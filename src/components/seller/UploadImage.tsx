import React, { useState } from "react";
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { storage } from "../../../firebase";

// Thêm prop onUpload để parent có thể nhận URL và update state sản phẩm
interface UploadImageProps {
  productId: string; // nếu là sản phẩm mới, có thể là "new"
  onUpload?: (url: string) => void;
}

export const UploadImage: React.FC<UploadImageProps> = ({ productId, onUpload }) => {
  const [file, setFile] = useState<File | null>(null);
  const [url, setUrl] = useState("");
  const [uploading, setUploading] = useState(false);

  const handleUpload = async () => {
    if (!file) return;
    setUploading(true);

    const storageRef = ref(storage, `products/${Date.now()}_${file.name}`);
    const uploadTask = uploadBytesResumable(storageRef, file);

    uploadTask.on(
      "state_changed",
      (snapshot) => {
        const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
        console.log("Upload is " + progress + "% done");
      },
      (error) => {
        console.error(error);
        setUploading(false);
      },
      async () => {
        const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
        setUrl(downloadURL);
        setUploading(false);

        // Gọi backend lưu URL
        const token = localStorage.getItem("sellerToken");
        if (!token) return;

        try {
          await fetch(`${import.meta.env.VITE_API_URL || "http://localhost:4000/api"}/seller/products/${productId}/image`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ imageUrl: downloadURL }),
          });
          // Thông báo parent nếu cần
          onUpload && onUpload(downloadURL);
        } catch (err) {
          console.error("Failed to save image to backend", err);
        }
      }
    );
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
