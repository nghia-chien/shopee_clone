import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { X, AlertTriangle } from 'lucide-react';
import { createUserComplaint } from '../../api/userapi/complaints';
import { createSellerComplaint } from '../../api/sellerapi/complaints';
import { useAuthStore } from '../../store/auth';
import { useSellerAuthStore } from '../../store/SellerAuth';
import type { ComplaintDraft, ComplaintRecord, ComplaintType } from '../../types/complaints';

type Actor = 'USER' | 'SELLER';

const ISSUE_TEMPLATES: Record<
  ComplaintType,
  Array<{ id: string; label: string; description?: string; disabled?: boolean }>
> = {
  PRODUCT_SHOP: [
    { id: 'PRODUCT_DEFECT', label: 'Sản phẩm lỗi / khác mô tả' },
    { id: 'WRONG_OR_MISSING', label: 'Nhận nhầm / thiếu hàng' },
    { id: 'SHIP_DELAY', label: 'Chậm trễ giao hàng / Shipper', description: 'Đang triển khai', disabled: true },
  ],
  SELLER_USER: [
    { id: 'USER_CANCEL', label: 'User hủy đơn liên tục' },
    { id: 'USER_ABUSE', label: 'Hành vi sai / lạm dụng' },
    { id: 'FAKE_REVIEW', label: 'Đánh giá ảo / phản hồi sai' },
  ],
  SYSTEM: [
    { id: 'PAYMENT_ERROR', label: 'Lỗi thanh toán' },
    { id: 'ORDER_FLOW', label: 'Lỗi tạo/cập nhật đơn' },
    { id: 'LOGIN_ACCESS', label: 'Lỗi đăng nhập / truy cập' },
  ],
};

interface ComplaintModalProps {
  open: boolean;
  actor: Actor;
  defaultValues?: ComplaintDraft;
  onClose: () => void;
  onSuccess?: (complaint: ComplaintRecord) => void;
}

interface FormState {
  type: ComplaintType;
  issueCode: string;
  description: string;
  sellerId?: string;
  userId?: string;
  orderId?: string;
  productId?: string;
  channel: string;
  evidenceText: string;
}

const USER_TYPES: ComplaintType[] = ['PRODUCT_SHOP', 'SYSTEM'];
const SELLER_TYPES: ComplaintType[] = ['SELLER_USER', 'SYSTEM'];

export function ComplaintModal({ actor, open, defaultValues, onClose, onSuccess }: ComplaintModalProps) {
  const { token: userToken } = useAuthStore();
  const { token: sellerToken } = useSellerAuthStore();
  const queryClient = useQueryClient();

  const allowedTypes = actor === 'SELLER' ? SELLER_TYPES : USER_TYPES;
  const fallbackType = allowedTypes[0];

  const [formState, setFormState] = useState<FormState>(() => ({
    type: defaultValues?.type && allowedTypes.includes(defaultValues.type) ? defaultValues.type : fallbackType,
    issueCode: defaultValues?.meta?.issueCode ?? ISSUE_TEMPLATES[fallbackType][0].id,
    description: defaultValues?.description ?? '',
    sellerId: defaultValues?.seller_id ?? (defaultValues?.meta?.context?.sellerId as string | undefined),
    userId: defaultValues?.user_id ?? (defaultValues?.meta?.context?.userId as string | undefined),
    orderId: defaultValues?.order_id ?? (defaultValues?.meta?.context?.orderId as string | undefined),
    productId: defaultValues?.product_id ?? (defaultValues?.meta?.context?.productId as string | undefined),
    channel: defaultValues?.meta?.channel ?? (defaultValues?.meta?.autoFill?.channel ?? 'APP'),
    evidenceText: (defaultValues?.meta?.evidence ?? []).join('\n'),
  }));

  useEffect(() => {
    if (!open) return;
    setFormState({
      type: defaultValues?.type && allowedTypes.includes(defaultValues.type) ? (defaultValues.type as ComplaintType) : fallbackType,
      issueCode:
        defaultValues?.meta?.issueCode ??
        ISSUE_TEMPLATES[
          defaultValues?.type && allowedTypes.includes(defaultValues.type)
            ? (defaultValues.type as ComplaintType)
            : fallbackType
        ][0].id,
      description: defaultValues?.description ?? '',
      sellerId: defaultValues?.seller_id ?? (defaultValues?.meta?.context?.sellerId as string | undefined),
      userId: defaultValues?.user_id ?? (defaultValues?.meta?.context?.userId as string | undefined),
      orderId: defaultValues?.order_id ?? (defaultValues?.meta?.context?.orderId as string | undefined),
      productId: defaultValues?.product_id ?? (defaultValues?.meta?.context?.productId as string | undefined),
      channel: defaultValues?.meta?.channel ?? (defaultValues?.meta?.autoFill?.channel ?? 'APP'),
      evidenceText: (defaultValues?.meta?.evidence ?? []).join('\n'),
    });
  }, [open, defaultValues, allowedTypes, fallbackType]);

  const token = actor === 'SELLER' ? sellerToken : userToken;
  const issueOptions = ISSUE_TEMPLATES[formState.type];
  const evidenceList = useMemo(
    () =>
      formState.evidenceText
        .split('\n')
        .map((line) => line.trim())
        .filter(Boolean),
    [formState.evidenceText]
  );

  const mutation = useMutation({
    mutationFn: async () => {
      if (!token) {
        throw new Error('Bạn cần đăng nhập để gửi khiếu nại');
      }

      const payload: ComplaintDraft & { type: ComplaintType } = {
        type: formState.type,
        seller_id: formState.sellerId,
        user_id: formState.userId,
        order_id: formState.orderId,
        product_id: formState.productId,
        description: formState.description,
        meta: {
          issueCode: formState.issueCode,
          reason: issueOptions.find((opt) => opt.id === formState.issueCode)?.label,
          channel: formState.channel,
          context: {
            ...(defaultValues?.meta?.context ?? {}),
            sellerId: formState.sellerId,
            userId: formState.userId,
            orderId: formState.orderId,
            productId: formState.productId,
          },
          autoFill: defaultValues?.meta?.autoFill,
          evidence: evidenceList,
        },
      };

      if (actor === 'SELLER') {
        return createSellerComplaint(token, payload);
      }
      return createUserComplaint(token, payload);
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['complaints'] });
      queryClient.invalidateQueries({ queryKey: ['complaints', actor.toLowerCase()] });
      if (data?.complaint && onSuccess) {
        onSuccess(data.complaint);
      }
      onClose();
    },
  });

  const currentIssue = issueOptions.find((opt) => opt.id === formState.issueCode);
  const missingSeller = actor === 'USER' && formState.type === 'PRODUCT_SHOP' && !formState.sellerId;
  const disabled = missingSeller || mutation.isPending;

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="w-full max-w-2xl rounded-2xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b px-6 py-4">
          <div>
            
            <h2 className="text-xl text-center font-semibold text-gray-900">Tạo khiếu nại</h2>
            
          </div>
          <button onClick={onClose} className="rounded-full p-2 text-gray-500 hover:bg-gray-100">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="max-h-[70vh] overflow-y-auto px-6 py-4 space-y-5">
          {!token && (
            <div className="flex items-center gap-2 rounded-lg border border-yellow-200 bg-yellow-50 px-3 py-2 text-sm text-yellow-700">
              <AlertTriangle className="h-4 w-4" />
              Vui lòng đăng nhập để tiếp tục
            </div>
          )}

          <div>
            <label className="text-sm font-medium text-gray-700">Nhóm khiếu nại</label>
            <select
              value={formState.type}
              onChange={(e) =>
                setFormState((prev) => ({
                  ...prev,
                  type: e.target.value as ComplaintType,
                  issueCode: ISSUE_TEMPLATES[e.target.value as ComplaintType][0].id,
                }))
              }
              className="mt-1 w-full rounded-lg border px-3 py-2"
            >
              {allowedTypes.map((type) => (
                <option key={type} value={type}>
                  {type === 'PRODUCT_SHOP' && 'Sản phẩm / Shop'}
                  {type === 'SELLER_USER' && 'Người mua vi phạm'}
                  {type === 'SYSTEM' && 'Lỗi hệ thống'}
                </option>
              ))}
            </select>
            
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700">Tình huống cụ thể</label>
            <select
              value={formState.issueCode}
              onChange={(e) => setFormState((prev) => ({ ...prev, issueCode: e.target.value }))}
              className="mt-1 w-full rounded-lg border px-3 py-2"
            >
              {issueOptions.map((item) => (
                <option key={item.id} value={item.id} disabled={item.disabled}>
                  {item.label} {item.disabled ? '(đang phát triển)' : ''}
                </option>
              ))}
            </select>
            {currentIssue?.description && (
              <p className="mt-1 text-xs text-gray-500">{currentIssue.description}</p>
            )}
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700">Mô tả chi tiết</label>
            <textarea
              value={formState.description}
              onChange={(e) => setFormState((prev) => ({ ...prev, description: e.target.value }))}
              rows={4}
              className="mt-1 w-full rounded-lg border px-3 py-2"
              placeholder="Mô tả rõ tình trạng, thời gian, bằng chứng..."
            />
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700">Bằng chứng (mỗi dòng 1 link / ghi chú)</label>
            <textarea
              value={formState.evidenceText}
              onChange={(e) => setFormState((prev) => ({ ...prev, evidenceText: e.target.value }))}
              rows={3}
              className="mt-1 w-full rounded-lg border px-3 py-2 text-sm"
              placeholder="https://drive.../ảnh\nSố vận đơn: ..."
            />
          </div>
        </div>

        <div className="flex items-center justify-between border-t px-6 py-4">
          {missingSeller && (
            <p className="text-sm text-red-500">Vui lòng nhập seller ID để tiếp tục</p>
          )}
          {mutation.isError && (
            <p className="text-sm text-red-500">{(mutation.error as Error).message}</p>
          )}
          <div className="ml-auto flex gap-3">
            <button
              onClick={onClose}
              className="rounded-lg border px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50"
            >
              Hủy
            </button>
            <button
              disabled={disabled}
              onClick={() => mutation.mutate()}
              className="rounded-lg bg-orange-500 px-4 py-2 text-sm font-medium text-white hover:bg-orange-600 disabled:cursor-not-allowed disabled:bg-orange-200"
            >
              {mutation.isPending ? 'Đang gửi...' : 'Gửi khiếu nại'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

