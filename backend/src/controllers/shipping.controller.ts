import type { Request, Response } from 'express';

const GHN_API = `${process.env.GHN_API}/shiip/public-api`;

const GHN_TOKEN = process.env.GHN_TOKEN;

type FetchOptions = {
  method?: 'GET' | 'POST';
  body?: Record<string, unknown>;
};

interface GhnResponse<T> {
  code?: number;
  data: T;
  message?: string;
}

/**
 * Validate và format số điện thoại cho GHN API
 * GHN yêu cầu số điện thoại Việt Nam: 10 số, bắt đầu bằng 0
 */
export function validateAndFormatPhone(phone: string | null | undefined): string {
  if (!phone) {
    throw new Error('Số điện thoại là bắt buộc');
  }

  // Loại bỏ khoảng trắng, dấu gạch ngang, dấu ngoặc
  let cleaned = phone.replace(/[\s\-\(\)]/g, '');

  // Nếu bắt đầu bằng +84, chuyển thành 0
  if (cleaned.startsWith('+84')) {
    cleaned = '0' + cleaned.substring(3);
  }

  // Nếu bắt đầu bằng 84 (không có +), chuyển thành 0
  if (cleaned.startsWith('84') && cleaned.length === 11) {
    cleaned = '0' + cleaned.substring(2);
  }

  // Validate: phải bắt đầu bằng 0 và có 10 số
  if (!/^0\d{9}$/.test(cleaned)) {
    throw new Error(`Số điện thoại "" ${phone} "" không có thực . Yêu cầu: 10 số, bắt đầu bằng 0 (ví dụ: 0123456789)`);
  }

  return cleaned;
}

/**
 * Validate đầy đủ thông tin địa chỉ và số điện thoại trước khi tạo đơn GHN
 * Đảm bảo tất cả các trường bắt buộc đều có giá trị hợp lệ
 */
export function validateGhnOrderParams(params: {
  to_name?: string | null;
  to_phone?: string | null;
  to_address?: string | null;
  to_ward_code?: string | null;
  to_district_id?: number | null;
  from_name?: string | null;
  from_phone?: string | null;
  from_address?: string | null;
  from_ward_code?: string | null;
  from_district_id?: number | null;
  weight?: number | null;
  items?: Array<any> | null;
}): { valid: boolean; error?: string; validatedParams?: any } {
  const errors: string[] = [];

  // Validate thông tin người nhận (to_*)
  if (!params.to_name || params.to_name.trim() === '') {
    errors.push('Tên người nhận (to_name) là bắt buộc');
  }

  if (!params.to_phone) {
    errors.push('Số điện thoại người nhận (to_phone) là bắt buộc');
  } else {
    try {
      validateAndFormatPhone(params.to_phone);
    } catch (error: any) {
      errors.push(`Số điện thoại người nhận không hợp lệ: ${error.message}`);
    }
  }

  if (!params.to_address || params.to_address.trim() === '') {
    errors.push('Địa chỉ người nhận (to_address) là bắt buộc');
  }

  if (!params.to_ward_code || params.to_ward_code.trim() === '') {
    errors.push('Mã phường/xã người nhận (to_ward_code) là bắt buộc');
  }

  if (!params.to_district_id || Number.isNaN(Number(params.to_district_id)) || Number(params.to_district_id) <= 0) {
    errors.push('Mã quận/huyện người nhận (to_district_id) là bắt buộc và phải là số hợp lệ');
  }

  // Validate thông tin người gửi (from_*)
  if (!params.from_name || params.from_name.trim() === '') {
    errors.push('Tên người gửi (from_name) là bắt buộc');
  }

  if (!params.from_phone) {
    errors.push('Số điện thoại người gửi (from_phone) là bắt buộc');
  } else {
    try {
      validateAndFormatPhone(params.from_phone);
    } catch (error: any) {
      errors.push(`Số điện thoại người gửi không hợp lệ: ${error.message}`);
    }
  }

  if (!params.from_address || params.from_address.trim() === '') {
    errors.push('Địa chỉ người gửi (from_address) là bắt buộc');
  }

  if (!params.from_ward_code || params.from_ward_code.trim() === '') {
    errors.push('Mã phường/xã người gửi (from_ward_code) là bắt buộc');
  }

  if (!params.from_district_id || Number.isNaN(Number(params.from_district_id)) || Number(params.from_district_id) <= 0) {
    errors.push('Mã quận/huyện người gửi (from_district_id) là bắt buộc và phải là số hợp lệ');
  }

  // Validate weight
  if (!params.weight || Number.isNaN(Number(params.weight)) || Number(params.weight) <= 0) {
    errors.push('Trọng lượng (weight) là bắt buộc và phải là số lớn hơn 0 (đơn vị: gram)');
  }

  // Validate items
  if (!params.items || !Array.isArray(params.items) || params.items.length === 0) {
    errors.push('Danh sách sản phẩm (items) là bắt buộc và phải có ít nhất 1 sản phẩm');
  } else {
    params.items.forEach((item, index) => {
      if (!item.name || item.name.trim() === '') {
        errors.push(`Sản phẩm thứ ${index + 1} thiếu tên (name)`);
      }
      if (!item.quantity || Number.isNaN(Number(item.quantity)) || Number(item.quantity) <= 0) {
        errors.push(`Sản phẩm thứ ${index + 1} có số lượng (quantity) không hợp lệ`);
      }
    });
  }

  if (errors.length > 0) {
    return {
      valid: false,
      error: `Validation failed: ${errors.join('; ')}`,
    };
  }

  // Trả về validated params với số điện thoại đã được format
  return {
    valid: true,
    validatedParams: {
      to_name: params.to_name!.trim(),
      to_phone: validateAndFormatPhone(params.to_phone!),
      to_address: params.to_address!.trim(),
      to_ward_code: params.to_ward_code!.trim(),
      to_district_id: Number(params.to_district_id!),
      from_name: params.from_name!.trim(),
      from_phone: validateAndFormatPhone(params.from_phone!),
      from_address: params.from_address!.trim(),
      from_ward_code: params.from_ward_code!.trim(),
      from_district_id: Number(params.from_district_id!),
      weight: Number(params.weight!),
    },
  };
}



export async function callGhnApi<T>(endpoint: string, options: FetchOptions = {}): Promise<T> {
  if (!GHN_TOKEN) {
    throw new Error('GHN token is not configured');
  }

  const response = await fetch(`${GHN_API}${endpoint}`, {
    method: options.method ?? 'GET',
    headers: {
      Token: GHN_TOKEN,
      ...(options.body ? { 'Content-Type': 'application/json' } : {}),
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  const payload = (await response.json().catch(() => {
    throw new Error('Unable to parse GHN response');
  })) as GhnResponse<T>;

  if (!response.ok || (typeof payload.code === 'number' && payload.code !== 200)) {
    throw new Error(payload.message || 'GHN API error');
  }

  return payload.data;
}

export async function getProvinces(_req: Request, res: Response) {
  try {
    const provinces = await callGhnApi('/master-data/province');
    res.json(provinces);
  } catch (error) {
    console.error('Failed to fetch GHN provinces:', error);
    res.status(500).json({ error: 'Failed to fetch provinces' });
  }
}

export async function getDistricts(req: Request, res: Response) {
  const provinceId = Number(req.params.province_id);
  if (Number.isNaN(provinceId)) {
    return res.status(400).json({ error: 'Invalid province_id' });
  }

  try {
    const districts = await callGhnApi('/master-data/district', {
      method: 'POST',
      body: { province_id: provinceId },
    });
    res.json(districts);
  } catch (error) {
    console.error('Failed to fetch GHN districts:', error);
    res.status(500).json({ error: 'Failed to fetch districts' });
  }
}

export async function getWards(req: Request, res: Response) {
  const districtId = Number(req.params.district_id);
  if (Number.isNaN(districtId)) {
    return res.status(400).json({ error: 'Invalid district_id' });
  }

  try {
    const wards = await callGhnApi(`/master-data/ward?district_id=${districtId}`, {
      method: 'POST',
      body: { district_id: districtId },
    });
    res.json(wards);
  } catch (error) {
    console.error('Failed to fetch GHN wards:', error);
    res.status(500).json({ error: 'Failed to fetch wards' });
  }
}

export async function calculateShippingFee(req: Request, res: Response) {
  const { from_district, to_district, weight, service_id = 53321 } = req.body || {};

  if (
    Number.isNaN(Number(from_district)) ||
    Number.isNaN(Number(to_district)) ||
    Number.isNaN(Number(weight))
  ) {
    return res.status(400).json({ error: 'from_district, to_district và weight là bắt buộc' });
  }

  try {
    const fee = await callGhnApi('/v2/shipping-order/fee', {
      method: 'POST',
      body: {
        from_district_id: Number(from_district),
        to_district_id: Number(to_district),
        service_id,
        weight: Number(weight),
        coupon: null,
      },
    });
    res.json(fee);
  } catch (error) {
    console.error('Failed to calculate GHN shipping fee:', error);
    res.status(500).json({ error: 'Failed to calculate shipping fee' });
  }
}

export async function createShippingOrder(req: Request, res: Response) {
  const {
    to_name,
    to_phone,
    to_address,
    to_ward_code,
    to_district_id,
    weight,
    note = '',
    required_note = 'KHONGCHOXEMHANG',
    items = [],
  } = req.body || {};

  // Lấy shop config từ env
  const shopConfig = {
    from_name: process.env.SHIP_FROM_NAME || 'Shop',
    from_phone: process.env.SHIP_FROM_PHONE || '',
    from_address: process.env.SHIP_FROM_ADDRESS || 'Hà Nội',
    from_ward_code: process.env.SHIP_FROM_WARD_CODE || '',
    from_district_id: Number(process.env.SHIP_FROM_DISTRICT_ID || 1450),
  };

  // Validate đầy đủ thông tin trước khi tạo đơn
  const validation = validateGhnOrderParams({
    to_name,
    to_phone,
    to_address,
    to_ward_code,
    to_district_id,
    from_name: shopConfig.from_name,
    from_phone: shopConfig.from_phone,
    from_address: shopConfig.from_address,
    from_ward_code: shopConfig.from_ward_code,
    from_district_id: shopConfig.from_district_id,
    weight,
    items,
  });

  if (!validation.valid) {
    console.error('❌ Validation failed:', validation.error);
    return res.status(400).json({ error: validation.error || 'Validation failed' });
  }

  const validated = validation.validatedParams!;

  try {
    const orderPayload = {
      payment_type_id: 2,
      note,
      required_note,
      to_name: validated.to_name,
      to_phone: validated.to_phone,
      to_address: validated.to_address,
      to_ward_code: validated.to_ward_code,
      to_district_id: validated.to_district_id,
      weight: validated.weight,
      content: req.body?.content ?? '',
      items,
      from_name: validated.from_name,
      from_phone: validated.from_phone,
      from_address: validated.from_address,
      from_ward_code: validated.from_ward_code,
      from_district_id: validated.from_district_id,
    };

    console.log('✅ Validated payload gửi lên GHN:', JSON.stringify(orderPayload, null, 2));

    const ghnOrder = await callGhnApi('/v2/shipping-order/create', {
      method: 'POST',
      body: orderPayload,
    });

    console.log('GHN trả về:', JSON.stringify(ghnOrder, null, 2));

    res.json(ghnOrder);
  } catch (error: any) {
    console.error('Failed to create GHN order:', error.response?.data || error.message);
    res
      .status(500)
      .json({ error: 'Failed to create GHN order', details: error.response?.data || error.message });
  }
}

export async function cancelShippingOrder(req: Request, res: Response) {
  const { order_code } = req.body || {};

  if (!order_code) {
    return res.status(400).json({ error: 'order_code là bắt buộc' });
  }

  try {
    const result = await callGhnApi('/v2/switch-status/cancel', {
      method: 'POST',
      body: { order_code },
    });

    res.json(result);
  } catch (error) {
    console.error('Failed to cancel GHN order:', error);
    res.status(500).json({ error: 'Failed to cancel GHN order' });
  }
}

/**
 * Helper function to create GHN order (called from order controller)
 */
export async function createGhnOrderInternal(params: {
  to_name: string;
  to_phone: string;
  to_address: string;
  to_ward_code: string;
  to_district_id: number;
  weight: number;
  length?: number;
  width?: number;
  height?: number;
  service_type_id?: number;
  payment_type_id: number;
  required_note?: string;
  note?: string;
  items: Array<{
    name: string;
    quantity: number;
    weight?: number;
    price?: number;
    product_code?: string;
  }>;
  from_name: string;
  from_phone: string;
  from_address: string;
  from_ward_code: string;
  from_district_id: number;
}): Promise<any> {
  // Validate đầy đủ thông tin trước khi tạo đơn GHN
  const validation = validateGhnOrderParams({
    to_name: params.to_name,
    to_phone: params.to_phone,
    to_address: params.to_address,
    to_ward_code: params.to_ward_code,
    to_district_id: params.to_district_id,
    from_name: params.from_name,
    from_phone: params.from_phone,
    from_address: params.from_address,
    from_ward_code: params.from_ward_code,
    from_district_id: params.from_district_id,
    weight: params.weight,
    items: params.items,
  });

  if (!validation.valid) {
    console.error('❌ GHN order validation failed:', validation.error);
    throw new Error(validation.error || 'Validation failed');
  }

  // Sử dụng validated params để đảm bảo dữ liệu đã được format đúng
  const validated = validation.validatedParams!;

  const orderPayload = {
    payment_type_id: params.payment_type_id,
    note: params.note || '',
    required_note: params.required_note || 'KHONGCHOXEMHANG',
    service_type_id: params.service_type_id || 2,
    to_name: validated.to_name,
    to_phone: validated.to_phone,
    to_address: validated.to_address,
    to_ward_code: validated.to_ward_code,
    to_district_id: validated.to_district_id,
    weight: validated.weight,
    length: params.length || 10,
    width: params.width || 10,
    height: params.height || 10,
    content: '',
    items: params.items,
    from_name: validated.from_name,
    from_phone: validated.from_phone,
    from_address: validated.from_address,
    from_ward_code: validated.from_ward_code,
    from_district_id: validated.from_district_id,
  };

  console.log('✅ Validated payload gửi lên GHN:', JSON.stringify(orderPayload, null, 2));

  const ghnOrder = await callGhnApi('/v2/shipping-order/create', {
    method: 'POST',
    body: orderPayload,
  });

  console.log('GHN trả về:', JSON.stringify(ghnOrder, null, 2));

  return ghnOrder;
}

/**
 * Pre-validate GHN order trước khi tạo đơn hàng
 * Test xem GHN có chấp nhận địa chỉ này không bằng cách tính phí vận chuyển
 * Nếu tính được phí → địa chỉ hợp lệ
 */
interface GhnFeeResponse {
  total?: number;
  leadtime?: number;
  data?: {
    total?: number;
    leadtime?: number;
  };
}

export async function preValidateGhnOrder(params: {
  to_name: string;
  to_phone: string;
  to_address: string;
  to_ward_code: string;
  to_district_id: number;
  from_name: string;
  from_phone: string;
  from_address: string;
  from_ward_code: string;
  from_district_id: number;
  weight: number;
}): Promise<{ valid: boolean; error?: string; details?: any }> {
  try {
    // 1. Validate params trước
    const validation = validateGhnOrderParams({
      to_name: params.to_name,
      to_phone: params.to_phone,
      to_address: params.to_address,
      to_ward_code: params.to_ward_code,
      to_district_id: params.to_district_id,
      from_name: params.from_name,
      from_phone: params.from_phone,
      from_address: params.from_address,
      from_ward_code: params.from_ward_code,
      from_district_id: params.from_district_id,
      weight: params.weight,
      items: [{ name: 'Test', quantity: 1 }], // Dummy item để test
    });

    if (!validation.valid) {
      return {
        valid: false,
        error: validation.error || 'Validation failed',
      };
    }

    const validated = validation.validatedParams!;

    // 2. Test tính phí vận chuyển (để validate địa chỉ)
    // Nếu GHN tính được phí → địa chỉ hợp lệ
    try {
      const feeResponse = await callGhnApi('/v2/shipping-order/fee', {
        method: 'POST',
        body: {
          from_district_id: validated.from_district_id,
          to_district_id: validated.to_district_id,
          weight: validated.weight,
          service_id: 53321,
        },
      }) as GhnFeeResponse; // Ép kiểu ở đây

      // Kiểm tra response structure
      const total = feeResponse?.total || feeResponse?.data?.total;
      const leadtime = feeResponse?.leadtime || feeResponse?.data?.leadtime;

      // Nếu tính được phí → địa chỉ hợp lệ
      if (total !== undefined && total !== null) {
        return {
          valid: true,
          details: { shippingFee: total, estimatedTime: leadtime },
        };
      }

      return {
        valid: false,
        error: 'Không thể tính phí vận chuyển. Địa chỉ có thể không hợp lệ với GHN.',
      };
    } catch (feeError: any) {
      // Nếu lỗi tính phí → địa chỉ không hợp lệ
      const errorMessage = feeError.message || 'Unknown error';
      
      console.error('❌ Pre-validation failed (fee calculation):', {
        error: errorMessage,
        from_district_id: validated.from_district_id,
        to_district_id: validated.to_district_id,
      });

      // Phân tích lỗi cụ thể
      if (errorMessage.includes('district') || errorMessage.includes('ward') || 
          errorMessage.includes('District') || errorMessage.includes('Ward')) {
        return {
          valid: false,
          error: `Địa chỉ không hợp lệ với GHN: ${errorMessage}. Vui lòng kiểm tra lại địa chỉ.`,
        };
      }

      if (errorMessage.includes('service') || errorMessage.includes('Service')) {
        return {
          valid: false,
          error: `Dịch vụ vận chuyển không khả dụng cho địa chỉ này: ${errorMessage}.`,
        };
      }

      return {
        valid: false,
        error: `Không thể validate địa chỉ với GHN: ${errorMessage}. Vui lòng thử lại sau.`,
      };
    }
  } catch (error: any) {
    console.error('❌ Pre-validation error:', error);
    return {
      valid: false,
      error: `Lỗi khi validate địa chỉ: ${error.message || 'Unknown error'}`,
    };
  }
}

/**
 * Retry tạo GHN order cho một shipping_order cụ thể
 * POST /api/shipping/retry/:shippingOrderId
 */
export async function retryShippingOrderController(req: Request, res: Response) {
  try {
    const { shippingOrderId } = req.params;
    const { maxRetries } = req.body as { maxRetries?: number };

    const { retryShippingOrder } = await import('../services/shippingRetry.service');
    
    const result = await retryShippingOrder({
      shippingOrderId,
      maxRetries: maxRetries || 3,
    });

    if (result.success) {
      return res.json({
        success: true,
        message: 'GHN order created successfully',
        orderCode: result.orderCode,
        retryCount: result.retryCount,
      });
    } else {
      return res.status(500).json({
        success: false,
        message: 'Failed to create GHN order',
        error: result.error,
        retryCount: result.retryCount,
      });
    }
  } catch (error: any) {
    console.error('Failed to retry shipping order:', error);
    return res.status(500).json({ error: error.message || 'Failed to retry shipping order' });
  }
}

/**
 * Retry tất cả failed shipping orders
 * POST /api/shipping/retry-all
 */
export async function retryAllFailedShippingOrdersController(req: Request, res: Response) {
  try {
    const { maxRetries } = req.body as { maxRetries?: number };

    const { retryAllFailedShippingOrders } = await import('../services/shippingRetry.service');
    
    const result = await retryAllFailedShippingOrders(maxRetries || 3);

    return res.json({
      success: true,
      message: `Processed ${result.total} failed shipping orders`,
      total: result.total,
      results: result.results,
    });
  } catch (error: any) {
    console.error('Failed to retry all failed shipping orders:', error);
    return res.status(500).json({ error: error.message || 'Failed to retry all failed shipping orders' });
  }
}

/**
 * Lấy danh sách shipping orders theo status
 * GET /api/shipping/orders?status=failed
 */
export async function getShippingOrdersController(req: Request, res: Response) {
  try {
    const { status, limit = '50', offset = '0' } = req.query;

    const where: any = {};
    if (status) {
      where.status = status;
    }

    const [orders, total] = await Promise.all([
      (await import('../utils/prisma')).prisma.shipping_order.findMany({
        where,
        take: Number(limit),
        skip: Number(offset),
        orderBy: { created_at: 'desc' },
        include: {
          seller_order: {
            include: {
              orders: {
                select: {
                  id: true,
                  user_id: true,
                  total: true,
                  status: true,
                },
              },
            },
          },
        },
      }),
      (await import('../utils/prisma')).prisma.shipping_order.count({ where }),
    ]);

    return res.json({
      orders,
      total,
      limit: Number(limit),
      offset: Number(offset),
    });
  } catch (error: any) {
    console.error('Failed to get shipping orders:', error);
    return res.status(500).json({ error: error.message || 'Failed to get shipping orders' });
  }
}


