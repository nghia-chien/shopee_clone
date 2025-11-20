const API_URL = import.meta.env.VITE_API_URL || "http://localhost:4000/api";

export interface AdminAuthData { 
  id: string; 
  email: string; 
  name: string; 
}

export interface AdminAuthResponse { 
  error?: string; 
  admin: AdminAuthData; 
  token: string; 
}

// Đăng nhập admin
export async function loginAdmin(email: string, password: string) {
  const res = await fetch(`${API_URL}/admin/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  return res.json() as Promise<AdminAuthResponse>;
}

// Lấy thông tin admin hiện tại
export async function getAdminMe(token: string) {
  const res = await fetch(`${API_URL}/admin/me`, {
    method: "GET",
    headers: { 
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`,
    },
  });
  return res.json() as Promise<{ admin: AdminAuthData; error?: string }>;
}

