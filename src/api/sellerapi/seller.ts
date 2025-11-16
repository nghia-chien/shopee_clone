const API_URL = import.meta.env.VITE_API_URL || "http://localhost:4000/api";

export interface SellerAuthData { id: string; email: string; name?: string; }
export interface SellerAuthResponse { error: any; seller: SellerAuthData; token: string; }

// Đăng ký
export async function registerSeller(name: string, email: string, password: string, phone_number?: string) {
  const res = await fetch(`${API_URL}/seller/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, email, password, phone_number }),
  });
  return res.json() as Promise<SellerAuthResponse>;
}

// Đăng nhập
export async function loginSeller(email: string, password: string) {
  const res = await fetch(`${API_URL}/seller/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  return res.json() as Promise<SellerAuthResponse>;
}

// Exchange buyer token -> seller token using current buyer auth header
export async function exchangeSellerToken(buyerToken: string) {
  const res = await fetch(`${API_URL}/seller/auth/exchange`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${buyerToken}`,
    },
  });
  return res.json() as Promise<{ token: string; seller: SellerAuthData; error?: any }>;
}
import axios from "axios";

const axiosClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:4000/api",
  headers: { "Content-Type": "application/json" },
});

export default axiosClient;
