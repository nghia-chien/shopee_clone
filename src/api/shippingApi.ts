import axios from 'axios';

const API_ROOT = (import.meta.env.VITE_API_URL || 'http://localhost:4000/api').replace(/\/$/, '');
const SHIPPING_API = `${API_ROOT}/shipping`;

const client = axios.create({
  baseURL: SHIPPING_API,
});

// 🔹 Interceptors để log request và response
client.interceptors.request.use((config) => {
  console.log('📤 Gửi request:', config.method?.toUpperCase(), config.url);
  console.log('Dữ liệu gửi:', config.data || config.params || {});
  return config;
});

client.interceptors.response.use(
  (response) => {
    console.log('📥 Response từ server:', response.status, response.config.url);
    console.log('Dữ liệu trả về:', response.data);
    return response;
  },
  (error) => {
    console.error('❌ Lỗi request:', error.config?.url);
    console.error('Chi tiết lỗi:', error.response?.data || error.message);
    return Promise.reject(error);
  }
);

export const getProvinces = () => client.get('/provinces');

export const getDistricts = (provinceId: number) => client.get(`/districts/${provinceId}`);

export const getWards = (districtId: number) => client.get(`/wards/${districtId}`);

export interface FeeRequest {
  from_district_id: number;
  to_district_id: number;
  weight: number;
  service_id?: number;
}

export const calculateShippingFee = (data: FeeRequest) => client.post('/fee', data);

export interface CreateOrderRequest {
  to_name: string;
  to_phone: string;
  to_address: string;
  to_ward_code: string;
  to_district_id: number;
  weight: number;
  service_id?: number;
  note?: string;
  required_note?: string;
  cod_amount?: number;
  items?: Array<{
    name: string;
    quantity: number;
    weight?: number;
    price?: number;
    product_code?: string;
  }>;
  content?: string;
  payment_type_id?: number;
  insurance_value?: number;
  client_order_code?: string;
  return_address?: string;
  return_phone?: string;
  return_district_id?: number;
  return_ward_code?: string;
  pick_shift?: number[];
  pickup_time?: number;
  length?: number;
  width?: number;
  height?: number;
}

export const createShippingOrder = (data: CreateOrderRequest) => {
  console.log('🚀 Tạo đơn hàng GHN với payload:', data);
  return client.post('/create-order', data);
};

export const cancelShippingOrder = (orderCode: string) => {
  console.log('🚫 Hủy đơn hàng GHN:', orderCode);
  return client.post('/cancel-order', { order_code: orderCode });
};
