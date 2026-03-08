import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { PlusCircle, AlertCircle } from 'lucide-react';
import { useAuthStore } from '../../store/auth';
import { fetchUserComplaints, addComplaintEvidence } from '../../api/userapi/complaints';
import { ComplaintModal } from '../../components/complaints/ComplaintModal';
import { ComplaintCard } from '../../components/complaints/ComplaintCard';
import type { ComplaintDraft, ComplaintRecord } from '../../types/complaints';

export default function ComplaintsPage() {
  const { token } = useAuthStore();
  const queryClient = useQueryClient();
  const [draft, setDraft] = useState<ComplaintDraft | null>(null);
  const [commentInputs, setCommentInputs] = useState<Record<string, string>>({});

  const { data, isLoading, error } = useQuery({
    queryKey: ['complaints', 'user'],
    queryFn: () => fetchUserComplaints(token!),
    enabled: !!token,
  });

  const addCommentMutation = useMutation({
    mutationFn: ({ complaintId, content }: { complaintId: string; content: string }) =>
      addComplaintEvidence(token!, complaintId, content),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['complaints', 'user'] });
      setCommentInputs({});
    },
  });

  if (!token) {
    return (
      <div className="rounded-2xl border border-dashed border-orange-200 bg-white p-8 text-center text-gray-600">
        <AlertCircle className="mx-auto mb-3 h-10 w-10 text-orange-400" />
        <p>Vui lòng đăng nhập để quản lý khiếu nại.</p>
      </div>
    );
  }

  const complaints = data ?? [];

  const handleOpenNewComplaint = (preset?: ComplaintDraft) => {
    setDraft(
      preset ?? {
        type: 'PRODUCT_SHOP',
        meta: {
          channel: 'USER_CENTER',
          autoFill: { source: 'complaints-page' },
        },
      }
    );
  };

  const handleSubmitComment = (complaint: ComplaintRecord) => {
    const content = commentInputs[complaint.id];
    if (!content) return;
    addCommentMutation.mutate({ complaintId: complaint.id, content });
  };

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Khiếu nại & Báo cáo</h1>
            
          </div>
          <button
            onClick={() => handleOpenNewComplaint()}
            className="inline-flex items-center gap-2 rounded-xl bg-orange-500 px-4 py-2 text-sm font-medium text-white shadow hover:bg-orange-600"
          >
            <PlusCircle className="h-4 w-4" />
            Tạo khiếu nại
          </button>
        </div>

      </div>

      {isLoading && <p className="text-sm text-gray-500">Đang tải khiếu nại...</p>}
      {error && (
        <p className="text-sm text-red-500">
          {(error as Error).message || 'Không thể tải dữ liệu'}
        </p>
      )}

      {!isLoading && complaints.length === 0 && (
        <div className="rounded-2xl border border-dashed border-gray-200 bg-white p-8 text-center text-gray-500">
          Chưa có khiếu nại nào. Bạn có thể bắt đầu bằng nút &quot;Tạo khiếu nại&quot;.
        </div>
      )}
      <div className="space-y-4">
        {complaints.map((complaint) => (
          <ComplaintCard
            key={complaint.id}
            complaint={complaint}
          />
        ))}
      </div>
      <ComplaintModal
        open={!!draft}
        actor="USER"
        defaultValues={draft ?? undefined}
        onClose={() => setDraft(null)}
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ['complaints', 'user'] });
          setDraft(null);
        }}
      />
    </div>
  );
}
