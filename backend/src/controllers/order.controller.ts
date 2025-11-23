import { Request, Response } from 'express';
import { prisma } from '../utils/prisma';
import { createGhnOrderInternal, callGhnApi, validateAndFormatPhone } from './shipping.controller';

// Validation function để kiểm tra address và GHN connectivity
async function validateShippingRequirements(address: any): Promise<{ valid: boolean; error?: string }> {
  // Kiểm tra address có đủ GHN IDs
  if (!address.ward_code || !address.district_id) {
    return {
      valid: false,
      error: 'Địa chỉ chưa có đầy đủ thông tin GHN (ward_code, district_id). Vui lòng cập nhật địa chỉ.',
    };
  }

  // Kiểm tra connectivity với GHN API (test với provinces endpoint)
  try {
    await callGhnApi('/master-data/province');
    return { valid: true };
  } catch (error: any) {
    return {
      valid: false,
      error: `Không thể kết nối với GHN API: ${error.message}. Vui lòng thử lại sau.`,
    };
  }
}

// Helper function để retry GHN API call
async function retryGhnOrderCreation(
  params: Parameters<typeof createGhnOrderInternal>[0],
  maxRetries: number = 3,
  delayMs: number = 1000
): Promise<{ success: boolean; orderCode: string | null; error: string | null }> {
  let lastError: string | null = null;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const ghnOrder = await createGhnOrderInternal(params);
      const orderCode = ghnOrder?.order_code || ghnOrder?.data?.order_code || null;
      
      if (orderCode) {
        return { success: true, orderCode, error: null };
      }
      
      lastError = 'GHN API returned success but order_code is missing';
    } catch (error: any) {
      lastError = error.message || 'Unknown error';
      
      if (attempt < maxRetries) {
        // Wait before retry
        await new Promise(resolve => setTimeout(resolve, delayMs * attempt));
        console.log(`Retrying GHN order creation (attempt ${attempt + 1}/${maxRetries})...`);
      }
    }
  }
  
  return { success: false, orderCode: null, error: lastError };
}

// Kiểu request có user
interface AuthenticatedRequest extends Request {
  user?: { id: string };
}

type CartItemWithProduct = Awaited<ReturnType<typeof fetchCartItems>>[number];
type VoucherApplication = Awaited<ReturnType<typeof validateVoucherForCart>>;

async function fetchCartItems(params: { userId: string; cartItemIds: string[] }) {
  return prisma.cart_item.findMany({
    where: {
      user_id: params.userId,
      id: { in: params.cartItemIds },
    },
    include: { product: true },
  });
}

const sumCartItems = (items: CartItemWithProduct[]) =>
  items.reduce((sum, item) => sum + Number(item.product.price) * item.quantity, 0);

const nowDate = () => new Date();

class VoucherError extends Error {
  status: number;
  constructor(message: string, status = 400) {
    super(message);
    this.status = status;
  }
}

async function validateVoucherForCart(
  voucherCode: string,
  userId: string,
  cartItems: CartItemWithProduct[]
) {
  const voucher = await prisma.vouchers.findUnique({ where: { code: voucherCode.toUpperCase() } });
  if (!voucher) throw new VoucherError('Voucher không tồn tại');

  const now = nowDate();
  if (voucher.status !== 'ACTIVE' || now < voucher.start_at || now > voucher.end_at) {
    throw new VoucherError('Voucher đã hết hạn hoặc chưa bắt đầu');
  }

  if (voucher.applicable_user_id && voucher.applicable_user_id !== userId) {
    throw new VoucherError('Voucher này không dành cho bạn');
  }

  if (voucher.usage_limit_total && (voucher.used_count ?? 0) >= voucher.usage_limit_total) {
    throw new VoucherError('Voucher đã đạt giới hạn sử dụng');
  }

  // For PLATFORM vouchers, allow usage without saving first
  // For other vouchers, require saving first
  // PLATFORM vouchers are those with source='ADMIN' or type='PLATFORM'
  const isPlatformVoucher = voucher.source === 'ADMIN' || voucher.type === 'PLATFORM';
  
  let savedVoucher = await prisma.user_vouchers.findUnique({
    where: {
      user_id_voucher_id: {
        user_id: userId,
        voucher_id: voucher.id,
      },
    },
  });

  if (!savedVoucher && !isPlatformVoucher) {
    throw new VoucherError('Bạn cần lưu voucher trước khi sử dụng');
  }

  // If PLATFORM voucher not saved yet, we'll create it during order creation
  if (savedVoucher) {
    if (
      voucher.usage_limit_per_user &&
      savedVoucher.usage_count >= voucher.usage_limit_per_user
    ) {
      throw new VoucherError('Bạn đã sử dụng voucher này tối đa số lần cho phép');
    }
  } else if (isPlatformVoucher && voucher.usage_limit_per_user) {
    // Check if user has used this PLATFORM voucher before (even if not saved)
    const existingUsage = await prisma.user_vouchers.findUnique({
      where: {
        user_id_voucher_id: {
          user_id: userId,
          voucher_id: voucher.id,
        },
      },
    });
    if (existingUsage && existingUsage.usage_count >= voucher.usage_limit_per_user) {
      throw new VoucherError('Bạn đã sử dụng voucher này tối đa số lần cho phép');
    }
  }

  let applicableItems = cartItems;
  // For PLATFORM vouchers (source='ADMIN'), don't filter by seller_id
  // For seller vouchers, filter by seller_id
  if (voucher.seller_id && voucher.source !== 'ADMIN') {
    applicableItems = applicableItems.filter(
      (item) => item.product.seller_id === voucher.seller_id
    );
  }
  if (voucher.product_id) {
    applicableItems = applicableItems.filter((item) => item.product_id === voucher.product_id);
  }

  if (applicableItems.length === 0) {
    throw new VoucherError('Giỏ hàng không đủ điều kiện áp dụng voucher này');
  }

  const baseAmount = sumCartItems(applicableItems);
  const minOrder = Number(voucher.min_order_amount ?? 0);
  if (minOrder > 0 && baseAmount < minOrder) {
    throw new VoucherError(
      `Giá trị đơn tối thiểu để sử dụng voucher là ${minOrder.toLocaleString('vi-VN')}đ`
    );
  }

  let discount = 0;
  if (voucher.discount_type === 'PERCENT') {
    discount = (baseAmount * Number(voucher.discount_value)) / 100;
    if (voucher.max_discount_amount) {
      discount = Math.min(discount, Number(voucher.max_discount_amount));
    }
  } else {
    discount = Number(voucher.discount_value);
  }
  discount = Math.min(discount, baseAmount);

  if (discount <= 0) {
    throw new VoucherError('Voucher không áp dụng được cho giỏ hàng hiện tại');
  }

  const inferredSeller =
    voucher.seller_id ??
    (voucher.product_id
      ? applicableItems[0]?.product?.seller_id ?? null
      : null);

  return {
    voucher,
    discount,
    baseAmount,
    userVoucherId: savedVoucher?.id || null, // null if PLATFORM voucher not saved yet
    targetSellerId: inferredSeller,
    isPlatformVoucher,
  };
}

/**
 * 📦 Lấy danh sách đơn hàng của người dùng hiện tại
 */
// Lấy tất cả seller_order của user, kèm thông tin product
export async function listOrdersController(req: AuthenticatedRequest, res: Response) {
  try {
    const user_id = req.user?.id;
    if (!user_id) return res.status(401).json({ message: 'Unauthorized' });

    const sellerOrders = await prisma.seller_order.findMany({
      where: {
        orders: {
          user_id
        }
      },
      include: {
        orders: {
          include: {
            order_item: {
              include: { product: true }
            }
          }
        },
        seller: {
          select: {
            id: true,
            name: true,
            avatar: true,
            shop_mall: true
          }
        }
      },
      orderBy: { created_at: 'desc' }
    });

    const mapped = sellerOrders.map(so => {
      const items = so.orders.order_item.filter(oi => oi.product.seller_id === so.seller_id);
      return {
        id: so.id,
        order_id: so.order_id,
        seller: so.seller,
        total: Number(so.total),
        status: so.seller_status || 'pending',
        created_at: so.created_at,
        items: items.map(i => ({
          id: i.id,
          product_id: i.product_id,
          title: i.product.title,
          images: i.product.images,
          price: Number(i.price),
          quantity: i.quantity
        }))
      };
    });

    return res.json({ data: mapped });

  } catch (err: any) {
    console.error(err);
    return res.status(500).json({ message: err.message });
  }
}

/**
 * 🛒 Tạo đơn hàng mới từ giỏ hàng
 */
export async function createOrderController(req: AuthenticatedRequest, res: Response) {
  try {
    if (!req.user) return res.status(401).json({ message: 'Unauthorized' });
    const { cart_item_ids, voucher_code, shipping_code, address_id, payment_method } = req.body as {
      cart_item_ids?: string[];
      voucher_code?: string;
      shipping_code?: string;
      address_id?: string;
      payment_method?: string;
    };

    if (!cart_item_ids?.length) {
      return res.status(400).json({ message: 'Vui lòng chọn sản phẩm để đặt hàng' });
    }

    if (!address_id) {
      return res.status(400).json({ message: 'Vui lòng chọn địa chỉ giao hàng' });
    }

    // Lấy address và user info
    const address = await prisma.address.findFirst({
      where: { id: address_id, user_id: req.user.id },
    });

    if (!address) {
      return res.status(404).json({ message: 'Địa chỉ không tồn tại' });
    }

    // Validate address và GHN connectivity
    console.log('🔍 Validating address:', {
      address_id: address.id,
      has_ward_code: !!address.ward_code,
      has_district_id: !!address.district_id,
      ward_code: address.ward_code,
      district_id: address.district_id,
    });
    
    const validation = await validateShippingRequirements(address);
    if (!validation.valid) {
      console.error('❌ Address validation failed:', validation.error);
      // Gửi notification về validation failure
      try {
        const { notifyGhnConnectivityIssue } = await import('../services/notification.service');
        if (validation.error?.includes('GHN API')) {
          await notifyGhnConnectivityIssue(validation.error);
        }
      } catch (notifError) {
        console.error('Failed to send notification:', notifError);
      }
      
      return res.status(400).json({ message: validation.error });
    }

    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
    });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const cart_items = await fetchCartItems({ userId: req.user.id, cartItemIds: cart_item_ids });
    console.log('🛒 Fetched cart items:', {
      count: cart_items.length,
      item_ids: cart_items.map(i => i.id),
      products: cart_items.map(i => ({
        id: i.product_id,
        title: i.product.title,
        price: i.product.price,
        seller_id: i.product.seller_id,
        weight: i.product.weight,
      })),
    });
    
    if (cart_items.length === 0) {
      return res.status(400).json({ message: 'Cart is empty' });
    }
    
    // Validate cart items have required fields
    for (const item of cart_items) {
      if (!item.product.title) {
        console.error('❌ Product missing title:', item.product_id);
        return res.status(400).json({ 
          message: `Sản phẩm ${item.product_id} thiếu thông tin title. Vui lòng kiểm tra lại.` 
        });
      }
      if (!item.product.seller_id) {
        console.error('❌ Product missing seller_id:', item.product_id);
        return res.status(400).json({ 
          message: `Sản phẩm ${item.product_id} thiếu thông tin seller. Vui lòng kiểm tra lại.` 
        });
      }
    }

    const grossTotal = sumCartItems(cart_items);
    let appliedVoucher: VoucherApplication | null = null;

    if (voucher_code?.trim()) {
      try {
        appliedVoucher = await validateVoucherForCart(
          voucher_code.trim(),
          req.user.id,
          cart_items
        );
      } catch (error: any) {
        const status = error instanceof VoucherError ? error.status : 400;
        return res.status(status).json({ message: error.message || 'Voucher không hợp lệ' });
      }
    }

    const orderTotal = Math.max(0, grossTotal - (appliedVoucher?.discount ?? 0));

    // Tính weight từ products (gram)
    const totalWeight = cart_items.reduce((sum, item) => {
      const productWeight = item.product.weight ? Number(item.product.weight) * 1000 : 500; // Convert kg to gram, default 500g
      return sum + productWeight * item.quantity;
    }, 0);

    // Determine payment_type_id: 1 = COD, 2 = Non-COD (PayPal, etc.)
    const payment_type_id = payment_method === 'COD' ? 1 : 2;

    const order = await prisma.orders.create({
      data: {
        user_id: req.user.id,
        total: orderTotal,
        status: 'pending',
        shipping_code: shipping_code?.trim() || null,
        address_id: address_id,
        payment_method: payment_method || 'COD',
        payment_type_id: payment_type_id,
        service_type_id: 2,
        to_name: address.full_name,
        to_phone: address.phone,
        to_address: `${address.address_line}, ${address.ward}, ${address.district}, ${address.city}`,
        to_ward_name: address.ward,
        to_district_name: address.district,
        to_province_name: address.city,
        required_note: 'KHONGCHOXEMHANG',
        weight: totalWeight,
        length: 10,
        width: 10,
        height: 10,
        system_voucher:
          appliedVoucher && appliedVoucher.voucher.source === 'ADMIN'
            ? {
                code: appliedVoucher.voucher.code,
                discount: appliedVoucher.discount,
                type: appliedVoucher.voucher.type,
                source: appliedVoucher.voucher.source,
              }
            : undefined,
        order_item: {
          create: cart_items.map((item) => ({
            product_id: item.product_id,
            price: item.product.price,
            quantity: item.quantity,
          })),
        },
      },
      include: {
        order_item: { include: { product: true } },
      },
    });

    const sellerMap = new Map<string, CartItemWithProduct[]>();
    cart_items.forEach((item) => {
      const sellerId = item.product.seller_id;
      if (!sellerMap.has(sellerId)) sellerMap.set(sellerId, []);
      sellerMap.get(sellerId)!.push(item);
    });

    const sellerTotals = new Map<string, number>();
    sellerMap.forEach((items, sellerId) => {
      sellerTotals.set(sellerId, sumCartItems(items));
    });

    const sellerDiscountMap = new Map<string, number>();
    if (appliedVoucher) {
      // For PLATFORM vouchers (source='ADMIN'), distribute discount across all sellers
      // For seller vouchers, apply discount to specific seller
      if (appliedVoucher.voucher.source === 'ADMIN') {
        // PLATFORM voucher: distribute discount proportionally
        const baseTotal = Array.from(sellerTotals.values()).reduce((sum, val) => sum + val, 0);
        let allocated = 0;
        const entries = Array.from(sellerTotals.entries());
        entries.forEach(([sellerId, sellerTotal], index) => {
          if (baseTotal === 0) {
            sellerDiscountMap.set(sellerId, 0);
            return;
          }
          let portion = (appliedVoucher!.discount * sellerTotal) / baseTotal;
          portion = Math.min(portion, sellerTotal);
          if (index === entries.length - 1) {
            portion = Math.min(appliedVoucher!.discount - allocated, sellerTotal);
          }
          portion = Number(Number(portion).toFixed(2));
          allocated += portion;
          sellerDiscountMap.set(sellerId, Math.max(0, portion));
        });
      } else if (appliedVoucher.voucher.seller_id || appliedVoucher.targetSellerId) {
        // Seller voucher: apply discount to specific seller
        const target = appliedVoucher.voucher.seller_id || appliedVoucher.targetSellerId;
        if (target) {
          sellerDiscountMap.set(target, appliedVoucher.discount);
        }
      }
    }

    // Lấy seller info để lấy from_address
    const sellers = await prisma.seller.findMany({
      where: { id: { in: Array.from(sellerMap.keys()) } },
    });
    const sellerInfoMap = new Map(sellers.map(s => [s.id, s]));

    // Lấy shop config từ database (shop_settings) hoặc fallback về env
    let shopSettings = await prisma.shop_settings.findUnique({
      where: { id: 'shop_settings_singleton' },
    });

    // Fallback về env nếu chưa có trong database
    if (!shopSettings) {
      const rawPhone = process.env.SHIP_FROM_PHONE || '';
      console.log('⚠️ Shop settings not found in database, using env variables');
      shopSettings = {
        id: 'shop_settings_singleton',
        name: process.env.SHIP_FROM_NAME || 'Shop',
        phone: rawPhone,
        address_line: process.env.SHIP_FROM_ADDRESS || 'Hà Nội',
        province_id: null,
        province_name: null,
        district_id: Number(process.env.SHIP_FROM_DISTRICT_ID || 1450),
        district_name: null,
        ward_code: process.env.SHIP_FROM_WARD_CODE || null,
        ward_name: null,
        created_at: new Date(),
        updated_at: new Date(),
      };
    }

    console.log('🏪 Shop config:', {
      from_name: shopSettings.name,
      from_phone: shopSettings.phone ? `${shopSettings.phone.substring(0, 3)}***` : 'EMPTY',
      from_address: shopSettings.address_line,
      has_ward_code: !!shopSettings.ward_code,
      district_id: shopSettings.district_id,
      ward_code: shopSettings.ward_code,
    });

    // Validate shop address có đầy đủ thông tin GHN
    if (!shopSettings.ward_code || !shopSettings.district_id) {
      console.error('❌ Shop address missing GHN information:', {
        has_ward_code: !!shopSettings.ward_code,
        has_district_id: !!shopSettings.district_id,
        ward_code: shopSettings.ward_code,
        district_id: shopSettings.district_id,
      });
      return res.status(400).json({
        message: `Địa chỉ shop thiếu thông tin GHN (ward_code: ${shopSettings.ward_code ? 'có' : 'thiếu'}, district_id: ${shopSettings.district_id ? 'có' : 'thiếu'}). ` +
          `Vui lòng cấu hình địa chỉ shop tại /admin/settings với đầy đủ Tỉnh/Thành phố, Quận/Huyện, và Phường/Xã.`
      });
    }

    const shopConfig = {
      from_name: shopSettings.name || 'Shop',
      from_phone: shopSettings.phone,
      from_address: shopSettings.address_line,
      from_ward_code: shopSettings.ward_code, // Đã validate không null ở trên
      from_district_id: shopSettings.district_id, // Đã validate không null ở trên
    };
    
    console.log('✅ Shop config validated:', {
      from_name: shopConfig.from_name,
      from_ward_code: shopConfig.from_ward_code,
      from_district_id: shopConfig.from_district_id,
    });

    // Validate shop phone
    let validatedShopPhone: string;
    try {
      if (!shopConfig.from_phone || shopConfig.from_phone.trim() === '') {
        throw new Error('SHIP_FROM_PHONE environment variable is not set or is empty. Please add SHIP_FROM_PHONE=0987654321 to your .env file in the backend folder.');
      }
      validatedShopPhone = validateAndFormatPhone(shopConfig.from_phone);
      console.log('✅ Shop phone validated:', `${validatedShopPhone.substring(0, 3)}***`);
    } catch (error: any) {
      console.error('❌ Shop phone validation failed:', {
        input: shopConfig.from_phone,
        error: error.message,
      });
      return res.status(500).json({ 
        message: `Shop phone number is invalid: ${error.message}. Please configure SHIP_FROM_PHONE in environment variables with a valid Vietnamese phone number (10 digits, starting with 0). Example: SHIP_FROM_PHONE=0987654321` 
      });
    }

    // Validate customer phone
    let validatedCustomerPhone: string;
    try {
      validatedCustomerPhone = validateAndFormatPhone(address.phone);
    } catch (error: any) {
      return res.status(400).json({ 
        message: `Customer phone number is invalid: ${error.message}. Please update the address with a valid phone number.` 
      });
    }

    const sellerOrders = [];
    for (const [seller_id, items] of sellerMap) {
      const sellerTotal = sellerTotals.get(seller_id) ?? 0;
      const sellerDiscount = sellerDiscountMap.get(seller_id) ?? 0;
      const sellerOrder = await prisma.seller_order.create({
        data: {
          order_id: order.id,
          seller_id,
          total: Math.max(0, sellerTotal - sellerDiscount),
          seller_status: 'pending',
          shop_voucher:
            sellerDiscount > 0 && 
            appliedVoucher?.voucher.source !== 'ADMIN' && 
            appliedVoucher?.voucher.seller_id === seller_id
              ? {
                  code: appliedVoucher.voucher.code,
                  discount: sellerDiscount,
                }
              : undefined,
          created_at: order.created_at,
          updated_at: order.updated_at,
        },
      });

      // Tính weight cho seller items (gram)
      const sellerWeight = items.reduce((sum, item) => {
        const productWeight = item.product.weight ? Number(item.product.weight) * 1000 : 500;
        return sum + productWeight * item.quantity;
      }, 0);

      // Tạo items array cho GHN
      const ghnItems = items.map(item => {
        const productTitle = item.product.title || `Sản phẩm ${item.product_id}`;
        const productWeight = item.product.weight ? Number(item.product.weight) * 1000 : 500;
        const productPrice = Number(item.product.price) || 0;
        
        if (!productTitle) {
          console.warn(`⚠️ Product ${item.product_id} has no title, using fallback`);
        }
        
        return {
          name: productTitle,
          quantity: item.quantity,
          weight: productWeight,
          price: productPrice,
          product_code: item.product_id,
        };
      });
      
      console.log('📦 GHN items prepared:', ghnItems);

      // Validate required address fields before calling GHN
      if (!address.ward_code || !address.district_id) {
        console.error('❌ Missing required address fields:', {
          seller_id,
          has_ward_code: !!address.ward_code,
          has_district_id: !!address.district_id,
        });
        throw new Error(
          `Địa chỉ thiếu thông tin cần thiết (ward_code: ${address.ward_code ? 'có' : 'thiếu'}, ` +
          `district_id: ${address.district_id ? 'có' : 'thiếu'}). ` +
          `Vui lòng cập nhật địa chỉ với đầy đủ thông tin.`
        );
      }
      
      // Validate shop ward_code và district_id trước khi gọi GHN
      if (!shopConfig.from_ward_code || !shopConfig.from_district_id) {
        console.error(`❌ Shop config invalid for seller ${seller_id}:`, {
          from_ward_code: shopConfig.from_ward_code,
          from_district_id: shopConfig.from_district_id,
        });
        throw new Error(
          `Địa chỉ shop không hợp lệ: ward_code=${shopConfig.from_ward_code || 'thiếu'}, ` +
          `district_id=${shopConfig.from_district_id || 'thiếu'}. ` +
          `Vui lòng cấu hình địa chỉ shop tại /admin/settings.`
        );
      }

      // Gọi GHN API để tạo shipping order với retry mechanism
      let retryResult;
      try {
        console.log(`🚚 Creating GHN order for seller ${seller_id}...`);
        console.log(`📍 Shop address (from):`, {
          name: shopConfig.from_name,
          address: shopConfig.from_address,
          ward_code: shopConfig.from_ward_code,
          district_id: shopConfig.from_district_id,
        });
        console.log(`📍 Customer address (to):`, {
          name: address.full_name,
          address: `${address.address_line}, ${address.ward}, ${address.district}, ${address.city}`,
          ward_code: address.ward_code,
          district_id: address.district_id,
        });
        retryResult = await retryGhnOrderCreation({
          to_name: address.full_name,
          to_phone: validatedCustomerPhone,
          to_address: `${address.address_line}, ${address.ward}, ${address.district}, ${address.city}`,
          to_ward_code: address.ward_code,
          to_district_id: address.district_id,
          weight: sellerWeight,
          length: 10,
          width: 10,
          height: 10,
          service_type_id: 2,
          payment_type_id: payment_type_id,
          required_note: 'KHONGCHOXEMHANG',
          note: '',
          items: ghnItems,
          from_name: shopConfig.from_name,
          from_phone: validatedShopPhone,
          from_address: shopConfig.from_address,
          from_ward_code: shopConfig.from_ward_code,
          from_district_id: shopConfig.from_district_id,
        }, 3, 1000); // 3 retries, 1s delay
        console.log(`✅ GHN order result for seller ${seller_id}:`, {
          success: retryResult.success,
          orderCode: retryResult.orderCode,
          error: retryResult.error,
        });
      } catch (retryError: any) {
        console.error(`❌ Error in retryGhnOrderCreation for seller ${seller_id}:`, retryError);
        console.error('Retry error details:', {
          message: retryError.message,
          stack: retryError.stack,
        });
        // Nếu retry mechanism bị lỗi, vẫn tiếp tục với status failed
        retryResult = {
          success: false,
          orderCode: null,
          error: retryError.message || 'Failed to create GHN order',
        };
      }

      // Xác định status dựa trên kết quả
      const shippingStatus: 'created' | 'failed' = retryResult.success ? 'created' : 'failed';
      
      // Lưu shipping_order info với status tracking
      let shippingOrder;
      try {
        console.log(`💾 Saving shipping_order for seller ${seller_id}...`);
        const shippingOrderData = {
          seller_order_id: sellerOrder.id,
          ghn_order_code: retryResult.orderCode,
          to_ward_code: address.ward_code,
          to_district_id: address.district_id,
          to_province_id: address.province_id,
          weight: sellerWeight,
          length: 10,
          width: 10,
          height: 10,
          service_type_id: 2,
          payment_type_id: payment_type_id,
          items: ghnItems as any,
          status: shippingStatus as 'created' | 'failed',
          error_message: retryResult.error,
          retry_count: retryResult.success ? 0 : 3, // Số lần đã retry
          last_retry_at: retryResult.success ? null : new Date(),
        };
        
        console.log('Shipping order data:', JSON.stringify(shippingOrderData, null, 2));
        
        shippingOrder = await prisma.shipping_order.create({
          data: shippingOrderData,
        });
        console.log(`✅ Created shipping_order ${shippingOrder.id} for seller ${seller_id}`);
      } catch (dbError: any) {
        console.error(`❌ Failed to create shipping_order for seller ${seller_id}:`, dbError);
        console.error('DB Error details:', {
          code: dbError.code,
          message: dbError.message,
          meta: dbError.meta,
          cause: dbError.cause,
        });
        
        // Nếu là lỗi Prisma schema, throw với message rõ ràng
        if (dbError.code && dbError.code.startsWith('P')) {
          const errorMsg = `Database error (${dbError.code}): ${dbError.message}. ` +
            `Có thể Prisma schema chưa được migrate hoặc có constraint violation. ` +
            `Hãy chạy: npx prisma migrate dev && npx prisma generate. ` +
            `Chi tiết: ${JSON.stringify(dbError.meta || {})}`;
          console.error(errorMsg);
          throw new Error(errorMsg);
        }
        
        // Nếu không phải lỗi schema, vẫn throw để catch ở ngoài
        throw dbError;
      }

      // Gửi notification nếu fail
      if (!retryResult.success) {
        console.warn(`⚠️ Failed to create GHN order for seller ${seller_id} after retries:`, retryResult.error);
        
        // Gửi notification
        try {
          const { notifyGhnOrderFailure } = await import('../services/notification.service');
          await notifyGhnOrderFailure({
            shippingOrderId: shippingOrder.id,
            sellerOrderId: sellerOrder.id,
            orderId: order.id,
            error: retryResult.error || 'Unknown error',
            retryCount: 3,
          });
        } catch (notifError) {
          console.error('Failed to send notification:', notifError);
        }
      }

      sellerOrders.push(sellerOrder);
    }

    await prisma.cart_item.deleteMany({
      where: { user_id: req.user.id, id: { in: cart_item_ids } },
    });

    if (appliedVoucher) {
      await prisma.$transaction([
        prisma.vouchers.update({
          where: { id: appliedVoucher.voucher.id },
          data: { used_count: (appliedVoucher.voucher.used_count ?? 0) + 1 },
        }),
        // If PLATFORM voucher and not saved yet, create user_vouchers record
        // Otherwise, update existing record
        appliedVoucher.userVoucherId
          ? prisma.user_vouchers.update({
              where: {
                user_id_voucher_id: {
                  user_id: req.user.id,
                  voucher_id: appliedVoucher.voucher.id,
                },
              },
              data: {
                usage_count: { increment: 1 },
                used_at: new Date(),
              },
            })
          : prisma.user_vouchers.upsert({
              where: {
                user_id_voucher_id: {
                  user_id: req.user.id,
                  voucher_id: appliedVoucher.voucher.id,
                },
              },
              update: {
                usage_count: { increment: 1 },
                used_at: new Date(),
              },
              create: {
                user_id: req.user.id,
                voucher_id: appliedVoucher.voucher.id,
                usage_count: 1,
                used_at: new Date(),
              },
            }),
      ]);
    }

    return res.status(201).json({ order, sellerOrders });
  } catch (error: any) {
    console.error('❌ createOrderController error:', error);
    console.error('Error stack:', error.stack);
    console.error('Error details:', {
      message: error.message,
      code: error.code,
      meta: error.meta,
      cause: error.cause,
      name: error.name,
    });
    
    // Log request body for debugging (without sensitive data)
    console.error('Request body:', {
      cart_item_ids: req.body?.cart_item_ids,
      address_id: req.body?.address_id,
      payment_method: req.body?.payment_method,
      has_voucher_code: !!req.body?.voucher_code,
    });
    
    // Trả về error message chi tiết hơn để debug
    const errorMessage = error.message || 'Internal server error';
    const isPrismaError = error.code && error.code.startsWith('P');
    
    return res.status(500).json({ 
      message: errorMessage,
      ...(isPrismaError && { 
        hint: 'Có thể Prisma schema chưa được migrate. Hãy chạy: npx prisma migrate dev && npx prisma generate',
        code: error.code,
        meta: error.meta,
      }),
      ...(process.env.NODE_ENV === 'development' && {
        stack: error.stack,
      })
    });
  }
}



/**
 * 🔍 Lấy chi tiết một đơn hàng hoặc tất cả đơn hàng
 */
export async function getOrdersController(req: AuthenticatedRequest, res: Response) {
  try {
    if (!req.user) return res.status(401).json({ message: 'Unauthorized' });

    // Lấy tất cả đơn hàng của user, kèm order_item + product + seller_order
    const orders = await prisma.orders.findMany({
      where: { user_id: req.user.id },
      include: {
        order_item: { 
          include: { 
            product: true 
          } 
        },
        seller_order: {
          include: {
            seller: {
              select: {
                id: true,
                name: true,
              }
            }
          }
        }
      },
      orderBy: { created_at: 'desc' }, // mới nhất lên đầu
    });

    return res.status(200).json({ items: orders }); // ⚡ trả về array
  } catch (error) {
    console.error('❌ getOrdersController error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}
