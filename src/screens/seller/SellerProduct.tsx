import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  fetchSellerProducts,
  updateSellerProduct,
  deleteSellerProduct,
} from "../../api/sellerapi/sellerProducts";
import { useSellerAuthStore } from "../../store/SellerAuth";
import { Package, Search, Plus, Edit2, Trash2 } from "lucide-react";

interface Product {
  id: string;
  title: string;
  description?: string;
  price: number;
  stock: number;
  images: string[];
  status?: string;
  attributes?: Record<string, any>;
}

const currencyFormatter = new Intl.NumberFormat("vi-VN", {
  style: "currency",
  currency: "VND",
  maximumFractionDigits: 0,
});

const formatCurrency = (value: number) =>
  currencyFormatter.format(Math.max(0, Math.round(value || 0)));

export const SellerProduct = () => {
  const navigate = useNavigate();
  const { token, seller } = useSellerAuthStore();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [rawColumnFilters, setRawColumnFilters] = useState({
    title: "",
    status: "all",
    minPrice: "",
    maxPrice: "",
    minStock: "",
    maxStock: "",
  });
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [editForm, setEditForm] = useState({
    title: "",
    price: "",
    stock: "",
    description: "",
  });
  const [attributesEditor, setAttributesEditor] = useState<
    Array<{ key: string; value: string }>
  >([]);
  const [editErrors, setEditErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const debouncedColumnFilters = useDebouncedValue(rawColumnFilters, 200);

  useEffect(() => {
    if (!token) {
      navigate("/seller/login");
      return;
    }
    loadProducts();
  }, [token, navigate]);

  const loadProducts = async () => {
    if (!token) return;
    try {
      setLoading(true);
      const data = await fetchSellerProducts(token);
      setProducts(data.products || []);
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
    const stock = parseInt(editForm.stock, 10);
    if (isNaN(stock) || stock < 0) {
      errors.stock = "Số lượng phải là số không âm";
    }
    setEditErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSaveEdit = async () => {
    if (!editingProduct || !token) return;
    if (!validateEditForm()) return;

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
        stock: parseInt(editForm.stock, 10),
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

  const handleToggleVisibility = async (product: Product) => {
    if (!token) return;
    const nextStatus = product.status === "inactive" ? "active" : "inactive";
    setTogglingId(product.id);
    setError("");
    setSuccessMessage("");
    try {
      await updateSellerProduct(token, product.id, { status: nextStatus });
      await loadProducts();
    } catch (err: any) {
      setError(err.message || "Không thể cập nhật trạng thái sản phẩm");
    } finally {
      setTogglingId(null);
    }
  };

  const handleDelete = async (productId: string) => {
    if (!token) return;
    if (
      !window.confirm("Bạn có chắc chắn muốn xóa sản phẩm này? Hành động này không thể hoàn tác.")
    )
      return;

    setDeleting(productId);
    setError("");
    setSuccessMessage("");
    try {
      await deleteSellerProduct(token, productId);
      setSuccessMessage("Xóa sản phẩm thành công!");
      await loadProducts();
      setTimeout(() => setSuccessMessage(""), 3000);
    } catch (err: any) {
      setError(err.message || "Xóa sản phẩm thất bại");
    } finally {
      setDeleting(null);
    }
  };

  const filteredProducts = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();
    const parsedFilters = {
      minPrice: debouncedColumnFilters.minPrice ? Number(debouncedColumnFilters.minPrice) : null,
      maxPrice: debouncedColumnFilters.maxPrice ? Number(debouncedColumnFilters.maxPrice) : null,
      minStock: debouncedColumnFilters.minStock ? Number(debouncedColumnFilters.minStock) : null,
      maxStock: debouncedColumnFilters.maxStock ? Number(debouncedColumnFilters.maxStock) : null,
    };

    return products.filter((product) => {
      if (
        normalizedSearch &&
        !(
          product.title.toLowerCase().includes(normalizedSearch) ||
          product.description?.toLowerCase().includes(normalizedSearch)
        )
      ) {
        return false;
      }
      if (
        debouncedColumnFilters.title.trim() &&
        !product.title.toLowerCase().includes(debouncedColumnFilters.title.trim().toLowerCase())
      ) {
        return false;
      }
      if (
        debouncedColumnFilters.status !== "all" &&
        (product.status || "active") !== debouncedColumnFilters.status
      ) {
        return false;
      }
      if (parsedFilters.minPrice !== null && product.price < parsedFilters.minPrice) return false;
      if (parsedFilters.maxPrice !== null && product.price > parsedFilters.maxPrice) return false;
      if (parsedFilters.minStock !== null && product.stock < parsedFilters.minStock) return false;
      if (parsedFilters.maxStock !== null && product.stock > parsedFilters.maxStock) return false;
      return true;
    });
  }, [products, searchTerm, debouncedColumnFilters]);

  const productStats = useMemo(
    () => ({
      totalProducts: products.length,
      totalStock: products.reduce((sum, p) => sum + p.stock, 0),
      totalValue: products.reduce((sum, p) => sum + p.price * p.stock, 0),
      activeProducts: products.filter((p) => p.status === "active" || !p.status).length,
    }),
    [products]
  );

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Đang tải sản phẩm...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 w-full overflow-x-hidden">
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl  sm:px-3 lg:px-8 py-2">
          <div className="flex flex-col gap-1 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-sm uppercase text-gray-500">Quản lý sản phẩm</p>
              
            </div>
            <div className="flex flex-wrap gap-2">
                <button
                    onClick={() => navigate("/seller/upload")}
                    className="flex items-center gap-1 bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-md font-semibold shadow-sm text-sm"
                >
                    <Plus className="w-3 h-3" />
                    Thêm sản phẩm
                </button>
                <button
                    onClick={() => loadProducts()}
                    className="px-3 py-2 rounded-md border border-gray-200 text-gray-700 hover:bg-gray-50 font-semibold text-sm"
                >
                    Làm mới
                </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: "Tổng sản phẩm", value: productStats.totalProducts },
            { label: "Tổng tồn kho", value: productStats.totalStock },
            { label: "Giá trị kho", value: formatCurrency(productStats.totalValue) },
            { label: "Đang hoạt động", value: productStats.activeProducts },
          ].map((card) => (
            <div key={card.label} className="bg-white rounded-lg shadow-sm p-2 border border-gray-100">
              <p className="text-xs text-gray-500">{card.label}</p>
              <p className="text-2xl font-bold text-gray-900 mt-2">{card.value}</p>
            </div>
          ))}
        </div>

        <div className=" rounded-xl shadow-md  border border-gray-100">
          <div className="flex flex-col gap-3 md:flex-row md:items-center">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Tìm nhanh theo tên hoặc mô tả..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              />
            </div>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center gap-2">
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
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg flex items-center gap-2">
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
          <div className="bg-white rounded-2xl shadow-md border border-gray-100 overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-100">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left align-top">
                    <div className="space-y-2">
                      <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                        Sản phẩm
                      </span>
                      <input
                        type="text"
                        value={rawColumnFilters.title}
                        onChange={(e) =>
                          setRawColumnFilters((prev) => ({ ...prev, title: e.target.value }))
                        }
                        className="w-full rounded-lg border border-gray-300 px-2 py-1 text-sm"
                        placeholder="Lọc theo tên"
                      />
                    </div>
                  </th>
                  <th className="px-4 py-3 text-left align-top">
                    <div className="space-y-2">
                      <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                        Giá (VND)
                      </span>
                      <div className="flex gap-2">
                        <input
                          type="number"
                          value={rawColumnFilters.minPrice}
                          onChange={(e) =>
                            setRawColumnFilters((prev) => ({ ...prev, minPrice: e.target.value }))
                          }
                          className="w-full rounded-lg border border-gray-300 px-2 py-1 text-sm"
                          placeholder="Từ"
                        />
                        <input
                          type="number"
                          value={rawColumnFilters.maxPrice}
                          onChange={(e) =>
                            setRawColumnFilters((prev) => ({ ...prev, maxPrice: e.target.value }))
                          }
                          className="w-full rounded-lg border border-gray-300 px-2 py-1 text-sm"
                          placeholder="Đến"
                        />
                      </div>
                    </div>
                  </th>
                  <th className="px-4 py-3 text-left align-top">
                    <div className="space-y-2">
                      <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                        Tồn kho
                      </span>
                      <div className="flex gap-2">
                        <input
                          type="number"
                          value={rawColumnFilters.minStock}
                          onChange={(e) =>
                            setRawColumnFilters((prev) => ({ ...prev, minStock: e.target.value }))
                          }
                          className="w-full rounded-lg border border-gray-300 px-2 py-1 text-sm"
                          placeholder="Từ"
                        />
                        <input
                          type="number"
                          value={rawColumnFilters.maxStock}
                          onChange={(e) =>
                            setRawColumnFilters((prev) => ({ ...prev, maxStock: e.target.value }))
                          }
                          className="w-full rounded-lg border border-gray-300 px-2 py-1 text-sm"
                          placeholder="Đến"
                        />
                      </div>
                    </div>
                  </th>
                  <th className="px-4 py-3 text-left align-top">
                    <div className="space-y-2">
                      <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                        Trạng thái
                      </span>
                      <select
                        value={rawColumnFilters.status}
                        onChange={(e) =>
                          setRawColumnFilters((prev) => ({ ...prev, status: e.target.value }))
                        }
                        className="w-full rounded-lg border border-gray-300 px-2 py-1 text-sm bg-white"
                      >
                        <option value="all">Tất cả</option>
                        <option value="active">Đang bán</option>
                        <option value="inactive">Đã ẩn</option>
                      </select>
                    </div>
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    Hành động nhanh
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredProducts.map((product) => (
                  <tr key={product.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-4">
                      <div className="flex items-start gap-3">
                        <div className="w-16 h-16 rounded-lg bg-gray-100 overflow-hidden flex-shrink-0">
                          {product.images?.[0] ? (
                            <img
                              src={product.images[0]}
                              alt={product.title}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-400">
                              <Package className="w-6 h-6" />
                            </div>
                          )}
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900">{product.title}</p>
                          <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                            {product.description || "Chưa có mô tả"}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <p className="text-base font-semibold text-blue-600">
                        {formatCurrency(product.price)}
                      </p>
                    </td>
                    <td className="px-4 py-4">
                      <p
                        className={`text-base font-semibold ${
                          product.stock > 0 ? "text-green-600" : "text-red-600"
                        }`}
                      >
                        {product.stock}
                      </p>
                    </td>
                    <td className="px-4 py-4">
                      <span
                        className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold ${
                          product.status === "inactive"
                            ? "bg-gray-100 text-gray-700"
                            : "bg-green-100 text-green-700"
                        }`}
                      >
                        <span
                          className={`w-2 h-2 rounded-full ${
                            product.status === "inactive" ? "bg-gray-500" : "bg-green-500"
                          }`}
                        ></span>
                        {product.status === "inactive" ? "Đã ẩn" : "Đang bán"}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex flex-wrap gap-2">
                        <button
                          onClick={() => handleEdit(product)}
                          className="flex items-center gap-2 rounded-lg border border-blue-200 px-3 py-1.5 text-sm font-semibold text-blue-600 hover:bg-blue-50"
                        >
                          <Edit2 className="w-4 h-4" />
                          Sửa nhanh
                        </button>
                        <button
                          onClick={() => handleToggleVisibility(product)}
                          disabled={togglingId === product.id}
                          className="flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-1.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                        >
                          {togglingId === product.id ? (
                            <>
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600"></div>
                              Đang cập nhật...
                            </>
                          ) : (
                            <>{product.status === "inactive" ? "Hiển thị" : "Ẩn nhanh"}</>
                          )}
                        </button>
                        <button
                          onClick={() => handleDelete(product.id)}
                          disabled={deleting === product.id}
                          className="flex items-center gap-2 rounded-lg border border-red-200 px-3 py-1.5 text-sm font-semibold text-red-600 hover:bg-red-50 disabled:opacity-50"
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
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

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
                <label className="block text-sm font-medium text-gray-700 mb-2">Mô Tả</label>
                <textarea
                  value={editForm.description}
                  onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                />
              </div>
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
                    <div key={`${pair.key}-${idx}`} className="flex gap-2">
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
                        onClick={() =>
                          setAttributesEditor(attributesEditor.filter((_, i) => i !== idx))
                        }
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

function useDebouncedValue<T>(value: T, delay = 200) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const handler = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debounced;
}
