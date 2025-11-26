import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  getAllAdminThreads,
  getAdminThreadById,
  type AdminThreadFilters,
  type Thread,
  type Message,
} from "../../../api/adminapi/data/adminMessages";
import { Search, RefreshCw, MessageSquare, User, Store } from "lucide-react";

const THREAD_PAGE_SIZE = 20;
const MESSAGE_PAGE_SIZE = 50;

function formatDate(value?: string | null) {
  if (!value) return "";
  return new Date(value).toLocaleString("vi-VN");
}

export function AdminMessages() {
  const [filters, setFilters] = useState<AdminThreadFilters>({
    page: 1,
    limit: THREAD_PAGE_SIZE,
  });
  const [search, setSearch] = useState("");
  const [selectedThreadId, setSelectedThreadId] = useState<string | null>(null);
  const [messagePage, setMessagePage] = useState(1);

  const threadsQuery = useQuery({
    queryKey: ["admin-message-threads", filters],
    queryFn: () => getAllAdminThreads(filters),
    keepPreviousData: true,
  });

  const threadDetailQuery = useQuery({
    queryKey: ["admin-thread-detail", selectedThreadId, messagePage],
    queryFn: () => getAdminThreadById(selectedThreadId!, messagePage, MESSAGE_PAGE_SIZE),
    enabled: !!selectedThreadId,
    keepPreviousData: true,
  });

  // Apply search filter
  useEffect(() => {
    setFilters((prev) => ({
      ...prev,
      page: 1,
      search: search.trim() ? search.trim() : undefined,
    }));
  }, [search]);

  // Auto-select first thread for convenience
  useEffect(() => {
    if (threadsQuery.data?.items?.length) {
      const hasSelected = threadsQuery.data.items.some((thread) => thread.id === selectedThreadId);
      if (!hasSelected) {
        setSelectedThreadId(threadsQuery.data.items[0].id);
      }
    } else if (!threadsQuery.isLoading && !threadsQuery.isFetching) {
      setSelectedThreadId(null);
    }
  }, [threadsQuery.data, threadsQuery.isLoading, threadsQuery.isFetching, selectedThreadId]);

  // Reset pagination when switching threads
  useEffect(() => {
    setMessagePage(1);
  }, [selectedThreadId]);

  const activeThread = threadDetailQuery.data?.thread;
  const messages = useMemo(() => threadDetailQuery.data?.messages ?? [], [threadDetailQuery.data]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Quản lý tin nhắn</h1>
          <p className="text-sm text-gray-500">
            Theo dõi và kiểm tra toàn bộ cuộc trò chuyện giữa người mua và người bán.
          </p>
        </div>
        <button
          onClick={() => {
            threadsQuery.refetch();
            if (selectedThreadId) {
              threadDetailQuery.refetch();
            }
          }}
          className="inline-flex items-center gap-2 rounded-xl border px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          <RefreshCw className={`h-4 w-4 ${threadsQuery.isFetching || threadDetailQuery.isFetching ? "animate-spin" : ""}`} />
          Làm mới
        </button>
      </div>

      <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
        <section className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Tìm theo tên, email người mua/người bán..."
              className="w-full rounded-2xl border pl-10 pr-4 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
          </div>

          <div className="rounded-2xl border bg-white">
            <div className="border-b px-4 py-2 text-sm font-medium text-gray-600">
              Cuộc trò chuyện ({threadsQuery.data?.total ?? 0})
            </div>

            {threadsQuery.isLoading ? (
              <p className="p-4 text-sm text-gray-500">Đang tải danh sách...</p>
            ) : threadsQuery.data?.items.length ? (
              <ul className="max-h-[640px] divide-y overflow-y-auto">
                {threadsQuery.data.items.map((thread) => (
                  <ThreadListItem
                    key={thread.id}
                    thread={thread}
                    isActive={thread.id === selectedThreadId}
                    onSelect={() => setSelectedThreadId(thread.id)}
                  />
                ))}
              </ul>
            ) : (
              <p className="p-4 text-sm text-gray-500">Không tìm thấy cuộc trò chuyện nào.</p>
            )}
          </div>
        </section>

        <section className="rounded-2xl border bg-white p-4 min-h-[640px]">
          {!selectedThreadId ? (
            <div className="flex h-full flex-col items-center justify-center text-center text-gray-500">
              <MessageSquare className="h-12 w-12 text-blue-200" />
              <p className="mt-4 text-sm">Chọn một cuộc trò chuyện để xem chi tiết</p>
            </div>
          ) : threadDetailQuery.isLoading ? (
            <p className="text-sm text-gray-500">Đang tải tin nhắn...</p>
          ) : !activeThread ? (
            <p className="text-sm text-gray-500">Không tìm thấy thông tin cuộc trò chuyện.</p>
          ) : (
            <div className="flex h-full flex-col gap-4">
              <div className="rounded-2xl border bg-gray-50 p-4">
                <div className="flex flex-wrap items-center gap-4">
                  <ParticipantBadge
                    icon={User}
                    title="Người mua"
                    name={activeThread.user?.name ?? "Chưa cập nhật"}
                    email={activeThread.user?.email ?? "Không xác định"}
                  />
                  <ParticipantBadge
                    icon={Store}
                    title="Người bán"
                    name={activeThread.seller?.name ?? "Chưa cập nhật"}
                    email={activeThread.seller?.email ?? "Không xác định"}
                  />
                </div>
                <p className="mt-4 text-xs text-gray-500">
                  Bắt đầu: {formatDate(activeThread.created_at)} • Cập nhật cuối: {formatDate(activeThread.updated_at)}
                </p>
              </div>

              <div className="flex-1 overflow-y-auto rounded-2xl border bg-white p-4">
                {messages.length === 0 ? (
                  <p className="text-sm text-gray-500">Chưa có tin nhắn nào trong cuộc trò chuyện này.</p>
                ) : (
                  <div className="space-y-3">
                    {messages.map((message) => (
                      <MessageBubble key={message.id} message={message} />
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

interface ThreadListItemProps {
  thread: Thread;
  isActive: boolean;
  onSelect: () => void;
}

function ThreadListItem({ thread, isActive, onSelect }: ThreadListItemProps) {
  const lastMessage = thread.messages[0];
  return (
    <li>
      <button
        onClick={onSelect}
        className={`flex w-full flex-col gap-1 px-4 py-3 text-left transition ${
          isActive ? "bg-blue-50" : "hover:bg-gray-50"
        }`}
      >
        <div className="flex items-center justify-between text-sm font-semibold text-gray-800">
          <span>{thread.user?.name || thread.user?.email || "Người mua"}</span>
          <span className="text-xs font-normal text-gray-500">{formatDate(thread.updated_at)}</span>
        </div>
        <p className="text-xs text-gray-600">
          Người bán: <span className="font-medium">{thread.seller?.name ?? "Chưa cập nhật"}</span>
        </p>
        <p className="text-sm text-gray-500 line-clamp-2">
          {lastMessage?.content ? lastMessage.content : "Chưa có tin nhắn"}
        </p>
        <span className="text-xs text-gray-400">{thread._count.messages} tin nhắn</span>
      </button>
    </li>
  );
}

interface ParticipantBadgeProps {
  icon: typeof User;
  title: string;
  name: string;
  email: string;
}

function ParticipantBadge({ icon: Icon, title, name, email }: ParticipantBadgeProps) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border bg-white px-4 py-2">
      <Icon className="h-5 w-5 text-blue-500" />
      <div>
        <p className="text-xs uppercase tracking-wide text-gray-400">{title}</p>
        <p className="text-sm font-semibold text-gray-900">{name}</p>
        <p className="text-xs text-gray-500">{email}</p>
      </div>
    </div>
  );
}

function MessageBubble({ message }: { message: Message }) {
  const isUser = message.sender_type === "USER";
  const senderLabel = isUser ? message.user?.name || message.user?.email || "User" : message.seller?.name || "Seller";

  return (
    <div
      className={`rounded-2xl border px-4 py-3 ${
        isUser ? "border-blue-100 bg-blue-50" : "border-gray-200 bg-gray-50"
      }`}
    >
      <div className="flex items-center justify-between text-xs text-gray-500">
        <span className="font-semibold text-gray-700">
          {isUser ? "Người mua" : "Người bán"} • {senderLabel}
        </span>
        <span>{formatDate(message.created_at)}</span>
      </div>
      <p className="mt-2 whitespace-pre-wrap text-sm text-gray-800">{message.content || "[Tin nhắn hệ thống]"}</p>
      {message.attachments && (
        <pre className="mt-2 overflow-auto rounded-lg bg-white/70 p-2 text-xs text-gray-500">
          {JSON.stringify(message.attachments, null, 2)}
        </pre>
      )}
      {message.status && (
        <p className="mt-2 text-xs text-gray-400">
          Trạng thái: <span className="font-medium uppercase">{message.status}</span>
        </p>
      )}
    </div>
  );
}


