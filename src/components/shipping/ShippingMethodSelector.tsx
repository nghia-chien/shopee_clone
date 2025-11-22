import React, { useEffect, useState } from 'react';
import { calculateShippingFee } from '../../api/shippingApi';
import { Loader2 } from 'lucide-react';

export interface ShippingMethod {
  id: string;
  name: string;
  description: string;
  estimated_delivery: string;
  default_fee: number;
  service_id?: number;
}

interface ShippingMethodSelectorProps {
  fromDistrictId: number;
  fromWardCode: string;
  toDistrictId: number | null;
  toWardCode: string | null;
  weight: number;
  onShippingMethodChange: (method: ShippingMethod & { fee: number }) => void;
  className?: string;
}

export const SHIPPING_METHODS: ShippingMethod[] = [
  {
    id: 'standard',
    name: 'Giao hàng tiêu chuẩn',
    description: 'Giao hàng trong 3-5 ngày làm việc',
    estimated_delivery: '3-5 ngày',
    default_fee: 20000,
    service_id: 53321,
  },
  {
    id: 'express',
    name: 'Giao hàng nhanh',
    description: 'Giao hàng trong 1-2 ngày làm việc',
    estimated_delivery: '1-2 ngày',
    default_fee: 35000,
    service_id: 53320,
  },
  {
    id: 'priority',
    name: 'Giao hàng hỏa tốc',
    description: 'Giao hàng trong ngày',
    estimated_delivery: 'Trong ngày',
    default_fee: 50000,
    service_id: 53322,
  },
];

export const ShippingMethodSelector: React.FC<ShippingMethodSelectorProps> = ({
  fromDistrictId,
  fromWardCode,
  toDistrictId,
  toWardCode,
  weight,
  onShippingMethodChange,
  className = '',
}) => {
  const [selectedMethod, setSelectedMethod] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [fees, setFees] = useState<Record<string, number>>({});
  const [error, setError] = useState<string | null>(null);

  // Calculate shipping fees when destination changes
  useEffect(() => {
    const calculateFees = async () => {
      if (!toDistrictId || !toWardCode) return;

      setLoading(true);
      setError(null);

      try {
        const newFees: Record<string, number> = {};

        for (const method of SHIPPING_METHODS) {
          try {
            const response = await calculateShippingFee({
              from_district_id: fromDistrictId,
              to_district_id: toDistrictId,
              weight: weight || 500, // Default to 500g if weight is 0
              service_id: method.service_id,
            });
            newFees[method.id] = response.data.total ?? method.default_fee;
          } catch (err) {
            console.error(`Error calculating ${method.name} fee:`, err);
            newFees[method.id] = method.default_fee; // Fallback to default fee
          }
        }

        setFees(newFees);
        
        // Auto-select the first method if none selected
        if (!selectedMethod && SHIPPING_METHODS.length > 0) {
          const firstMethod = SHIPPING_METHODS[0];
          onShippingMethodChange({
            ...firstMethod,
            fee: newFees[firstMethod.id] || firstMethod.default_fee,
          });
          setSelectedMethod(firstMethod.id);
        }
      } catch (err) {
        console.error('Error calculating shipping fees:', err);
        setError('Không thể tính phí vận chuyển. Vui lòng thử lại sau.');
      } finally {
        setLoading(false);
      }
    };

    calculateFees();
  }, [fromDistrictId, fromWardCode, toDistrictId, toWardCode, weight, onShippingMethodChange]);

  const handleMethodSelect = (method: ShippingMethod) => {
    setSelectedMethod(method.id);
    onShippingMethodChange({
      ...method,
      fee: fees[method.id] || method.default_fee,
    });
  };

  if (loading && !selectedMethod) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
        <span className="ml-2">Đang tính phí vận chuyển...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-md bg-red-50 p-4 text-red-700">
        <p>{error}</p>
        <p className="mt-2 text-sm">Vui lòng kiểm tra lại địa chỉ giao hàng.</p>
      </div>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      <h3 className="text-lg font-medium">Phương thức vận chuyển</h3>
      
      <div className="space-y-3">
        {SHIPPING_METHODS.map((method) => {
          const fee = fees[method.id] || method.default_fee;
          const isSelected = selectedMethod === method.id;
          
          return (
            <div
              key={method.id}
              onClick={() => handleMethodSelect(method)}
              className={`cursor-pointer rounded-lg border p-4 transition-colors ${
                isSelected ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-blue-300'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-3">
                  <div
                    className={`mt-0.5 h-5 w-5 rounded-full border ${
                      isSelected ? 'border-blue-500 bg-blue-500' : 'border-gray-300'
                    } flex items-center justify-center`}
                  >
                    {isSelected && (
                      <div className="h-2 w-2 rounded-full bg-white"></div>
                    )}
                  </div>
                  <div>
                    <div className="flex items-center">
                      <span className="font-medium">{method.name}</span>
                      <span className="ml-2 rounded bg-blue-100 px-2 py-0.5 text-xs text-blue-800">
                        {method.estimated_delivery}
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-gray-600">{method.description}</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-medium">
                    {new Intl.NumberFormat('vi-VN', {
                      style: 'currency',
                      currency: 'VND',
                    }).format(fee)}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ShippingMethodSelector;
