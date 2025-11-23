import { useEffect, useMemo, useState } from "react";
import { useAuthStore } from "../../store/auth";
import { getUserVouchers, saveVoucher } from "../../api/userapi/vouchers";
import type { UserVoucherEntry } from "../../api/userapi/vouchers";
import { useNavigate } from "react-router-dom";

export default function VoucherPage() {
  const { token } = useAuthStore();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [vouchers, setVouchers] = useState<UserVoucherEntry[]>([]);

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

  const grouped = useMemo(() => {
    const now = Date.now();
    // Filter out vouchers that have been used up (usage_count >= usage_limit_per_user)
    const availableVouchers = vouchers.filter((entry) => {
      const limit = entry.voucher.usage_limit_per_user;
      if (limit && entry.usage_count >= limit) {
        return false; // Voucher đã dùng hết, không hiển thị
      }
      else if (entry.usage_count >= 1) return false;
      else if (entry.voucher.source === "SELLER" && entry.saved_at === null) return false;
      
      return true;
    });
    
    return {
      active: availableVouchers.filter(
        (entry) =>
          entry.voucher.status === "ACTIVE" &&
          now >= new Date(entry.voucher.start_at).getTime() &&
          now <= new Date(entry.voucher.end_at).getTime()
      ),
    };
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
    return (
      <div
        key={entry.id}
        className="border rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white shadow-sm"
      >
        <div>
          <div className="flex items-center gap-2 mb-1">
            <p className="text-lg font-semibold text-orange-600">{discountLabel}</p>
            
          </div>

          {minOrder > 0 && (
            <p className="text-sm text-gray-600">
              Đơn tối thiểu {minOrder.toLocaleString("vi-VN")}₫
            </p>
          )}
          <p className="text-xs text-gray-500">
            Hiệu lực: {new Date(v.start_at).toLocaleDateString("vi-VN")} -{" "}
            {new Date(v.end_at).toLocaleDateString("vi-VN")}
          </p>
          <p className="text-xs text-gray-500">
            Nguồn: {v.source === "ADMIN" ? "Shopee" : "ShopBrand"} 
          </p>
        </div>
        <div className="flex flex-col items-end gap-2 text-sm text-gray-600">
          <button
                onClick={() => navigate("/cart")}
                className="px-4 py-2 rounded-full bg-orange-500 text-white text-sm font-semibold hover:bg-orange-600 transition"
              >
                Sử dụng ngay
              </button>    
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Kho Voucher</h1>
        <p className="text-sm text-gray-500">
          Lưu và quản lý các voucher bạn đã sưu tầm từ shop hoặc hệ thống.
        </p>
      </div>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-gray-800">Voucher khả dụng</h2>
        {grouped.active.length === 0 ? (
          <p className="text-sm text-gray-500">Bạn chưa có voucher nào phù hợp.</p>
        ) : (
          <div className="space-y-3">{grouped.active.map(renderVoucherCard)}</div>
        )}
      </section>

      
    </div>
  );
}
