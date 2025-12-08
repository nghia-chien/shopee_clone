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
  });

  const threadDetailQuery = useQuery({
    queryKey: ["admin-thread-detail", selectedThreadId, messagePage],
    queryFn: () => getAdminThreadById(selectedThreadId!, messagePage, MESSAGE_PAGE_SIZE),
    enabled: !!selectedThreadId,
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
    <div className="h-screen flex flex-col bg-gradient-to-br from-gray-50 to-gray-100 p-1">
      {/* Header */}
      <div className="flex items-center justify-between mb-1">

        <button
          onClick={() => {
            threadsQuery.refetch();
            if (selectedThreadId) {
              threadDetailQuery.refetch();
            }
          }}
          className="inline-flex items-center gap-2 rounded-xl bg-white border border-gray-200 px-5 py-2.5 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 hover:shadow transition-all"
        >
          <RefreshCw className={`h-4 w-4 ${threadsQuery.isFetching || threadDetailQuery.isFetching ? "animate-spin" : ""}`} />
          Làm mới
        </button>
      </div>

      {/* Main Content */}
      <div className="flex-1 grid gap-6 lg:grid-cols-[380px_1fr] overflow-hidden">
        {/* Thread List Sidebar */}
        <section className="flex flex-col bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
          {/* Search Bar */}
          <div className="p-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Tìm theo tên, email..."
                className="w-full rounded-xl border-0 pl-11 pr-4 py-3 text-sm shadow-sm ring-1 ring-gray-300 focus:ring-2 focus:ring-blue-500 transition-all"
              />
            </div>
          </div>

          {/* Thread Count */}
          <div className="px-4 py-3 border-b border-gray-200 bg-gray-50">
            <p className="text-sm font-semibold text-gray-700">
              Cuộc trò chuyện
              <span className="ml-2 inline-flex items-center justify-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-800">
                {threadsQuery.data?.total ?? 0}
              </span>
            </p>
          </div>

          {/* Thread List */}
          <div className="flex-1 overflow-y-auto">
            {threadsQuery.isLoading ? (
              <div className="flex items-center justify-center h-40">
                <div className="text-center">
                  <RefreshCw className="h-8 w-8 animate-spin text-blue-500 mx-auto mb-2" />
                  <p className="text-sm text-gray-500">Đang tải danh sách...</p>
                </div>
              </div>
            ) : threadsQuery.data?.items.length ? (
              <ul className="divide-y divide-gray-100">
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
              <div className="flex flex-col items-center justify-center h-40 text-gray-400">
                <MessageSquare className="h-12 w-12 mb-3" />
                <p className="text-sm">Không tìm thấy cuộc trò chuyện nào</p>
              </div>
            )}
          </div>
        </section>

        {/* Messages Panel */}
        <section className="flex flex-col bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
          {!selectedThreadId ? (
            <div className="flex-1 flex flex-col items-center justify-center text-gray-400">
              <MessageSquare className="h-20 w-20 mb-4 text-gray-300" />
              <p className="text-lg font-medium text-gray-500">Chọn một cuộc trò chuyện</p>
              <p className="text-sm text-gray-400 mt-1">để xem chi tiết tin nhắn</p>
            </div>
          ) : threadDetailQuery.isLoading ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <RefreshCw className="h-8 w-8 animate-spin text-blue-500 mx-auto mb-2" />
                <p className="text-sm text-gray-500">Đang tải tin nhắn...</p>
              </div>
            </div>
          ) : !activeThread ? (
            <div className="flex-1 flex items-center justify-center">
              <p className="text-sm text-gray-500">Không tìm thấy thông tin cuộc trò chuyện</p>
            </div>
          ) : (
            <>
              {/* Thread Info Header */}
              <div className="p-5 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
                <div className="flex flex-wrap gap-4 mb-4">
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
                <div className="flex items-center gap-4 text-xs text-gray-600">
                  <span className="flex items-center gap-1">
                    <span className="font-medium">Bắt đầu:</span>
                    <span>{formatDate(activeThread.created_at)}</span>
                  </span>
                  <span className="text-gray-300">•</span>
                  <span className="flex items-center gap-1">
                    <span className="font-medium">Cập nhật:</span>
                    <span>{formatDate(activeThread.updated_at)}</span>
                  </span>
                </div>
              </div>

              {/* Messages Area */}
              <div className="flex-1 overflow-y-auto p-5 bg-gray-50">
                {messages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-gray-400">
                    <MessageSquare className="h-12 w-12 mb-3" />
                    <p className="text-sm">Chưa có tin nhắn nào trong cuộc trò chuyện này</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {messages.map((message) => (
                      <MessageBubble key={message.id} message={message} />
                    ))}
                  </div>
                )}
              </div>
            </>
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
  interface PreviewMessage {
    content?: string | null;
  }
  // Helper function để tạo preview text
  const getPreviewText = (message?: PreviewMessage): string => {
    if (!message?.content) return "Chưa có tin nhắn";
    
    try {
      // Kiểm tra nếu content là JSON string
      const trimmed = message.content.trim();
      if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
        const parsed = JSON.parse(trimmed);
        
        // Nếu là order_update
        if (parsed.type === 'order_update') {
          const productName = parsed.orderName || parsed.name || 'Sản phẩm';
          const status = parsed.status || parsed.statusCode || '';
          
          // Giới hạn tên sản phẩm (ví dụ: 40 ký tự)
          const limitedName = productName.length > 40 
            ? productName.substring(0, 40) + '...' 
            : productName;
          
          return status 
            ? `${limitedName} / ${status}`
            : limitedName;
        }
        
        // Nếu là JSON khác có name và status
        if (parsed.name || parsed.orderName) {
          const productName = parsed.orderName || parsed.name || 'Sản phẩm';
          const status = parsed.status || parsed.statusCode || '';
          
          const limitedName = productName.length > 40 
            ? productName.substring(0, 40) + '...' 
            : productName;
          
          return status 
            ? `${limitedName} / ${status}`
            : limitedName;
        }
      }
      
      // Nếu không phải JSON hoặc không có thông tin cần, hiển thị content bình thường
      return message.content.length > 100 
        ? message.content.substring(0, 100) + '...'
        : message.content;
      
    } catch (err) {
      // Nếu parse lỗi, hiển thị content bình thường
      return message.content.length > 100 
        ? message.content.substring(0, 100) + '...'
        : message.content;
    }
  };
  return (
    <li>
      <button
        onClick={onSelect}
        className={`flex w-full flex-col gap-2 px-4 py-4 text-left transition-all ${
          isActive 
            ? "bg-gradient-to-r from-blue-50 to-indigo-50 border-l-4 border-blue-500" 
            : "hover:bg-gray-50"
        }`}
      >
        <div className="flex items-center justify-between">
          <span className="text-sm font-bold text-gray-900 truncate flex-1">
            {thread.user?.name || thread.user?.email || "Người mua"}
          </span>
          <span className="text-xs text-gray-500 ml-2 flex-shrink-0">
            {formatDate(thread.updated_at)}
          </span>
        </div>
        
        <div className="flex items-center gap-2">
          <Store className="h-3.5 w-3.5 text-gray-400 flex-shrink-0" />
          <p className="text-xs text-gray-600 truncate">
            {thread.seller?.name ?? "Chưa cập nhật"}
          </p>
        </div>
        
        <p className="text-sm text-gray-600 line-clamp-2 leading-relaxed">
          {getPreviewText(lastMessage)}
        </p>
        
        <div className="flex items-center gap-2 mt-1">
          <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-700">
            {thread._count.messages} tin nhắn
          </span>
        </div>
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
    <div className="flex items-start gap-3 rounded-xl bg-white border border-gray-200 shadow-sm px-4 py-3 flex-1 min-w-0">
      <div className="flex-shrink-0">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-blue-100 to-indigo-100">
          <Icon className="h-5 w-5 text-blue-600" />
        </div>
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1">
          {title}
        </p>
        <p className="text-sm font-bold text-gray-900 truncate">{name}</p>
        <p className="text-xs text-gray-600 truncate mt-0.5">{email}</p>
      </div>
    </div>
  );
}

function MessageBubble({ message }: { message: Message }) {
  const isUser = message.sender_type === "USER";
  const senderLabel = isUser ? message.user?.name || message.user?.email || "User" : message.seller?.name || "Seller";

  // DEBUG: Log toàn bộ message để xem cấu trúc thực tế
  console.log('=== DEBUG MessageBubble ===');
  console.log('Message ID:', message.id);
  console.log('Message content:', message.content);
  console.log('Attachments type:', typeof message.attachments);
  console.log('Attachments raw:', message.attachments);
  console.log('Is attachments array?', Array.isArray(message.attachments));
  console.log('===========================');

  // Parse content hoặc attachments với logging chi tiết
  const renderAttachments = () => {
    console.log('=== DEBUG renderAttachments ===');
    console.log('Message content type:', typeof message.content);
    
    // TH1: content chứa JSON
    try {
      // Kiểm tra nếu content là JSON string
      if (message.content && typeof message.content === 'string') {
        const trimmedContent = message.content.trim();
        
        // Kiểm tra xem có phải JSON không (bắt đầu bằng { và kết thúc bằng })
        if (trimmedContent.startsWith('{') && trimmedContent.endsWith('}')) {
          console.log('Content appears to be JSON, parsing...');
          try {
            const parsedContent = JSON.parse(trimmedContent);
            console.log('Parsed content:', parsedContent);
            
            return (
              <>
                {/* Không hiển thị content text vì nó là JSON */}
                <div className="mt-3">
                  <AttachmentCard 
                    attachment={parsedContent}
                    index={0}
                  />
                </div>
              </>
            );
          } catch (parseError) {
            console.log('Content is not valid JSON, treating as normal text');
            // Không làm gì, sẽ xử lý ở phần dưới
          }
        }
      }
      
      // TH2: attachments có dữ liệu
      if (message.attachments) {
        console.log('Processing attachments...');
        
        let parsedAttachments;
        
        if (typeof message.attachments === 'string') {
          console.log('Attachments is string, parsing JSON...');
          try {
            parsedAttachments = JSON.parse(message.attachments);
          } catch (parseError) {
            console.error('JSON parse error:', parseError);
            return (
              <div className="mt-2 rounded-lg border border-red-300 bg-red-50 p-3">
                <p className="text-sm font-medium text-red-800">Lỗi phân tích JSON</p>
                <pre className="mt-2 overflow-auto text-xs text-red-600">
                  {message.attachments}
                </pre>
              </div>
            );
          }
        } else if (typeof message.attachments === 'object') {
          console.log('Attachments is already object');
          parsedAttachments = message.attachments;
        } else {
          console.log('Attachments has unexpected type:', typeof message.attachments);
          return null;
        }
        
        // DEBUG: Log cấu trúc parsed
        console.log('Parsed structure:', {
          isArray: Array.isArray(parsedAttachments),
          keys: Object.keys(parsedAttachments),
          fullObject: parsedAttachments
        });
        
        // Hiển thị attachments
        return (
          <div className="mt-3">
            {Array.isArray(parsedAttachments) ? (
              <div className="space-y-2">
                {parsedAttachments.map((attachment, index) => (
                  <AttachmentCard 
                    key={index} 
                    attachment={attachment} 
                    index={index}
                  />
                ))}
              </div>
            ) : (
              <AttachmentCard 
                attachment={parsedAttachments} 
                index={0}
              />
            )}
          </div>
        );
      }
      
      // TH3: Không có attachments, content là text bình thường
      console.log('No attachments found');
      return null;
      
    } catch (err) {
      console.error('Unexpected error in renderAttachments:', err);
      const errorMessage = err instanceof Error 
        ? err.message 
        : typeof err === 'string' 
          ? err 
          : 'Đã xảy ra lỗi không xác định';
      
      return (
        <div className="mt-2 rounded-lg border border-red-300 bg-red-50 p-3">
          <p className="text-sm font-medium text-red-800">Lỗi xử lý đính kèm</p>
          <p className="mt-1 text-xs text-red-600">{errorMessage}</p>
        </div>
      );
    }
  };

  // Kiểm tra nếu content là JSON để quyết định hiển thị
  const shouldShowContent = () => {
    if (!message.content || typeof message.content !== 'string') {
      return true;
    }
    
    const trimmed = message.content.trim();
    return !(trimmed.startsWith('{') && trimmed.endsWith('}'));
  };

  return (
    <div
      className={`rounded-2xl shadow-sm border px-5 py-4 ${
        isUser 
          ? "bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200" 
          : "bg-white border-gray-200"
      }`}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className={`flex h-7 w-7 items-center justify-center rounded-full ${
            isUser ? "bg-blue-500" : "bg-gray-500"
          }`}>
            {isUser ? (
              <User className="h-4 w-4 text-white" />
            ) : (
              <Store className="h-4 w-4 text-white" />
            )}
          </div>
          <div>
            <span className="text-xs font-semibold text-gray-700">
              {isUser ? "Người mua" : "Người bán"}
            </span>
            <span className="text-xs text-gray-500 ml-2">{senderLabel}</span>
          </div>
        </div>
        <span className="text-xs text-gray-500">{formatDate(message.created_at)}</span>
      </div>
      
      {/* Chỉ hiển thị content nếu không phải JSON */}
      {shouldShowContent() && (
        <p className="whitespace-pre-wrap text-sm text-gray-800 leading-relaxed">
          {message.content || "[Tin nhắn hệ thống]"}
        </p>
      )}
      
      {renderAttachments()}
      
      {message.status && (
        <div className="mt-3 pt-3 border-t border-gray-200">
          <span className="inline-flex items-center rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-700">
            Trạng thái: <span className="ml-1 uppercase font-semibold">{message.status}</span>
          </span>
        </div>
      )}
    </div>
  );
}

interface AttachmentCardProps {
  attachment: any;
  index: number;
}

function AttachmentCard({ attachment }: AttachmentCardProps) {
  const { type, orderId, orderName, price, image, status, statusCode } = attachment;
  
  // Nếu là order_update type, hiển thị card đặc biệt
  if (type === 'order_update') {
    return (
      <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
        <div className="bg-gradient-to-r from-blue-500 to-indigo-500 px-4 py-2 flex items-center justify-between">
          <span className="text-xs font-semibold text-white">
            📦 Cập nhật đơn hàng
          </span>
          {statusCode && (
            <span className="rounded-full bg-white/20 backdrop-blur-sm px-3 py-1 text-xs font-medium text-white">
              {statusCode}
            </span>
          )}
        </div>
        
        <div className="p-4">
          <div className="flex gap-4">
            {image && (
              <div className="flex-shrink-0">
                <img 
                  src={image} 
                  alt={orderName} 
                  className="h-20 w-20 rounded-lg object-cover border border-gray-200 shadow-sm"
                />
              </div>
            )}
            
            <div className="flex-1 min-w-0 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-xs font-medium text-gray-500 mb-1">Mã đơn hàng</p>
                  <p className="text-sm font-bold text-gray-900 truncate">{orderId}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-500 mb-1">Trạng thái</p>
                  <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-semibold text-green-800">
                    {status}
                  </span>
                </div>
              </div>
              
              <div>
                <p className="text-xs font-medium text-gray-500 mb-1">Tên sản phẩm</p>
                <p className="text-sm font-semibold text-gray-900 line-clamp-2 leading-relaxed">
                  {orderName}
                </p>
              </div>
              
              {price && (
                <div>
                  <p className="text-xs font-medium text-gray-500 mb-1">Giá tiền</p>
                  <p className="text-lg font-bold text-blue-600">
                    {parseInt(price).toLocaleString('vi-VN')}₫
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Fallback cho các loại attachments khác
  return (
    <div className="rounded-xl border border-gray-200 bg-white shadow-sm p-4">
      <div className="grid grid-cols-2 gap-4">
        {attachment.id && (
          <div>
            <p className="text-xs font-medium text-gray-500 mb-1">ID</p>
            <p className="text-sm font-semibold text-gray-900 truncate">{attachment.id}</p>
          </div>
        )}
        
        {attachment.status && (
          <div>
            <p className="text-xs font-medium text-gray-500 mb-1">Trạng thái</p>
            <span className="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-semibold text-blue-800">
              {attachment.status}
            </span>
          </div>
        )}
        
        {attachment.name && (
          <div className="col-span-2">
            <p className="text-xs font-medium text-gray-500 mb-1">Tên</p>
            <p className="text-sm font-semibold text-gray-900">{attachment.name}</p>
          </div>
        )}
        
        {attachment.images && (
          <div className="col-span-2">
            <p className="text-xs font-medium text-gray-500 mb-2">Hình ảnh</p>
            <div className="flex gap-2 overflow-x-auto pb-2">
              {(Array.isArray(attachment.images) ? attachment.images : [attachment.images]).map((img: string, index: number) => (
                <img 
                  key={index}
                  src={img} 
                  alt={`Attachment ${index + 1}`}
                  className="h-20 w-20 rounded-lg object-cover flex-shrink-0 border border-gray-200 shadow-sm"
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}