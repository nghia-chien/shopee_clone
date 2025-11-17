import { useMemo, useState, useEffect, useCallback, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  CalendarDays,
  CreditCard,
  Mail,
  MapPin,
  Package,
  Phone,
  ShieldCheck,
  User2,
  X,
  Camera,
} from "lucide-react";
import {
  getAccount,
  updateAccount,
  uploadAvatar,
  changePassword,
  getAddresses,
  createAddress,
  updateAddress,
  deleteAddress,
  setDefaultAddress,
  type Address,
} from "../../api/userapi/account";
import { useAuthStore } from "../../store/auth";
import { getUserOrders } from "../../api/userapi/orders";

type TabId = "overview" | "addresses" | "security" | "bank";

type BankCard = {
  id: string;
  cardNumber: string;
  bankName: string;
  holderName: string;
};

const tabs: { id: TabId; label: string; description: string }[] = [
  { id: "overview", label: "Hồ sơ", description: "Thông tin cá nhân & liên hệ" },
  { id: "addresses", label: "Địa chỉ", description: "Quản lý địa chỉ nhận hàng" },
  { id: "security", label: "Đổi mật khẩu", description: "Mật khẩu & đăng nhập" },
  { id: "bank", label: "Ngân hàng", description: "Liên kết thẻ & ví ngân hàng" },
];

function formatCurrency(value: number) {
  return value.toLocaleString("vi-VN", { style: "currency", currency: "VND" });
}

export default function AccountPage() {
  const { token } = useAuthStore();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<TabId>("overview");
  const [bankCards, setBankCards] = useState<BankCard[]>([]);
  const [showBankForm, setShowBankForm] = useState(false);
  const [editingBank, setEditingBank] = useState<BankCard | null>(null);

  // Form states
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordForAction, setPasswordForAction] = useState("");
  const passwordRef = useRef("");
  const [pendingAction, setPendingAction] = useState<(() => void) | null>(null);
  const [showAvatarUpload, setShowAvatarUpload] = useState(false);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

  // Address form states
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [editingAddress, setEditingAddress] = useState<Address | null>(null);
  const [addressForm, setAddressForm] = useState({
    full_name: "",
    phone: "",
    address_line: "",
    city: "",
    district: "",
    ward: "",
    is_default: false,
  });

  // Password change form
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  // Profile edit form
  const [profileForm, setProfileForm] = useState({
    name: "",
    phone_number: "",
  });

  // Fetch user data
  const { data: user, isLoading: userLoading } = useQuery({
    queryKey: ["account"],
    queryFn: getAccount,
    enabled: !!token,
  });

  // Fetch addresses
  const { data: addressesData, isLoading: addressesLoading } = useQuery({
    queryKey: ["addresses"],
    queryFn: getAddresses,
    enabled: !!token,
  });

  // Fetch orders for stats
  const { data: ordersData } = useQuery({
    queryKey: ["user-orders"],
    queryFn: () => getUserOrders(token!),
    enabled: !!token,
  });

  // Update profile form when user data loads
  useEffect(() => {
    if (user) {
      setProfileForm({
        name: user.name || "",
        phone_number: user.phone_number || "",
      });
    }
  }, [user]);

  // Update address form when editing
  useEffect(() => {
    if (editingAddress) {
      setAddressForm({
        full_name: editingAddress.full_name,
        phone: editingAddress.phone,
        address_line: editingAddress.address_line,
        city: editingAddress.city,
        district: editingAddress.district,
        ward: editingAddress.ward,
        is_default: editingAddress.is_default,
      });
    } else {
      setAddressForm({
        full_name: "",
        phone: "",
        address_line: "",
        city: "",
        district: "",
        ward: "",
        is_default: false,
      });
    }
  }, [editingAddress]);

  // Mutations
  const updateAccountMutation = useMutation({
    mutationFn: (data: { name?: string; phone_number?: string; password: string }) =>
      updateAccount(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["account"] });
      setShowPasswordModal(false);
      setPasswordForAction("");
      alert("Cập nhật thông tin thành công!");
    },
    onError: (error: any) => {
      alert(error.message || "Cập nhật thất bại");
    },
  });

  const uploadAvatarMutation = useMutation({
    mutationFn: ({ file, password }: { file: File; password: string }) =>
      uploadAvatar(file, password),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["account"] });
      setShowAvatarUpload(false);
      setAvatarFile(null);
      setAvatarPreview(null);
      setShowPasswordModal(false);
      setPasswordForAction("");
      alert("Cập nhật ảnh đại diện thành công!");
    },
    onError: (error: any) => {
      alert(error.message || "Upload thất bại");
    },
  });

  const changePasswordMutation = useMutation({
    mutationFn: changePassword,
    onSuccess: () => {
      setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
      alert("Đổi mật khẩu thành công!");
    },
    onError: (error: any) => {
      alert(error.message || "Đổi mật khẩu thất bại");
    },
  });

  const createAddressMutation = useMutation({
    mutationFn: createAddress,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["addresses"] });
      setShowAddressForm(false);
      setEditingAddress(null);
      alert("Thêm địa chỉ thành công!");
    },
    onError: (error: any) => {
      alert(error.message || "Thêm địa chỉ thất bại");
    },
  });

  const updateAddressMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => updateAddress(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["addresses"] });
      setShowAddressForm(false);
      setEditingAddress(null);
      alert("Cập nhật địa chỉ thành công!");
    },
    onError: (error: any) => {
      alert(error.message || "Cập nhật địa chỉ thất bại");
    },
  });

  const deleteAddressMutation = useMutation({
    mutationFn: deleteAddress,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["addresses"] });
      alert("Xóa địa chỉ thành công!");
    },
    onError: (error: any) => {
      alert(error.message || "Xóa địa chỉ thất bại");
    },
  });

  const setDefaultAddressMutation = useMutation({
    mutationFn: setDefaultAddress,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["addresses"] });
      alert("Đặt địa chỉ mặc định thành công!");
    },
    onError: (error: any) => {
      alert(error.message || "Đặt mặc định thất bại");
    },
  });

  const addresses = addressesData?.addresses || [];

  // Calculate order stats
  const orderStats = useMemo(() => {
    const orders: any[] = Array.isArray(ordersData?.data) ? ordersData.data : [];
    const total = orders.reduce((sum: number, order: any) => sum + Number(order.total || 0), 0);
    const counts = orders.reduce<Record<string, number>>((acc, order: any) => {
      const status = order.status || 'unknown';
      acc[status] = (acc[status] ?? 0) + 1;
      return acc;
    }, {});

    const tier =
      total > 50_000_000
        ? { label: "Diamond", color: "text-purple-600" }
        : total > 20_000_000
        ? { label: "Platinum", color: "text-indigo-600" }
        : total > 5_000_000
        ? { label: "Gold", color: "text-orange-500" }
        : { label: "Member", color: "text-gray-600" };

    return {
      totalOrders: orders.length,
      totalSpend: total,
      counts,
      tier,
    };
  }, [ordersData]);

  const joinDate = user?.created_at
    ? new Date(user.created_at).toLocaleDateString("vi-VN")
    : "Chưa cập nhật";

  const displayName = user?.name || "Khách hàng";

  // Handle avatar upload
  const handleAvatarSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAvatarFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
      setShowAvatarUpload(true);
    }
  };

  const handleAvatarUpload = useCallback(() => {
    if (!avatarFile) return;
    const file = avatarFile;
    setPendingAction(() => {
      return () => {
        uploadAvatarMutation.mutate({ file, password: passwordRef.current });
      };
    });
    setShowPasswordModal(true);
  }, [avatarFile, uploadAvatarMutation]);

  const handleUpdateProfile = useCallback(() => {
    const name = profileForm.name;
    const phone_number = profileForm.phone_number;
    setPendingAction(() => {
      return () => {
        updateAccountMutation.mutate({
          name,
          phone_number,
          password: passwordRef.current,
        });
      };
    });
    setShowPasswordModal(true);
  }, [profileForm.name, profileForm.phone_number, updateAccountMutation]);

  const handleChangePassword = () => {
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      alert("Mật khẩu mới và xác nhận mật khẩu không khớp!");
      return;
    }
    if (passwordForm.newPassword.length < 6) {
      alert("Mật khẩu mới phải có ít nhất 6 ký tự!");
      return;
    }
    changePasswordMutation.mutate(passwordForm);
  };

  const handleAddressSubmit = () => {
    if (!addressForm.full_name || !addressForm.phone || !addressForm.address_line || !addressForm.city || !addressForm.district || !addressForm.ward) {
      alert("Vui lòng điền đầy đủ thông tin!");
      return;
    }

    if (editingAddress) {
      updateAddressMutation.mutate({ id: editingAddress.id, data: addressForm });
    } else {
      createAddressMutation.mutate(addressForm);
    }
  };

  const handleDeleteAddress = (id: string) => {
    if (confirm("Bạn có chắc muốn xóa địa chỉ này?")) {
      deleteAddressMutation.mutate(id);
    }
  };

  const handleSetDefaultAddress = (id: string) => {
    setDefaultAddressMutation.mutate(id);
  };

  // Handlers với useCallback để tránh re-render
  const handlePasswordChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setPasswordForAction(value);
    passwordRef.current = value;
  }, []);

  const handlePasswordCancel = useCallback(() => {
    setShowPasswordModal(false);
    setPasswordForAction("");
    passwordRef.current = "";
    setPendingAction(null);
  }, []);

  const handlePasswordConfirm = useCallback(() => {
    if (!passwordForAction.trim()) {
      alert("Vui lòng nhập mật khẩu");
      return;
    }
    if (pendingAction) {
      pendingAction();
    }
  }, [passwordForAction, pendingAction]);

  // Password modal component - memoized để tránh re-render
  const PasswordModal = useMemo(() => {
    if (!showPasswordModal) return null;
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-white rounded-2xl p-6 max-w-md w-full mx-4">
          <h3 className="text-xl font-bold mb-4">Xác nhận mật khẩu</h3>
          <p className="text-sm text-gray-600 mb-4">
            Vui lòng nhập mật khẩu để xác thực hành động này
          </p>
          <input
            type="password"
            value={passwordForAction}
            onChange={handlePasswordChange}
            placeholder="Nhập mật khẩu"
            className="w-full rounded-xl border border-gray-300 px-4 py-3 mb-4 focus:ring-2 focus:ring-orange-200 focus:border-orange-400 outline-none"
            autoComplete="current-password"
          />
          <div className="flex gap-3">
            <button
              onClick={handlePasswordCancel}
              className="flex-1 px-4 py-2 rounded-xl border border-gray-300 text-gray-700 font-semibold hover:bg-gray-50 transition"
            >
              Hủy
            </button>
            <button
              onClick={handlePasswordConfirm}
              className="flex-1 px-4 py-2 rounded-xl bg-orange-500 text-white font-semibold hover:bg-orange-600 transition"
            >
              Xác nhận
            </button>
          </div>
        </div>
      </div>
    );
  }, [showPasswordModal, passwordForAction, handlePasswordChange, handlePasswordCancel, handlePasswordConfirm]);

  const renderTabContent = () => {
    if (activeTab === "addresses") {
      return (
        <div className="space-y-4">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-gray-900">Địa chỉ của tôi</h2>
            <button
              onClick={() => {
                setEditingAddress(null);
                setShowAddressForm(true);
              }}
              className="px-5 py-3 rounded-xl bg-orange-500 text-white font-semibold hover:bg-orange-600 transition flex items-center gap-2"
            >
              <Package className="w-4 h-4" />
              Thêm địa chỉ mới
            </button>
          </div>

          {showAddressForm && (
            <div className="rounded-2xl border-2 border-orange-200 bg-orange-50 p-6 space-y-4">
              <h3 className="font-semibold text-gray-900 text-lg">
                {editingAddress ? "Sửa địa chỉ" : "Thêm địa chỉ mới"}
              </h3>
              <div className="grid gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Họ và tên *</label>
                  <input
                    type="text"
                    value={addressForm.full_name}
                    onChange={(e) => setAddressForm({ ...addressForm, full_name: e.target.value })}
                    placeholder="Nhập họ và tên"
                    className="w-full rounded-xl border border-gray-300 px-4 py-3 focus:ring-2 focus:ring-orange-200 focus:border-orange-400 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Số điện thoại *</label>
                  <input
                    type="text"
                    value={addressForm.phone}
                    onChange={(e) => setAddressForm({ ...addressForm, phone: e.target.value })}
                    placeholder="Nhập số điện thoại"
                    className="w-full rounded-xl border border-gray-300 px-4 py-3 focus:ring-2 focus:ring-orange-200 focus:border-orange-400 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Địa chỉ chi tiết *</label>
                  <input
                    type="text"
                    value={addressForm.address_line}
                    onChange={(e) => setAddressForm({ ...addressForm, address_line: e.target.value })}
                    placeholder="Số nhà, tên đường"
                    className="w-full rounded-xl border border-gray-300 px-4 py-3 focus:ring-2 focus:ring-orange-200 focus:border-orange-400 outline-none"
                  />
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Tỉnh/Thành phố *</label>
                    <input
                      type="text"
                      value={addressForm.city}
                      onChange={(e) => setAddressForm({ ...addressForm, city: e.target.value })}
                      placeholder="TP. Hồ Chí Minh"
                      className="w-full rounded-xl border border-gray-300 px-4 py-3 focus:ring-2 focus:ring-orange-200 focus:border-orange-400 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Quận/Huyện *</label>
                    <input
                      type="text"
                      value={addressForm.district}
                      onChange={(e) => setAddressForm({ ...addressForm, district: e.target.value })}
                      placeholder="Quận Bình Thạnh"
                      className="w-full rounded-xl border border-gray-300 px-4 py-3 focus:ring-2 focus:ring-orange-200 focus:border-orange-400 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Phường/Xã *</label>
                    <input
                      type="text"
                      value={addressForm.ward}
                      onChange={(e) => setAddressForm({ ...addressForm, ward: e.target.value })}
                      placeholder="Phường 13"
                      className="w-full rounded-xl border border-gray-300 px-4 py-3 focus:ring-2 focus:ring-orange-200 focus:border-orange-400 outline-none"
                    />
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="is_default"
                    checked={addressForm.is_default}
                    onChange={(e) => setAddressForm({ ...addressForm, is_default: e.target.checked })}
                    className="w-4 h-4 text-orange-500 border-gray-300 rounded focus:ring-orange-500"
                  />
                  <label htmlFor="is_default" className="text-sm text-gray-700">
                    Đặt làm địa chỉ mặc định
                  </label>
                </div>
              </div>
              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => {
                    setShowAddressForm(false);
                    setEditingAddress(null);
                  }}
                  className="px-5 py-2 rounded-xl border border-gray-300 text-gray-700 font-semibold hover:bg-gray-50 transition"
                >
                  Hủy
                </button>
                <button
                  onClick={handleAddressSubmit}
                  disabled={createAddressMutation.isPending || updateAddressMutation.isPending}
                  className="px-5 py-2 rounded-xl bg-orange-500 text-white font-semibold hover:bg-orange-600 transition disabled:opacity-50"
                >
                  {createAddressMutation.isPending || updateAddressMutation.isPending ? "Đang lưu..." : "Lưu"}
                </button>
              </div>
            </div>
          )}

          {addressesLoading ? (
            <div className="text-center py-8 text-gray-500">Đang tải...</div>
          ) : addresses.length === 0 ? (
            <div className="text-center py-12">
              <MapPin className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 text-lg">Chưa có địa chỉ nào</p>
            </div>
          ) : (
            <div className="space-y-3">
              {addresses.map((addr) => (
                <div
                  key={addr.id}
                  className="rounded-2xl border border-gray-200 p-5 hover:shadow-md transition"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h4 className="font-semibold text-gray-900">{addr.full_name}</h4>
                        <span className="text-gray-500">|</span>
                        <span className="text-gray-700">{addr.phone}</span>
                      </div>
                      <p className="text-gray-600 mb-2">
                        {addr.address_line}, {addr.ward}, {addr.district}, {addr.city}
                      </p>
                      {addr.is_default && (
                        <span className="inline-block px-3 py-1 text-xs font-medium rounded-md border border-orange-500 text-orange-600">
                          Mặc định
                        </span>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          setEditingAddress(addr);
                          setShowAddressForm(true);
                        }}
                        className="text-blue-600 hover:text-blue-700 font-medium text-sm"
                      >
                        Cập nhật
                      </button>
                      {!addr.is_default && (
                        <button
                          onClick={() => handleDeleteAddress(addr.id)}
                          disabled={deleteAddressMutation.isPending}
                          className="text-red-600 hover:text-red-700 font-medium text-sm disabled:opacity-50"
                        >
                          Xóa
                        </button>
                      )}
                    </div>
                  </div>
                  {!addr.is_default && (
                    <div className="mt-3 pt-3 border-t border-gray-100">
                      <button
                        onClick={() => handleSetDefaultAddress(addr.id)}
                        disabled={setDefaultAddressMutation.isPending}
                        className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 text-sm font-medium hover:bg-gray-50 transition disabled:opacity-50"
                      >
                        Thiết lập mặc định
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      );
    }

    if (activeTab === "security") {
      return (
        <div className="space-y-5">
          <div className="rounded-2xl border border-gray-100 p-5 hover:shadow-sm transition">
            <div className="flex items-center gap-3 mb-2">
              <ShieldCheck className="w-5 h-5 text-green-600" />
              <h3 className="font-semibold text-gray-900">Bảo mật 2 lớp</h3>
            </div>
            <p className="text-sm text-gray-500 mb-4">
              Kích hoạt OTP qua email khi đăng nhập và thay đổi mật khẩu.
            </p>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">Trạng thái</span>
              <span className="inline-flex items-center px-3 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-600">
                Đang bật
              </span>
            </div>
          </div>

          <div className="rounded-2xl border border-gray-100 p-5 space-y-4">
            <h3 className="font-semibold text-gray-900">Đổi mật khẩu</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Mật khẩu hiện tại *</label>
                <input
                  type="password"
                  value={passwordForm.currentPassword}
                  onChange={(e) =>
                    setPasswordForm({ ...passwordForm, currentPassword: e.target.value })
                  }
                  placeholder="Nhập mật khẩu hiện tại"
                  className="w-full rounded-xl border border-gray-300 px-4 py-3 focus:ring-2 focus:ring-orange-200 focus:border-orange-400 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Mật khẩu mới *</label>
                <input
                  type="password"
                  value={passwordForm.newPassword}
                  onChange={(e) =>
                    setPasswordForm({ ...passwordForm, newPassword: e.target.value })
                  }
                  placeholder="Nhập mật khẩu mới (tối thiểu 6 ký tự)"
                  className="w-full rounded-xl border border-gray-300 px-4 py-3 focus:ring-2 focus:ring-orange-200 focus:border-orange-400 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Xác nhận mật khẩu mới *</label>
                <input
                  type="password"
                  value={passwordForm.confirmPassword}
                  onChange={(e) =>
                    setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })
                  }
                  placeholder="Nhập lại mật khẩu mới"
                  className="w-full rounded-xl border border-gray-300 px-4 py-3 focus:ring-2 focus:ring-orange-200 focus:border-orange-400 outline-none"
                />
              </div>
            </div>
            <button
              onClick={handleChangePassword}
              disabled={
                !passwordForm.currentPassword ||
                !passwordForm.newPassword ||
                !passwordForm.confirmPassword ||
                changePasswordMutation.isPending
              }
              className="px-5 py-3 rounded-xl bg-orange-500 text-white font-semibold hover:bg-orange-600 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {changePasswordMutation.isPending ? "Đang xử lý..." : "Đổi mật khẩu"}
            </button>
          </div>
        </div>
      );
    }

    if (activeTab === "bank") {
      return (
        <div className="space-y-6">
          <div>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-900">Thẻ Tín Dụng/Ghi Nợ</h2>
              <button
                onClick={() => {
                  setEditingBank(null);
                  setShowBankForm(true);
                }}
                className="px-5 py-3 rounded-xl bg-orange-500 text-white font-semibold hover:bg-orange-600 transition flex items-center gap-2"
              >
                <CreditCard className="w-4 h-4" />
                Thêm Thẻ Mới
              </button>
            </div>

            {showBankForm && (
              <div className="rounded-2xl border-2 border-orange-200 bg-orange-50 p-6 space-y-4 mb-4">
                <h3 className="font-semibold text-gray-900 text-lg">
                  {editingBank ? "Sửa thẻ" : "Thêm thẻ mới"}
                </h3>
                <div className="grid gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Số thẻ</label>
                    <input
                      type="text"
                      defaultValue={editingBank?.cardNumber || ""}
                      placeholder="1234 5678 9012 3456"
                      className="w-full rounded-xl border border-gray-300 px-4 py-3 focus:ring-2 focus:ring-orange-200 focus:border-orange-400 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Tên ngân hàng</label>
                    <input
                      type="text"
                      defaultValue={editingBank?.bankName || ""}
                      placeholder="Vietcombank"
                      className="w-full rounded-xl border border-gray-300 px-4 py-3 focus:ring-2 focus:ring-orange-200 focus:border-orange-400 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Tên chủ thẻ</label>
                    <input
                      type="text"
                      defaultValue={editingBank?.holderName || ""}
                      placeholder="TRINH XUAN NGHIA"
                      className="w-full rounded-xl border border-gray-300 px-4 py-3 focus:ring-2 focus:ring-orange-200 focus:border-orange-400 outline-none"
                    />
                  </div>
                </div>
                <div className="flex gap-3 justify-end">
                  <button
                    onClick={() => {
                      setShowBankForm(false);
                      setEditingBank(null);
                    }}
                    className="px-5 py-2 rounded-xl border border-gray-300 text-gray-700 font-semibold hover:bg-gray-50 transition"
                  >
                    Hủy
                  </button>
                  <button
                    onClick={() => {
                      setShowBankForm(false);
                      setEditingBank(null);
                    }}
                    className="px-5 py-2 rounded-xl bg-orange-500 text-white font-semibold hover:bg-orange-600 transition"
                  >
                    Lưu
                  </button>
                </div>
              </div>
            )}

            {bankCards.length === 0 ? (
              <div className="text-center py-12">
                <CreditCard className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 text-lg">Bạn chưa liên kết thẻ.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {bankCards.map((card) => (
                  <div
                    key={card.id}
                    className="rounded-2xl border border-gray-200 p-5 hover:shadow-md transition"
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex items-start gap-4">
                        <CreditCard className="w-8 h-8 text-orange-500 mt-1" />
                        <div>
                          <h4 className="font-semibold text-gray-900">{card.bankName}</h4>
                          <p className="text-gray-600">**** **** **** {card.cardNumber.slice(-4)}</p>
                          <p className="text-sm text-gray-500 mt-1">{card.holderName}</p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            setEditingBank(card);
                            setShowBankForm(true);
                          }}
                          className="text-blue-600 hover:text-blue-700 font-medium text-sm"
                        >
                          Cập nhật
                        </button>
                        <button
                          onClick={() => {
                            setBankCards(bankCards.filter((c) => c.id !== card.id));
                          }}
                          className="text-red-600 hover:text-red-700 font-medium text-sm"
                        >
                          Xóa
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div>
            <h2 className="text-xl font-bold text-gray-900 mb-4">Tài Khoản Ngân Hàng Của Tôi</h2>
            <div className="text-center py-12 border-2 border-dashed border-gray-200 rounded-2xl">
              <CreditCard className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 text-lg mb-4">Bạn chưa có tài khoản ngân hàng.</p>
              <button className="px-5 py-3 rounded-xl bg-orange-500 text-white font-semibold hover:bg-orange-600 transition flex items-center gap-2 mx-auto">
                <Package className="w-4 h-4" />
                Thêm Ngân Hàng Liên Kết
              </button>
            </div>
          </div>
        </div>
      );
    }

    // Overview tab
    return (
      <div className="space-y-5">
        {/* Avatar Upload */}
        {showAvatarUpload && (
          <div className="rounded-2xl border-2 border-orange-200 bg-orange-50 p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-gray-900 text-lg">Cập nhật ảnh đại diện</h3>
              <button
                onClick={() => {
                  setShowAvatarUpload(false);
                  setAvatarFile(null);
                  setAvatarPreview(null);
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            {avatarPreview && (
              <div className="flex justify-center">
                <img
                  src={avatarPreview}
                  alt="Preview"
                  className="w-32 h-32 rounded-full object-cover border-4 border-white shadow-lg"
                />
              </div>
            )}
            <button
              onClick={handleAvatarUpload}
              disabled={uploadAvatarMutation.isPending}
              className="w-full px-5 py-3 rounded-xl bg-orange-500 text-white font-semibold hover:bg-orange-600 transition disabled:opacity-50"
            >
              {uploadAvatarMutation.isPending ? "Đang upload..." : "Xác nhận upload"}
            </button>
          </div>
        )}

        <div className="grid gap-5 sm:grid-cols-2">
          <div className="rounded-2xl border border-gray-100 p-5 hover:shadow-sm transition">
            <div className="flex items-center gap-3 mb-4">
              <Mail className="w-6 h-6 text-orange-500" />
              <div className="flex-1">
                <p className="text-sm text-gray-500">Email</p>
                <p className="text-base font-semibold text-gray-900">
                  {user?.email ?? "Chưa cập nhật"}
                </p>
              </div>
            </div>
            <p className="text-sm text-gray-500">Sử dụng để đăng nhập và nhận thông báo đơn hàng.</p>
          </div>
          <div className="rounded-2xl border border-gray-100 p-5 hover:shadow-sm transition">
            <div className="flex items-center gap-3 mb-4">
              <Phone className="w-6 h-6 text-green-500" />
              <div className="flex-1">
                <p className="text-sm text-gray-500">Số điện thoại</p>
                <p className="text-base font-semibold text-gray-900">
                  {user?.phone_number ?? "Chưa cập nhật"}
                </p>
              </div>
            </div>
            <p className="text-sm text-gray-500">Nhận thông tin giao hàng và hỗ trợ xác thực.</p>
          </div>
        </div>

        {/* Profile Edit Form */}
        <div className="rounded-2xl border border-gray-100 p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-gray-900">Thông tin cá nhân</h3>
            <label className="relative cursor-pointer">
              <input
                type="file"
                accept="image/*"
                onChange={handleAvatarSelect}
                className="hidden"
              />
              <div className="flex items-center gap-2 text-orange-500 hover:text-orange-600">
                <Camera className="w-5 h-5" />
                <span className="text-sm font-medium">
                  {user?.avatar ? "Đổi ảnh" : "Thêm ảnh"}
                </span>
              </div>
            </label>
          </div>

          {user?.avatar && !avatarPreview && (
            <div className="flex justify-center">
              <img
                src={user.avatar}
                alt="Avatar"
                className="w-24 h-24 rounded-full object-cover border-4 border-orange-200 shadow-lg"
              />
            </div>
          )}

          <div className="grid gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Họ và tên</label>
              <input
                type="text"
                value={profileForm.name}
                onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                placeholder="Nhập họ và tên"
                className="w-full rounded-xl border border-gray-300 px-4 py-3 focus:ring-2 focus:ring-orange-200 focus:border-orange-400 outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Số điện thoại</label>
              <input
                type="text"
                value={profileForm.phone_number}
                onChange={(e) =>
                  setProfileForm({ ...profileForm, phone_number: e.target.value })
                }
                placeholder="Nhập số điện thoại"
                className="w-full rounded-xl border border-gray-300 px-4 py-3 focus:ring-2 focus:ring-orange-200 focus:border-orange-400 outline-none"
              />
            </div>
          </div>
          <button
            onClick={handleUpdateProfile}
            disabled={
              updateAccountMutation.isPending ||
              (profileForm.name === user?.name && profileForm.phone_number === user?.phone_number)
            }
            className="px-5 py-2 rounded-xl bg-orange-500 text-white font-semibold hover:bg-orange-600 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {updateAccountMutation.isPending ? "Đang lưu..." : "Lưu thay đổi"}
          </button>
        </div>
      </div>
    );
  };

  if (userLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center text-gray-500">Đang tải...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {PasswordModal}

      <main className="flex-1 max-w-6xl w-full mx-auto px-4 py-8 space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* LEFT – Tabs + Content */}
          <div className="lg:col-span-2 bg-white rounded-2xl shadow-lg border border-gray-200/50 overflow-hidden">
            {/* Tabs Navigation */}
            <div className="bg-gradient-to-r from-gray-50 to-white border-b border-gray-200 px-6 py-4">
              <div className="flex flex-wrap items-center gap-3">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 ${
                      activeTab === tab.id
                        ? "bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-lg shadow-orange-200 scale-105"
                        : "bg-white text-gray-600 hover:bg-gray-50 hover:text-gray-900 border border-gray-200"
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Tab Content */}
            <div className="p-6">
              {renderTabContent()}
            </div>
          </div>

          {/* RIGHT – User Stats Panel */}
          <div className="space-y-6">

            {/* Member Info Card */}
            <div className="bg-gradient-to-br from-orange-500 via-orange-600 to-orange-700 text-white rounded-2xl p-6 shadow-xl relative overflow-hidden">
              {/* Decorative Elements */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16"></div>
              <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full -ml-12 -mb-12"></div>
              
              <div className="relative z-10">
                {/* User Header */}
                <div className="flex items-start justify-between mb-6">
                  <div className="flex flex-col">
                    <span className="font-bold text-xl mb-1">{user?.name || "User"}</span>
                    <div className="flex items-center gap-1.5 text-sm text-white/90">
                      <CalendarDays className="w-4 h-4" />
                      <span>Thành viên từ {joinDate}</span>
                    </div>
                  </div>
                </div>

                {/* Stats Grid */}
                <div className="space-y-4">
                  {/* Tier Status */}
                  <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                    <p className="text-xs text-white/80 uppercase tracking-wide mb-1">Trạng thái hội viên</p>
                    <p className="text-2xl font-bold text-white">
                      {orderStats.tier.label}
                    </p>
                  </div>

                  {/* Total Spend & Orders */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                      <p className="text-xs text-white/80 uppercase tracking-wide mb-1">Tổng chi tiêu</p>
                      <p className="text-lg font-bold text-white truncate">
                        {formatCurrency(orderStats.totalSpend)}
                      </p>
                    </div>

                    <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                      <p className="text-xs text-white/80 uppercase tracking-wide mb-1">Đơn hàng</p>
                      <p className="text-lg font-bold text-white">
                        {orderStats.totalOrders}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </main>
    </div>
  );
}
