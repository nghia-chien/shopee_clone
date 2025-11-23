import { useList, useCreate } from "@refinedev/core";
import { useNavigate } from "react-router-dom";
import { Plus, Search } from "lucide-react";
import { useState } from "react";

export function VoucherList() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");

  const { data: listData, isLoading } = useList({
    resource: "vouchers",
    pagination: {
      current: 1,
      pageSize: 50,
    },
    filters: search ? [{ field: "q", operator: "contains", value: search }] : [],
  });

  // In Refine v4, listData has structure: { data: [...], total: number }
  const vouchers = listData?.data || [];
  const total = listData?.total || 0;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Quản Lý Voucher</h1>
        <div className="flex items-center gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Tìm kiếm voucher..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 pr-4 py-2 border rounded-lg"
            />
          </div>
          <button
            onClick={() => navigate("/admin/vouchers/create")}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <Plus className="w-4 h-4" />
            Tạo voucher
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="text-center py-8">Đang tải...</div>
      ) : (
        <>
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Mã voucher
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Loại
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Giảm giá
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Thời gian
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Trạng thái
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {vouchers.map((voucher: any) => (
                  <tr key={voucher.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {voucher.code}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {voucher.type}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {voucher.discount_type === "PERCENT"
                        ? `${voucher.discount_value}%`
                        : `₫${Number(voucher.discount_value).toLocaleString()}`}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(voucher.start_at).toLocaleDateString("vi-VN")} -{" "}
                      {new Date(voucher.end_at).toLocaleDateString("vi-VN")}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          voucher.status === "ACTIVE"
                            ? "bg-green-100 text-green-800"
                            : "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {voucher.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="text-sm text-gray-500">Tổng: {total} voucher</div>
        </>
      )}
    </div>
  );
}

export function VoucherCreate() {
  const navigate = useNavigate();
  const { mutate, isLoading } = useCreate();

  const [formData, setFormData] = useState({
    code: "",
    type: "PLATFORM",
    discount_type: "PERCENT",
    discount_value: 10,
    max_discount_amount: "",
    min_order_amount: "",
    usage_limit_per_user: "",
    usage_limit_total: "",
    start_at: "",
    end_at: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    mutate(
      {
        resource: "vouchers",
        values: {
          ...formData,
          source: "ADMIN",
          max_discount_amount: formData.max_discount_amount ? parseFloat(formData.max_discount_amount) : null,
          min_order_amount: formData.min_order_amount ? parseFloat(formData.min_order_amount) : 0,
          usage_limit_per_user: formData.usage_limit_per_user ? parseInt(formData.usage_limit_per_user) : 1,
          usage_limit_total: formData.usage_limit_total ? parseInt(formData.usage_limit_total) : 1000,
          start_at: new Date(formData.start_at).toISOString(),
          end_at: new Date(formData.end_at).toISOString(),
        },
      },
      {
        onSuccess: () => {
          navigate("/admin/vouchers");
        },
      }
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Tạo Voucher Mới</h1>
        <button
          onClick={() => navigate("/admin/vouchers")}
          className="px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300"
        >
          Quay lại
        </button>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-6 space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Mã voucher</label>
            <input
              type="text"
              value={formData.code}
              onChange={(e) => setFormData({ ...formData, code: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Loại</label>
            <select
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg"
            >
              <option value="PLATFORM">Platform</option>
              <option value="SHOP">Shop</option>
            </select>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Loại giảm giá</label>
            <select
              value={formData.discount_type}
              onChange={(e) => setFormData({ ...formData, discount_type: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg"
            >
              <option value="PERCENT">Phần trăm</option>
              <option value="AMOUNT">Số tiền</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Giá trị giảm</label>
            <input
              type="number"
              value={formData.discount_value}
              onChange={(e) => setFormData({ ...formData, discount_value: parseFloat(e.target.value) })}
              className="w-full px-3 py-2 border rounded-lg"
              required
            />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Giảm tối đa (tùy chọn)</label>
            <input
              type="number"
              value={formData.max_discount_amount}
              onChange={(e) => setFormData({ ...formData, max_discount_amount: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Đơn tối thiểu</label>
            <input
              type="number"
              value={formData.min_order_amount}
              onChange={(e) => setFormData({ ...formData, min_order_amount: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg"
            />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Giới hạn mỗi user</label>
            <input
              type="number"
              value={formData.usage_limit_per_user}
              onChange={(e) => setFormData({ ...formData, usage_limit_per_user: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Giới hạn tổng</label>
            <input
              type="number"
              value={formData.usage_limit_total}
              onChange={(e) => setFormData({ ...formData, usage_limit_total: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg"
            />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Ngày bắt đầu</label>
            <input
              type="datetime-local"
              value={formData.start_at}
              onChange={(e) => setFormData({ ...formData, start_at: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Ngày kết thúc</label>
            <input
              type="datetime-local"
              value={formData.end_at}
              onChange={(e) => setFormData({ ...formData, end_at: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg"
              required
            />
          </div>
        </div>
        <div className="flex gap-4">
          <button
            type="submit"
            disabled={!!isLoading}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {isLoading ? "Đang tạo..." : "Tạo voucher"}
          </button>
          <button
            type="button"
            onClick={() => navigate("/admin/vouchers")}
            className="px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300"
          >
            Hủy
          </button>
        </div>
      </form>
    </div>
  );
}

