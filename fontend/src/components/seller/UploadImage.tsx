import React, { useState } from "react";
import { useSellerAuthStore } from "../../store/SellerAuth";

interface UploadImageProps {
  product_id: string; // nếu là sản phẩm mới, có thể là "new"
  onUpload?: (url: string) => void;
}

export const UploadImage: React.FC<UploadImageProps> = ({ product_id, onUpload }) => {
  const [file, setFile] = useState<File | null>(null);
  const [url, setUrl] = useState("");
  const [uploading, setUploading] = useState(false);

  const handleUpload = async () => {
    if (!file) return;
    setUploading(true);

    try {
      // Lấy token trực tiếp từ Zustand store
      const token = useSellerAuthStore.getState().token;
      if (!token) throw new Error("Seller not logged in");

      const formData = new FormData();
      formData.append("image", file);

      const res = await fetch(
        `${import.meta.env.VITE_API_URL || "http://localhost:4000/api"}/seller/upload`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        }
      );

      if (!res.ok) throw new Error("Upload failed");
      const data = (await res.json()) as { url: string };
      setUrl(data.url);
      if (onUpload) onUpload(data.url);
    } catch (error) {
      console.error(error);
      alert("Upload failed. Check console for details.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div>
      <input
        type="file"
        accept="image/*"
        onChange={(e) => e.target.files && setFile(e.target.files[0])}
        disabled={uploading}
      />
      <button onClick={handleUpload} disabled={!file || uploading}>
        {uploading ? "Uploading..." : "Upload"}
      </button>
      {url && <img src={url} alt="uploaded" width={200} />}
    </div>
  );
};
