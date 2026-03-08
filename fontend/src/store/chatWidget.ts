// store/chatWidget.ts
import { create } from 'zustand';

interface ChatWidgetState {
  open: boolean;
  sellerId: string | null;
  sellerName: string | null;
  openChat: (sellerId: string, sellerName: string) => void;
  closeChat: () => void;
  // Thêm hàm reset
  resetChat: () => void;
}

export const useChatWidgetStore = create<ChatWidgetState>((set) => ({
  open: false,
  sellerId: null,
  sellerName: null,
  
  openChat: (sellerId, sellerName) => {
    console.log('Store: Opening chat with', sellerId, sellerName);
    set({ 
      open: true,
      sellerId, 
      sellerName 
    });
  },
  
  closeChat: () => {
    console.log('Store: Closing chat');
    set({ 
      open: false,
      // KHÔNG reset sellerId và sellerName ở đây
    });
  },
  
  // Hàm mới: Reset hoàn toàn
  resetChat: () => {
    console.log('Store: Resetting chat');
    set({
      open: false,
      sellerId: null,
      sellerName: null
    });
  }
}));