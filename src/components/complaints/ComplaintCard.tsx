import type { ComplaintRecord, ComplaintTimelineItem } from '../../types/complaints';
import { BadgeAlert, MessageSquareMore, PackageSearch, Clock, User, Store, Package, FileText, CheckCircle2, XCircle, AlertCircle } from 'lucide-react';
import type { ReactNode } from "react";

interface ComplaintCardProps {
  complaint: ComplaintRecord;
  role?: 'USER' | 'SELLER' | 'ADMIN';
  actions?: ReactNode;
}

const STATUS_CONFIG = {
  NEW: { label: 'Mới', color: 'orange', icon: AlertCircle },
  IN_PROGRESS: { label: 'Đang xử lý', color: 'blue', icon: Clock },
  RESOLVED: { label: 'Đã giải quyết', color: 'emerald', icon: CheckCircle2 },
  REJECTED: { label: 'Từ chối', color: 'red', icon: XCircle },
};

const TYPE_LABELS: Record<string, string> = {
  PRODUCT_SHOP: 'Sản phẩm / Shop',
  SELLER_USER: 'Seller → User',
  SYSTEM: 'Hệ thống',
};

function formatDate(date: string) {
  return new Date(date).toLocaleString('vi-VN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function Timeline({ items }: { items?: ComplaintTimelineItem[] }) {
  if (!items?.length) return null;

  return (
    <div className="mt-4 rounded-lg border border-gray-200 bg-gray-50 p-3">
      <p className="text-sm font-semibold text-gray-800 mb-3 flex items-center gap-2">
        <Clock className="h-4 w-4 text-gray-500" /> Lịch sử
      </p>
      <div className="space-y-2">
        {items.map((item, idx) => (
          <div key={idx} className="flex gap-2">
            {/* Dot timeline */}
            <div className="flex flex-col items-center mt-1">
              <span className="h-2 w-2 rounded-full bg-indigo-500 ring-2 ring-indigo-100" />
              {idx < items.length - 1 && <span className="w-px flex-1 bg-gray-300 my-1" />}
            </div>

            {/* Nội dung timeline */}
            <div className="flex-1 text-left text-sm">
              {/* Hàng trạng thái */}
              <div className="flex flex-wrap items-center gap-2">
                <p className="font-medium text-gray-900">{item.action}</p>
                <p className="text-xs text-gray-500">Bởi {item.by}</p>
                <p className="text-xs text-gray-400 flex items-center gap-1">
                  <Clock className="h-3 w-3" /> {formatDate(item.at)}
                </p>
              </div>

              {/* Hàng phản hồi/note */}
              {item.note && (
                <p className="mt-1 text-xs text-gray-700 bg-white rounded p-1 border border-gray-200">
                  {item.note}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}


export function ComplaintCard({ complaint, role = 'USER', actions }: ComplaintCardProps) {
  const meta = complaint.attachments;
  const statusConfig = STATUS_CONFIG[complaint.status as keyof typeof STATUS_CONFIG] || {
    label: complaint.status,
    color: 'gray',
    icon: AlertCircle,
  };
  const StatusIcon = statusConfig.icon;

  return (
    <div className="group relative overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm transition-all hover:shadow-lg">
      {/* Header gradient */}
      <div className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-${statusConfig.color}-400 to-${statusConfig.color}-600`} />

      <div className="p-6">
        {/* Top Section: Type & Status */}
        <div className="flex flex-wrap items-start justify-between gap-4 mb-5">
          <div className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-50 to-indigo-100">
              <PackageSearch className="h-5 w-5 text-indigo-600" />
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-900">
                {TYPE_LABELS[complaint.type] || complaint.type}
              </p>
              <p className="text-xs text-gray-500">ID: {complaint.id}</p>
            </div>
          </div>

          <div className={`flex items-center gap-2 rounded-full bg-${statusConfig.color}-50 px-4 py-2 ring-1 ring-${statusConfig.color}-200`}>
            <StatusIcon className={`h-4 w-4 text-${statusConfig.color}-600`} />
            <span className={`text-sm font-semibold text-${statusConfig.color}-700`}>
              {statusConfig.label}
            </span>
          </div>
        </div>

        {/* Product Info */}
        {complaint.product && (
          <div className="mb-4 flex items-start gap-3 rounded-xl bg-gray-50 p-4">
            <Package className="mt-0.5 h-5 w-5 flex-shrink-0 text-gray-400" />
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-gray-500">Sản phẩm</p>
              <p className="mt-1 font-semibold text-gray-900">{complaint.product.title}</p>
            </div>
          </div>
        )}

        {/* Main Content */}
        <div className="space-y-3">
          {meta?.reason && (
            <div className="rounded-lg bg-red-50 p-4 border-l-4 border-red-400">
              <p className="text-sm font-semibold text-red-900 mb-1">Vấn đề được báo cáo</p>
              <p className="text-sm text-red-700">{meta.reason}</p>
            </div>
          )}

          {complaint.description && (
            <div className="rounded-lg bg-gray-50 p-4">
              <p className="text-sm font-semibold text-gray-900 mb-2 flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Mô tả chi tiết
              </p>
              <p className="text-sm leading-relaxed text-gray-700">{complaint.description}</p>
            </div>
          )}

          {/* Metadata Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            {complaint.orders && (
              <div className="flex items-center gap-2 text-sm">
                <div className="h-8 w-8 rounded-lg bg-purple-50 flex items-center justify-center">
                  <FileText className="h-4 w-4 text-purple-600" />
                </div>
                <div>
                  <p className="text-xs text-gray-500">Mã đơn hàng</p>
                  <p className="font-semibold text-gray-900">{complaint.orders.id}</p>
                </div>
              </div>
            )}

            {complaint.seller && (
              <div className="flex items-center gap-2 text-sm">
                <div className="h-8 w-8 rounded-lg bg-amber-50 flex items-center justify-center">
                  <Store className="h-4 w-4 text-amber-600" />
                </div>
                <div>
                  <p className="text-xs text-gray-500">Shop</p>
                  <p className="font-semibold text-gray-900">{complaint.seller.name}</p>
                </div>
              </div>
            )}

            {complaint.user_complaints_user_idTouser && role !== 'USER' && (
              <div className="flex items-center gap-2 text-sm">
                <div className="h-8 w-8 rounded-lg bg-blue-50 flex items-center justify-center">
                  <User className="h-4 w-4 text-blue-600" />
                </div>
                <div>
                  <p className="text-xs text-gray-500">Người mua</p>
                  <p className="font-semibold text-gray-900">
                    {complaint.user_complaints_user_idTouser.name || complaint.user_complaints_user_idTouser.email}
                  </p>
                </div>
              </div>
            )}

            
          </div>
        </div>

        {/* Seller Response */}
        {meta?.responses?.seller && (
          <div className="mt-5 rounded-xl border-2 border-orange-200 bg-gradient-to-br from-orange-50 to-amber-50 p-4">
            <div className="flex items-start gap-3">
              <div className="h-8 w-8 rounded-lg bg-orange-200 flex items-center justify-center flex-shrink-0">
                <Store className="h-4 w-4 text-orange-700" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-bold text-orange-900">Phản hồi từ người bán</p>
                <p className="mt-2 text-sm text-orange-800 leading-relaxed">{meta.responses.seller.message}</p>
                {meta.responses.seller.updatedAt && (
                  <p className="mt-2 text-xs text-orange-600 flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {formatDate(meta.responses.seller.updatedAt)}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Admin Response */}
        {meta?.responses?.admin && (
          <div className="mt-5 rounded-xl border-2 border-emerald-200 bg-gradient-to-br from-emerald-50 to-teal-50 p-4">
            <div className="flex items-start gap-3">
              <div className="h-8 w-8 rounded-lg bg-emerald-200 flex items-center justify-center flex-shrink-0">
                <CheckCircle2 className="h-4 w-4 text-emerald-700" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-bold text-emerald-900">
                  Quyết định từ Admin {meta.responses.admin.actor && `- ${meta.responses.admin.actor}`}
                </p>
                {meta.responses.admin.note && (
                  <p className="mt-2 text-sm text-emerald-800 leading-relaxed">{meta.responses.admin.note}</p>
                )}
                {meta.responses.admin.updatedAt && (
                  <p className="mt-2 text-xs text-emerald-600 flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {formatDate(meta.responses.admin.updatedAt)}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}
        {/* Timeline */}
        <Timeline items={meta?.timeline} />

        {/* Actions */}
        {actions && (
          <div className="mt-5 pt-5 border-t border-gray-200">
            {actions}
          </div>
        )}

        {/* Footer */}
        <div className="mt-5 pt-4 border-t border-gray-200 flex flex-wrap items-center gap-4 text-xs text-gray-500">
          <div className="flex items-center gap-1.5">
            <BadgeAlert className="h-4 w-4" />
            <span>Tạo lúc: {formatDate(complaint.created_at)}</span>
          </div>
          {complaint.updated_at && (
            <div className="flex items-center gap-1.5">
              <Clock className="h-4 w-4" />
              <span>Cập nhật: {formatDate(complaint.updated_at)}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
