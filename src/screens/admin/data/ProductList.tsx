import { useList, useShow, useUpdate, useDelete } from "@refinedev/core";
import { useNavigate, useParams } from "react-router-dom";
import { Edit2, Trash2, Eye, Search } from "lucide-react";
import { useState, useEffect } from "react";

export function ProductList() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");

  const { data: listData, isLoading } = useList({
    resource: "products",
    pagination: {
      current: 1,
      pageSize: 20,
    },
    filters: search ? [{ field: "q", operator: "contains", value: search }] : [],
  });

  const { mutate: deleteProduct } = useDelete();

  const handleDelete = (id: string) => {
    if (confirm("Bạn có chắc chắn muốn xóa sản phẩm này?")) {
      deleteProduct({
        resource: "products",
        id,
      });
    }
  };

  // In Refine v4, listData has structure: { data: [...], total: number }
  const products = listData?.data || [];
  const total = listData?.total || 0;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Quản Lý Sản Phẩm</h1>
        <div className="flex items-center gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Tìm kiếm sản phẩm..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 pr-4 py-2 border rounded-lg"
            />
          </div>
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
                    Sản Phẩm
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Giá
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tồn Kho
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Seller
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Trạng Thái
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Thao Tác
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {products.map((product: any) => (
                  <tr key={product.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        {product.images && product.images.length > 0 && (
                          <img
                            src={product.images[0]}
                            alt={product.title}
                            className="h-10 w-10 rounded object-cover mr-3"
                          />
                        )}
                        <div className="min-w-0 flex-1">
                          <div className="text-sm font-medium text-gray-900 truncate max-w-xs" title={product.title}>
                            {product.title}
                          </div>
                          <div className="text-sm text-gray-500 truncate max-w-xs">{product.category?.name}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      ₫{Number(product.price).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {product.stock}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {product.seller?.name || "N/A"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          product.status === "active"
                            ? "bg-green-100 text-green-800"
                            : "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {product.status || "active"}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => navigate(`/admin/products/show/${product.id}`)}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => navigate(`/admin/products/edit/${product.id}`)}
                          className="text-indigo-600 hover:text-indigo-900"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(product.id)}
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
          <div className="text-sm text-gray-500">Tổng: {total} sản phẩm</div>
        </>
      )}
    </div>
  );
}

export function ProductShow() {
  const { id } = useParams();
  const navigate = useNavigate();

  const showResult = useShow({
    resource: "products",
    id: id!,
  });

  // In Refine v4, useShow might return different structures
  // Try multiple ways to access the data
  const product = 
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
  if (!product) return <div className="text-center py-8">Không tìm thấy sản phẩm</div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Chi Tiết Sản Phẩm</h1>
        <button
          onClick={() => navigate("/admin/products")}
          className="px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300"
        >
          Quay lại
        </button>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <div className="grid grid-cols-2 gap-6">
          <div>
            <h2 className="text-lg font-semibold mb-4">Thông Tin Cơ Bản</h2>
            <div className="space-y-2">
              <p><strong>ID:</strong> {product.id}</p>
              <p><strong>Tên:</strong> {product.title}</p>
              <p><strong>Giá:</strong> ₫{Number(product.price).toLocaleString()}</p>
              <p><strong>Tồn kho:</strong> {product.stock}</p>
              <p><strong>Trạng thái:</strong> {product.status || "active"}</p>
            </div>
          </div>
          <div>
            <h2 className="text-lg font-semibold mb-4">Thông Tin Khác</h2>
            <div className="space-y-2">
              <p><strong>Seller:</strong> {product.seller?.name || "N/A"}</p>
              <p><strong>Danh mục:</strong> {product.category?.name || "N/A"}</p>
              <p><strong>Đánh giá:</strong> {product.rating || 0}</p>
              <p><strong>Số đánh giá:</strong> {product.reviews_count || 0}</p>
            </div>
          </div>
        </div>
        {product.description && (
          <div className="mt-6">
            <h2 className="text-lg font-semibold mb-2">Mô tả</h2>
            <p className="text-gray-700">{product.description}</p>
          </div>
        )}
        {product.images && product.images.length > 0 && (
          <div className="mt-6">
            <h2 className="text-lg font-semibold mb-2">Hình ảnh</h2>
            <div className="grid grid-cols-4 gap-4">
              {product.images.map((img: string, idx: number) => (
                <img key={idx} src={img} alt={`${product.title} ${idx + 1}`} className="rounded-lg" />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export function ProductEdit() {
  const { id } = useParams();
  const navigate = useNavigate();
  const showResult = useShow({ resource: "products", id: id! });
  const { mutate, isLoading } = useUpdate();
  
  // In Refine v4, useShow might return different structures
  const product = 
    (showResult as any).data?.data || 
    (showResult as any).data || 
    (showResult as any).query?.data?.data ||
    (showResult as any).query?.data ||
    (showResult as any).result?.data ||
    (showResult as any).result;
    
  const isLoadingProduct = 
    (showResult as any).isLoading || 
    (showResult as any).isFetching || 
    (showResult as any).query?.isLoading ||
    (showResult as any).query?.isFetching ||
    false;
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    price: "",
    stock: 0,
    status: "active",
    discount: 0,
  });

  // Update formData when product is loaded
  useEffect(() => {
    if (product) {
      setFormData({
        title: product.title || "",
        description: product.description || "",
        price: product.price?.toString() || "",
        stock: product.stock || 0,
        status: product.status || "active",
        discount: product.discount || 0,
      });
    }
  }, [product]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    mutate({
      resource: "products",
      id: id!,
      values: {
        ...formData,
        price: parseFloat(formData.price.toString()),
        stock: parseInt(formData.stock.toString()),
      },
    }, {
      onSuccess: () => {
        navigate("/admin/products");
      },
    });
  };

  if (isLoadingProduct) return <div>Đang tải...</div>;
  if (!product) return <div>Không tìm thấy sản phẩm</div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Chỉnh Sửa Sản Phẩm</h1>
        <button
          onClick={() => navigate("/admin/products")}
          className="px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300"
        >
          Quay lại
        </button>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-6 space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Tên sản phẩm</label>
          <input
            type="text"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            className="w-full px-3 py-2 border rounded-lg"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Mô tả</label>
          <textarea
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            className="w-full px-3 py-2 border rounded-lg"
            rows={4}
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Giá</label>
            <input
              type="number"
              value={formData.price}
              onChange={(e) => setFormData({ ...formData, price: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tồn kho</label>
            <input
              type="number"
              value={formData.stock}
              onChange={(e) => setFormData({ ...formData, stock: parseInt(e.target.value) })}
              className="w-full px-3 py-2 border rounded-lg"
              required
            />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Giảm giá (%)</label>
            <input
              type="number"
              value={formData.discount}
              onChange={(e) => setFormData({ ...formData, discount: parseFloat(e.target.value) })}
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
            onClick={() => navigate("/admin/products")}
            className="px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300"
          >
            Hủy
          </button>
        </div>
      </form>
    </div>
  );
}

