import React, { useEffect, useRef, useState } from 'react';
import {
  X,
  Send,
  Minimize2,
  Maximize2,
  ArrowLeft,
  Search,
  ChevronDown,
  MessageSquare,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../../store/auth';
import {
  useUserThreads,
  useUserMessages,
  useSendUserMessage,
  useCreateThread,
} from '../../hooks/useChat';
import { parseSystemMessage, type Message } from '../../api/chat';
import { useChatWidgetStore } from "../../store/chatWidget";



export function ChatWidget() {
  const { open, sellerId, sellerName, closeChat, resetChat } = useChatWidgetStore();
  
  const { t } = useTranslation();
  const { user, token } = useAuthStore();

  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [selectedThreadId, setSelectedThreadId] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [message, setMessage] = useState('');

  const threadsQuery = useUserThreads();
  const createThread = useCreateThread();
  const messagesQuery = useUserMessages(selectedThreadId);
  const sendMessage = useSendUserMessage();

  const threads = threadsQuery.data?.threads || [];
  const messages = messagesQuery.data?.messages || [];

  const listRef = useRef<HTMLDivElement | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  // Auto scroll to bottom when messages change
  useEffect(() => {
    if (isOpen && !isMinimized) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen, isMinimized]);
useEffect(() => {
    console.log('ChatWidget: open changed to', open);
    console.log('ChatWidget: sellerId changed to', sellerId);
    
    if (open) {
      console.log('ChatWidget: Opening widget...');
      setIsOpen(true);
      setIsMinimized(false);
      
      // Reset selectedThreadId khi mở chat mới
      if (sellerId) {
        setSelectedThreadId(null);
      }
    } else {
      console.log('ChatWidget: Closing widget...');
      setIsOpen(false);
      setIsMinimized(false);
      setSelectedThreadId(null);
    }
  }, [open, sellerId]); 


    // FIX: Xử lý khi component unmount
  useEffect(() => {
    return () => {
      // Reset khi component unmount (tùy chọn)
      resetChat();
    };
  }, []);
// FIX: Hàm đóng widget - GỌI ĐÚNG STORE
  const handleCloseWidget = () => {
    console.log('ChatWidget: handleCloseWidget called');
    setIsOpen(false);
    setIsMinimized(false);
    setSelectedThreadId(null);
    closeChat(); // Gọi store
  };

 const handleOpenWidget = () => {
    console.log('ChatWidget: handleOpenWidget called');
    // Reset store state trước
    resetChat();
    // Sau đó mở
    setIsOpen(true);
    setIsMinimized(false);
  };


useEffect(() => {
    if (!token || !sellerId || !isOpen || threads.length === 0) return;
    
    console.log('ChatWidget: Looking for thread with seller', sellerId);
    
    // Tìm thread hiện có
    const existing = threads.find((t) => t.seller_id === sellerId);
    
    if (existing) {
      console.log('ChatWidget: Found existing thread', existing.id);
      setSelectedThreadId(existing.id);
    } else {
      console.log('ChatWidget: Creating new thread for', sellerId);
      createThread.mutate(sellerId, {
        onSuccess: (data) => {
          console.log('ChatWidget: Thread created', data.thread.id);
          setSelectedThreadId(data.thread.id);
        },
        onError: (error) => {
          console.error('ChatWidget: Error creating thread:', error);
        }
      });
    }
  }, [sellerId, threads, token, createThread, isOpen]); // THÊM isOpen

  if (!token || !user) return null;

  const formatTime = (iso?: string | null) => {
    if (!iso) return '';
    const d = new Date(iso);
    return d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
  };

  const getLastMessagePreview = (thread: any) => {
    const last = thread.messages?.[0];
    if (!last) return '';
    if (last.sender_type === 'SYSTEM') {
      const parsed = parseSystemMessage(last.content || '');
      if (parsed && parsed.orderName) return parsed.orderName;
      return last.content.slice(0, 60);
    }
    return last.content?.slice(0, 60) ?? '';
  };

  const openWidget = () => {
    setIsOpen(true);
    setIsMinimized(false);
    // focus search when opening and no selected thread
    setTimeout(() => {
      if (!selectedThreadId) {
        (document.getElementById('chat-search-input') as HTMLInputElement | null)?.focus();
      } else {
        inputRef.current?.focus();
      }
    }, 120);
  };

  const closeWidget = () => {
    setIsOpen(false);
    setIsMinimized(false);
    setSelectedThreadId(null);
  };

  const onThreadClick = (threadId: string) => {
    setSelectedThreadId(threadId);
    setTimeout(() => inputRef.current?.focus(), 120);
  };

  const handleSend = async () => {
    if (!message.trim() || !selectedThreadId) return;
    const content = message.trim();
    setMessage('');
    try {
      await sendMessage.mutateAsync({ threadId: selectedThreadId, content });
    } catch (err) {
      console.error(err);
      setMessage(content);
    }
  };

  const handleKeyDownInput: React.KeyboardEventHandler<HTMLInputElement> = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const renderSystemMessage = (msg: Message) => {
    const system = parseSystemMessage(msg.content || '');
    if (!system) {
      return (
        <div className="flex justify-center my-4" key={msg.id}>
          <div className="bg-gray-100 text-gray-600 text-xs px-3 py-2 rounded-lg max-w-[78%]">
            {msg.content}
          </div>
        </div>
      );
    }

    return (
      <div className="flex justify-center my-3" key={msg.id}>
        <div className="bg-white border border-gray-200 rounded-lg p-3 max-w-[86%] w-full">
          <div className="flex gap-3">
            {system.image ? (
              <img
                src={system.image}
                alt={system.orderName}
                className="w-16 h-16 rounded object-cover"
              />
            ) : (
              <div className="w-16 h-16 rounded bg-gray-100 flex items-center justify-center text-xs" />
            )}

            <div className="flex-1">
              <div className="text-xs text-gray-500 mb-1">{t('chat.order_info')}</div>
              <div className="font-semibold text-sm text-gray-800">{system.orderName}</div>
              <div className="mt-1">
                <span className="text-orange-500 font-bold">
                  ₫{parseFloat(system.price || '0').toLocaleString('vi-VN')}
                </span>
              </div>

              <div className="mt-2 text-xs flex items-center gap-2">
                <span className="text-gray-600">{t('chat.status')}:</span>
                <span
                  className={`font-semibold ${
                    system.statusCode === 'completed'
                      ? 'text-green-600'
                      : system.statusCode === 'cancelled'
                      ? 'text-red-600'
                      : 'text-blue-600'
                  }`}
                >
                  {system.status}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderMessageBubble = (msg: Message) => {
    const isOwn = msg.sender_type === 'USER';
    return (
      <div
        key={msg.id}
        className={`flex ${isOwn ? 'justify-end' : 'justify-start'} mb-3 px-3`}
      >
        <div
          className={`max-w-[72%] px-3 py-2 rounded-2xl text-xs break-words ${
            isOwn ? 'bg-orange-500 text-white rounded-br-none' : 'bg-white border border-gray-200 text-gray-800 rounded-bl-none'
          }`}
        >
          <div className="whitespace-pre-wrap">{msg.content}</div>
          <div className={`text-[10px] mt-1 ${isOwn ? 'text-orange-100' : 'text-gray-400'}`}>
            {formatTime(msg.created_at)}
          </div>
        </div>
      </div>
    );
  };

  // Filter threads by search query
  const visibleThreads = threads.filter((th) => {
    if (!query.trim()) return true;
    const name = th.seller?.name || '';
    const last = getLastMessagePreview(th);
    return (
      name.toLowerCase().includes(query.toLowerCase()) ||
      last.toLowerCase().includes(query.toLowerCase())
    );
  });

  // placeholder welcome illustration path (uploaded by user)
  const welcomeIllustration = '/mnt/data/2c691895-ea66-4309-aeae-94c44e03f7bc.png';

  return (
    <>
      {!isOpen && (
        <button
          onClick={handleOpenWidget} // Dùng hàm đã fix
          title={t('chat.open_chat') as string}
          className="fixed bottom-24 right-6 w-12 h-12 bg-orange-500 text-white rounded-full shadow-lg hover:bg-orange-600 transition flex items-center justify-center z-50"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
        </button>
      )}

      {isOpen && (
        <div
          className={`fixed bottom-6 right-6 bg-white rounded-lg shadow-2xl z-50 flex ${
            isMinimized ? 'w-80 h-14' : 'w-[900px] h-[560px]'
          } transition-all duration-300 overflow-hidden`}
        >
          {/* Left sidebar (threads) */}
          {!isMinimized && (
            <div className="w-[280px] border-r border-gray-200 bg-white flex flex-col">
              <div className="h-14 px-4 flex items-center justify-between border-b">
                <div className="flex items-center gap-3">
                  <div className="text-orange-500 font-bold text-xl">Chat</div>
                </div>
              </div>

              {/* Search & filter */}
              <div className="p-3 border-b">
                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <input
                      id="chat-search-input"
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      placeholder={t('chat.search_placeholder') as string}
                      className="w-full pl-10 pr-3 h-10 rounded border border-gray-200 text-sm focus:outline-none focus:ring-1 focus:ring-orange-300"
                    />
                  </div>

                </div>
              </div>

              {/* Threads list */}
              <div className="flex-1 overflow-y-auto" ref={listRef}>
                {threadsQuery.isLoading ? (
                  <div className="p-4 text-center text-gray-500">{t('chat.loading')}</div>
                ) : visibleThreads.length === 0 ? (
                  <div className="p-6 text-center text-gray-500">
                    <MessageSquare className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                    <div>{t('chat.no_threads')}</div>
                  </div>
                ) : (
                  visibleThreads.map((thread: any) => {
                    const last = thread.messages?.[0];
                    const isSelected = selectedThreadId === thread.id;
                    return (
                      <div
                        key={thread.id}
                        onClick={() => onThreadClick(thread.id)}
                        className={`p-3 border-b border-gray-100 cursor-pointer hover:bg-gray-50 transition flex items-start gap-3 ${
                          isSelected ? 'bg-orange-50 border-l-4 border-l-orange-500' : ''
                        }`}
                      >
                        <div className="w-11 h-11 flex-shrink-0 rounded-full bg-gray-100 overflow-hidden flex items-center justify-center text-sm font-semibold text-white text-center">
                          {thread.seller?.avatar ? (
                            <img src={thread.seller.avatar} alt={thread.seller?.name} className="w-full h-full object-cover" />
                          ) : (
                            <span className="text-orange-500">{(thread.seller?.name?.charAt(0) || 'S').toUpperCase()}</span>
                          )}
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <div className="font-medium text-gray-900 truncate">{thread.seller?.name || t('chat.seller')}</div>
                            <div className="text-xs text-gray-400 ml-2">
                              {last ? formatTime(last.created_at) : ''}
                            </div>
                          </div>

                          <div className="text-sm text-gray-600 truncate mt-1">
                            {getLastMessagePreview(thread) || t('chat.system_message_preview')}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}

          {/* Right main pane (chat area) */}
          <div className="flex-1 flex flex-col bg-gray-50">
            {/* Header */}
            <div className="h-14 border-b bg-white flex items-center justify-between px-4">
              <div className="flex items-center gap-3">
                {selectedThreadId ? (
                  <button
                    onClick={() => setSelectedThreadId(null)}
                    className="p-1 rounded hover:bg-gray-100"
                    title={t('chat.back') as string}
                  >
                    <ArrowLeft className="w-5 h-5 text-gray-600" />
                  </button>
                ) : (
                  <div className="w-5" />
                )}

                <div className="w-9 h-9 rounded-full bg-gray-200 overflow-hidden flex items-center justify-center">
                  {/* show selected seller avatar if available */}
                  {selectedThreadId ? (
                    (() => {
                      const sel = threads.find((t) => t.id === selectedThreadId);
                      if (sel?.seller?.avatar) {
                        return <img src={sel.seller.avatar} alt={sel.seller?.name} className="w-full h-full object-cover" />;
                      }
                      if (sel?.seller?.name) {
                        return (
                          <div className="text-sm font-semibold text-orange-500">
                            {sel.seller.name.charAt(0).toUpperCase()}
                          </div>
                        );
                      }
                      return null; // không có gì
                    })()
                  ) : (
                    sellerName ? (
                      <div className="text-sm font-semibold text-orange-500">
                        {sellerName.charAt(0).toUpperCase()}
                      </div>
                    ) : null // không có sellerName → không render gì
                  )}

                </div>

                <div>
                <div className="font-semibold text-gray-900 text-sm">
                  {selectedThreadId
                    ? threads.find((t) => t.id === selectedThreadId)?.seller?.name || null
                    : sellerName || null}
                </div>
                </div>  
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsMinimized(!isMinimized)}
                  className="p-1 rounded hover:bg-gray-100"
                >
                  {isMinimized ? <Maximize2 className="w-4 h-4 text-gray-600" /> : <Minimize2 className="w-4 h-4 text-gray-600" />}
                </button>

                <button onClick={handleCloseWidget} className="p-1 rounded hover:bg-gray-100">
                  <X className="w-4 h-4 text-gray-600" />
                </button>
              </div>
            </div>

            {/* Chat content or welcome */}
            {!selectedThreadId ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-6">

                <div className="text-lg font-semibold text-gray-800 mb-1">{t('chat.welcome_title')}</div>
                <div className="text-sm text-gray-400">{t('chat.welcome_subtitle')}</div>
              </div>
            ) : (
              <>
                <div className="flex-1 overflow-y-auto p-4">
                  <div className="space-y-2">
                    {messages.length === 0 && (
                      <div className="text-center text-gray-400 mt-8">{t('chat.start_conversation')}</div>
                    )}

                    {messages.map((msg: Message) => {
                      if (msg.sender_type === 'SYSTEM') return renderSystemMessage(msg);
                      return renderMessageBubble(msg);
                    })}

                    <div ref={messagesEndRef} />
                  </div>
                </div>

                {/* Input area */}
                <div className="border-t bg-white p-3">
                  <div className="flex items-center gap-3">
                    

                    <input
                      ref={inputRef}
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      onKeyDown={handleKeyDownInput}
                      placeholder={t('chat.type_message') as string}
                      className="flex-1 h-10 rounded-lg border border-gray-200 px-3 text-sm focus:outline-none focus:ring-1 focus:ring-orange-300"
                      // disabled={sendMessage.isLoading}
                    />

                    <button
                      onClick={handleSend}
                      // disabled={!message.trim() || sendMessage.isLoading}
                      className="w-10 h-10 rounded-lg flex items-center justify-center bg-orange-500 hover:bg-orange-600 text-white disabled:opacity-50"
                      title={t('chat.send')}
                    >
                      <Send className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
