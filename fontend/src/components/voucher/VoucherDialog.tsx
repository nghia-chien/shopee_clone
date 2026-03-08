import { X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

// Component Dialog cho Voucher - Không cần type definitions riêng
function VoucherDialog({ 
  isOpen, 
  onClose, 
  applicableVouchers, 
  selectedVoucherCode, 
  setSelectedVoucherCode, 
  evaluateVoucher,
  voucherLoading
}: {
  isOpen: boolean;
  onClose: () => void;
  applicableVouchers: Array<any & { isApplicable: boolean; reason: string; preview: any }>; // Thêm field mới
  selectedVoucherCode: string;
  setSelectedVoucherCode: (code: string) => void;
  evaluateVoucher: (voucher: any) => { discount: number; base: number } | null;
  voucherLoading: boolean;
}) {
  const navigate = useNavigate();
  
  if (!isOpen) return null;

  const handleNavigateToVouchers = () => {
    onClose();
    navigate('/user/vouchers');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[80vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <h3 className="text-lg font-semibold text-gray-900">Chọn Voucher</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition"
            aria-label="Đóng"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[60vh]">
          {voucherLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mx-auto mb-2"></div>
              <p className="text-sm text-gray-500">Đang tải voucher...</p>
            </div>
          ) : applicableVouchers.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-gray-400 mb-3">
                <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" />
                </svg>
              </div>
              <p className="text-sm text-gray-500 mb-4">
                Không có voucher khả dụng cho sản phẩm đã chọn.
              </p>
              <button
                onClick={handleNavigateToVouchers}
                className="text-sm text-orange-500 hover:text-orange-600 font-medium"
              >
                Xem kho voucher →
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-sm text-gray-500 mb-2">
                Chọn 1 voucher để áp dụng:
              </p>
              
              {applicableVouchers.map((entry: any) => {
                const v = entry.voucher;
                const isSelected = selectedVoucherCode === v.code;
                const isApplicable = entry.isApplicable;
                const reason = entry.reason;
                const preview = entry.preview;
                
                const discountLabel = v.discount_type === 'PERCENT'
                  ? `${v.discount_value}%`
                  : `${Number(v.discount_value).toLocaleString('vi-VN')}₫`;
                
                // Tính % discount nếu có preview
                const discountPercent = preview ? Math.round((preview.discount / preview.base) * 100) : 0;
    

                return (
                  <div
                    key={entry.id}
                    className={`border rounded-lg p-4 transition-all relative ${
                      isApplicable
                        ? isSelected 
                          ? 'border-orange-500 bg-orange-50 ring-1 ring-orange-500' 
                          : 'border-gray-200 hover:border-orange-300 bg-white'
                        : 'border-gray-200 bg-gray-100 opacity-70 cursor-not-allowed'
                    }`}
                  >
                    {/* Overlay disabled */}
                    {!isApplicable && (
                      <div className="absolute inset-0 bg-white/50 z-10 rounded-lg"></div>
                    )}
                    
                    <div className="flex items-start justify-between relative z-20">
                      <div className="flex-1">
                        {/* Header */}
                        <div className="flex items-center gap-2 mb-2">
                          <span className={`font-bold text-lg ${
                            isApplicable ? 'text-orange-600' : 'text-gray-500'
                          }`}>
                            {discountLabel}
                          </span>
                          <span className={`px-2 py-1 text-xs font-medium rounded ${
                            v.source === 'ADMIN' 
                              ? 'bg-blue-100 text-blue-700' 
                              : 'bg-green-100 text-green-700'
                          } ${!isApplicable ? 'opacity-60' : ''}`}>
                            {v.source === 'ADMIN' ? 'PLATFORM' : 'SHOP'}
                          </span>
                          {isApplicable && preview && discountPercent > 0 && (
                            <span className="text-xs text-gray-500">
                              Giảm {discountPercent}%
                            </span>
                          )}
                        </div>
                        
                        {/* Code và trạng thái */}
                        <div className="flex items-center gap-2 mb-2">
                          <code className={`text-sm font-mono px-2 py-1 rounded ${
                            isApplicable ? 'bg-gray-100' : 'bg-gray-200'
                          }`}>
                            {v.code}
                          </code>
                          {v.usage_limit_per_user && (
                            <span className="text-xs text-gray-500">
                              Còn {v.usage_limit_per_user - entry.usage_count} lượt
                            </span>
                          )}
                        </div>
                        
                        {/* Discount amount nếu có */}
                        {isApplicable && preview ? (
                          <div className="text-sm text-gray-600 mb-2">
                            <span className="font-medium">
                              Giảm {preview.discount.toLocaleString('vi-VN')}₫
                            </span>
                            {v.min_order_amount && v.min_order_amount > 0 && (
                              <>
                                <span className="text-gray-400 mx-1">•</span>
                                <span>Đơn tối thiểu {Number(v.min_order_amount).toLocaleString('vi-VN')}₫</span>
                              </>
                            )}
                          </div>
                        ) : (
                          <div className="text-sm text-gray-500 mb-2">
                            {reason}
                          </div>
                        )}
                        
                        {/* Validity */}
                        <div className={`text-xs flex items-center gap-2 ${
                          isApplicable ? 'text-gray-500' : 'text-gray-400'
                        }`}>
                          <span>
                            HSD: {new Date(v.end_at).toLocaleDateString('vi-VN')}
                          </span>
                          {v.product_id && (
                            <span className="px-1.5 py-0.5 bg-purple-100 text-purple-700 rounded">
                              Ấn định sản phẩm
                            </span>
                          )}
                        </div>
                      </div>
                      
                      {/* Radio button - chỉ hiển thị nếu applicable */}
                      {isApplicable ? (
                        <button
                          onClick={() => setSelectedVoucherCode(v.code === selectedVoucherCode ? "" : v.code)}
                          className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ml-4 flex-shrink-0 ${
                            isSelected
                              ? 'border-orange-500 bg-orange-500'
                              : 'border-gray-300'
                          }`}
                          aria-pressed={isSelected}
                        >
                          {isSelected && (
                            <div className="w-2 h-2 rounded-full bg-white" />
                          )}
                        </button>
                      ) : (
                        <div className="ml-4 flex-shrink-0">
                          <div className="w-5 h-5 rounded-full border-2 border-gray-300 flex items-center justify-center">
                            <div className="w-3 h-0.5 bg-gray-300"></div>
                          </div>
                        </div>
                      )}
                    </div>
                    
                    {/* Warning badge cho voucher không khả dụng */}
                    {!isApplicable && (
                      <div className="absolute top-2 right-2 z-30">
                        <span className="text-xs px-2 py-1 bg-gray-200 text-gray-600 rounded">
                          Không khả dụng
                        </span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t bg-gray-50 flex items-center justify-between">
          <div>
            {selectedVoucherCode && (
              <button
                onClick={() => setSelectedVoucherCode("")}
                className="text-sm text-gray-600 hover:text-gray-800 transition-colors"
              >
                Bỏ chọn voucher
              </button>
            )}
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => {
                setSelectedVoucherCode("");
                onClose();
              }}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
            >
              Không dùng
            </button>
            <button
              onClick={onClose}
              className="px-6 py-2 bg-orange-500 hover:bg-orange-600 text-white font-medium rounded-md transition-colors"
            >
              Xác nhận
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default VoucherDialog;