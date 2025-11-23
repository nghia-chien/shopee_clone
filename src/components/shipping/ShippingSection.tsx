import React from 'react';
import { AddressSelector } from './AddressSelector';
import { ShippingMethodSelector } from './ShippingMethodSelector';
import { useShipping } from '../../hooks/useShipping';

interface ShippingSectionProps {
  sellerLocation: {
    districtId: number;
    wardCode: string;
  };
  weight?: number;
  onShippingInfoChange: (data: {
    address: {
      provinceId: number | null;
      districtId: number | null;
      wardCode: string | null;
      fullAddress: string;
      phoneNumber: string;
      recipientName: string;
    };
    shippingMethod: {
      id: string;
      name: string;
      fee: number;
    } | null;
  }) => void;
  defaultValues?: {
    address?: {
      provinceId?: number;
      districtId?: number;
      wardCode?: string;
      fullAddress?: string;
      phoneNumber?: string;
      recipientName?: string;
    };
  };
}

export const ShippingSection: React.FC<ShippingSectionProps> = ({
  sellerLocation,
  weight = 500, // default weight in grams
  onShippingInfoChange,
  defaultValues,
}) => {
  const {
    address,
    updateAddress,
    shippingMethod,
    setShippingMethod,
    shippingFee,
    isCalculating,
    error,
  } = useShipping({
    defaultAddress: defaultValues?.address,
    sellerLocation,
    weight,
  });

  // Notify parent when shipping info changes
  React.useEffect(() => {
    onShippingInfoChange({
      address,
      shippingMethod: shippingMethod
        ? {
            ...shippingMethod,
            fee: shippingFee,
          }
        : null,
    });
  }, [address, shippingMethod, shippingFee, onShippingInfoChange]);

  const handleRecipientNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    updateAddress({ recipientName: e.target.value });
  };

  const handlePhoneNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    updateAddress({ phoneNumber: e.target.value });
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <h2 className="text-lg font-medium text-gray-900 mb-4">Thông tin người nhận</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Họ và tên <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={address.recipientName}
              onChange={handleRecipientNameChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
              placeholder="Nhập họ và tên"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Số điện thoại <span className="text-red-500">*</span>
            </label>
            <input
              type="tel"
              value={address.phoneNumber}
              onChange={handlePhoneNumberChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
              placeholder="Nhập số điện thoại"
              required
            />
          </div>
        </div>

        <div className="mb-4">
          <h3 className="text-md font-medium text-gray-900 mb-3">Địa chỉ nhận hàng</h3>
          <AddressSelector
            onAddressChange={(newAddress) => {
              updateAddress(newAddress);
            }}
            defaultValues={{
              provinceId: defaultValues?.address?.provinceId,
              districtId: defaultValues?.address?.districtId,
              wardCode: defaultValues?.address?.wardCode,
              fullAddress: defaultValues?.address?.fullAddress,
            }}
          />
        </div>

        {address.districtId && address.wardCode && (
          <div className="pt-4 border-t border-gray-200">
            <h3 className="text-md font-medium text-gray-900 mb-3">Phương thức vận chuyển</h3>
            <ShippingMethodSelector
              fromDistrictId={sellerLocation.districtId}
              fromWardCode={sellerLocation.wardCode}
              toDistrictId={address.districtId}
              toWardCode={address.wardCode}
              weight={weight}
              onShippingMethodChange={setShippingMethod}
            />
            {error && (
              <p className="mt-2 text-sm text-red-500">{error}</p>
            )}
            {isCalculating && (
              <p className="mt-2 text-sm text-gray-500">
                Đang tính phí vận chuyển...
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ShippingSection;