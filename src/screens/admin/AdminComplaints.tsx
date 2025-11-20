import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Search, RefreshCw } from 'lucide-react';
import { useAdminAuthStore } from '../../store/AdminAuth';
import { fetchAdminComplaints, respondAdminComplaint } from '../../api/adminapi/complaints';
import { ComplaintCard } from '../../components/complaints/ComplaintCard';
import type { ComplaintStatus } from '../../types/complaints';
import type { AdminComplaintFilters } from '../../api/adminapi/complaints';

const STATUS_OPTIONS: ComplaintStatus[] = ['NEW', 'IN_PROGRESS', 'RESOLVED', 'REJECTED'];
const TYPE_OPTIONS = [
  { id: '', label: 'Tất cả nhóm' },
  { id: 'PRODUCT_SHOP', label: 'PRODUCT_SHOP' },
  { id: 'SELLER_USER', label: 'SELLER_USER' },
  { id: 'SYSTEM', label: 'SYSTEM' },
];

export function AdminComplaints() {
  const { token } = useAdminAuthStore();
  const queryClient = useQueryClient();
  const [filters, setFilters] = useState<AdminComplaintFilters>({});
  const [actionState, setActionState] = useState<
    Record<string, { status: ComplaintStatus; note: string; notifyTarget: 'USER' | 'SELLER' | 'BOTH' }>
  >({});

  const { data, isLoading, error, refetch, isFetching } = useQuery({
    queryKey: ['complaints', 'admin', filters],
    queryFn: () => fetchAdminComplaints(token!, filters),
    enabled: !!token,
  });

  const respondMutation = useMutation({
    mutationFn: ({
      complaintId,
      status,
      note,
      notifyTarget,
    }: {
      complaintId: string;
      status: ComplaintStatus;
      note: string;
      notifyTarget: 'USER' | 'SELLER' | 'BOTH';
    }) => respondAdminComplaint(token!, complaintId, { status, note, notifyTarget }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['complaints', 'admin'] });
    },
  });

  if (!token) {
    return <p className="text-sm text-gray-500">Vui lòng đăng nhập Admin để quản lý khiếu nại.</p>;
  }

  const complaints = data?.complaints ?? [];
  const overview = data?.overview ?? [];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Quản lý khiếu nại</h1>
          <p className="text-sm text-gray-500">
            Tổng quan trạng thái NEW / IN_PROGRESS / RESOLVED / REJECTED.
          </p>
        </div>
        <button
          onClick={() => refetch()}
          className="inline-flex items-center gap-2 rounded-xl border px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          <RefreshCw className={`h-4 w-4 ${isFetching ? 'animate-spin' : ''}`} />
          Làm mới
        </button>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {overview.map((item) => (
          <div key={item.status} className="rounded-2xl border bg-white p-4 shadow-sm">
            <p className="text-xs font-semibold uppercase text-gray-500">{item.status}</p>
            <p className="mt-1 text-3xl font-semibold text-gray-900">{item.total}</p>
          </div>
        ))}
      </div>

      <div className="rounded-2xl border bg-white p-4 shadow-sm">
        <div className="flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
            <input
              value={filters.q ?? ''}
              onChange={(e) => setFilters((prev) => ({ ...prev, q: e.target.value }))}
              placeholder="Tìm theo nội dung, user, seller"
              className="w-full rounded-xl border pl-9 pr-3 py-2 text-sm"
            />
          </div>
          <select
            value={filters.status ?? ''}
            onChange={(e) =>
              setFilters((prev) => ({ ...prev, status: (e.target.value as ComplaintStatus) || undefined }))
            }
            className="rounded-xl border px-3 py-2 text-sm"
          >
            <option value="">Tất cả trạng thái</option>
            {STATUS_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
          <select
            value={filters.type ?? ''}
            onChange={(e) =>
              setFilters((prev) => ({ ...prev, type: e.target.value || undefined }))
            }
            className="rounded-xl border px-3 py-2 text-sm"
          >
            {TYPE_OPTIONS.map((type) => (
              <option key={type.id} value={type.id}>
                {type.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {isLoading && <p className="text-sm text-gray-500">Đang tải dữ liệu...</p>}
      {error && <p className="text-sm text-red-500">{(error as Error).message}</p>}

      <div className="space-y-4">
        {complaints.map((complaint) => {
          const state =
            actionState[complaint.id] ?? {
              status: complaint.status,
              note: '',
              notifyTarget: 'USER',
            };

          return (
            <ComplaintCard
              key={complaint.id}
              complaint={complaint}
              role="ADMIN"
              actions={
                <div className="grid gap-3 md:grid-cols-3">
                  <div>
                    <label className="text-xs font-semibold text-gray-600">Trạng thái</label>
                    <select
                      value={state.status}
                      onChange={(e) =>
                        setActionState((prev) => ({
                          ...prev,
                          [complaint.id]: {
                            ...state,
                            status: e.target.value as ComplaintStatus,
                          },
                        }))
                      }
                      className="mt-1 w-full rounded-xl border px-3 py-2 text-sm"
                    >
                      {STATUS_OPTIONS.map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-600">Thông báo</label>
                    <select
                      value={state.notifyTarget}
                      onChange={(e) =>
                        setActionState((prev) => ({
                          ...prev,
                          [complaint.id]: {
                            ...state,
                            notifyTarget: e.target.value as 'USER' | 'SELLER' | 'BOTH',
                          },
                        }))
                      }
                      className="mt-1 w-full rounded-xl border px-3 py-2 text-sm"
                    >
                      <option value="USER">Chỉ User</option>
                      <option value="SELLER">Chỉ Seller</option>
                      <option value="BOTH">Cả User & Seller</option>
                    </select>
                  </div>
                  <div className="md:col-span-3">
                    <label className="text-xs font-semibold text-gray-600">Ghi chú</label>
                    <textarea
                      value={state.note}
                      onChange={(e) =>
                        setActionState((prev) => ({
                          ...prev,
                          [complaint.id]: { ...state, note: e.target.value },
                        }))
                      }
                      rows={3}
                      className="mt-1 w-full rounded-xl border px-3 py-2 text-sm"
                      placeholder="Quyết định / hướng dẫn..."
                    />
                  </div>
                  <div className="md:col-span-3 flex justify-end">
                    <button
                      disabled={respondMutation.isPending}
                      onClick={() =>
                        respondMutation.mutate({
                          complaintId: complaint.id,
                          status: state.status,
                          note: state.note,
                          notifyTarget: state.notifyTarget,
                        })
                      }
                      className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-300"
                    >
                      {respondMutation.isPending ? 'Đang cập nhật...' : 'Cập nhật'}
                    </button>
                  </div>
                </div>
              }
            />
          );
        })}

        {!isLoading && complaints.length === 0 && (
          <div className="rounded-2xl border border-dashed border-gray-200 bg-white p-8 text-center text-gray-500">
            Không tìm thấy khiếu nại phù hợp bộ lọc.
          </div>
        )}
      </div>
    </div>
  );
}
