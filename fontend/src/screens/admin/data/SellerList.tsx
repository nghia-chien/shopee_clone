import { useList, useShow, useCreate, useUpdate, useDelete } from "@refinedev/core";
import { useNavigate, useParams } from "react-router-dom";
import { Edit2, Trash2, Eye, Plus, Search } from "lucide-react";
import { useState, useEffect } from "react";

export function SellerList() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");

  console.log("🎯 SellerList Component Render - Search:", search);
  const { data: listData, isLoading } = useList({
    resource: "sellers",
    pagination: {
      current: 1,
      pageSize: 20,
    },
    filters: search ? [{ field: "q", operator: "contains", value: search }] : [],
  });

  // 2. Log dữ liệu trả về từ API
  console.log("📊 SellerList API Response:", {
    listData,
    isLoading,
    searchFilter: search ? [{ field: "q", operator: "contains", value: search }] : []
  });
  const { mutate: deleteSeller } = useDelete();

  const handleDelete = (id: string) => {
    // 3. Log khi xóa seller
    console.log("🗑️ Delete Seller Clicked - ID:", id);
    
    if (confirm("Bạn có chắc chắn muốn xóa seller này?")) {
      console.log("✅ Confirm delete - Calling API for ID:", id);
      deleteSeller({
        resource: "sellers",
        id,
      });
    } else {
      console.log("❌ Delete cancelled");
    }
  };

  // In Refine v4, listData has structure: { data: [...], total: number }
  const sellers = listData?.data || [];
  const total = listData?.total || 0;

  console.log("📋 Processed Sellers Data:", {
    sellers,
    total,
    rawDataStructure: listData ? Object.keys(listData) : 'No data'
  });
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Quản Lý Sellers</h1>
        <div className="flex items-center gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Tìm kiếm seller..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 pr-4 py-2 border rounded-lg"
            />
          </div>
          <button
            onClick={() => navigate("/admin/sellers/create")}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <Plus className="w-4 h-4" />
            Thêm seller
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
                    Tên shop
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Trạng thái
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Shop Mall
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Thao Tác
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {sellers.map((seller: any) => (
                  <tr key={seller.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {seller.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{seller.email}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          seller.status === "active"
                            ? "bg-green-100 text-green-800"
                            : "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {seller.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {seller.shop_mall || "normal"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => navigate(`/admin/sellers/show/${seller.id}`)}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => navigate(`/admin/sellers/edit/${seller.id}`)}
                          className="text-indigo-600 hover:text-indigo-900"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(seller.id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="text-sm text-gray-500">Tổng: {total} sellers</div>
        </>
      )}
    </div>
  );
}

export function SellerShow() {
  const { id } = useParams();
  const navigate = useNavigate();

  const showResult = useShow({
    resource: "sellers",
    id: id!,
  });

  // In Refine v4, useShow might return different structures
  const seller = 
    (showResult as any).data?.data || 
    (showResult as any).data || 
    (showResult as any).query?.data?.data ||
    (showResult as any).query?.data ||
    (showResult as any).result?.data ||
    (showResult as any).result;
    
  const isLoading = 
    (showResult as any).isLoading || 
    (showResult as any).isFetching || 
    (showResult as any).query?.isLoading ||
    (showResult as any).query?.isFetching ||
    false;
    
  const error = 
    (showResult as any).error || 
    (showResult as any).query?.error;

  if (isLoading) return <div className="text-center py-8">Đang tải...</div>;
  if (error) return <div className="text-center py-8 text-red-600">Lỗi: {error?.message || "Không thể tải dữ liệu"}</div>;
  if (!seller) return <div className="text-center py-8">Không tìm thấy seller</div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Chi Tiết Seller</h1>
        <button
          onClick={() => navigate("/admin/sellers")}
          className="px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300"
        >
          Quay lại
        </button>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <div className="space-y-4">
          <div>
            <strong>ID:</strong> {seller.id}
          </div>
          <div>
            <strong>Tên:</strong> {seller.name}
          </div>
          <div>
            <strong>Email:</strong> {seller.email}
          </div>
          <div>
            <strong>Trạng thái:</strong> {seller.status}
          </div>
          <div>
            <strong>Shop Mall:</strong> {seller.shop_mall || "normal"}
          </div>
        </div>
      </div>
    </div>
  );
}

export function SellerCreate() {
  const navigate = useNavigate();
  const { mutate, isLoading } = useCreate();

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone_number: "",
    password: "",
    status: "active",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    mutate(
      {
        resource: "sellers",
        values: formData,
      },
      {
        onSuccess: () => {
          navigate("/admin/sellers");
        },
      }
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Tạo Seller Mới</h1>
        <button
          onClick={() => navigate("/admin/sellers")}
          className="px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300"
        >
          Quay lại
        </button>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-6 space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Tên shop</label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="w-full px-3 py-2 border rounded-lg"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
          <input
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            className="w-full px-3 py-2 border rounded-lg"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">SĐT (tùy chọn)</label>
          <input
            type="text"
            value={formData.phone_number}
            onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })}
            className="w-full px-3 py-2 border rounded-lg"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Mật khẩu</label>
          <input
            type="password"
            value={formData.password}
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            className="w-full px-3 py-2 border rounded-lg"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Trạng thái</label>
          <select
            value={formData.status}
            onChange={(e) => setFormData({ ...formData, status: e.target.value })}
            className="w-full px-3 py-2 border rounded-lg"
          >
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
        <div className="flex gap-4">
          <button
            type="submit"
            disabled={!!isLoading}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {isLoading ? "Đang tạo..." : "Tạo seller"}
          </button>
          <button
            type="button"
            onClick={() => navigate("/admin/sellers")}
            className="px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300"
          >
            Hủy
          </button>
        </div>
      </form>
    </div>
  );
}

export function SellerEdit() {
  const { id } = useParams();
  const navigate = useNavigate();
  const showResult = useShow({ resource: "sellers", id: id! });
  const { mutate, isLoading } = useUpdate();
  
  // In Refine v4, useShow might return different structures
  const seller = 
    (showResult as any).data?.data || 
    (showResult as any).data || 
    (showResult as any).query?.data?.data ||
    (showResult as any).query?.data ||
    (showResult as any).result?.data ||
    (showResult as any).result;
    
  const isLoadingSeller = 
    (showResult as any).isLoading || 
    (showResult as any).isFetching || 
    (showResult as any).query?.isLoading ||
    (showResult as any).query?.isFetching ||
    false;
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone_number: "",
    status: "active",
  });

  // Update formData when seller is loaded
  useEffect(() => {
    if (seller) {
      setFormData({
        name: seller.name || "",
        email: seller.email || "",
        phone_number: seller.phone_number || "",
        status: seller.status || "active",
      });
    }
  }, [seller]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    mutate(
      {
        resource: "sellers",
        id: id!,
        values: formData,
      },
      {
        onSuccess: () => {
          navigate("/admin/sellers");
        },
      }
    );
  };

  if (isLoadingSeller) return <div>Đang tải...</div>;
  if (!seller) return <div>Không tìm thấy seller</div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Chỉnh Sửa Seller</h1>
        <button
          onClick={() => navigate("/admin/sellers")}
          className="px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300"
        >
          Quay lại
        </button>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-6 space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Tên shop</label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="w-full px-3 py-2 border rounded-lg"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
          <input
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            className="w-full px-3 py-2 border rounded-lg"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">SĐT (tùy chọn)</label>
          <input
            type="text"
            value={formData.phone_number}
            onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })}
            className="w-full px-3 py-2 border rounded-lg"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Trạng thái</label>
          <select
            value={formData.status}
            onChange={(e) => setFormData({ ...formData, status: e.target.value })}
            className="w-full px-3 py-2 border rounded-lg"
          >
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
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
            onClick={() => navigate("/admin/sellers")}
            className="px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300"
          >
            Hủy
          </button>
        </div>
      </form>
    </div>
  );
}

