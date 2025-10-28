import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface SellerAuthState {
  token: string | null;
  seller: {
    id: string;
    email: string;
    phoneNumber?: string;
    name?: string;
  } | null;
  setAuth: (token: string, seller: {
    id: string;
    email: string;
    phoneNumber?: string;
    name?: string;
  }) => void;
  logout: () => void;
}

export const useSellerAuthStore = create<SellerAuthState>()(
  persist(
    (set) => ({
      token: null,
      seller: null,
      setAuth: (token, seller) => set({ token, seller }),
      logout: () => set({ token: null, seller: null }),
    }),
    { name: 'seller-auth' } // lưu riêng key cho seller
  )
);
