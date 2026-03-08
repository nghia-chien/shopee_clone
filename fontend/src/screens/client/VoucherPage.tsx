import { useEffect, useMemo, useState } from "react";
import { useAuthStore } from "../../store/auth";
import { getUserVouchers } from "../../api/userapi/vouchers";
import type { UserVoucherEntry } from "../../api/userapi/vouchers";
import { useNavigate } from "react-router-dom";

export default function VoucherPage() {
  const { token } = useAuthStore();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [vouchers, setVouchers] = useState<UserVoucherEntry[]>([]);

  // Lấy voucher của user
  useEffect(() => {
    if (!token) {
      navigate("/login");
      return;
    }
    const fetchData = async () => {
      try {
        setLoading(true);
        const data = await getUserVouchers(token);
        setVouchers(data.vouchers || []);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [token, navigate]);

  // Lọc voucher theo quy tắc
  const availableVouchers = useMemo(() => {
    const now = Date.now();

    return vouchers.filter((entry) => {
      const v = entry.voucher;

      // 1. Kiểm tra lượt dùng
      const limit = v.usage_limit_per_user ?? 1;
      if (entry.usage_count >= limit) return false;

      // 2. Kiểm tra hạn sử dụng
      if (now > new Date(v.end_at).getTime()) return false;

      // 3. Kiểm tra trạng thái ACTIVE
      if (v.status !== "ACTIVE") return false;

      // 4. Kiểm tra điều kiện source/type
      if (v.source === "SELLER") {
        return entry.saved_at !== null;
      }

      if (v.source === "ADMIN") {
        if (v.type === "PLATFORM") return true;
        if (v.type === "SHOP" && entry.saved_at !== null) return true;
        return false;
      }

      return false;
    });
  }, [vouchers]);

  if (!token) {
    return <div className="p-6">Vui lòng đăng nhập để xem kho voucher.</div>;
  }

  if (loading) {
    return <div className="p-6 text-gray-500">Đang tải voucher...</div>;
  }

  const renderVoucherCard = (entry: UserVoucherEntry) => {
    const v = entry.voucher;
    const discountLabel =
      v.discount_type === "PERCENT"
        ? `${v.discount_value}%`
        : `${Number(v.discount_value).toLocaleString("vi-VN")}₫`;
    const minOrder = Number(v.min_order_amount ?? 0);
    const isShopVoucher = v.source === "SELLER";

    return (
    <div
      key={entry.id}
      className="border-2 border-dashed border-orange-300 rounded-xl p-4 bg-orange-50 flex flex-col gap-3"
    >
      {/* Phần trên: tên shop + mã voucher và thông tin giảm giá */}
      <div className="flex justify-between items-start">
        {/* Bên trái: tên shop + mã voucher */}
        <div className="flex flex-col">
          <h3 className="font-bold text-lg text-orange-600">{v.code}</h3>
          {isShopVoucher && (
            <p className="text-xs text-blue-500 font-semibold mb-1">{v.seller?.name}</p>
          )}
        </div>

        {/* Bên phải: giảm giá + đơn tối thiểu */}
        <div className="text-right">
          <p className="text-sm text-gray-700 font-semibold">Giảm {discountLabel}</p>
          {minOrder > 0 && (
            <p className="text-xs text-gray-500 mt-1">
              Đơn tối thiểu ₫{minOrder.toLocaleString("vi-VN")}
            </p>
          )}
        </div>
      </div>

  {/* Phần dưới: HSD + nút sử dụng */}
  <div className="flex justify-between items-center mt-2">
    <span className="text-xs text-gray-400">
      HSD: {new Date(v.end_at).toLocaleDateString("vi-VN")}
    </span>
    <button
      onClick={() => navigate("/cart")}
      className="px-4 py-2 rounded-lg bg-orange-500 text-white text-sm font-semibold hover:bg-orange-600 transition disabled:opacity-50"
    >
      Sử dụng ngay
    </button>
  </div>
</div>


    );
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Kho Voucher</h1>
        </div>
        {token && (
          <span className="text-sm text-gray-500">
            {availableVouchers.length} voucher khả dụng
          </span>
        )}
      </div>

      <section className="bg-white rounded-2xl shadow-sm p-6">
        {availableVouchers.length === 0 ? (
          <div className="text-center text-gray-500 py-8 border-2 border-dashed border-gray-300 rounded-xl">
            Bạn chưa có voucher nào có thể dùng
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {availableVouchers.map(renderVoucherCard)}
          </div>
        )}
      </section>
    </div>
  );
}
