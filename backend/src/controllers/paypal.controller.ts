import type { Request, Response } from 'express';

const PAYPAL_API_BASE =
  process.env.PAYPAL_API_BASE || 'https://api-m.sandbox.paypal.com';
const DEFAULT_VND_RATE = Number(process.env.PAYPAL_VND_EXCHANGE_RATE || '24000');

function getBasicAuthHeader() {
  const clientId = process.env.VITE_PAYPAL_CLIENT_ID;
  const secret = process.env.PAYPAL_SECRET;
  if (!clientId || !secret) {
    throw new Error('VITE_PAYPAL_CLIENT_ID hoặc PAYPAL_SECRET chưa được cấu hình');
  }
  const credentials = Buffer.from(`${clientId}:${secret}`).toString('base64');
  return `Basic ${credentials}`;
}

export async function createPayPalOrderController(req: Request, res: Response) {
  try {
    const {
      amount,
      total,
      currency = 'USD',
      original_amount_vnd,
      conversion_rate,
    } = req.body as {
      amount?: number;
      total?: number;
      currency?: 'USD' | 'VND';
      original_amount_vnd?: number;
      conversion_rate?: number;
    };

    const rawAmount = Number(amount ?? total);
    if (!Number.isFinite(rawAmount) || rawAmount <= 0) {
      return res.status(400).json({ message: 'amount / total không hợp lệ' });
    }

    const rate =
      Number(conversion_rate) > 0
        ? Number(conversion_rate)
        : DEFAULT_VND_RATE > 0
        ? DEFAULT_VND_RATE
        : 24000;

    let usdValue = rawAmount;
    let vndValue =
      currency === 'USD'
        ? Number(
            original_amount_vnd && Number(original_amount_vnd) > 0
              ? original_amount_vnd
              : rawAmount * rate
          )
        : rawAmount;

    if (currency !== 'USD') {
      vndValue = rawAmount;
      usdValue = rawAmount / rate;
    }

    usdValue = Number(usdValue.toFixed(2));
    if (!Number.isFinite(usdValue) || usdValue <= 0) {
      usdValue = 0.01;
    }

    const response = await fetch(`${PAYPAL_API_BASE}/v2/checkout/orders`, {
      method: "POST",
      headers: {
        "Authorization": getBasicAuthHeader(),
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        intent: "CAPTURE",
        purchase_units: [
          {
            amount: {
              currency_code: "USD",
              value: usdValue.toFixed(2),
            },
            custom_id: `VND:${Math.round(vndValue)}`,
          },
        ],
      }),
    });
    

    if (!response.ok) {
      const error = await response.text();
      console.error('PayPal create order failed:', error);
      return res.status(response.status).json({ message: 'PayPal create order failed', error });
    }

    const data = (await response.json()) as { id: string };
    return res.json({
      orderId: data.id,
      converted_amount: {
        vnd: vndValue,
        usd: usdValue,
        rate,
      },
    });
  } catch (error: any) {
    console.error('createPayPalOrderController error:', error);
    return res.status(500).json({ message: error.message || 'Internal server error' });
  }
}

export async function capturePayPalOrderController(req: Request, res: Response) {
  try {
    const { orderId } = req.body as { orderId?: string };
    if (!orderId) {
      return res.status(400).json({ message: 'orderId không hợp lệ' });
    }

    const response = await fetch(
      `${PAYPAL_API_BASE}/v2/checkout/orders/${orderId}/capture`,
      {
        method: 'POST',
        headers: {
          Authorization: getBasicAuthHeader(),
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      const error = await response.text();
      console.error('PayPal capture order failed:', error);
      return res.status(response.status).json({ message: 'PayPal capture failed', error });
    }

    const data = await response.json();
    return res.json(data);
  } catch (error: any) {
    console.error('capturePayPalOrderController error:', error);
    return res.status(500).json({ message: error.message || 'Internal server error' });
  }
}
