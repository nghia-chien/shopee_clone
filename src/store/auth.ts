import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

interface AuthState {
	token: string | null;
	user: { 
		id: string; 
		email: string; 
		phoneNumber?: string;
    name?: string;
    isSeller?: boolean;
    sellerId?: string | null;
	} | null;
	setAuth: (token: string, user: { 
		id: string; 
		email: string; 
		phoneNumber?: string;
    name?: string;
    isSeller?: boolean;
    sellerId?: string | null;
	}) => void;
	logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      user: null,
      setAuth: (token, user) => set({ token, user }),
      logout: () => set({ token: null, user: null }),
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => sessionStorage),
    }
  )
);
