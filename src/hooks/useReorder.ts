// hooks/useReorder.ts
import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

interface ReorderItem {
  product_id: string;
  quantity: number;
  variant_id?: string | null;
  variant?: string;
}

export const useReorder = () => {
  const navigate = useNavigate();

  const prepareReorderData = useCallback((items: ReorderItem[]) => {
    const reorderData = {
      items: items.map(item => ({
        product_id: item.product_id,
        quantity: item.quantity,
        variant_id: item.variant_id || null,
        variant: item.variant || '',
      })),
      timestamp: Date.now(),
    };

    localStorage.removeItem('reorder_items');
    localStorage.setItem('reorder_items', JSON.stringify(reorderData));

    return reorderData;
  }, []);

  const handleReorder = useCallback((items: ReorderItem[]) => {
    const confirmReorder = window.confirm(
      `Thêm ${items.length} sản phẩm vào giỏ hàng?`
    );
    
    if (!confirmReorder) return;

    prepareReorderData(items);
    navigate('/cart', { state: { isReorder: true } });
  }, [navigate, prepareReorderData]);

  const clearReorderData = useCallback(() => {
    localStorage.removeItem('reorder_items');
  }, []);

  const getReorderData = useCallback(() => {
    const data = localStorage.getItem('reorder_items');
    if (!data) return null;

    try {
      const parsed = JSON.parse(data);
      // Kiểm tra thời gian hiệu lực (15 phút)
      const FIFTEEN_MINUTES = 15 * 60 * 1000;
      if (Date.now() - parsed.timestamp > FIFTEEN_MINUTES) {
        localStorage.removeItem('reorder_items');
        return null;
      }
      return parsed;
    } catch {
      localStorage.removeItem('reorder_items');
      return null;
    }
  }, []);

  return {
    handleReorder,
    clearReorderData,
    getReorderData,
    prepareReorderData,
  };
};