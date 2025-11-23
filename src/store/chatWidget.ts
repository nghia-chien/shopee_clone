// store/chatWidget.ts
import { create } from 'zustand';

interface ChatWidgetState {
  open: boolean;
  sellerId: string | null;
  sellerName: string | null;
  openChat: (sellerId: string, sellerName?: string | null) => void;
  closeChat: () => void;
}

export const useChatWidgetStore = create<ChatWidgetState>((set) => ({
  open: false,
  sellerId: null,
  sellerName: null,

  openChat: (sellerId, sellerName = null) =>
    set({ open: true, sellerId, sellerName }),

  closeChat: () =>
    set({ open: false, sellerId: null, sellerName: null }),
}));
