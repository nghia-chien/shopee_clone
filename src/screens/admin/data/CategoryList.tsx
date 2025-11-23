import { useList, useShow, useCreate, useUpdate, useDelete } from "@refinedev/core";
import { useNavigate, useParams } from "react-router-dom";
import { Edit2, Trash2, Eye, Plus, Search } from "lucide-react";
import { useState, useEffect } from "react";

export function CategoryList() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");

  const { data: listData, isLoading } = useList({
    resource: "categories",
    pagination: {
      current: 1,
      pageSize: 100,
    },
    filters: search ? [{ field: "q", operator: "contains", value: search }] : [],
  });

  const { mutate: deleteCategory } = useDelete();

  const handleDelete = (id: string) => {
    if (confirm("Bạn có chắc chắn muốn xóa danh mục này?")) {
      deleteCategory({
        resource: "categories",
        id,
      });
    }
  };

  // In Refine v4, listData has structure: { data: [...], total: number }
  const categories = listData?.data || [];
  const total = listData?.total || 0;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Quản Lý Danh Mục</h1>
        <div className="flex items-center gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Tìm kiếm danh mục..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 pr-4 py-2 border rounded-lg"
            />
          </div>
          <button
            onClick={() => navigate("/admin/categories/create")}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <Plus className="w-4 h-4" />
            Thêm danh mục
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
                    Tên
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Slug
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Cấp độ
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Số sản phẩm
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Thao Tác
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {categories.map((category: any) => (
                  <tr key={category.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{category.name}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {category.slug}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {category.level}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {category._count?.product || 0}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => navigate(`/admin/categories/show/${category.id}`)}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => navigate(`/admin/categories/edit/${category.id}`)}
                          className="text-indigo-600 hover:text-indigo-900"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(category.id)}
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
          <div className="text-sm text-gray-500">Tổng: {total} danh mục</div>
        </>
      )}
    </div>
  );
}

export function CategoryShow() {
  const { id } = useParams();
  const navigate = useNavigate();

  const showResult = useShow({
    resource: "categories",
    id: id!,
  });

  // In Refine v4, useShow might return different structures
  const category = 
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
  if (!category) return <div className="text-center py-8">Không tìm thấy danh mục</div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Chi Tiết Danh Mục</h1>
        <button
          onClick={() => navigate("/admin/categories")}
          className="px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300"
        >
          Quay lại
        </button>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <div className="space-y-4">
          <div>
            <strong>ID:</strong> {category.id}
          </div>
          <div>
            <strong>Tên:</strong> {category.name}
          </div>
          <div>
            <strong>Slug:</strong> {category.slug}
          </div>
          <div>
            <strong>Cấp độ:</strong> {category.level}
          </div>
          <div>
            <strong>Path:</strong> {category.path?.join(" > ") || category.name}
          </div>
          <div>
            <strong>Số sản phẩm:</strong> {category._count?.product || 0}
          </div>
          {category.image && (
            <div>
              <strong>Hình ảnh:</strong>
              <img src={category.image} alt={category.name} className="mt-2 h-32 rounded" />
            </div>
          )}
        </div>
      </div>

      {category.product && category.product.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">Sản Phẩm Trong Danh Mục</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {category.product.map((product: any) => (
              <div
                key={product.id}
                onClick={() => navigate(`/admin/products/show/${product.id}`)}
                className="cursor-pointer border rounded-lg p-2 hover:shadow-lg transition-shadow"
              >
                {product.images && product.images.length > 0 && (
                  <img
                    src={product.images[0]}
                    alt={product.title}
                    className="w-full h-32 object-cover rounded mb-2"
                  />
                )}
                <p className="text-sm font-medium truncate" title={product.title}>
                  {product.title}
                </p>
                <p className="text-xs text-gray-500">₫{Number(product.price).toLocaleString()}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export function CategoryCreate() {
  const navigate = useNavigate();
  const { mutate, isLoading: isLoadingState } = useCreate();

  const [formData, setFormData] = useState({
    name: "",
    slug: "",
    parent_id: "",
    level: 1,
    image: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    mutate(
      {
        resource: "categories",
        values: {
          ...formData,
          parent_id: formData.parent_id || null,
          // Path will be auto-generated by backend
        },
      },
      {
        onSuccess: () => {
          navigate("/admin/categories");
        },
      }
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Tạo Danh Mục Mới</h1>
        <button
          onClick={() => navigate("/admin/categories")}
          className="px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300"
        >
          Quay lại
        </button>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-6 space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Tên danh mục</label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="w-full px-3 py-2 border rounded-lg"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Slug</label>
          <input
            type="text"
            value={formData.slug}
            onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
            className="w-full px-3 py-2 border rounded-lg"
            required
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Cấp độ</label>
            <input
              type="number"
              value={formData.level}
              onChange={(e) => setFormData({ ...formData, level: parseInt(e.target.value) })}
              className="w-full px-3 py-2 border rounded-lg"
              min="1"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Parent ID (tùy chọn)</label>
            <input
              type="text"
              value={formData.parent_id}
              onChange={(e) => setFormData({ ...formData, parent_id: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg"
            />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Hình ảnh URL (tùy chọn)</label>
          <input
            type="text"
            value={formData.image}
            onChange={(e) => setFormData({ ...formData, image: e.target.value })}
            className="w-full px-3 py-2 border rounded-lg"
          />
        </div>
        <div className="flex gap-4">
          <button
            type="submit"
            disabled={isLoadingState}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {isLoadingState ? "Đang tạo..." : "Tạo danh mục"}
          </button>
          <button
            type="button"
            onClick={() => navigate("/admin/categories")}
            className="px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300"
          >
            Hủy
          </button>
        </div>
      </form>
    </div>
  );
}

export function CategoryEdit() {
  const { id } = useParams();
  const navigate = useNavigate();
  const showResult = useShow({ resource: "categories", id: id! });
  const { mutate, isLoading: isLoadingState } = useUpdate();
  
  // In Refine v4, useShow might return different structures
  const category = 
    (showResult as any).data?.data || 
    (showResult as any).data || 
    (showResult as any).query?.data?.data ||
    (showResult as any).query?.data ||
    (showResult as any).result?.data ||
    (showResult as any).result;
    
  const isLoadingCategory = 
    (showResult as any).isLoading || 
    (showResult as any).isFetching || 
    (showResult as any).query?.isLoading ||
    (showResult as any).query?.isFetching ||
    false;
  const [formData, setFormData] = useState({
    name: "",
    slug: "",
    parent_id: "",
    level: 1,
    image: "",
  });

  // Update formData when category is loaded
  useEffect(() => {
    if (category) {
      setFormData({
        name: category.name || "",
        slug: category.slug || "",
        parent_id: category.parent_id || "",
        level: category.level || 1,
        image: category.image || "",
      });
    }
  }, [category]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    mutate(
      {
        resource: "categories",
        id: id!,
        values: {
          ...formData,
          parent_id: formData.parent_id || null,
        },
      },
      {
        onSuccess: () => {
          navigate("/admin/categories");
        },
      }
    );
  };

  if (isLoadingCategory) return <div>Đang tải...</div>;
  if (!category) return <div>Không tìm thấy danh mục</div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Chỉnh Sửa Danh Mục</h1>
        <button
          onClick={() => navigate("/admin/categories")}
          className="px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300"
        >
          Quay lại
        </button>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-6 space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Tên danh mục</label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="w-full px-3 py-2 border rounded-lg"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Slug</label>
          <input
            type="text"
            value={formData.slug}
            onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
            className="w-full px-3 py-2 border rounded-lg"
            required
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Cấp độ</label>
            <input
              type="number"
              value={formData.level}
              onChange={(e) => setFormData({ ...formData, level: parseInt(e.target.value) })}
              className="w-full px-3 py-2 border rounded-lg"
              min="1"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Parent ID (tùy chọn)</label>
            <input
              type="text"
              value={formData.parent_id}
              onChange={(e) => setFormData({ ...formData, parent_id: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg"
            />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Hình ảnh URL (tùy chọn)</label>
          <input
            type="text"
            value={formData.image}
            onChange={(e) => setFormData({ ...formData, image: e.target.value })}
            className="w-full px-3 py-2 border rounded-lg"
          />
        </div>
        <div className="flex gap-4">
          <button
            type="submit"
            disabled={isLoadingState}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {isLoadingState ? "Đang lưu..." : "Lưu thay đổi"}
          </button>
          <button
            type="button"
            onClick={() => navigate("/admin/categories")}
            className="px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300"
          >
            Hủy
          </button>
        </div>
      </form>
    </div>
  );
}

