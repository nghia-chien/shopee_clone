import { useEffect, useState } from "react";
import { createSellerVoucher, listSellerVouchers } from "../../api/sellerapi/vouchers";
import type { SellerVoucherPayload } from "../../api/sellerapi/vouchers";
import { fetchSellerProducts } from "../../api/sellerapi/sellerProducts";
import { useSellerAuthStore } from "../../store/SellerAuth";

interface Product {
  id: string;
  title: string;
  price: number;
}

export function SellerVoucher() {
  const { token } = useSellerAuthStore();
  const [vouchers, setVouchers] = useState<any[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState<SellerVoucherPayload>({
    code: "",
    type: "SHOP",
    discount_type: "PERCENT",
    discount_value: 10,
    max_discount_amount: "",
    min_order_amount: "",
    usage_limit_per_user: "",
    usage_limit_total: "",
    start_at: "",
    end_at: "",
  });

  const loadVouchers = async () => {
    try {
      setLoading(true);
      const data = await listSellerVouchers();
      setVouchers(data.vouchers || []);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadVouchers();
    loadProducts();
  }, []);

  const loadProducts = async () => {
    if (!token) return;
    try {
      const data = await fetchSellerProducts(token);
      setProducts(data.products || []);
    } catch (error) {
      console.error("Failed to load products:", error);
    }
  };

  const handleChange = (field: keyof SellerVoucherPayload, value: any) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.code || !form.start_at || !form.end_at) {
      alert("Vui lòng nhập đủ thông tin bắt buộc");
      return;
    }
    try {
      setSubmitting(true);
      await createSellerVoucher({
        ...form,
        discount_value: Number(form.discount_value),
        max_discount_amount:
          form.discount_type === "PERCENT" ? Number(form.max_discount_amount || 0) : "",
        min_order_amount: form.min_order_amount ? Number(form.min_order_amount) : "",
        usage_limit_per_user: form.usage_limit_per_user ? Number(form.usage_limit_per_user) : "",
        usage_limit_total: form.usage_limit_total ? Number(form.usage_limit_total) : "",
      });
      await loadVouchers();
      alert("Đã tạo voucher thành công");
    } catch (error: any) {
      alert(error?.message || "Không thể tạo voucher");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl border p-6 shadow-sm">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Tạo voucher mới</h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-700">Mã voucher *</label>
              <input
                type="text"
                value={form.code}
                onChange={(e) => handleChange("code", e.target.value.toUpperCase())}
                className="w-full mt-1 px-3 py-2 border rounded-lg"
                placeholder="SHOPSALE10"
                required
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Loại ưu đãi</label>
              <select
                value={form.discount_type}
                onChange={(e) => handleChange("discount_type", e.target.value as "PERCENT" | "AMOUNT")}
                className="w-full mt-1 px-3 py-2 border rounded-lg"
              >
                <option value="PERCENT">Giảm %</option>
                <option value="AMOUNT">Giảm tiền</option>
              </select>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">
                Giá trị giảm {form.discount_type === "PERCENT" ? "(%)" : "(VND)"}
              </label>
              <input
                type="number"
                min={1}
                value={form.discount_value}
                onChange={(e) => handleChange("discount_value", Number(e.target.value))}
                className="w-full mt-1 px-3 py-2 border rounded-lg"
                required
              />
            </div>
            {form.discount_type === "PERCENT" && (
              <div>
                <label className="text-sm font-medium text-gray-700">Giảm tối đa (VND)</label>
                <input
                  type="number"
                  min={0}
                  value={form.max_discount_amount || ""}
                  onChange={(e) => handleChange("max_discount_amount", e.target.value)}
                  className="w-full mt-1 px-3 py-2 border rounded-lg"
                  placeholder="Ví dụ: 50000"
                />
              </div>
            )}
            <div>
              <label className="text-sm font-medium text-gray-700">Đơn tối thiểu (VND)</label>
              <input
                type="number"
                min={0}
                value={form.min_order_amount || ""}
                onChange={(e) => handleChange("min_order_amount", e.target.value)}
                className="w-full mt-1 px-3 py-2 border rounded-lg"
                placeholder="Tùy chọn"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Giới hạn mỗi user</label>
              <input
                type="number"
                min={1}
                value={form.usage_limit_per_user || ""}
                onChange={(e) => handleChange("usage_limit_per_user", e.target.value)}
                className="w-full mt-1 px-3 py-2 border rounded-lg"
                placeholder="Mặc định 1"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Tổng lượt dùng</label>
              <input
                type="number"
                min={1}
                value={form.usage_limit_total || ""}
                onChange={(e) => handleChange("usage_limit_total", e.target.value)}
                className="w-full mt-1 px-3 py-2 border rounded-lg"
                placeholder="Mặc định 1000"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Áp dụng cho sản phẩm</label>
              <select
                value={form.product_id || ""}
                onChange={(e) => handleChange("product_id", e.target.value || undefined)}
                className="w-full mt-1 px-3 py-2 border rounded-lg"
              >
                <option value="">Tất cả sản phẩm (Áp dụng cho shop)</option>
                {products.map((product) => (
                  <option key={product.id} value={product.id}>
                    {product.title} - ₫{Number(product.price).toLocaleString("vi-VN")}
                  </option>
                ))}
              </select>
              {products.length === 0 && (
                <p className="text-xs text-gray-500 mt-1">Chưa có sản phẩm. Vui lòng tạo sản phẩm trước.</p>
              )}
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Bắt đầu *</label>
              <input
                type="datetime-local"
                value={form.start_at}
                onChange={(e) => handleChange("start_at", e.target.value)}
                className="w-full mt-1 px-3 py-2 border rounded-lg"
                required
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Kết thúc *</label>
              <input
                type="datetime-local"
                value={form.end_at}
                onChange={(e) => handleChange("end_at", e.target.value)}
                className="w-full mt-1 px-3 py-2 border rounded-lg"
                required
              />
            </div>
          </div>
          <button
            type="submit"
            disabled={submitting}
            className="px-6 py-3 rounded-lg bg-orange-500 text-white font-semibold hover:bg-orange-600 transition disabled:opacity-50"
          >
            {submitting ? "Đang tạo..." : "Tạo voucher"}
          </button>
        </form>
      </div>

      <div className="bg-white rounded-xl border p-6 shadow-sm">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Voucher đã tạo</h2>
        {loading ? (
          <p className="text-sm text-gray-500">Đang tải...</p>
        ) : vouchers.length === 0 ? (
          <p className="text-sm text-gray-500">Bạn chưa tạo voucher nào.</p>
        ) : (
          <div className="space-y-3">
            {vouchers.map((v) => (
              <div
                key={v.id}
                className="border rounded-lg p-4 flex flex-col md:flex-row md:items-center justify-between gap-3"
              >
                <div>
                  <p className="font-semibold text-gray-900">{v.code}</p>
                  <p className="text-sm text-gray-600">
                    {v.discount_type === "PERCENT"
                      ? `Giảm ${v.discount_value}%`
                      : `Giảm ${Number(v.discount_value).toLocaleString("vi-VN")}₫`}
                  </p>
                  <p className="text-xs text-gray-500">
                    HSD: {new Date(v.start_at).toLocaleDateString("vi-VN")} -{" "}
                    {new Date(v.end_at).toLocaleDateString("vi-VN")}
                  </p>
                </div>
                <span className="text-xs text-gray-500">
                  Đã dùng: {v.used_count ?? 0}/{v.usage_limit_total ?? "∞"}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
