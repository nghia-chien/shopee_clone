import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { PlusCircle } from 'lucide-react';
import { useSellerAuthStore } from '../../store/SellerAuth';
import { fetchSellerComplaints, respondSellerComplaint } from '../../api/sellerapi/complaints';
import { ComplaintModal } from '../../components/complaints/ComplaintModal';
import { ComplaintCard } from '../../components/complaints/ComplaintCard';
import type { ComplaintDraft, ComplaintRecord, ComplaintStatus } from '../../types/complaints';

const statusTabs: Array<{ id: ComplaintStatus | 'ALL'; label: string }> = [
  { id: 'ALL', label: 'Tất cả' },
  { id: 'NEW', label: 'Chờ xử lý' },
  { id: 'IN_PROGRESS', label: 'Đang xử lý' },
  { id: 'RESOLVED', label: 'Hoàn tất' },
  { id: 'REJECTED', label: 'Từ chối' },
];

export default function SellerComplaintsPage() {
  const { token, seller } = useSellerAuthStore();
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState<(ComplaintStatus | 'ALL')>('ALL');
  const [draft, setDraft] = useState<ComplaintDraft | null>(null);
  const [responses, setResponses] = useState<Record<string, string>>({});

  const { data, isLoading, error } = useQuery({
    queryKey: ['complaints', 'seller'],
    queryFn: () => fetchSellerComplaints(token!),
    enabled: !!token,
  });

  const respondMutation = useMutation({
    mutationFn: ({ id, message }: { id: string; message: string }) =>
      respondSellerComplaint(token!, id, { message }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['complaints', 'seller'] });
      setResponses({});
    },
  });

  const filteredComplaints = useMemo(() => {
    if (!data) return [];
    return data.filter((complaint) => statusFilter === 'ALL' || complaint.status === statusFilter);
  }, [data, statusFilter]);

  const canRespond = (complaint: ComplaintRecord) =>
    complaint.type === 'PRODUCT_SHOP' &&
    !complaint.attachments?.responses?.seller &&
    complaint.status !== 'RESOLVED' &&
    complaint.status !== 'REJECTED';

  const openDraft = () => {
    setDraft({
      type: 'SELLER_USER',
      seller_id: seller?.id,
      meta: {
        channel: 'SELLER_CENTER',
        autoFill: { source: 'seller-complaints' },
      },
    });
  };

  if (!token) {
    return <p className="text-sm text-gray-500">Đăng nhập Seller Center để quản lý khiếu nại.</p>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Khiếu nại & Báo cáo</h1>
          <p className="text-sm text-gray-500">Theo dõi khiếu nại từ người mua và tạo báo cáo lên Admin.</p>
        </div>
        <button
          onClick={openDraft}
          className="inline-flex items-center gap-2 rounded-xl bg-orange-500 px-4 py-2 text-sm font-medium text-white shadow hover:bg-orange-600"
        >
          <PlusCircle className="h-4 w-4" />
          Báo người mua / Lỗi hệ thống
        </button>
      </div>

      <div className="flex flex-wrap gap-2 rounded-2xl border bg-white p-3 shadow-sm">
        {statusTabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setStatusFilter(tab.id)}
            className={`rounded-full px-4 py-1 text-sm font-medium ${
              statusFilter === tab.id ? 'bg-orange-500 text-white' : 'bg-gray-100 text-gray-600'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {isLoading && <p className="text-sm text-gray-500">Đang tải dữ liệu...</p>}
      {error && <p className="text-sm text-red-500">{(error as Error).message}</p>}

      <div className="space-y-4">
        {filteredComplaints.map((complaint) => (
          <ComplaintCard
            key={complaint.id}
            complaint={complaint}
            role="SELLER"
            actions={
              canRespond(complaint) && (
                <div className="space-y-2">
                  <textarea
                    value={responses[complaint.id] ?? ''}
                    onChange={(e) => setResponses((prev) => ({ ...prev, [complaint.id]: e.target.value }))}
                    rows={3}
                    placeholder="Trả lời cho người mua..."
                    className="w-full rounded-xl border px-3 py-2 text-sm"
                  />
                  <button
                    disabled={respondMutation.isPending || !(responses[complaint.id]?.trim())}
                    onClick={() => {
                      const message = responses[complaint.id]?.trim();
                      if (!message) return;
                      respondMutation.mutate({ id: complaint.id, message });
                    }}
                    className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 disabled:cursor-not-allowed disabled:bg-gray-400"
                  >
                    {respondMutation.isPending ? 'Đang gửi...' : 'Phản hồi người mua'}
                  </button>
                </div>
              )
            }
          />
        ))}
        {!isLoading && filteredComplaints.length === 0 && (
          <div className="rounded-2xl border border-dashed border-gray-200 bg-white p-8 text-center text-gray-500">
            Không có khiếu nại trong trạng thái này.
          </div>
        )}
      </div>

      <ComplaintModal
        open={!!draft}
        actor="SELLER"
        defaultValues={draft ?? undefined}
        onClose={() => setDraft(null)}
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ['complaints', 'seller'] });
          setDraft(null);
        }}
      />
    </div>
  );
}
