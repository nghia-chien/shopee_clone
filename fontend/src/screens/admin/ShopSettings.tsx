import { useState, useEffect, useCallback } from 'react';
import type { FormEvent } from 'react';
import { AddressSelector } from '../../components/shipping/AddressSelector';
import { api } from '../../api/userapi/client';
import { useAdminAuthStore } from '../../store/AdminAuth';

interface ShopForm {
  name: string;
  phone: string;
  address_line: string;
  province_id?: number;
  province_name: string;
  district_id?: number;
  district_name: string;
  ward_code?: string;
  ward_name: string;
}

export function ShopSettings() {
  const { token: adminToken } = useAdminAuthStore();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [settings, setSettings] = useState<ShopForm | null>(null);
  const [skipValidation, setSkipValidation] = useState(false);

  const [form, setForm] = useState<ShopForm>({
    name: '',
    phone: '',
    address_line: '',
    province_id: undefined,
    province_name: '',
    district_id: undefined,
    district_name: '',
    ward_code: undefined,
    ward_name: '',
  });

  // State riêng cho AddressSelector - chỉ update khi load settings
  const [addressKey, setAddressKey] = useState(0);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      const data = await api<{ settings: ShopForm }>('/shop-settings');
      setSettings(data.settings);
      setForm({
        ...data.settings
      });
      // Force re-mount AddressSelector với data mới
      setAddressKey(prev => prev + 1);
    } catch (err: any) {
      console.error('Error loading shop settings:', err);
      setError(err.message || 'Không thể tải cài đặt shop');
    } finally {
      setLoading(false);
    }
  };

  // Dùng useCallback để tránh re-create function mỗi lần render
  const handleAddressChange = useCallback((location: any) => {
    setForm((prev) => {
      // Chỉ update nếu giá trị thực sự thay đổi
      const hasChanges = 
        location.provinceId !== prev.province_id ||
        location.provinceName !== prev.province_name ||
        location.districtId !== prev.district_id ||
        location.districtName !== prev.district_name ||
        location.wardCode !== prev.ward_code ||
        location.wardName !== prev.ward_name;

      if (!hasChanges) {
        return prev; // Không update nếu giống nhau
      }

      return {
        ...prev,
        province_id: location.provinceId ?? prev.province_id,
        province_name: location.provinceName ?? prev.province_name,
        district_id: location.districtId ?? prev.district_id,
        district_name: location.districtName ?? prev.district_name,
        ward_code: location.wardCode ?? prev.ward_code,
        ward_name: location.wardName ?? prev.ward_name,
      };
    });
  }, []);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);
    setSaving(true);

    try {
      // Validate required fields
      if (!form.name || !form.phone || !form.address_line) {
        setError('Vui lòng điền đầy đủ thông tin: Tên shop, Số điện thoại, và Địa chỉ');
        setSaving(false);
        return;
      }

      if (!adminToken) {
        setError('Bạn cần đăng nhập admin để cập nhật cài đặt');
        setSaving(false);
        return;
      }

      // Prepare payload
      let payload;
      
      if (skipValidation) {
        // Nếu skip validation: XÓA CẢ ward_code VÀ district_id
        // Chỉ giữ lại province
        payload = {
          name: form.name,
          phone: form.phone,
          address_line: form.address_line,
          province_id: form.province_id,
          province_name: form.province_name,
          // KHÔNG GỬI district_id, district_name, ward_code, ward_name
        };
      } else {
        // Gửi đầy đủ như bình thường
        payload = { ...form };
      }

      console.log('📤 Sending shop settings payload:', {
        ...payload,
        skipValidation,
        ward_code_type: typeof payload.ward_code,
        district_id_type: typeof payload.district_id,
      });

      await api('/shop-settings', {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${adminToken}`,
        },
        body: JSON.stringify(payload),
      });
  
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
      await loadSettings();
    } catch (err: any) {
      console.error('Error saving shop settings:', err);
      
      // Nếu lỗi là do ward_code không hợp lệ và chưa skip validation
      if (err.message?.includes('Ward code') && err.message?.includes('không tồn tại') && !skipValidation) {
        setError(
          err.message + 
          '\n\n💡 Tip: Bạn có thể tick vào ô "Bỏ qua validation ward_code" bên dưới để lưu chỉ với Tỉnh/Thành phố (không cần Quận/Huyện và Phường/Xã).'
        );
      } else if (err.message?.includes('ward_code') && err.message?.includes('district_id')) {
        setError(
          err.message + 
          '\n\n💡 Tip: Backend yêu cầu cả ward_code và district_id phải có hoặc cả hai để trống. Tick "Bỏ qua validation" để chỉ lưu Province.'
        );
      } else {
        setError(err.message || 'Không thể lưu cài đặt shop');
      }
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="text-center text-gray-500">Đang tải...</div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Cấu hình địa chỉ shop</h1>
        <p className="text-sm text-gray-600 mb-6">
          Cấu hình địa chỉ shop để gửi hàng qua GHN. Địa chỉ này sẽ được sử dụng làm địa chỉ người gửi khi tạo đơn hàng vận chuyển.
        </p>

        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md text-red-700 text-sm">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-md text-green-700 text-sm">
            ✅ Đã lưu cài đặt thành công!
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tên shop <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={form.name}
              onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
              placeholder="Tên shop"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Số điện thoại <span className="text-red-500">*</span>
            </label>
            <input
              type="tel"
              required
              value={form.phone}
              onChange={(e) => setForm((prev) => ({ ...prev, phone: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
              placeholder="0987654321"
            />
            <p className="mt-1 text-xs text-gray-500">
              Format: 10 số, bắt đầu bằng 0 (ví dụ: 0987654321)
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Địa chỉ cụ thể <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={form.address_line}
              onChange={(e) => setForm((prev) => ({ ...prev, address_line: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
              placeholder="Số nhà, tên đường"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tỉnh/Thành phố - Quận/Huyện - Phường/Xã <span className="text-red-500">*</span>
            </label>
            <p className="text-xs text-gray-500 mb-3">
              ⚠️ Quan trọng: Phải chọn đầy đủ để đảm bảo địa chỉ hợp lệ với GHN API
            </p>
            
            {form.ward_code && (
              <div className="mb-3 p-3 bg-blue-50 border border-blue-200 rounded-md">
                <div className="flex items-start justify-between gap-2">
                  <div className="text-sm text-blue-800">
                    <span className="font-medium">Ward hiện tại:</span> {form.ward_name} (Code: {form.ward_code})
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setForm(prev => ({
                        ...prev,
                        ward_code: undefined,
                        ward_name: '',
                      }));
                      setAddressKey(prev => prev + 1); // Force re-mount để clear selection
                    }}
                    className="text-xs px-2 py-1 bg-blue-600 text-white rounded hover:bg-blue-700"
                  >
                    Xóa & chọn lại
                  </button>
                </div>
              </div>
            )}
            
            <div className="mb-3 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
              <label className="flex items-start gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={skipValidation}
                  onChange={(e) => setSkipValidation(e.target.checked)}
                  className="w-4 h-4 mt-0.5 text-orange-500 border-gray-300 rounded focus:ring-orange-500"
                />
                <div className="text-yellow-800">
                  <div className="font-medium mb-1">⚠️ Bỏ qua Quận/Huyện và Phường/Xã</div>
                  <div className="text-xs">
                    Tick tùy chọn này nếu:
                    <ul className="list-disc ml-4 mt-1">
                      <li>Ward code không được GHN API nhận diện</li>
                      <li>Bạn chỉ muốn lưu <strong>Tỉnh/Thành phố</strong> (không cần Quận/Huyện và Phường/Xã)</li>
                      <li>GHN chưa có dữ liệu đầy đủ cho khu vực của bạn</li>
                    </ul>
                    <div className="mt-2 p-2 bg-yellow-100 rounded text-yellow-900">
                      <strong>Lưu ý:</strong> Khi tick, hệ thống sẽ CHỈ lưu thông tin Tỉnh/Thành phố và bỏ qua Quận/Huyện + Phường/Xã
                    </div>
                  </div>
                </div>
              </label>
            </div>
            <AddressSelector
              key={addressKey} // Force re-mount khi load settings mới
              includeStreetInput={false}
              showLabels={true}
              defaultValues={{
                provinceId: form.province_id,
                provinceName: form.province_name,
                districtId: form.district_id,
                districtName: form.district_name,
                wardCode: form.ward_code,
                wardName: form.ward_name,
              }}
              onAddressChange={handleAddressChange}
            />
          </div>

          <div className="flex items-center gap-4 pt-4 border-t">
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2 bg-orange-500 text-white rounded-md hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? 'Đang lưu...' : 'Lưu cài đặt'}
            </button>
            <button
              type="button"
              onClick={loadSettings}
              disabled={saving}
              className="px-6 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 disabled:opacity-50"
            >
              Hủy
            </button>
          </div>
        </form>

        {settings && (
          <div className="mt-6 p-4 bg-gray-50 rounded-md">
            <h3 className="text-sm font-medium text-gray-700 mb-2">Thông tin hiện tại:</h3>
            <div className="text-sm text-gray-600 space-y-1">
              <p>
                <span className="font-medium">Tên:</span> {settings.name}
              </p>
              <p>
                <span className="font-medium">SĐT:</span> {settings.phone}
              </p>
              <p>
                <span className="font-medium">Địa chỉ:</span> {settings.address_line}
              </p>
              {settings.ward_name && settings.district_name && settings.province_name && (
                <p>
                  <span className="font-medium">Khu vực:</span>{' '}
                  {settings.ward_name}, {settings.district_name}, {settings.province_name}
                </p>
              )}
              {settings.ward_code && (
                <p>
                  <span className="font-medium">Ward Code:</span> {settings.ward_code}
                </p>
              )}
              {settings.district_id && (
                <p>
                  <span className="font-medium">District ID:</span> {settings.district_id}
                </p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}