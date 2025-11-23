import React, { useEffect, useRef, useState } from "react";
import { getProvinces, getDistricts, getWards } from "../../api/shippingApi";

interface AddressSelectorProps {
  onAddressChange: (data: {
    provinceId: number | null;
    provinceName?: string;
    districtId: number | null;
    districtName?: string;
    wardCode: string | null;
    wardName?: string;
    fullAddress?: string;
    streetAddress?: string;
  }) => void;
  className?: string;
  showLabels?: boolean;
  includeStreetInput?: boolean;
  defaultValues?: {
    provinceId?: number;
    provinceName?: string;
    districtId?: number;
    districtName?: string;
    wardCode?: string;
    wardName?: string;
    fullAddress?: string;
    streetAddress?: string;
  };
}

export const AddressSelector: React.FC<AddressSelectorProps> = ({
  onAddressChange,
  className = "",
  showLabels = true,
  includeStreetInput = true,
  defaultValues,
}) => {
  const [provinces, setProvinces] = useState<Array<{ ProvinceID: number; ProvinceName: string }>>([]);
  const [districts, setDistricts] = useState<Array<{ DistrictID: number; DistrictName: string }>>([]);
  const [wards, setWards] = useState<Array<{ WardCode: string; WardName: string }>>([]);
  const [selectedProvince, setSelectedProvince] = useState<number | null>(defaultValues?.provinceId || null);
  const [selectedDistrict, setSelectedDistrict] = useState<number | null>(defaultValues?.districtId || null);
  const [selectedWard, setSelectedWard] = useState<string | null>(defaultValues?.wardCode || null);
  const [streetAddress, setStreetAddress] = useState<string>(
    defaultValues?.streetAddress ||
      (defaultValues?.fullAddress ? defaultValues.fullAddress.split(",")[0]?.trim() ?? "" : "")
  );
  const defaultsAppliedRef = useRef(false);

  const normalize = (value?: string | null) =>
    value
      ? value
          .toString()
          .trim()
          .toLowerCase()
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "")
      : "";

  const findProvinceIdByName = (name?: string) => {
    const normalizedName = normalize(name);
    if (!normalizedName) return null;
    const province = provinces.find((p) => normalize(p.ProvinceName) === normalizedName);
    return province?.ProvinceID ?? null;
  };

  const findDistrictIdByName = (name?: string) => {
    const normalizedName = normalize(name);
    if (!normalizedName) return null;
    const district = districts.find((d) => normalize(d.DistrictName) === normalizedName);
    return district?.DistrictID ?? null;
  };

  const findWardCodeByName = (name?: string) => {
    const normalizedName = normalize(name);
    if (!normalizedName) return null;
    const ward = wards.find((w) => normalize(w.WardName) === normalizedName);
    return ward?.WardCode ?? null;
  };

  const handleProvinceChange = (value: string) => {
    const provinceId = value ? Number(value) : null;
    setSelectedProvince(provinceId);
    setSelectedDistrict(null);
    setSelectedWard(null);
    setDistricts([]);
    setWards([]);
  };

  const handleDistrictChange = (value: string) => {
    const districtId = value ? Number(value) : null;
    setSelectedDistrict(districtId);
    setSelectedWard(null);
    setWards([]);
  };

  const handleWardChange = (value: string) => {
    setSelectedWard(value || null);
  };

  // Load provinces on mount
  useEffect(() => {
    const fetchProvinces = async () => {
      try {
        const response = await getProvinces();
        setProvinces(response.data);
      } catch (error) {
        console.error("Error fetching provinces:", error);
      }
    };
    fetchProvinces();
  }, []);

  // Load districts when province is selected
  useEffect(() => {
    const fetchDistricts = async () => {
      if (!selectedProvince) {
        setDistricts([]);
        setSelectedDistrict(null);
        setWards([]);
        setSelectedWard(null);
        return;
      }
      try {
        const response = await getDistricts(selectedProvince);
        setDistricts(response.data);
      } catch (error) {
        console.error("Error fetching districts:", error);
      }
    };
    fetchDistricts();
  }, [selectedProvince]);

  // Load wards when district is selected
  useEffect(() => {
    const fetchWards = async () => {
      if (!selectedDistrict) {
        setWards([]);
        setSelectedWard(null);
        return;
      }
      try {
        const response = await getWards(selectedDistrict);
        setWards(response.data);
      } catch (error) {
        console.error("Error fetching wards:", error);
      }
    };
    fetchWards();
  }, [selectedDistrict]);

  // Apply default values once when data is available
  useEffect(() => {
    if (defaultsAppliedRef.current) return;
    if (!defaultValues) return;
    if (!provinces.length) return;

    const provinceFromName = findProvinceIdByName(defaultValues.provinceName);
    const nextProvince = defaultValues.provinceId ?? provinceFromName;

    if (nextProvince) {
      setSelectedProvince(nextProvince);
    }
  }, [defaultValues, provinces]);

  useEffect(() => {
    if (defaultsAppliedRef.current) return;
    if (!defaultValues) return;
    if (!selectedProvince) return;
    if (!districts.length) return;

    const provinceMatches =
      (defaultValues.provinceId && defaultValues.provinceId === selectedProvince) ||
      (!defaultValues.provinceId &&
        (!defaultValues.provinceName ||
          findProvinceIdByName(defaultValues.provinceName) === selectedProvince));

    if (!provinceMatches) return;

    const districtFromName = findDistrictIdByName(defaultValues.districtName);
    const nextDistrict = defaultValues.districtId ?? districtFromName;

    if (nextDistrict) {
      setSelectedDistrict(nextDistrict);
    }
  }, [defaultValues, districts, selectedProvince]);

  useEffect(() => {
    if (defaultsAppliedRef.current) return;
    if (!defaultValues) return;
    if (!selectedDistrict) return;
    if (!wards.length) return;

    const districtMatches =
      (defaultValues.districtId && defaultValues.districtId === selectedDistrict) ||
      (!defaultValues.districtId &&
        (!defaultValues.districtName ||
          findDistrictIdByName(defaultValues.districtName) === selectedDistrict));

    if (!districtMatches) return;

    const wardFromName = findWardCodeByName(defaultValues.wardName);
    const nextWard = defaultValues.wardCode ?? wardFromName;

    if (nextWard) {
      setSelectedWard(nextWard);
      defaultsAppliedRef.current = true;
    }
  }, [defaultValues, wards, selectedDistrict]);

  // Notify parent when address changes
  useEffect(() => {
    if (selectedProvince && selectedDistrict && selectedWard) {
      const province = provinces.find(p => p.ProvinceID === selectedProvince);
      const district = districts.find(d => d.DistrictID === selectedDistrict);
      const ward = wards.find(w => w.WardCode === selectedWard);
      
      const fullAddress = [
        streetAddress,
        ward?.WardName,
        district?.DistrictName,
        province?.ProvinceName
      ].filter(Boolean).join(', ');

      onAddressChange({
        provinceId: selectedProvince,
        provinceName: province?.ProvinceName,
        districtId: selectedDistrict,
        districtName: district?.DistrictName,
        wardCode: selectedWard,
        wardName: ward?.WardName,
        streetAddress,
        fullAddress
      });
    }
  }, [selectedProvince, selectedDistrict, selectedWard, streetAddress, provinces, districts, wards, onAddressChange]);

  // Set default values on mount if provided
  useEffect(() => {
    if (defaultValues) {
      if (defaultValues.provinceId) setSelectedProvince(defaultValues.provinceId);
      if (defaultValues.districtId) setSelectedDistrict(defaultValues.districtId);
      if (defaultValues.wardCode) setSelectedWard(defaultValues.wardCode);
    }
  }, [defaultValues]);

  return (
    <div className={`space-y-4 ${className}`}>
      {includeStreetInput && (
        <div>
          {showLabels && <label className="block text-sm font-medium text-gray-700 mb-1">Địa chỉ cụ thể</label>}
          <input
            type="text"
            value={streetAddress}
            onChange={(e) => setStreetAddress(e.target.value)}
            placeholder="Số nhà, tên đường"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
          />
        </div>
      )}
      
      <div>
        {showLabels && <label className="block text-sm font-medium text-gray-700 mb-1">Tỉnh/Thành phố</label>}
        <select
          value={selectedProvince?.toString() || ""}
          onChange={(e) => handleProvinceChange(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
        >
          <option value="">Chọn Tỉnh/Thành phố</option>
          {provinces.map((province) => (
            <option key={province.ProvinceID} value={province.ProvinceID}>
              {province.ProvinceName}
            </option>
          ))}
        </select>
      </div>

      <div>
        {showLabels && <label className="block text-sm font-medium text-gray-700 mb-1">Quận/Huyện</label>}
        <select
          value={selectedDistrict?.toString() || ""}
          onChange={(e) => handleDistrictChange(e.target.value)}
          disabled={!selectedProvince}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
        >
          <option value="">Chọn Quận/Huyện</option>
          {districts.map((district) => (
            <option key={district.DistrictID} value={district.DistrictID}>
              {district.DistrictName}
            </option>
          ))}
        </select>
      </div>

      <div>
        {showLabels && <label className="block text-sm font-medium text-gray-700 mb-1">Phường/Xã</label>}
        <select
          value={selectedWard || ""}
          onChange={(e) => handleWardChange(e.target.value)}
          disabled={!selectedDistrict}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
        >
          <option value="">Chọn Phường/Xã</option>
          {wards.map((ward) => (
            <option key={ward.WardCode} value={ward.WardCode}>
              {ward.WardName}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
};

export default AddressSelector;