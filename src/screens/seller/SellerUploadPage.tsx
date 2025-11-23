import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { uploadSellerImage, getCategoryTree, getCategoryAttributes } from "../../api/sellerapi/sellerProducts";
import { useSellerAuthStore } from "../../store/SellerAuth";

export const SellerUploadPage = () => {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [discount, setDiscount] = useState<number | "">("");
  const [rating, setRating] = useState<number | "">("");
  const [tags, setTags] = useState("");
  const [price, setPrice] = useState<number | "">("");
  const [stock, setStock] = useState<number | "">("");
  const [images, setImages] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState("");
  const [categories, setCategories] = useState<any[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>("");
  const [attributeSchema, setAttributeSchema] = useState<{ fields: Array<{ key: string; label: string; type: string; required?: boolean }> } | null>(null);
  const [attributes, setAttributes] = useState<Record<string, any>>({});
  const navigate = useNavigate();

  // Load category tree
  React.useEffect(() => {
    (async () => {
      try {
        const data = await getCategoryTree();
        setCategories(data.categories || []);
      } catch {}
    })();
  }, []);

  // Load attribute schema when category changes
  React.useEffect(() => {
    (async () => {
      if (!selectedCategoryId) { setAttributeSchema(null); setAttributes({}); return; }
      try {
        const data = await getCategoryAttributes(selectedCategoryId);
        setAttributeSchema(data.attributes);
        const initial: Record<string, any> = {};
        data.attributes?.fields?.forEach((f: any) => { initial[f.key] = ""; });
        setAttributes(initial);
      } catch {}
    })();
  }, [selectedCategoryId]);

  // 🖼 Khi chọn thêm ảnh
  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;

    const newFiles = Array.from(e.target.files);
    const newPreviews = newFiles.map((file) => URL.createObjectURL(file));

    // ✅ Cộng thêm ảnh, không ghi đè
    setImages((prev) => [...prev, ...newFiles]);
    setPreviewUrls((prev) => [...prev, ...newPreviews]);
  };

  // ❌ Xóa ảnh đã chọn
  const handleRemoveImage = (index: number) => {
    const updatedImages = [...images];
    const updatedPreviews = [...previewUrls];
    updatedImages.splice(index, 1);
    updatedPreviews.splice(index, 1);

    setImages(updatedImages);
    setPreviewUrls(updatedPreviews);
  };

  // 🚀 Submit form
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage("");

    if (!title || !price || !stock || images.length === 0) {
      setMessage("Vui lòng nhập đủ thông tin và chọn ít nhất 1 ảnh");
      return;
    }
    if (!selectedCategoryId) {
      setMessage("Vui lòng chọn ngành hàng");
      return;
    }

    const token = useSellerAuthStore.getState().token;
    if (!token) {
      setMessage("Bạn chưa đăng nhập");
      return;
    }

    setUploading(true);
    try {
      // Upload tất cả ảnh song song
      const uploadPromises = images.map((file) => uploadSellerImage(file));
      const imageUrls = await Promise.all(uploadPromises);

      // Gửi yêu cầu tạo sản phẩm
      const res = await fetch(
        `${import.meta.env.VITE_API_URL || "http://localhost:4000/api"}/seller/product`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            title,
            description,
            price,
            stock,
            categoryId: selectedCategoryId,
            attributes,
            discount,
            rating,
            tags,
            images: imageUrls, // ✅ gửi mảng nhiều ảnh
          }),
        }
      );

      const data = await res.json();
      if (data.error) {
        setMessage(`Lỗi: ${data.error}`);
      } else {
        setMessage("Tải sản phẩm thành công!");
        // Reset form
        setTitle("");
        setDescription("");
        setRating("");
        setTags("");
        setDiscount("");
        setPrice("");
        setStock("");
        setImages([]);
        setPreviewUrls([]);
        setSelectedCategoryId("");
        setAttributes({});
      }
    } catch (err: any) {
      console.error(err);
      setMessage(err.message || "Server error screens/seller/SellerUploadPage");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f5f5f5] w-full overflow-x-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 grid grid-cols-12 gap-6">
        

        {/* Form */}
        <section className="col-span-12 md:col-span-9 lg:col-span-9">
          <div className="bg-white border rounded-lg p-0">
            <div className="border-b px-6 py-4">
              <h1 className="text-xl font-bold">Thêm 1 sản phẩm mới</h1>
            </div>

            <form onSubmit={handleSubmit} className="divide-y">
              {/* Thông tin cơ bản */}
              <div className="p-6 space-y-4">
                <h2 className="font-semibold text-gray-900">Thông tin cơ bản</h2>
                {/* Ngành hàng */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Ngành hàng</label>
                  <select
                    value={selectedCategoryId}
                    onChange={(e) => setSelectedCategoryId(e.target.value)}
                    className="w-full px-3 py-2 border rounded"
                  >
                    <option value="">Chọn ngành hàng</option>
                    {categories.map((c) => (
                      <optgroup key={c.id} label={c.name}>
                        {c.children?.length ? c.children.map((c2: any) => (
                          <>
                            <option key={c2.id} value={c2.id}>{c2.name}</option>
                            {c2.children?.length ? c2.children.map((c3: any) => (
                              <option key={c3.id} value={c3.id}>└ {c3.name}</option>
                            )) : null}
                          </>
                        )) : (
                          <option value={c.id}>{c.name}</option>
                        )}
                      </optgroup>
                    ))}
                  </select>
                  {categories.length === 0 && (
                    <p className="text-xs text-gray-500 mt-1">Chưa có dữ liệu danh mục. Vui lòng chạy seed danh mục trong backend rồi tải lại trang.</p>
                  )}
                </div>
                {/* Ảnh sản phẩm */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Hình ảnh sản phẩm</label>
                  <div className="flex items-start gap-4">
                    <div>
                      <input
                        type="file"
                        multiple
                        accept="image/*"
                        onChange={handleImageSelect}
                        className="block text-sm text-gray-600"
                      />
                      <p className="text-xs text-gray-500 mt-1">Tối thiểu 1 ảnh. Tỉ lệ 1:1 khuyến nghị.</p>
                    </div>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-3">
                    {previewUrls.map((url, index) => (
                      <div key={index} className="relative">
                        <img src={url} alt={`preview-${index}`} className="w-24 h-24 object-cover rounded border" />
                        <button
                          type="button"
                          onClick={() => handleRemoveImage(index)}
                          className="absolute -top-2 -right-2 bg-red-500 text-white w-6 h-6 rounded-full text-xs"
                          aria-label="remove"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Tên & mô tả */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Tên sản phẩm</label>
                    <input
                      type="text"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      className="w-full px-3 py-2 border rounded"
                      placeholder="Tên sản phẩm + Thương hiệu + Mẫu + Thông số"
                      required
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Mô tả sản phẩm</label>
                    <textarea
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      rows={5}
                      className="w-full px-3 py-2 border rounded"
                      placeholder="Mô tả chi tiết, chất liệu, kích thước..."
                    />
                  </div>
                </div>
                {/* Thuộc tính theo ngành */}
                {attributeSchema && attributeSchema.fields?.length > 0 && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {attributeSchema.fields.map((f) => (
                      <div key={f.key}>
                        <label className="block text-sm font-medium text-gray-700 mb-1">{f.label}{f.required ? ' *' : ''}</label>
                        <input
                          type={f.type === 'number' ? 'number' : 'text'}
                          value={attributes[f.key] ?? ''}
                          onChange={(e) => setAttributes({ ...attributes, [f.key]: e.target.value })}
                          className="w-full px-3 py-2 border rounded"
                        />
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Thông tin bán hàng */}
              <div className="p-6 space-y-4">
                <h2 className="font-semibold text-gray-900">Thông tin bán hàng</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Giá</label>
                    <input
                      type="number"
                      value={price}
                      onChange={(e) => setPrice(Number(e.target.value))}
                      className="w-full px-3 py-2 border rounded"
                      placeholder="0"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Kho hàng</label>
                    <input
                      type="number"
                      value={stock}
                      onChange={(e) => setStock(Number(e.target.value))}
                      className="w-full px-3 py-2 border rounded"
                      placeholder="0"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Hành động */}
              <div className="p-6 flex items-center justify-end gap-3 bg-gray-50">
                {message && <p className="text-sm text-red-600 mr-auto">{message}</p>}
                <button
                  type="button"
                  onClick={() => navigate(-1)}
                  className="px-4 py-2 border rounded bg-white hover:bg-gray-50"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded bg-[#ee4d2d] text-white hover:bg-[#d63d20]"
                  disabled={uploading}
                >
                  {uploading ? "Đang lưu..." : "Lưu & Hiển thị"}
                </button>
              </div>
            </form>
          </div>
        </section>
      </div>
    </div>
  );
};
