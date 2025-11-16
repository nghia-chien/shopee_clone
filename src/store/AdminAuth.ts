import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

interface AdminAuthState {
  token: string | null;
  admin: {
    id: string;
    email: string;
    name: string;
  } | null;
  setAuth: (token: string, admin: {
    id: string;
    email: string;
    name: string;
  }) => void;
  logout: () => void;
}

export const useAdminAuthStore = create<AdminAuthState>()(
  persist(
    (set) => ({
      token: null,
      admin: null,
      setAuth: (token, admin) => set({ token, admin }),
      logout: () => set({ token: null, admin: null }),
    }),
    {
      name: 'admin-auth',
      storage: createJSONStorage(() => sessionStorage),
    }
  )
);

