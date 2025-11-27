import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { uploadSellerImage, getCategoryTree, getCategoryAttributes, getSellerProductById } from "../../api/sellerapi/sellerProducts";
import { useSellerAuthStore } from "../../store/SellerAuth";

// Sửa type DescriptionBlock để hỗ trợ cả string và File
type DescriptionBlock = { 
  type: "text" | "image"; 
  content: string | File 
};

type Variant = { 
  title: string; 
  price: number | ""; 
  stock: number | ""; 
  imageFile?: File; 
  imageUrl?: string 
};

interface Product {
  id: string;
  title: string;
  description: DescriptionBlock[];
  price: number;
  stock: number;
  images: string[];
  status?: string;
  attributes?: Record<string, any>;
  discount?: number;
  rating?: number;
  tags?: string;
  categoryId?: string;
  variants?: Variant[];
}

export const SellerUploadPage = () => {
  const [searchParams] = useSearchParams();
  const editProductId = searchParams.get('edit');
  const isEditMode = Boolean(editProductId);
  
  const [title, setTitle] = useState("");
  const [descriptionBlocks, setDescriptionBlocks] = useState<DescriptionBlock[]>([{ type: "text", content: "" }]);
  const [discount, setDiscount] = useState<number | "">("");
  const [rating, setRating] = useState<number | "">("");
  const [tags, setTags] = useState("");
  const [price, setPrice] = useState<number | "">("");
  const [stock, setStock] = useState<number | "">("");
  const [images, setImages] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const [variants, setVariants] = useState<Variant[]>([]);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState("");
  const [categories, setCategories] = useState<any[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>("");
  const [attributeSchema, setAttributeSchema] = useState<{ fields: Array<{ key: string; label: string; type: string; required?: boolean }> } | null>(null);
  const [attributes, setAttributes] = useState<Record<string, any>>({});
  const [loadingProduct, setLoadingProduct] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  
  const navigate = useNavigate();
  const { token } = useSellerAuthStore();

  // Load category tree
  useEffect(() => {
    (async () => {
      try {
        const data = await getCategoryTree();
        setCategories(data.categories || []);
      } catch {}
    })();
  }, []);

  // Load product data khi ở chế độ edit
  useEffect(() => {
    if (isEditMode && editProductId && token) {
      loadProductForEdit(editProductId);
    }
  }, [isEditMode, editProductId, token]);

  // Load attribute schema khi category thay đổi
  useEffect(() => {
    (async () => {
      if (!selectedCategoryId) { setAttributeSchema(null); setAttributes({}); return; }
      try {
        const data = await getCategoryAttributes(selectedCategoryId);
        setAttributeSchema(data.attributes);
        const initial: Record<string, any> = {};
        data.attributes?.fields?.forEach((f: any) => { initial[f.key] = attributes[f.key] || ""; });
        setAttributes(initial);
      } catch {}
    })();
  }, [selectedCategoryId]);

const loadProductForEdit = async (productId: string) => {
  try {
    setLoadingProduct(true);
    const response = await getSellerProductById(token!, productId);
    const product = response.product;
    
    console.log('Product data:', product);
    console.log('Variants data:', product.variants);
    console.log('Product variants from API:', product.product_variant); // Kiểm tra cả trường này
    
    setEditingProduct(product);
    
    // Điền dữ liệu vào form
    setTitle(product.title || "");
    setDescriptionBlocks(product.description || [{ type: "text", content: "" }]);
    setPrice(product.price || "");
    setStock(product.stock || "");
    setDiscount(product.discount || "");
    setRating(product.rating || "");
    setTags(product.tags || "");
    setSelectedCategoryId(product.categoryId || "");
    setAttributes(product.attributes || {});
    
    // Xử lý variants - kiểm tra cả 2 trường có thể có
    let variantsData = product.variants || product.product_variant || [];
    console.log('Final variants data to set:', variantsData);
    
    if (variantsData.length > 0) {
      const formattedVariants: Variant[] = variantsData.map((v: any) => ({
        title: v.title || "",
        price: v.price || "",
        stock: v.stock || "",
        imageUrl: v.image || v.imageUrl || ""
      }));
      setVariants(formattedVariants);
    } else {
      setVariants([]);
    }
    
    // Xử lý images - chỉ set previewUrls
    setPreviewUrls(product.images || []);
    
    setMessage("Đã tải thông tin sản phẩm thành công!");
    
  } catch (err: any) {
    console.error('Failed to load product for edit:', err);
    setMessage(err.message || "Không thể tải thông tin sản phẩm");
  } finally {
    setLoadingProduct(false);
  }
};

  // Các hàm xử lý khác
  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const newFiles = Array.from(e.target.files);
    const newPreviews = newFiles.map((file) => URL.createObjectURL(file));
    setImages((prev) => [...prev, ...newFiles]);
    setPreviewUrls((prev) => [...prev, ...newPreviews]);
  };

  const handleRemoveImage = (index: number) => {
    const updatedImages = [...images];
    const updatedPreviews = [...previewUrls];
    updatedImages.splice(index, 1);
    updatedPreviews.splice(index, 1);
    setImages(updatedImages);
    setPreviewUrls(updatedPreviews);
  };

  const addTextBlock = () => setDescriptionBlocks(prev => [...prev, { type: "text", content: "" }]);
  
  // Sửa hàm addImageBlock để phù hợp với type mới
  const addImageBlock = (file: File) => {
    setDescriptionBlocks(prev => [...prev, { type: "image", content: file }]);
  };
  
  const removeDescriptionBlock = (index: number) => setDescriptionBlocks(prev => prev.filter((_, i) => i !== index));
  
  const updateTextBlock = (index: number, text: string) => 
    setDescriptionBlocks(prev => prev.map((b,i) => i===index?{...b, content:text}:b));

  const addVariant = () => setVariants(prev => [...prev, { title: "", price: "", stock: "" }]);
  const removeVariant = (index: number) => setVariants(prev => prev.filter((_, i) => i !== index));
  const updateVariant = (index: number, key: keyof Variant, value: any) =>
    setVariants(prev => prev.map((v,i)=>i===index?{...v,[key]:value}:v));

  const uploadBlockImages = async () => {
    const newBlocks: DescriptionBlock[] = await Promise.all(
      descriptionBlocks.map(async (block) => {
        if (block.type === "image" && block.content instanceof File) {
          const url = await uploadSellerImage(block.content);
          return { type: "image" as const, content: url };
        }
        return block;
      })
    );
    setDescriptionBlocks(newBlocks);
    return newBlocks;
  };

  const uploadVariantImages = async () => {
    return await Promise.all(variants.map(async v => {
      let imageUrl = v.imageUrl;
      if (v.imageFile) imageUrl = await uploadSellerImage(v.imageFile);
      return { 
        title: v.title, 
        price: v.price || 0, 
        stock: v.stock || 0, 
        image: imageUrl 
      };
    }));
  };

  // Cập nhật hàm submit để xử lý cả create và update
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage("");

    if (!title || (images.length === 0 && previewUrls.length === 0)) {
      setMessage("Vui lòng nhập tiêu đề và chọn ảnh chính");
      return;
    }
    if (!selectedCategoryId) {
      setMessage("Vui lòng chọn ngành hàng");
      return;
    }

    if (!token) {
      setMessage("Bạn chưa đăng nhập");
      return;
    }

    setUploading(true);
    try {
      // Upload main images - xử lý cả ảnh mới và ảnh cũ
      let mainImageUrls: string[] = [];
      if (isEditMode && images.length === 0) {
        // Nếu là chế độ sửa và không có ảnh mới, dùng ảnh cũ
        mainImageUrls = previewUrls;
      } else {
        // Ngược lại, upload ảnh mới
        mainImageUrls = await Promise.all(images.map(f => uploadSellerImage(f)));
      }

      // Upload description images
      const uploadedDescription = await uploadBlockImages();

      // Upload variant images
      const uploadedVariants = await uploadVariantImages();

      // Chuẩn bị dữ liệu
      const productData = {
        title,
        description: uploadedDescription,
        images: mainImageUrls,
        price: price ? Number(price) : undefined,
        stock: stock ? Number(stock) : undefined,
        categoryId: selectedCategoryId,
        attributes,
        discount: discount ? Number(discount) : undefined,
        rating: rating ? Number(rating) : undefined,
        tags,
        variants: uploadedVariants
      };

      let res;
      if (isEditMode && editingProduct) {
        // Cập nhật sản phẩm
        res = await fetch(`${import.meta.env.VITE_API_URL || "http://localhost:4000/api"}/seller/product/${editingProduct.id}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify(productData)
        });
      } else {
        // Tạo sản phẩm mới
        res = await fetch(`${import.meta.env.VITE_API_URL || "http://localhost:4000/api"}/seller/product`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify(productData)
        });
      }

      const data = await res.json();
      if (data.error) setMessage(`Lỗi: ${data.error}`);
      else {
        setMessage(isEditMode ? "Cập nhật sản phẩm thành công!" : "Tải sản phẩm thành công!");
        
        // Reset form nếu là tạo mới
        if (!isEditMode) {
          resetForm();
        }
        
        // Chuyển hướng sau 2 giây nếu là tạo mới
        setTimeout(() => {
          if (!isEditMode) {
            navigate("/seller/products");
          }
        }, 2000);
      }
    } catch (err: any) {
      console.error(err);
      setMessage(err.message || "Lỗi server");
    } finally {
      setUploading(false);
    }
  };

  const resetForm = () => {
    setTitle("");
    setDescriptionBlocks([{ type: "text", content: "" }]);
    setImages([]);
    setPreviewUrls([]);
    setVariants([]);
    setAttributes({});
    setSelectedCategoryId("");
    setDiscount("");
    setPrice("");
    setStock("");
    setRating("");
    setTags("");
  };

  // Thêm hàm để hiển thị nội dung description block
  const renderDescriptionContent = (block: DescriptionBlock) => {
    if (block.type === "text") {
      return block.content as string;
    } else {
      // Nếu là ảnh, hiển thị object URL nếu là File, hoặc string URL nếu là string
      if (block.content instanceof File) {
        return URL.createObjectURL(block.content);
      } else {
        return block.content as string;
      }
    }
  };

  // Thêm loading state
  if (loadingProduct) {
    return (
      <div className="min-h-screen bg-[#f5f5f5] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Đang tải thông tin sản phẩm...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f5f5f5] w-full overflow-x-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 grid grid-cols-12 gap-6">
        <section className="col-span-12 md:col-span-9 lg:col-span-9">
          <div className="bg-white border rounded-lg p-0">
            <div className="border-b px-6 py-4">
              <h1 className="text-xl font-bold">
                {isEditMode ? "Chỉnh sửa sản phẩm" : "Thêm 1 sản phẩm mới"}
              </h1>
              {isEditMode && editingProduct && (
                <p className="text-sm text-gray-600 mt-1">
                  Đang chỉnh sửa: {editingProduct.title}
                </p>
              )}
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
                          <React.Fragment key={c2.id}>
                            <option value={c2.id}>{c2.name}</option>
                            {c2.children?.length ? c2.children.map((c3: any) => (
                              <option key={c3.id} value={c3.id}>└ {c3.name}</option>
                            )) : null}
                          </React.Fragment>
                        )) : (
                          <option value={c.id}>{c.name}</option>
                        )}
                      </optgroup>
                    ))}
                  </select>
                  {categories.length===0 && (
                    <p className="text-xs text-gray-500 mt-1">Chưa có dữ liệu danh mục. Vui lòng chạy seed danh mục.</p>
                  )}
                </div>

                {/* Ảnh sản phẩm */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Hình ảnh sản phẩm</label>
                  <input type="file" multiple accept="image/*" onChange={handleImageSelect} className="block text-sm text-gray-600" />
                  <p className="text-xs text-gray-500 mt-1">
                    {isEditMode ? "Chọn ảnh mới để thay thế ảnh hiện tại" : "Tối thiểu 1 ảnh. Tỉ lệ 1:1 khuyến nghị."}
                  </p>
                  <div className="mt-3 flex flex-wrap gap-3">
                    {previewUrls.map((url, index) => (
                      <div key={index} className="relative">
                        <img src={url} alt={`preview-${index}`} className="w-24 h-24 object-cover rounded border" />
                        <button type="button" onClick={() => handleRemoveImage(index)} className="absolute -top-2 -right-2 bg-red-500 text-white w-6 h-6 rounded-full text-xs">×</button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Tên & Mô tả */}
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

                  {/* Description Editor */}
                  <div className="col-span-2 space-y-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Mô tả sản phẩm</label>
                    {descriptionBlocks.map((b, i) => (
                      <div key={i} className="flex gap-2 items-center">
                        {b.type === "text" ? (
                          <textarea
                            value={b.content as string}
                            onChange={e => updateTextBlock(i, e.target.value)}
                            rows={3}
                            className="w-full px-3 py-2 border rounded"
                            placeholder="Nhập nội dung..."
                          />
                        ) : (
                          <div className="relative">
                            <img 
                              src={renderDescriptionContent(b)} 
                              className="w-32 h-32 object-cover border rounded"
                              alt="description"
                            />
                          </div>
                        )}
                        <button type="button" onClick={() => removeDescriptionBlock(i)} className="px-2 py-1 bg-red-500 text-white rounded">Xóa</button>
                      </div>
                    ))}
                    <div className="flex gap-2 mt-2">
                      <button type="button" onClick={addTextBlock} className="px-3 py-1 bg-blue-500 text-white rounded">Thêm Text</button>
                      <input 
                        type="file" 
                        accept="image/*" 
                        onChange={e => e.target.files && addImageBlock(e.target.files[0])} 
                        className="px-3 py-1 bg-green-500 text-white rounded cursor-pointer"
                      />
                    </div>
                  </div>
                </div>

                {/* Thuộc tính theo ngành */}
                {attributeSchema && attributeSchema.fields?.length > 0 && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {attributeSchema.fields.map(f => (
                      <div key={f.key}>
                        <label className="block text-sm font-medium text-gray-700 mb-1">{f.label}{f.required ? '*' : ''}</label>
                        <input 
                          type={f.type === "number" ? "number" : "text"} 
                          value={attributes[f.key] ?? ''} 
                          onChange={e => setAttributes({...attributes, [f.key]: e.target.value})} 
                          className="w-full px-3 py-2 border rounded"
                        />
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Variant */}
              <div className="p-6 space-y-4">
                <h2 className="font-semibold text-gray-900">Variants sản phẩm</h2>
                {variants.map((v, i) => (
                  <div key={i} className="flex gap-2 items-center mb-2">
                    <input 
                      type="text" 
                      placeholder="Title" 
                      value={v.title} 
                      onChange={e => updateVariant(i, "title", e.target.value)} 
                      className="px-2 py-1 border rounded w-40"
                    />
                    <input 
                      type="number" 
                      placeholder="Price" 
                      value={v.price} 
                      onChange={e => updateVariant(i, "price", Number(e.target.value))} 
                      className="px-2 py-1 border rounded w-24"
                    />
                    <input 
                      type="number" 
                      placeholder="Stock" 
                      value={v.stock} 
                      onChange={e => updateVariant(i, "stock", Number(e.target.value))} 
                      className="px-2 py-1 border rounded w-24"
                    />
                    <input 
                      type="file" 
                      accept="image/*" 
                      onChange={e => e.target.files && updateVariant(i, "imageFile", e.target.files[0])} 
                      className="px-2 py-1 border rounded w-32"
                    />
                    {v.imageUrl && (
                      <img src={v.imageUrl} alt="variant" className="w-10 h-10 object-cover rounded" />
                    )}
                    <button type="button" onClick={() => removeVariant(i)} className="px-2 py-1 bg-red-500 text-white rounded">Xóa</button>
                  </div>
                ))}
                <button type="button" onClick={addVariant} className="px-3 py-1 bg-blue-500 text-white rounded">Thêm Variant</button>
              </div>

              {/* Thông tin bán hàng */}
              <div className="p-6 space-y-4">
                <h2 className="font-semibold text-gray-900">Thông tin bán hàng</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Giá mặc định</label>
                    <input 
                      type="number" 
                      value={price} 
                      onChange={e => setPrice(Number(e.target.value))} 
                      className="w-full px-3 py-2 border rounded"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Kho hàng mặc định</label>
                    <input 
                      type="number" 
                      value={stock} 
                      onChange={e => setStock(Number(e.target.value))} 
                      className="w-full px-3 py-2 border rounded"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Giảm giá (%)</label>
                    <input 
                      type="number" 
                      value={discount} 
                      onChange={e => setDiscount(Number(e.target.value))} 
                      className="w-full px-3 py-2 border rounded"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Đánh giá</label>
                    <input 
                      type="number" 
                      step="0.1" 
                      min="0" 
                      max="5" 
                      value={rating} 
                      onChange={e => setRating(Number(e.target.value))} 
                      className="w-full px-3 py-2 border rounded"
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Tags</label>
                    <input 
                      type="text" 
                      value={tags} 
                      onChange={e => setTags(e.target.value)} 
                      className="w-full px-3 py-2 border rounded"
                      placeholder="tag1, tag2, tag3"
                    />
                  </div>
                </div>
              </div>

              {/* Hành động */}
              <div className="p-6 flex items-center justify-end gap-3 bg-gray-50">
                {message && (
                  <p className={`text-sm mr-auto ${
                    message.includes("Lỗi") || message.includes("lỗi") 
                      ? "text-red-600" 
                      : "text-green-600"
                  }`}>
                    {message}
                  </p>
                )}
                <button 
                  type="button" 
                  onClick={() => navigate("/seller/products")} 
                  className="px-4 py-2 border rounded bg-white hover:bg-gray-50"
                >
                  Quay lại
                </button>
                <button 
                  type="submit" 
                  className="px-5 py-2 rounded bg-[#ee4d2d] text-white hover:bg-[#d63d20]" 
                  disabled={uploading}
                >
                  {uploading 
                    ? "Đang lưu..." 
                    : isEditMode 
                      ? "Cập nhật sản phẩm" 
                      : "Lưu & Hiển thị"
                  }
                </button>
              </div>
            </form>
          </div>
        </section>
      </div>
    </div>
  );
};