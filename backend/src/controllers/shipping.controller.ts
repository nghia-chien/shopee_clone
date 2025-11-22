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
    throw new Error(`Số điện thoại không đúng định dạng: ${phone}. Yêu cầu: 10 số, bắt đầu bằng 0 (ví dụ: 0123456789)`);
  }

  return cleaned;
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

  if (
    !to_name ||
    !to_phone ||
    !to_address ||
    !to_ward_code ||
    Number.isNaN(Number(to_district_id)) ||
    Number.isNaN(Number(weight))
  ) {
    console.log('Thiếu thông tin khách hàng hoặc địa chỉ:', req.body);
    return res.status(400).json({ error: 'Thiếu thông tin khách hàng hoặc địa chỉ' });
  }

  // Validate và format số điện thoại
  let validatedToPhone: string;
  try {
    validatedToPhone = validateAndFormatPhone(to_phone);
  } catch (error: any) {
    return res.status(400).json({ error: error.message || 'Số điện thoại không hợp lệ' });
  }

  // Lấy shop config từ env
  const shopConfig = {
    from_name: process.env.SHIP_FROM_NAME || 'Shop',
    from_phone: process.env.SHIP_FROM_PHONE || '',
    from_address: process.env.SHIP_FROM_ADDRESS || 'Hà Nội',
    from_ward_code: process.env.SHIP_FROM_WARD_CODE || '',
    from_district_id: Number(process.env.SHIP_FROM_DISTRICT_ID || 1450),
  };

  // Validate shop phone
  let validatedFromPhone: string;
  try {
    validatedFromPhone = validateAndFormatPhone(shopConfig.from_phone);
  } catch (error: any) {
    return res.status(500).json({ 
      error: `Shop phone number is invalid: ${error.message}. Please configure SHIP_FROM_PHONE in environment variables.` 
    });
  }

  try {
    const orderPayload = {
      payment_type_id: 2,
      note,
      required_note,
      to_name,
      to_phone: validatedToPhone,
      to_address,
      to_ward_code,
      to_district_id: Number(to_district_id),
      weight: Number(weight),
      content: req.body?.content ?? '',
      items,
      from_name: shopConfig.from_name,
      from_phone: validatedFromPhone,
      from_address: shopConfig.from_address,
      from_ward_code: shopConfig.from_ward_code,
      from_district_id: shopConfig.from_district_id,
    };

    console.log('Payload gửi lên GHN:', JSON.stringify(orderPayload, null, 2));

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
  // Validate và format số điện thoại
  const to_phone = validateAndFormatPhone(params.to_phone);
  const from_phone = validateAndFormatPhone(params.from_phone);

  const orderPayload = {
    payment_type_id: params.payment_type_id,
    note: params.note || '',
    required_note: params.required_note || 'KHONGCHOXEMHANG',
    service_type_id: params.service_type_id || 2,
    to_name: params.to_name,
    to_phone: to_phone,
    to_address: params.to_address,
    to_ward_code: params.to_ward_code,
    to_district_id: params.to_district_id,
    weight: params.weight,
    length: params.length || 10,
    width: params.width || 10,
    height: params.height || 10,
    content: '',
    items: params.items,
    from_name: params.from_name,
    from_phone: from_phone,
    from_address: params.from_address,
    from_ward_code: params.from_ward_code,
    from_district_id: params.from_district_id,
  };

  console.log('Payload gửi lên GHN:', JSON.stringify(orderPayload, null, 2));

  const ghnOrder = await callGhnApi('/v2/shipping-order/create', {
    method: 'POST',
    body: orderPayload,
  });

  console.log('GHN trả về:', JSON.stringify(ghnOrder, null, 2));

  return ghnOrder;
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


