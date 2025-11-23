import type { AuthProvider } from "@refinedev/core";

import { useAdminAuthStore } from "../../store/AdminAuth";

export const authProvider: AuthProvider = {
  login: async ({ email, password }) => {
    const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:4000/api";
    
    try {
      const response = await fetch(`${API_URL}/admin/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || error.message || "Login failed");
      }

      const data = await response.json();
      const { token, admin } = data;

      // Store auth in zustand store
      useAdminAuthStore.getState().setAuth(token, admin);

      return {
        success: true,
        redirectTo: "/admin/dashboard",
      };
    } catch (error: any) {
      return {
        success: false,
        error: {
          message: error.message || "Login failed",
          name: "LoginError",
        },
      };
    }
  },

  logout: async () => {
    useAdminAuthStore.getState().logout();
    return {
      success: true,
      redirectTo: "/admin/login",
    };
  },

  check: async () => {
    const token = useAdminAuthStore.getState().token;
    if (token) {
      return {
        authenticated: true,
      };
    }
    return {
      authenticated: false,
      redirectTo: "/admin/login",
      logout: true,
    };
  },

  onError: async (error) => {
    if (error?.status === 401) {
      return {
        logout: true,
        redirectTo: "/admin/login",
        error,
      };
    }
    return { error };
  },

  getIdentity: async () => {
    const admin = useAdminAuthStore.getState().admin;
    if (admin) {
      return admin;
    }
    return null;
  },
};

