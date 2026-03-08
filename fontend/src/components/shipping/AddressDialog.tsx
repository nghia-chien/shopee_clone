import { useState, useEffect } from 'react';
import type { FormEvent } from 'react';
import { X, MapPin, Plus, Check, Edit, Trash2 } from 'lucide-react';
import { AddressSelector } from './AddressSelector';
import { createAddress, getAddresses, updateAddress, deleteAddress, type Address } from '../../api/userapi/account';
import { useAuthStore } from '../../store/auth';

interface AddressDialogProps {
  open: boolean;
  onClose: () => void;
  onSelect: (address: Address) => void;
  currentAddressId?: string;
}

export function AddressDialog({ open, onClose, onSelect, currentAddressId }: AddressDialogProps) {
  const { user, token } = useAuthStore();
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<'list' | 'add' | 'edit'>('list'); // Thêm mode 'edit'
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [editingAddress, setEditingAddress] = useState<Address | null>(null); // Địa chỉ đang sửa

  // Form thêm/sửa địa chỉ
  const [addressForm, setAddressForm] = useState({
    full_name: user?.name || '',
    phone: user?.phone_number || '',
    address_line: '',
    city: '',
    district: '',
    ward: '',
    province_id: undefined as number | undefined,
    district_id: undefined as number | undefined,
    ward_code: undefined as string | undefined,
    is_default: false,
  });

  // Tải danh sách địa chỉ
  const loadAddresses = async () => {
    if (!token) return;
    try {
      setLoading(true);
      setError(null);
      const data = await getAddresses();
      setAddresses(data.addresses || []);
    } catch (err: any) {
      setError(err?.message || 'Không thể tải danh sách địa chỉ');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open) {
      loadAddresses();
      setMode('list');
      setEditingAddress(null);
      // Reset form về giá trị mặc định
      setAddressForm({
        full_name: user?.name || '',
        phone: user?.phone_number || '',
        address_line: '',
        city: '',
        district: '',
        ward: '',
        province_id: undefined,
        district_id: undefined,
        ward_code: undefined,
        is_default: false,
      });
    }
  }, [open, user]);

  // Xử lý chọn địa chỉ
  const handleSelectAddress = (address: Address) => {
    onSelect(address);
    onClose();
  };

  // Xử lý sửa địa chỉ
  const handleEditAddress = (address: Address) => {
    setEditingAddress(address);
    setAddressForm({
      full_name: address.full_name || user?.name || '',
      phone: address.phone || user?.phone_number || '',
      address_line: address.address_line || '',
      city: address.city || '',
      district: address.district || '',
      ward: address.ward || '',
      province_id: address.province_id || undefined,
      district_id: address.district_id || undefined,
      ward_code: address.ward_code || undefined,
      is_default: address.is_default || false,
    });
    setMode('edit');
  };

  // Xử lý xóa địa chỉ
  const handleDeleteAddress = async (addressId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (!window.confirm('Bạn có chắc chắn muốn xóa địa chỉ này?')) {
      return;
    }
    
    try {
      setDeletingId(addressId);
      await deleteAddress(addressId);
      
      // Nếu xóa địa chỉ đang được chọn, chọn địa chỉ khác
      if (currentAddressId === addressId) {
        const otherAddress = addresses.find(addr => addr.id !== addressId);
        if (otherAddress) {
          onSelect(otherAddress);
        }
      }
      
      await loadAddresses();
    } catch (err: any) {
      setError(err?.message || 'Không thể xóa địa chỉ');
    } finally {
      setDeletingId(null);
    }
  };

  // Xử lý lưu địa chỉ (thêm mới hoặc sửa)
  const handleSaveAddress = async (e: FormEvent) => {
    e.preventDefault();
    
    // Kiểm tra các trường bắt buộc
    if (!addressForm.full_name.trim() || !addressForm.phone.trim() || !addressForm.address_line.trim()) {
      setError('Vui lòng điền đầy đủ thông tin bắt buộc');
      return;
    }

    if (!addressForm.city || !addressForm.district || !addressForm.ward) {
      setError('Vui lòng chọn đầy đủ Tỉnh/Thành, Quận/Huyện, Phường/Xã');
      return;
    }

    try {
      setSaving(true);
      setError(null);
      
      if (mode === 'edit' && editingAddress) {
        // Sửa địa chỉ
        await updateAddress(editingAddress.id, addressForm);
      } else {
        // Thêm địa chỉ mới
        await createAddress(addressForm);
      }
      
      // Tải lại danh sách
      await loadAddresses();
      
      // Quay lại danh sách
      setMode('list');
      setEditingAddress(null);
      
      // Reset form
      setAddressForm({
        full_name: user?.name || '',
        phone: user?.phone_number || '',
        address_line: '',
        city: '',
        district: '',
        ward: '',
        province_id: undefined,
        district_id: undefined,
        ward_code: undefined,
        is_default: false,
      });
    } catch (err: any) {
      setError(err?.message || 'Không thể lưu địa chỉ');
    } finally {
      setSaving(false);
    }
  };

  // Hủy sửa/thêm
  const handleCancel = () => {
    setMode('list');
    setEditingAddress(null);
    setError(null);
    setAddressForm({
      full_name: user?.name || '',
      phone: user?.phone_number || '',
      address_line: '',
      city: '',
      district: '',
      ward: '',
      province_id: undefined,
      district_id: undefined,
      ward_code: undefined,
      is_default: false,
    });
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center gap-3">
            <MapPin className="h-5 w-5 text-orange-500" />
            <h2 className="text-lg font-semibold text-gray-900">
              {mode === 'list' ? 'Chọn địa chỉ giao hàng' : 
               mode === 'edit' ? 'Sửa địa chỉ' : 'Thêm địa chỉ mới'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto max-h-[calc(90vh-120px)] p-6">
          {mode === 'list' ? (
            /* Danh sách địa chỉ đã lưu */
            <>
              {loading ? (
                <div className="py-8 text-center">
                  <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-orange-500 border-r-transparent"></div>
                  <p className="mt-2 text-sm text-gray-500">Đang tải địa chỉ...</p>
                </div>
              ) : error ? (
                <div className="py-4 text-center">
                  <p className="text-sm text-red-500">{error}</p>
                  <button
                    onClick={loadAddresses}
                    className="mt-2 text-sm text-orange-500 hover:text-orange-600"
                  >
                    Thử lại
                  </button>
                </div>
              ) : addresses.length === 0 ? (
                <div className="py-8 text-center">
                  <MapPin className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500 mb-4">Bạn chưa có địa chỉ nào được lưu</p>
                  <button
                    onClick={() => setMode('add')}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
                  >
                    <Plus className="h-4 w-4" />
                    Thêm địa chỉ mới
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {addresses.map((address) => (
                    <div
                      key={address.id}
                      className={`border rounded-lg p-4 transition-all hover:border-orange-300 ${
                        currentAddressId === address.id
                          ? 'border-orange-500 bg-orange-50'
                          : 'border-gray-200'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div 
                          className="flex-1 cursor-pointer"
                          onClick={() => handleSelectAddress(address)}
                        >
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="font-medium text-gray-900">
                              {address.full_name} | {address.phone}
                            </h3>
                            {address.is_default && (
                              <span className="px-2 py-1 text-xs font-medium text-green-700 bg-green-100 rounded-full">
                                Mặc định
                              </span>
                            )}
                            {currentAddressId === address.id && (
                              <span className="px-2 py-1 text-xs font-medium text-orange-700 bg-orange-100 rounded-full flex items-center gap-1">
                                <Check className="h-3 w-3" />
                                Đang chọn
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-gray-600">
                            {address.address_line}
                          </p>
                          <p className="text-sm text-gray-600">
                            {address.ward}, {address.district}, {address.city}
                          </p>
                        </div>
                        <div className="ml-4 flex items-center gap-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEditAddress(address);
                            }}
                            className="p-2 text-gray-500 hover:text-orange-500 hover:bg-orange-50 rounded-lg transition-colors"
                            title="Sửa địa chỉ"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          <button
                            onClick={(e) => handleDeleteAddress(address.id, e)}
                            disabled={deletingId === address.id}
                            className="p-2 text-gray-500 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                            title="Xóa địa chỉ"
                          >
                            {deletingId === address.id ? (
                              <div className="h-4 w-4 animate-spin rounded-full border-2 border-solid border-red-500 border-r-transparent"></div>
                            ) : (
                              <Trash2 className="h-4 w-4" />
                            )}
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleSelectAddress(address);
                            }}
                            className="ml-2 px-4 py-2 text-sm font-medium text-orange-500 hover:bg-orange-50 rounded-lg transition-colors"
                          >
                            Chọn
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Nút thêm địa chỉ mới */}
              {addresses.length > 0 && (
                <button
                  onClick={() => setMode('add')}
                  className="mt-6 w-full inline-flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-orange-300 hover:text-orange-500 transition-colors"
                >
                  <Plus className="h-5 w-5" />
                  Thêm địa chỉ mới
                </button>
              )}
            </>
          ) : (
            /* Form thêm/sửa địa chỉ mới */
            <form onSubmit={handleSaveAddress} className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Họ và tên *
                  </label>
                  <input
                    type="text"
                    required
                    value={addressForm.full_name}
                    onChange={(e) =>
                      setAddressForm((prev) => ({ ...prev, full_name: e.target.value }))
                    }
                    className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    placeholder="Nhập họ và tên"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Số điện thoại *
                  </label>
                  <input
                    type="tel"
                    required
                    value={addressForm.phone}
                    onChange={(e) =>
                      setAddressForm((prev) => ({ ...prev, phone: e.target.value }))
                    }
                    className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    placeholder="Nhập số điện thoại"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Địa chỉ cụ thể *
                  </label>
                  <input
                    type="text"
                    required
                    value={addressForm.address_line}
                    onChange={(e) =>
                      setAddressForm((prev) => ({ ...prev, address_line: e.target.value }))
                    }
                    className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    placeholder="Số nhà, tên đường, tòa nhà..."
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Khu vực (Tỉnh/Thành - Quận/Huyện - Phường/Xã) *
                  </label>
                  <AddressSelector
                    key={`address-dialog-${mode}-${editingAddress?.id || 'new'}`}
                    includeStreetInput={false}
                    showLabels={false}
                    defaultValues={{
                      provinceId: addressForm.province_id,
                      provinceName: addressForm.city,
                      districtId: addressForm.district_id,
                      districtName: addressForm.district,
                      wardCode: addressForm.ward_code,
                      wardName: addressForm.ward,
                    }}
                    onAddressChange={(location) => {
                      setAddressForm((prev) => ({
                        ...prev,
                        city: location.provinceName || '',
                        district: location.districtName || '',
                        ward: location.wardName || '',
                        province_id: location.provinceId || undefined,
                        district_id: location.districtId || undefined,
                        ward_code: location.wardCode || undefined,
                      }));
                    }}
                  />
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="is_default"
                    checked={addressForm.is_default}
                    onChange={(e) =>
                      setAddressForm((prev) => ({ ...prev, is_default: e.target.checked }))
                    }
                    className="h-4 w-4 text-orange-500 focus:ring-orange-500 border-gray-300 rounded"
                  />
                  <label htmlFor="is_default" className="ml-2 text-sm text-gray-700">
                    Đặt làm địa chỉ mặc định
                  </label>
                </div>
              </div>

              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-600">{error}</p>
                </div>
              )}

              <div className="flex items-center gap-3 pt-4">
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 px-4 py-2 bg-orange-500 text-white rounded-lg text-sm font-medium hover:bg-orange-600 disabled:opacity-50 transition-colors"
                >
                  {saving ? 'Đang lưu...' : mode === 'edit' ? 'Cập nhật địa chỉ' : 'Lưu địa chỉ'}
                </button>
                <button
                  type="button"
                  onClick={handleCancel}
                  className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800"
                >
                  Hủy
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}