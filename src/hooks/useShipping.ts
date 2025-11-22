import { useState, useCallback } from 'react';
import { calculateShippingFee, createShippingOrder } from '../api/shippingApi';
import { SHIPPING_METHODS } from '../components/shipping/ShippingMethodSelector';
import type { ShippingMethod } from '../components/shipping/ShippingMethodSelector';

export interface ShippingAddress {
  provinceId: number | null;
  districtId: number | null;
  wardCode: string | null;
  fullAddress: string;
  phoneNumber: string;
  recipientName: string;
}

interface UseShippingProps {
  defaultAddress?: Partial<ShippingAddress>;
  sellerLocation?: {
    districtId: number;
    wardCode: string;
  };
  weight?: number; // in grams
}

export const useShipping = ({ 
  defaultAddress = {}, 
  sellerLocation = { districtId: 0, wardCode: '' },
  weight = 500 
}: UseShippingProps = {}) => {
  const [address, setAddress] = useState<ShippingAddress>({
    provinceId: null,
    districtId: null,
    wardCode: null,
    fullAddress: '',
    phoneNumber: '',
    recipientName: '',
    ...defaultAddress,
  });

  const [shippingMethod, setShippingMethod] = useState<ShippingMethod | null>(null);
  const [shippingFee, setShippingFee] = useState<number>(0);
  // shippingFee is used in the return value
  const [isCalculating, setIsCalculating] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Update shipping fee when address or shipping method changes
  const updateShippingFee = useCallback(async () => {
    if (!address.districtId || !address.wardCode || !shippingMethod) return;

    setIsCalculating(true);
    setError(null);

    try {
      const response = await calculateShippingFee({
        from_district_id: sellerLocation.districtId,
        to_district_id: address.districtId,
        weight: weight || 500,
        service_id: shippingMethod.service_id,
      });

      const calculatedFee = response.data?.total ?? shippingMethod.default_fee;
      setShippingFee(calculatedFee);
      return calculatedFee;
    } catch (err) {
      console.error('Error calculating shipping fee:', err);
      setError('Không thể tính phí vận chuyển. Vui lòng kiểm tra lại địa chỉ.');
      return 0;
    } finally {
      setIsCalculating(false);
    }
  }, [address, shippingMethod, sellerLocation, weight]);

  // Create shipping order
  const createOrder = useCallback(
    async (orderData: {
      orderId: string;
      items: Array<{
        name: string;
        quantity: number;
        weight: number;
        price: number;
        product_code?: string;
      }>;
      paymentMethod: string;
      note?: string;
    }) => {
      if (!shippingMethod || !address.districtId || !address.wardCode) {
        throw new Error('Vui lòng chọn đầy đủ thông tin vận chuyển');
      }

      try {
        const shippingFee = await updateShippingFee();
        
        const orderPayload = {
          order_id: orderData.orderId,
          to_name: address.recipientName,
          to_phone: address.phoneNumber,
          to_address: address.fullAddress,
          to_ward_code: address.wardCode,
          to_district_id: address.districtId,
          weight: weight || 500,
          length: 10,
          width: 10,
          height: 10,
          service_type_id: 2, // Standard delivery
          payment_type_id: orderData.paymentMethod === 'COD' ? 1 : 2, // 1: COD, 2: Non-COD
          required_note: 'KHONGCHOXEMHANG',
          items: orderData.items.map((item) => ({
            name: item.name,
            quantity: item.quantity,
            weight: item.weight,
            product_code: item.product_code || '',
          })),
          cod_amount: orderData.paymentMethod === 'COD' 
            ? orderData.items.reduce((sum, item) => sum + (item.price * item.quantity), 0) 
            : 0,
          content: `Đơn hàng #${orderData.orderId}`,
          note: orderData.note || '',
        };

        const response = await createShippingOrder(orderPayload);
        return response.data;
      } catch (err) {
        console.error('Error creating shipping order:', err);
        throw new Error('Không thể tạo đơn vận chuyển. Vui lòng thử lại sau.');
      }
    },
    [address, shippingMethod, updateShippingFee, weight]
  );

  // Update address
  const updateAddress = useCallback((newAddress: Partial<ShippingAddress>) => {
    setAddress((prev) => ({
      ...prev,
      ...newAddress,
    }));
  }, []);

  return {
    address,
    updateAddress,
    shippingMethod,
    setShippingMethod,
    shippingFee,
    isCalculating,
    error,
    createOrder,
  };
};

export default useShipping;
