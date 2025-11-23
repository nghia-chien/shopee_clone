import { useList, useShow, useUpdate } from "@refinedev/core";
import { useNavigate, useParams } from "react-router-dom";
import { Edit2, Eye, Search } from "lucide-react";
import { useState } from "react";

export function OrderList() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");

  const { data: listData, isLoading } = useList({
    resource: "orders",
    pagination: {
      current: 1,
      pageSize: 20,
    },
    filters: search ? [{ field: "q", operator: "contains", value: search }] : [],
  });

  // In Refine v4, listData has structure: { data: [...], total: number }
  const orders = listData?.data || [];
  const total = listData?.total || 0;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Quản Lý Đơn Hàng</h1>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Tìm kiếm đơn hàng..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 pr-4 py-2 border rounded-lg"
          />
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
                    Mã đơn
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Khách hàng
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tổng tiền
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Trạng thái
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Ngày tạo
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Thao Tác
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {orders.map((order: any) => (
                  <tr key={order.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {order.id.substring(0, 8)}...
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{order.user?.name || "N/A"}</div>
                      <div className="text-sm text-gray-500">{order.user?.email || ""}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      ₫{Number(order.total).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          order.status === "completed"
                            ? "bg-green-100 text-green-800"
                            : order.status === "pending"
                            ? "bg-yellow-100 text-yellow-800"
                            : "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {order.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(order.created_at).toLocaleDateString("vi-VN")}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => navigate(`/admin/orders/show/${order.id}`)}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => navigate(`/admin/orders/edit/${order.id}`)}
                          className="text-indigo-600 hover:text-indigo-900"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="text-sm text-gray-500">Tổng: {total} đơn hàng</div>
        </>
      )}
    </div>
  );
}

export function OrderShow() {
  const { id } = useParams();
  const navigate = useNavigate();

  const showResult = useShow({
    resource: "orders",
    id: id!,
  });

  // In Refine v4, useShow returns QueryObserverResult with data: { data: TData }
  const order = (showResult as any).data?.data;
  const isLoading = (showResult as any).isLoading || (showResult as any).isFetching || false;

  if (isLoading) return <div>Đang tải...</div>;
  if (!order) return <div>Không tìm thấy đơn hàng</div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Chi Tiết Đơn Hàng</h1>
        <button
          onClick={() => navigate("/admin/orders")}
          className="px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300"
        >
          Quay lại
        </button>
      </div>

      <div className="bg-white rounded-lg shadow p-6 space-y-6">
        <div>
          <h2 className="text-lg font-semibold mb-4">Thông Tin Đơn Hàng</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p><strong>Mã đơn:</strong> {order.id}</p>
              <p><strong>Tổng tiền:</strong> ₫{Number(order.total).toLocaleString()}</p>
              <p><strong>Trạng thái:</strong> {order.status}</p>
            </div>
            <div>
              <p><strong>Ngày tạo:</strong> {new Date(order.created_at).toLocaleString("vi-VN")}</p>
              <p><strong>Ngày cập nhật:</strong> {new Date(order.updated_at).toLocaleString("vi-VN")}</p>
            </div>
          </div>
        </div>

        {order.user && (
          <div>
            <h2 className="text-lg font-semibold mb-4">Thông Tin Khách Hàng</h2>
            <div>
              <p><strong>Tên:</strong> {order.user.name || "N/A"}</p>
              <p><strong>Email:</strong> {order.user.email || "N/A"}</p>
            </div>
          </div>
        )}

        {order.order_item && order.order_item.length > 0 && (
          <div>
            <h2 className="text-lg font-semibold mb-4">Sản Phẩm</h2>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Sản phẩm</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Giá</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Số lượng</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Thành tiền</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {order.order_item.map((item: any) => (
                    <tr key={item.id}>
                      <td className="px-4 py-2 text-sm">{item.product?.title || "N/A"}</td>
                      <td className="px-4 py-2 text-sm">₫{Number(item.price).toLocaleString()}</td>
                      <td className="px-4 py-2 text-sm">{item.quantity}</td>
                      <td className="px-4 py-2 text-sm">
                        ₫{(Number(item.price) * item.quantity).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export function OrderEdit() {
  const { id } = useParams();
  const navigate = useNavigate();
  const showResult = useShow({ resource: "orders", id: id! });
  const { mutate, isLoading } = useUpdate();
  
  // In Refine v4, useShow returns QueryObserverResult with data: { data: TData }
  const order = (showResult as any).data?.data;
  const [formData, setFormData] = useState({
    status: order?.status || "pending",
    fulfillment_status: order?.fulfillment_status || "pending",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    mutate(
      {
        resource: "orders",
        id: id!,
        values: formData,
      },
      {
        onSuccess: () => {
          navigate("/admin/orders");
        },
      }
    );
  };

  if (!order) return <div>Đang tải...</div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Chỉnh Sửa Đơn Hàng</h1>
        <button
          onClick={() => navigate("/admin/orders")}
          className="px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300"
        >
          Quay lại
        </button>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-6 space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Trạng thái</label>
          <select
            value={formData.status}
            onChange={(e) => setFormData({ ...formData, status: e.target.value })}
            className="w-full px-3 py-2 border rounded-lg"
          >
            <option value="pending">Pending</option>
            <option value="processing">Processing</option>
            <option value="shipped">Shipped</option>
            <option value="delivered">Delivered</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Fulfillment Status</label>
          <select
            value={formData.fulfillment_status}
            onChange={(e) => setFormData({ ...formData, fulfillment_status: e.target.value })}
            className="w-full px-3 py-2 border rounded-lg"
          >
            <option value="pending">Pending</option>
            <option value="processing">Processing</option>
            <option value="shipped">Shipped</option>
            <option value="delivered">Delivered</option>
          </select>
        </div>
        <div className="flex gap-4">
          <button
            type="submit"
            disabled={!!isLoading}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {isLoading ? "Đang lưu..." : "Lưu thay đổi"}
          </button>
          <button
            type="button"
            onClick={() => navigate("/admin/orders")}
            className="px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300"
          >
            Hủy
          </button>
        </div>
      </form>
    </div>
  );
}

