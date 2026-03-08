import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

interface Seller {
  id: string;
  email: string;
  name?: string;
  phone_number?: string;
  avatar?: string;
  rating: number | null;
  status: string;
  shop_mall?: string;
  address?: any;
}

interface SellerAuthState {
  token: string | null;
  seller: Seller | null;
  setAuth: (token: string, seller: Seller) => void;
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
