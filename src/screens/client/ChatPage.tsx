// import { useState } from 'react';
// import { useUserThreads } from '../../hooks/useChat';
// import { ChatBox } from '../../components/chat/ChatBox';
// import { useTranslation } from 'react-i18next';
// import { MessageSquare } from 'lucide-react';
// import type { ChatThread } from '../../api/chat';
// import { ComplaintModal } from '../../components/complaints/ComplaintModal';
// import type { ComplaintDraft } from '../../types/complaints';

// export function ChatPage() {
//   const { t } = useTranslation();
//   const { data: threadsData, isLoading } = useUserThreads();
//   const [selectedThreadId, setSelectedThreadId] = useState<string | null>(null);
//   const [complaintDraft, setComplaintDraft] = useState<ComplaintDraft | null>(null);

//   const threads = threadsData?.threads || [];
//   const selectedThread = threads.find((t) => t.id === selectedThreadId);
//   const openChatComplaint = (thread: ChatThread) => {
//     setComplaintDraft({
//       type: 'SYSTEM',
//       seller_id: thread.seller?.id,
//       meta: {
//         issueCode: 'ORDER_FLOW',
//         reason: 'Vấn đề trong chat / trao đổi',
//         channel: 'CHAT',
//         context: { threadId: thread.id, sellerId: thread.seller?.id },
//         autoFill: { lastMessage: thread.messages?.[0]?.content },
//       },
//     });
//   };

//   const handleThreadClick = (threadId: string) => setSelectedThreadId(threadId);

//   const formatTime = (dateString: string) => {
//     const date = new Date(dateString);
//     const now = new Date();
//     const diff = now.getTime() - date.getTime();
//     const days = Math.floor(diff / (1000 * 60 * 60 * 24));

//     if (days === 0) return date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
//     if (days === 1) return t('chat.yesterday');
//     if (days < 7) return date.toLocaleDateString('vi-VN', { weekday: 'short' });
//     return date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' });
//   };

//   const getLastMessagePreview = (thread: ChatThread) => {
//     if (thread.messages?.length) {
//       const lastMsg = thread.messages[0];
//       if (lastMsg.sender_type === 'SYSTEM') return t('chat.system_message_preview');
//       return lastMsg.content || '';
//     }
//     return t('chat.no_messages');
//   };

//   return (
//     <>
//       <div className="bg-white rounded-lg border h-[600px] flex overflow-hidden">
//       {/* Threads List */}
//       <div className="w-80 border-r border-gray-200 flex flex-col">
//         <div className="p-4 border-b border-gray-200">
//           <h2 className="text-xl font-semibold text-gray-900">{t('chat.messages')}</h2>
//         </div>

//         <div className="flex-1 overflow-y-auto">
//           {isLoading ? (
//             <div className="p-4 text-center text-gray-500">{t('chat.loading')}</div>
//           ) : threads.length === 0 ? (
//             <div className="p-4 text-center text-gray-500">
//               <MessageSquare className="w-12 h-12 mx-auto mb-2 text-gray-300" />
//               <p>{t('chat.no_threads')}</p>
//             </div>
//           ) : (
//             threads.map((thread) => (
//               <div
//                 key={thread.id}
//                 onClick={() => handleThreadClick(thread.id)}
//                 className={`p-4 border-b border-gray-100 cursor-pointer hover:bg-gray-50 transition ${
//                   selectedThreadId === thread.id ? 'bg-orange-50 border-l-4 border-l-orange-500' : ''
//                 }`}
//               >
//                 <div className="flex items-start gap-3">
//                   <div className="w-12 h-12 bg-orange-500 rounded-full flex items-center justify-center text-white font-semibold">
//                     {thread.seller?.name?.charAt(0).toUpperCase() || 'S'}
//                   </div>
//                   <div className="flex-1 min-w-0">
//                     <div className="flex items-center justify-between mb-1">
//                       <h3 className="font-semibold text-gray-900 truncate">
//                         {thread.seller?.name || t('chat.seller')}
//                       </h3>
//                       {!!thread.messages?.length && thread.messages && (
//                         <span className="text-xs text-gray-500">
//                           {formatTime(thread.messages[0]?.created_at)}
//                         </span>
//                       )}
//                     </div>
//                     <p className="text-sm text-gray-600 truncate">{getLastMessagePreview(thread)}</p>
//                   </div>
//                 </div>
//               </div>
//             ))
//           )}
//         </div>
//       </div>

//       {/* Chat Area */}
//       <div className="flex-1 flex flex-col">
//         {selectedThread ? (
//           <>
//             <div className="p-4 border-b border-gray-200 bg-gray-50">
//               <div className="flex items-center justify-between gap-3">
//                 <div className="flex items-center gap-3">
//                 <div className="w-10 h-10 bg-orange-500 rounded-full flex items-center justify-center text-white font-semibold">
//                   {selectedThread.seller?.avatar || 'S'}
//                 </div>
//                 <div>
//                   <h3 className="font-semibold text-gray-900">{selectedThread.seller?.name || t('chat.seller')}</h3>
//                   <p className="text-xs text-gray-500">{t('chat.online')}</p>
//                 </div>
//                 </div>
//                 <button
//                   onClick={() => openChatComplaint(selectedThread)}
//                   className="rounded-full border border-gray-300 px-3 py-1 text-xs font-medium text-gray-600 hover:bg-white"
//                 >
//                   Báo cáo chat
//                 </button>
//               </div>
//             </div>
//             <div className="flex-1 min-h-0 overflow-y-auto">
//               <ChatBox threadId={selectedThread.id} />
//             </div>
//           </>
//         ) : (
//           <div className="flex-1 flex items-center justify-center text-gray-500">
//             <div className="text-center">
//               <MessageSquare className="w-16 h-16 mx-auto mb-4 text-gray-300" />
//               <p>{t('chat.select_thread')}</p>
//             </div>
//           </div>
//         )}
//       </div>
//       </div>
//       <ComplaintModal
//         actor="USER"
//         open={!!complaintDraft}
//         defaultValues={complaintDraft ?? undefined}
//         onClose={() => setComplaintDraft(null)}
//         onSuccess={() => setComplaintDraft(null)}
//       />
//     </>
//   );
// }