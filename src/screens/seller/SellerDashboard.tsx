import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { fetchSellerProducts, updateSellerProduct, deleteSellerProduct } from "../../api/sellerapi/sellerProducts";
import { useSellerAuthStore } from "../../store/SellerAuth";
import { Package, TrendingUp, DollarSign, ShoppingBag, Plus, Edit2, Trash2, Search } from "lucide-react";

interface Product {
  id: string;
  title: string;
  description?: string;
  price: number;
  stock: number;
  images: string[];
  status?: string;
  rating?: number;
  created_at?: string;
  attributes?: Record<string, any>;
}

export const SellerDashboard = () => {
  const navigate = useNavigate();
  const { token, seller } = useSellerAuthStore();
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [editForm, setEditForm] = useState({ title: "", price: "", stock: "", description: "" });
  const [attributesEditor, setAttributesEditor] = useState<Array<{ key: string; value: string }>>([]);
  const [editErrors, setEditErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);

  useEffect(() => {
    if (!token) {
      navigate("/seller/login");
      return;
    }
    loadProducts();
  }, [token, navigate]);

  useEffect(() => {
    if (searchTerm) {
      const filtered = products.filter(p =>
        p.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.description?.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredProducts(filtered);
    } else {
      setFilteredProducts(products);
    }
  }, [searchTerm, products]);

  const loadProducts = async () => {
    try {
      setLoading(true);
      const data = await fetchSellerProducts(token!);
      setProducts(data.products || []);
      setFilteredProducts(data.products || []);
    } catch (err: any) {
      setError(err.message || "Failed to fetch products");
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    setEditForm({
      title: product.title,
      price: product.price.toString(),
      stock: product.stock.toString(),
      description: product.description || "",
    });
    const pairs: Array<{ key: string; value: string }> = [];
    if (product.attributes && typeof product.attributes === "object") {
      Object.entries(product.attributes).forEach(([k, v]) => {
        pairs.push({ key: k, value: String(v ?? "") });
      });
    }
    if (pairs.length === 0) pairs.push({ key: "", value: "" });
    setAttributesEditor(pairs);
    setEditErrors({});
    setError("");
    setSuccessMessage("");
  };

  const validateEditForm = () => {
    const errors: Record<string, string> = {};
    if (!editForm.title.trim()) {
      errors.title = "Tên sản phẩm không được để trống";
    }
    const price = parseFloat(editForm.price);
    if (isNaN(price) || price <= 0) {
      errors.price = "Giá phải là số dương";
    }
    const stock = parseInt(editForm.stock);
    if (isNaN(stock) || stock < 0) {
      errors.stock = "Số lượng phải là số không âm";
    }
    setEditErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSaveEdit = async () => {
    if (!editingProduct || !token) return;
    
    if (!validateEditForm()) {
      return;
    }

    setSaving(true);
    setError("");
    setSuccessMessage("");
    try {
      const attributesObj: Record<string, any> = {};
      attributesEditor.forEach(({ key, value }) => {
        const k = key.trim();
        if (k) attributesObj[k] = value;
      });
      await updateSellerProduct(token, editingProduct.id, {
        title: editForm.title.trim(),
        price: parseFloat(editForm.price),
        stock: parseInt(editForm.stock),
        description: editForm.description.trim(),
        attributes: Object.keys(attributesObj).length ? attributesObj : undefined,
      });
      await loadProducts();
      setSuccessMessage("Cập nhật sản phẩm thành công!");
      setTimeout(() => {
        setEditingProduct(null);
        setSuccessMessage("");
      }, 1500);
    } catch (err: any) {
      setError(err.message || "Cập nhật sản phẩm thất bại");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (product_id: string) => {
    if (!token) return;
    if (!window.confirm("Bạn có chắc chắn muốn xóa sản phẩm này? Hành động này không thể hoàn tác.")) return;
    
    setDeleting(product_id);
    setError("");
    setSuccessMessage("");
    try {
      await deleteSellerProduct(token, product_id);
      setSuccessMessage("Xóa sản phẩm thành công!");
      await loadProducts();
      setTimeout(() => setSuccessMessage(""), 3000);
    } catch (err: any) {
      setError(err.message || "Xóa sản phẩm thất bại");
    } finally {
      setDeleting(null);
    }
  };

  // Tính toán thống kê
  const stats = {
    totalProducts: products.length,
    totalStock: products.reduce((sum, p) => sum + p.stock, 0),
    totalValue: products.reduce((sum, p) => sum + p.price * p.stock, 0),
    activeProducts: products.filter(p => p.status === "active" || !p.status).length,
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Đang tải dữ liệu...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 w-full overflow-x-hidden">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Seller Dashboard</h1>
              <p className="mt-1 text-sm text-gray-500">
                Chào mừng, <span className="font-semibold">{seller?.name || "Seller"}</span>
              </p>
            </div>
            <button
              onClick={() => navigate("/seller/upload")}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold shadow-lg transition-all transform hover:scale-105"
            >
              <Plus className="w-5 h-5" />
              Thêm Sản Phẩm
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-blue-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Tổng Sản Phẩm</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{stats.totalProducts}</p>
              </div>
              <Package className="w-12 h-12 text-blue-500" />
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-green-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Tổng Tồn Kho</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{stats.totalStock}</p>
              </div>
              <ShoppingBag className="w-12 h-12 text-green-500" />
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-yellow-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Giá Trị Kho</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">
                  {new Intl.NumberFormat("vi-VN", {
                    style: "currency",
                    currency: "VND",
                  }).format(stats.totalValue)}
                </p>
              </div>
              <DollarSign className="w-12 h-12 text-yellow-500" />
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-purple-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Đang Hoạt Động</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{stats.activeProducts}</p>
              </div>
              <TrendingUp className="w-12 h-12 text-purple-500" />
            </div>
          </div>
        </div>

        {/* Search and Filter */}
        <div className="bg-white rounded-xl shadow-md p-6 mb-8">
          <div className="flex items-center gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Tìm kiếm sản phẩm..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              />
            </div>
          </div>
        </div>

        {/* Messages */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6 flex items-center gap-2">
            <span className="font-semibold">❌</span>
            <span>{error}</span>
            <button
              onClick={() => setError("")}
              className="ml-auto text-red-500 hover:text-red-700 font-bold"
            >
              ×
            </button>
          </div>
        )}
        {successMessage && (
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg mb-6 flex items-center gap-2">
            <span className="font-semibold">✅</span>
            <span>{successMessage}</span>
            <button
              onClick={() => setSuccessMessage("")}
              className="ml-auto text-green-500 hover:text-green-700 font-bold"
            >
              ×
            </button>
          </div>
        )}

        {filteredProducts.length === 0 ? (
          <div className="bg-white rounded-xl shadow-md p-12 text-center">
            <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Chưa có sản phẩm</h3>
            <p className="text-gray-600 mb-6">Bắt đầu bằng cách thêm sản phẩm đầu tiên của bạn</p>
            <button
              onClick={() => navigate("/seller/upload")}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold inline-flex items-center gap-2"
            >
              <Plus className="w-5 h-5" />
              Thêm Sản Phẩm
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProducts.map((product) => (
              <div
                key={product.id}
                className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-xl transition-shadow"
              >
                {/* Product Image */}
                <div className="relative h-48 bg-gray-100">
                  {product.images && product.images.length > 0 ? (
                    <img
                      src={product.images[0]}
                      alt={product.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Package className="w-16 h-16 text-gray-400" />
                    </div>
                  )}
                  <div className="absolute top-2 right-2">
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                      product.status === "active" || !product.status
                        ? "bg-green-100 text-green-800"
                        : "bg-gray-100 text-gray-800"
                    }`}>
                      {product.status || "active"}
                    </span>
                  </div>
                </div>

                {/* Product Info */}
                <div className="p-5">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2">
                    {product.title}
                  </h3>
                  {product.description && (
                    <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                      {product.description}
                    </p>
                  )}

                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <p className="text-2xl font-bold text-blue-600">
                        {new Intl.NumberFormat("vi-VN", {
                          style: "currency",
                          currency: "VND",
                        }).format(product.price)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-600">Tồn kho</p>
                      <p className={`text-lg font-semibold ${
                        product.stock > 0 ? "text-green-600" : "text-red-600"
                      }`}>
                        {product.stock}
                      </p>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEdit(product)}
                      disabled={deleting === product.id}
                      className="flex-1 flex items-center justify-center gap-2 bg-blue-50 hover:bg-blue-100 text-blue-600 px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Edit2 className="w-4 h-4" />
                      Sửa
                    </button>
                    <button
                      onClick={() => handleDelete(product.id)}
                      disabled={deleting === product.id}
                      className="flex-1 flex items-center justify-center gap-2 bg-red-50 hover:bg-red-100 text-red-600 px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {deleting === product.id ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-600"></div>
                          Đang xóa...
                        </>
                      ) : (
                        <>
                          <Trash2 className="w-4 h-4" />
                          Xóa
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Edit Modal */}
      {editingProduct && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Sửa Sản Phẩm</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tên Sản Phẩm <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={editForm.title}
                  onChange={(e) => {
                    setEditForm({ ...editForm, title: e.target.value });
                    if (editErrors.title) setEditErrors({ ...editErrors, title: "" });
                  }}
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none ${
                    editErrors.title ? "border-red-300 bg-red-50" : "border-gray-300"
                  }`}
                />
                {editErrors.title && (
                  <p className="mt-1 text-sm text-red-600">{editErrors.title}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Giá (VND) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={editForm.price}
                  onChange={(e) => {
                    setEditForm({ ...editForm, price: e.target.value });
                    if (editErrors.price) setEditErrors({ ...editErrors, price: "" });
                  }}
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none ${
                    editErrors.price ? "border-red-300 bg-red-50" : "border-gray-300"
                  }`}
                />
                {editErrors.price && (
                  <p className="mt-1 text-sm text-red-600">{editErrors.price}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Số Lượng <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  min="0"
                  value={editForm.stock}
                  onChange={(e) => {
                    setEditForm({ ...editForm, stock: e.target.value });
                    if (editErrors.stock) setEditErrors({ ...editErrors, stock: "" });
                  }}
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none ${
                    editErrors.stock ? "border-red-300 bg-red-50" : "border-gray-300"
                  }`}
                />
                {editErrors.stock && (
                  <p className="mt-1 text-sm text-red-600">{editErrors.stock}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Mô Tả
                </label>
                <textarea
                  value={editForm.description}
                  onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                />
              </div>

              {/* Chi tiết sản phẩm (Attributes) */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-gray-700">Chi Tiết Sản Phẩm</label>
                  <button
                    type="button"
                    onClick={() => setAttributesEditor([...attributesEditor, { key: "", value: "" }])}
                    className="text-sm px-2 py-1 border rounded hover:bg-gray-50"
                  >
                    Thêm dòng
                  </button>
                </div>
                <div className="space-y-2">
                  {attributesEditor.map((pair, idx) => (
                    <div key={idx} className="flex gap-2">
                      <input
                        type="text"
                        placeholder="Thuộc tính (vd: Màu sắc)"
                        value={pair.key}
                        onChange={(e) => {
                          const next = [...attributesEditor];
                          next[idx] = { ...next[idx], key: e.target.value };
                          setAttributesEditor(next);
                        }}
                        className="flex-1 px-3 py-2 border rounded"
                      />
                      <input
                        type="text"
                        placeholder="Giá trị (vd: Đỏ)"
                        value={pair.value}
                        onChange={(e) => {
                          const next = [...attributesEditor];
                          next[idx] = { ...next[idx], value: e.target.value };
                          setAttributesEditor(next);
                        }}
                        className="flex-1 px-3 py-2 border rounded"
                      />
                      <button
                        type="button"
                        onClick={() => setAttributesEditor(attributesEditor.filter((_, i) => i !== idx))}
                        className="px-2 py-1 border rounded text-red-600 hover:bg-red-50"
                      >
                        Xóa
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => {
                  setEditingProduct(null);
                  setEditErrors({});
                  setError("");
                  setSuccessMessage("");
                }}
                disabled={saving}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Hủy
              </button>
              <button
                onClick={handleSaveEdit}
                disabled={saving}
                className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {saving ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Đang lưu...
                  </>
                ) : (
                  "Lưu"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
