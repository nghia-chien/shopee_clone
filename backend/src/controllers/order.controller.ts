import { Request, Response } from 'express';
import { prisma } from '../utils/prisma';

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
        seller: true
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
    const { cart_item_ids, voucher_code } = req.body as {
      cart_item_ids?: string[];
      voucher_code?: string;
    };

    if (!cart_item_ids?.length) {
      return res.status(400).json({ message: 'Vui lòng chọn sản phẩm để đặt hàng' });
    }

    const cart_items = await fetchCartItems({ userId: req.user.id, cartItemIds: cart_item_ids });
    if (cart_items.length === 0) {
      return res.status(400).json({ message: 'Cart is empty' });
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

    const order = await prisma.orders.create({
      data: {
        user_id: req.user.id,
        total: orderTotal,
        status: 'pending',
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
  } catch (error) {
    console.error('❌ createOrderController error:', error);
    return res.status(500).json({ message: 'Internal server error' });
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
