import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSellerAuthStore } from "../../store/SellerAuth";


export const SellerHome = () => {
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { seller, token, setAuth, logout } = useSellerAuthStore();

  useEffect(() => {
    const fetchSeller = async () => {
      // Dùng token từ store trước
      const storedToken = token || localStorage.getItem("seller-auth");
      if (!storedToken) {
        navigate("/seller/login");
        return;
      }

      try {
        const baseUrl = import.meta.env.VITE_API_URL || "http://localhost:4000/api";
        const res = await fetch(`${baseUrl}/seller/auth/me`, {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${storedToken}`,
          },
        });

        if (!res.ok) {
          logout(); // xóa store nếu token hết hạn
          navigate("/seller/login");
          return;
        }

        const data = await res.json();
        // Cập nhật store luôn
        setAuth(storedToken, data.seller || data);
      } catch (err) {
        console.error("Fetch seller failed:", err);
        logout();
        navigate("/seller/login");
      } finally {
        setLoading(false);
      }
    };

    fetchSeller();
  }, [navigate, token, logout, setAuth]);

  if (loading) return <p>Loading...</p>;
  if (!seller) return <p>Không tìm thấy thông tin seller</p>;

  const handleLogout = () => {
    logout();
    navigate("/seller/login");
  };

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-4xl mx-auto bg-white p-6 rounded-lg shadow-md">
        <h1 className="text-3xl font-bold mb-4">Welcome, {seller.name}</h1>
        <p>Email: {seller.email}</p>
        <p>Rating: {seller.rating ?? 0}</p>
        <p>Status: {seller.status}</p>

        <div className="mt-6 flex space-x-4">
          <button
            onClick={() => navigate("/seller/dashboard")}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition"
          >
            Go to Dashboard
          </button>
          <button
            onClick={() => navigate("/seller/upload")}
            className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 transition"
          >
            Upload Product
          </button>
          <button
            onClick={handleLogout}
            className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 transition"
          >
            Logout
          </button>
        </div>
      </div>
    </div>
  );
};
