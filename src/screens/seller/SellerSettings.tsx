import { useState, useEffect, useCallback, useMemo } from "react";
import { User, CreditCard, Truck, Bell, Shield, Camera } from "lucide-react";
import {
  fetchSellerSettings,
  updateSellerProfile,
  changeSellerPassword,
  uploadSellerAvatar,
  type SellerSettingsSuccessResponse,
  type SellerProfileUpdatePayload,
  type SellerAddress,
} from "../../api/sellerapi/sellerSettings";

type TabId = "profile" | "payment" | "shipping" | "notification" | "security";

const tabs: { id: TabId; label: string; icon: any }[] = [
  { id: "profile", label: "Thông Tin", icon: User },
  { id: "payment", label: "Thanh Toán", icon: CreditCard },
  { id: "shipping", label: "Vận Chuyển", icon: Truck },
  { id: "notification", label: "Thông Báo", icon: Bell },
  { id: "security", label: "Bảo Mật", icon: Shield },
];

const DEFAULT_AVATAR = "https://ui-avatars.com/api/?name=Seller&background=f97316&color=fff";

const normalizeAddress = (address?: SellerAddress | null): Required<SellerAddress> => ({
  full_name: address?.full_name ?? "",
  phone: address?.phone ?? "",
  address_line: address?.address_line ?? "",
  city: address?.city ?? "",
  district: address?.district ?? "",
  ward: address?.ward ?? "",
});

export default function SellerSettings() {
  const [activeTab, setActiveTab] = useState<TabId>("profile");
  const [loading, setLoading] = useState(true);
  const [profileForm, setProfileForm] = useState(() => ({
    name: "",
    email: "",
    phone_number: "",
    avatar: "",
    address: normalizeAddress(),
  }));

  const [securityMeta, setSecurityMeta] = useState<SellerSettingsSuccessResponse["security"] | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [savingProfile, setSavingProfile] = useState(false);
  const [avatarUploading, setAvatarUploading] = useState(false);

  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordForAction, setPasswordForAction] = useState("");
  const [pendingPayload, setPendingPayload] = useState<SellerProfileUpdatePayload | null>(null);

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [changingPassword, setChangingPassword] = useState(false);

  const syncProfileState = useCallback((payload: SellerSettingsSuccessResponse) => {
    setProfileForm({
      name: payload.seller.name ?? "",
      email: payload.seller.email ?? "",
      phone_number: payload.seller.phone_number ?? "",
      avatar: payload.seller.avatar ?? "",
      address: normalizeAddress(payload.seller.address ?? undefined),
    });
    setSecurityMeta(payload.security);
  }, []);

  const loadProfile = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetchSellerSettings();
      if (response.ok && response.data && "seller" in response.data) {
        syncProfileState(response.data as SellerSettingsSuccessResponse);
      } else {
        alert((response.data as any)?.message ?? "Không thể tải thông tin cửa hàng");
      }
    } catch (error) {
      console.error(error);
      alert("Đã có lỗi xảy ra");
    } finally {
      setLoading(false);
    }
  }, [syncProfileState]);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  const submitProfileUpdate = useCallback(
    async (payload: SellerProfileUpdatePayload, opts?: { fromPassword?: boolean }) => {
      setSavingProfile(true);
      try {
        const response = await updateSellerProfile(payload);
        if (!response.ok) {
          if (response.status === 403 && (response.data as any)?.requiresPassword && !opts?.fromPassword) {
            setPendingPayload(payload);
            setShowPasswordModal(true);
            return;
          }
          alert((response.data as any)?.message ?? "Không thể cập nhật thông tin");
          return;
        }

        if ("seller" in response.data) {
          syncProfileState(response.data as SellerSettingsSuccessResponse);
          setAvatarFile(null);
          setAvatarPreview(null);
          setPendingPayload(null);
          setPasswordForAction("");
          setShowPasswordModal(false);
          if (response.data.message) alert(response.data.message);
        } else {
          alert("Phản hồi không hợp lệ từ máy chủ");
        }
      } catch (error) {
        console.error(error);
        alert("Đã có lỗi xảy ra");
      } finally {
        setSavingProfile(false);
      }
    },
    [syncProfileState]
  );

  const handleProfileSubmit = () => {
    submitProfileUpdate({
      name: profileForm.name,
      phone_number: profileForm.phone_number,
      address: profileForm.address,
    });
  };

  const handleAvatarSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarFile(file);
    const reader = new FileReader();
    reader.onloadend = () => setAvatarPreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleAvatarUpload = async () => {
    if (!avatarFile) return;
    setAvatarUploading(true);
    try {
      const url = await uploadSellerAvatar(avatarFile);
      await submitProfileUpdate({ avatar: url });
    } catch (error: any) {
      console.error(error);
      alert(error?.message ?? "Không thể upload ảnh");
    } finally {
      setAvatarUploading(false);
    }
  };

  const handlePasswordConfirm = () => {
    if (!pendingPayload || !passwordForAction.trim()) {
      alert("Vui lòng nhập mật khẩu");
      return;
    }
    submitProfileUpdate({ ...pendingPayload, password: passwordForAction }, { fromPassword: true });
  };

  const PasswordModal = useMemo(() => {
    if (!showPasswordModal) return null;
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-white rounded-2xl p-6 max-w-md w-full mx-4 shadow-2xl">
          <h3 className="text-xl font-bold mb-3">Xác thực cập nhật</h3>
          <p className="text-sm text-gray-600 mb-4">
            Hệ thống yêu cầu bạn xác nhận mật khẩu vì lần cập nhật gần nhất đã vượt quá 15 ngày.
          </p>
          <input
            type="password"
            value={passwordForAction}
            onChange={(e) => setPasswordForAction(e.target.value)}
            placeholder="Nhập mật khẩu"
            className="w-full rounded-xl border border-gray-300 px-4 py-3 mb-4 focus:ring-2 focus:ring-blue-200 focus:border-blue-500 outline-none"
          />
          <div className="flex gap-3">
            <button
              onClick={() => {
                setShowPasswordModal(false);
                setPasswordForAction("");
                setPendingPayload(null);
              }}
              className="flex-1 px-4 py-2 rounded-xl border border-gray-300 text-gray-700 font-semibold hover:bg-gray-50 transition"
            >
              Hủy
            </button>
            <button
              onClick={handlePasswordConfirm}
              className="flex-1 px-4 py-2 rounded-xl bg-blue-600 text-white font-semibold hover:bg-blue-700 transition"
            >
              Xác nhận
            </button>
          </div>
        </div>
      </div>
    );
  }, [passwordForAction, showPasswordModal, pendingPayload]);

  const handlePasswordFormSubmit = async () => {
    if (!passwordForm.currentPassword || !passwordForm.newPassword || !passwordForm.confirmPassword) {
      alert("Vui lòng nhập đầy đủ thông tin");
      return;
    }
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      alert("Mật khẩu xác nhận không khớp");
      return;
    }

    setChangingPassword(true);
    try {
      const response = await changeSellerPassword({
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
      });
      if (!response.ok) {
        alert((response.data as any)?.message ?? "Không thể đổi mật khẩu");
        return;
      }
      alert((response.data as any)?.message ?? "Đổi mật khẩu thành công");
      setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
    } catch (error) {
      console.error(error);
      alert("Đã có lỗi xảy ra");
    } finally {
      setChangingPassword(false);
    }
  };

  const securityNotice = useMemo(() => {
    if (!securityMeta) return "Chưa có thông tin cập nhật";
    if (securityMeta.requiresPassword) {
      return "Đã quá 15 ngày kể từ lần cập nhật cuối. Hệ thống sẽ yêu cầu bạn xác nhận mật khẩu trước khi lưu thay đổi.";
    }
    if (securityMeta.lastSensitiveUpdate) {
      return `Bạn đã cập nhật lần gần nhất vào ${new Date(securityMeta.lastSensitiveUpdate).toLocaleDateString("vi-VN")}.`;
    }
    return "Bạn chưa từng cập nhật thông tin cửa hàng.";
  }, [securityMeta]);

  const renderProfileTab = () => (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <h2 className="text-2xl font-bold text-gray-900">Thông Tin Cửa Hàng</h2>
        <p className="text-sm text-gray-500">{securityNotice}</p>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-5 shadow-sm">
        <div className="flex flex-col md:flex-row items-center gap-6">
          <div className="flex flex-col items-center gap-3 text-center">
            <img
              src={avatarPreview || profileForm.avatar || DEFAULT_AVATAR}
              alt="avatar"
              className="w-28 h-28 rounded-full object-cover border-4 border-blue-50 shadow"
            />
            <label className="text-blue-600 text-sm font-medium cursor-pointer flex items-center gap-2">
              <Camera className="w-4 h-4" />
              <span>Chọn ảnh</span>
              <input type="file" accept="image/*" className="hidden" onChange={handleAvatarSelect} />
            </label>
          </div>
          <div className="flex-1 w-full">
            <p className="text-sm text-gray-500 mb-2">
              Ảnh đại diện giúp khách hàng nhận diện thương hiệu của bạn.
            </p>
            <button
              onClick={handleAvatarUpload}
              disabled={!avatarFile || avatarUploading || savingProfile}
              className="px-5 py-3 rounded-xl bg-blue-600 text-white font-semibold disabled:opacity-50"
            >
              {avatarUploading ? "Đang tải ảnh..." : "Cập nhật logo"}
            </button>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Tên Cửa Hàng *</label>
            <input
              type="text"
              value={profileForm.name}
              onChange={(e) => setProfileForm((prev) => ({ ...prev, name: e.target.value }))}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
            <input
              type="email"
              value={profileForm.email}
              disabled
              className="w-full px-4 py-3 border border-gray-200 rounded-xl bg-gray-50 text-gray-500 cursor-not-allowed"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Số Điện Thoại *</label>
            <input
              type="tel"
              value={profileForm.phone_number}
              onChange={(e) => setProfileForm((prev) => ({ ...prev, phone_number: e.target.value }))}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Người liên hệ</label>
            <input
              type="text"
              value={profileForm.address.full_name}
              onChange={(e) =>
                setProfileForm((prev) => ({ ...prev, address: { ...prev.address, full_name: e.target.value } }))
              }
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Điện thoại nhận hàng</label>
            <input
              type="text"
              value={profileForm.address.phone}
              onChange={(e) =>
                setProfileForm((prev) => ({ ...prev, address: { ...prev.address, phone: e.target.value } }))
              }
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Tỉnh/Thành</label>
            <input
              type="text"
              value={profileForm.address.city}
              onChange={(e) =>
                setProfileForm((prev) => ({ ...prev, address: { ...prev.address, city: e.target.value } }))
              }
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Quận/Huyện</label>
            <input
              type="text"
              value={profileForm.address.district}
              onChange={(e) =>
                setProfileForm((prev) => ({ ...prev, address: { ...prev.address, district: e.target.value } }))
              }
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Phường/Xã</label>
            <input
              type="text"
              value={profileForm.address.ward}
              onChange={(e) =>
                setProfileForm((prev) => ({ ...prev, address: { ...prev.address, ward: e.target.value } }))
              }
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Địa chỉ chi tiết *</label>
          <input
            type="text"
            value={profileForm.address.address_line}
            onChange={(e) =>
              setProfileForm((prev) => ({ ...prev, address: { ...prev.address, address_line: e.target.value } }))
            }
            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
          />
        </div>

        <div className="flex justify-end">
          <button
            onClick={handleProfileSubmit}
            disabled={savingProfile}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-semibold transition-colors disabled:opacity-50"
          >
            {savingProfile ? "Đang lưu..." : "Lưu Thay Đổi"}
          </button>
        </div>
      </div>
    </div>
  );

  const renderSecurityTab = () => (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Bảo mật tài khoản</h2>
        <p className="text-sm text-gray-500">
          Đổi mật khẩu định kỳ để đảm bảo tài khoản cửa hàng của bạn luôn an toàn.
        </p>
      </div>
      <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Mật khẩu hiện tại</label>
          <input
            type="password"
            value={passwordForm.currentPassword}
            onChange={(e) => setPasswordForm((prev) => ({ ...prev, currentPassword: e.target.value }))}
            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Mật khẩu mới</label>
          <input
            type="password"
            value={passwordForm.newPassword}
            onChange={(e) => setPasswordForm((prev) => ({ ...prev, newPassword: e.target.value }))}
            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Nhập lại mật khẩu mới</label>
          <input
            type="password"
            value={passwordForm.confirmPassword}
            onChange={(e) => setPasswordForm((prev) => ({ ...prev, confirmPassword: e.target.value }))}
            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
          />
        </div>
        <div className="flex justify-end">
          <button
            onClick={handlePasswordFormSubmit}
            disabled={changingPassword}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-semibold transition-colors disabled:opacity-50"
          >
            {changingPassword ? "Đang cập nhật..." : "Đổi mật khẩu"}
          </button>
        </div>
      </div>
    </div>
  );

  const renderTabContent = () => {
    if (loading) {
      return (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-10 w-10 border-4 border-orange-200 border-t-orange-500" />
        </div>
      );
    }

    switch (activeTab) {
      case "profile":
        return renderProfileTab();
      case "security":
        return renderSecurityTab();
      default:
        return (
          <div className="min-h-[200px] flex flex-col items-center justify-center rounded-2xl border border-dashed border-gray-200 bg-gray-50 text-gray-500">
            Tính năng đang phát triển
          </div>
        );
    }
  };

  return (
    <div className="space-y-6 relative">
      <div className="flex gap-4 border-b border-gray-200 mb-4 overflow-x-auto">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 font-semibold rounded-t-xl ${
              activeTab === tab.id ? "bg-white shadow text-gray-900" : "text-gray-500"
            } flex items-center gap-2`}
          >
            <tab.icon className="w-5 h-5" /> {tab.label}
          </button>
        ))}
      </div>

      <div>{renderTabContent()}</div>

      {PasswordModal}
    </div>
  );
}
