import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { uploadSellerImage } from "../../api/sellerProducts";
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
  const navigate = useNavigate();

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
      }
    } catch (err: any) {
      console.error(err);
      setMessage(err.message || "Server error screens/seller/SellerUploadPage");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-3xl mx-auto bg-white p-6 rounded shadow">
        <h1 className="text-2xl font-bold mb-4">Upload New Product</h1>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="text"
            placeholder="Product Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full p-2 border rounded"
            required
          />
          <textarea
            placeholder="Description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full p-2 border rounded"
          />
          <input
            type="number"
            placeholder="discount"
            value={discount}
            onChange={(e) => setDiscount(Number(e.target.value))}
            className="w-full p-2 border rounded"
            required
          />
          <input
            type="number"
            placeholder="rating"
            value={rating}
            onChange={(e) => setRating(Number(e.target.value))}
            className="w-full p-2 border rounded"
            required
          />
          <textarea
            placeholder="tags"
            value={tags}
            onChange={(e) => setTags(e.target.value)}
            className="w-full p-2 border rounded"
          />
          <input
            type="number"
            placeholder="Price"
            value={price}
            onChange={(e) => setPrice(Number(e.target.value))}
            className="w-full p-2 border rounded"
            required
          />
          <input
            type="number"
            placeholder="Stock"
            value={stock}
            onChange={(e) => setStock(Number(e.target.value))}
            className="w-full p-2 border rounded"
            required
          />

          {/* ✅ Chọn thêm ảnh mà không mất ảnh cũ */}
          <input
            type="file"
            multiple
            accept="image/*"
            onChange={handleImageSelect}
            className="block w-full text-sm text-gray-500"
          />

          {/* ✅ Hiển thị preview nhiều ảnh có nút xóa */}
          <div className="flex flex-wrap gap-3 mt-3">
            {previewUrls.map((url, index) => (
              <div key={index} className="relative">
                <img
                  src={url}
                  alt={`preview-${index}`}
                  className="w-24 h-24 object-cover rounded border"
                />
                <button
                  type="button"
                  onClick={() => handleRemoveImage(index)}
                  className="absolute top-0 right-0 bg-red-500 text-white text-xs px-1 rounded"
                >
                  🗑
                </button>
              </div>
            ))}
          </div>

          <button
            type="submit"
            className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 transition"
            disabled={uploading}
          >
            {uploading ? "Uploading..." : "Upload Product"}
          </button>
        </form>

        {message && <p className="mt-4 text-red-600">{message}</p>}
      </div>
    </div>
  );
};
