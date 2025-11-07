import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

interface SellerAuthState {
  token: string | null;
  seller: {
    status: string;
    rating: number;
    id: string;
    email: string;
    phone_number?: string;
    name?: string;
  } | null;
  setAuth: (token: string, seller: {
    id: string;
    email: string;
    phone_number?: string;
    name?: string;
    status: string;
    rating: number;
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
    {
      name: 'seller-auth',
      storage: createJSONStorage(() => sessionStorage),
    }
  )
);
