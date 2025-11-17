import { useState, useEffect } from "react";
import { useAdminAuthStore } from "../../store/AdminAuth";
import {
  getAdminSellers,
  createAdminSeller,
  updateAdminSeller,
  deleteAdminSeller,
  type Seller,
} from "../../api/adminSellers";
import { Store, Plus, Edit2, Trash2, Search, X } from "lucide-react";

export function AdminSellers() {
  const { token } = useAdminAuthStore();
  const [sellers, setSellers] = useState<Seller[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [editingSeller, setEditingSeller] = useState<Seller | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone_number: "",
    password: "",
    status: "active" as "active" | "inactive",
  });

  useEffect(() => {
    if (token) loadSellers();
  }, [token, page, search, statusFilter]);

  const loadSellers = async () => {
    try {
      setLoading(true);
      setError("");
      const data = await getAdminSellers(token!, page, 20, search, statusFilter || undefined);
      setSellers(data.sellers || []);
      setTotalPages(data.pagination?.totalPages || 1);
    } catch (err: any) {
      setError(err.message || "Lỗi khi tải danh sách sellers");
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setEditingSeller(null);
    setFormData({ name: "", email: "", phone_number: "", password: "", status: "active" });
    setShowModal(true);
  };

  const handleEdit = (seller: Seller) => {
    setEditingSeller(seller);
    setFormData({
      name: seller.name,
      email: seller.email,
      phone_number: seller.phone_number || "",
      password: "",
      status: seller.status as "active" | "inactive",
    });
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setError("");
      if (editingSeller) {
        await updateAdminSeller(token!, editingSeller.id, {
          name: formData.name,
          email: formData.email,
          phone_number: formData.phone_number || null,
          status: formData.status,
        });
      } else {
        if (!formData.password) {
          setError("Mật khẩu là bắt buộc khi tạo seller mới");
          return;
        }
        await createAdminSeller(token!, {
          name: formData.name,
          email: formData.email,
          phone_number: formData.phone_number || undefined,
          password: formData.password,
          status: formData.status,
        });
      }
      setShowModal(false);
      loadSellers();
    } catch (err: any) {
      setError(err.message || "Lỗi khi lưu seller");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Bạn có chắc chắn muốn xóa seller này?")) return;
    try {
      await deleteAdminSeller(token!, id);
      loadSellers();
    } catch (err: any) {
      setError(err.message || "Lỗi khi xóa seller");
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800";
      case "inactive":
        return "bg-gray-100 text-gray-800";
      case "suspended":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Quản Lý Sellers</h1>
        <button
          onClick={handleCreate}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
        >
          <Plus className="w-5 h-5" />
          Thêm Seller
        </button>
      </div>

      {/* Filters */}
      <div className="mb-6 flex gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Tìm kiếm seller..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value);
            setPage(1);
          }}
          className="px-4 py-2 border rounded-lg"
        >
          <option value="">Tất cả trạng thái</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
          <option value="suspended">Suspended</option>
        </select>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
          {error}
        </div>
      )}

      {/* Table */}
      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
        </div>
      ) : (
        <>
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tên</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">SĐT</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Trạng thái</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Rating</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Sản phẩm</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Thao tác</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {sellers.map((seller) => (
                  <tr key={seller.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{seller.email}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{seller.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{seller.phone_number || "-"}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(seller.status)}`}>
                        {seller.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {seller.rating ? seller.rating.toFixed(1) : "0.0"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {seller._count?.product || 0}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => handleEdit(seller)}
                        className="text-blue-600 hover:text-blue-900 mr-4"
                      >
                        <Edit2 className="w-4 h-4 inline" />
                      </button>
                      <button
                        onClick={() => handleDelete(seller.id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        <Trash2 className="w-4 h-4 inline" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-6 flex justify-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-4 py-2 border rounded-lg disabled:opacity-50"
              >
                Trước
              </button>
              <span className="px-4 py-2">
                Trang {page} / {totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="px-4 py-2 border rounded-lg disabled:opacity-50"
              >
                Sau
              </button>
            </div>
          )}
        </>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold">
                {editingSeller ? "Sửa Seller" : "Tạo Seller Mới"}
              </h2>
              <button onClick={() => setShowModal(false)}>
                <X className="w-6 h-6" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Tên</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Email</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Số điện thoại</label>
                <input
                  type="text"
                  value={formData.phone_number}
                  onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Trạng thái</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value as "active" | "inactive" })}
                  className="w-full px-3 py-2 border rounded-lg"
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
              {!editingSeller && (
                <div>
                  <label className="block text-sm font-medium mb-1">Mật khẩu</label>
                  <input
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                    required
                  />
                </div>
              )}
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-4 py-2 border rounded-lg"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg"
                >
                  {editingSeller ? "Cập nhật" : "Tạo"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

