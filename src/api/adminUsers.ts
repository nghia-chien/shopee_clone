const API_URL = import.meta.env.VITE_API_URL || "http://localhost:4000/api";

export interface User {
  id: string;
  email: string;
  name?: string;
  phone_number?: string;
  created_at: string;
  updated_at: string;
}

export interface PaginatedResponse<T> {
  [key: string]: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Get all users
export async function getAdminUsers(token: string, page = 1, limit = 20, search = '') {
  const params = new URLSearchParams({
    page: page.toString(),
    limit: limit.toString(),
    ...(search && { search }),
  });
  
  const res = await fetch(`${API_URL}/admin/users?${params}`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });
  
  if (!res.ok) throw new Error('Failed to fetch users');
  return res.json() as Promise<PaginatedResponse<User>>;
}

// Get user by ID
export async function getAdminUser(token: string, id: string) {
  const res = await fetch(`${API_URL}/admin/users/${id}`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });
  
  if (!res.ok) throw new Error('Failed to fetch user');
  return res.json() as Promise<{ user: User }>;
}

// Create user
export async function createAdminUser(token: string, data: {
  name: string;
  email: string;
  phone_number?: string;
  password: string;
}) {
  const res = await fetch(`${API_URL}/admin/users`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });
  
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || 'Failed to create user');
  }
  return res.json();
}

// Update user
export async function updateAdminUser(token: string, id: string, data: {
  name?: string;
  email?: string;
  phone_number?: string | null;
}) {
  const res = await fetch(`${API_URL}/admin/users/${id}`, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });
  
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || 'Failed to update user');
  }
  return res.json();
}

// Delete user
export async function deleteAdminUser(token: string, id: string) {
  const res = await fetch(`${API_URL}/admin/users/${id}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });
  
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || 'Failed to delete user');
  }
  return res.json();
}

