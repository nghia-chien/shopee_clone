import { useState, useEffect, useRef } from 'react';
import { useUserThreads, useUserMessages, useSendUserMessage } from '../../hooks/useChat';
import { useCreateThread } from '../../hooks/useChat';
import { parseSystemMessage, type Message, type SystemMessageContent } from '../../api/chat';
import { useAuthStore } from '../../store/auth';
import { X, Send, Minimize2, Maximize2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface ChatWidgetProps {
  sellerId?: string;
  sellerName?: string;
}

export function ChatWidget({ sellerId, sellerName }: ChatWidgetProps) {
  const { t } = useTranslation();
  const { user, token } = useAuthStore();
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [selectedThreadId, setSelectedThreadId] = useState<string | null>(null);
  const [message, setMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { data: threadsData } = useUserThreads();
  const createThread = useCreateThread();
  const { data: messagesData } = useUserMessages(selectedThreadId);
  const sendMessage = useSendUserMessage();

  const threads = threadsData?.threads || [];
  const messages = messagesData?.messages || [];

  // Auto scroll to bottom
  useEffect(() => {
    if (isOpen && !isMinimized) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen, isMinimized]);

  // Auto create thread if sellerId provided
  useEffect(() => {
    if (sellerId && token && threads.length > 0) {
      const existingThread = threads.find(t => t.seller_id === sellerId);
      if (existingThread) {
        setSelectedThreadId(existingThread.id);
      } else {
        createThread.mutate(sellerId, {
          onSuccess: (data) => {
            setSelectedThreadId(data.thread.id);
          },
        });
      }
    }
  }, [sellerId, threads, token]);

  const handleOpen = () => {
    setIsOpen(true);
    setIsMinimized(false);
  };

  const handleClose = () => {
    setIsOpen(false);
    setIsMinimized(false);
  };

  const handleSend = async () => {
    if (!message.trim() || !selectedThreadId) return;

    const content = message.trim();
    setMessage('');

    try {
      await sendMessage.mutateAsync({ threadId: selectedThreadId, content });
    } catch (error) {
      console.error('Error sending message:', error);
      setMessage(content);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const renderSystemMessage = (msg: Message) => {
    const systemContent = parseSystemMessage(msg.content || '');
    if (!systemContent) {
      return (
        <div className="flex justify-center my-2">
          <div className="bg-gray-100 text-gray-600 text-xs px-3 py-2 rounded-lg max-w-[80%]">
            {msg.content}
          </div>
        </div>
      );
    }

    return (
      <div className="flex justify-center my-2">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 max-w-[85%]">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-blue-600 font-semibold text-xs">
              {t('chat.system_message')}
            </span>
          </div>
          
          {systemContent.image && (
            <img
              src={systemContent.image}
              alt={systemContent.orderName}
              className="w-full h-20 object-cover rounded mb-2"
            />
          )}
          
          <div className="space-y-1">
            <div className="font-semibold text-gray-900 text-xs">{systemContent.orderName}</div>
            <div className="text-orange-500 font-bold text-sm">
              ₫{parseFloat(systemContent.price).toLocaleString('vi-VN')}
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-600">{t('chat.status')}:</span>
              <span
                className={`text-xs font-semibold ${
                  systemContent.statusCode === 'completed'
                    ? 'text-green-600'
                    : systemContent.statusCode === 'cancelled'
                    ? 'text-red-600'
                    : 'text-blue-600'
                }`}
              >
                {systemContent.status}
              </span>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderUserMessage = (msg: Message) => {
    const isOwnMessage = msg.sender_type === 'USER';

    return (
      <div
        className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'} my-1`}
        key={msg.id}
      >
        <div
          className={`max-w-[75%] px-3 py-2 rounded-lg text-xs ${
            isOwnMessage
              ? 'bg-orange-500 text-white'
              : 'bg-gray-200 text-gray-900'
          }`}
        >
          <div>{msg.content}</div>
          <div
            className={`text-[10px] mt-1 ${
              isOwnMessage ? 'text-orange-100' : 'text-gray-500'
            }`}
          >
            {new Date(msg.created_at).toLocaleTimeString('vi-VN', {
              hour: '2-digit',
              minute: '2-digit',
            })}
          </div>
        </div>
      </div>
    );
  };

  if (!token || !user) {
    return null;
  }

  return (
    <>
      {/* Chat Button */}
      {!isOpen && (
        <button
          onClick={handleOpen}
          className="fixed bottom-24 right-6 w-12 h-12 bg-blue-500 text-white rounded-full shadow-lg hover:bg-blue-600 transition flex items-center justify-center z-50"
          title="Chat với chúng tôi"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
        </button>
      )}

      {/* Chat Widget */}
      {isOpen && (
        <div
          className={`fixed bottom-6 right-6 bg-white rounded-lg shadow-2xl z-50 flex flex-col ${
            isMinimized ? 'w-80 h-14' : 'w-96 h-[600px]'
          } transition-all duration-300`}
        >
          {/* Header */}
          <div className="bg-blue-500 text-white p-3 rounded-t-lg flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center text-sm font-semibold">
                {sellerName?.charAt(0).toUpperCase() || 'S'}
              </div>
              <div>
                <div className="font-semibold text-sm">
                  {sellerName || t('chat.seller')}
                </div>
                <div className="text-xs text-blue-100">{t('chat.online')}</div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsMinimized(!isMinimized)}
                className="p-1 hover:bg-white/20 rounded transition"
              >
                {isMinimized ? (
                  <Maximize2 className="w-4 h-4" />
                ) : (
                  <Minimize2 className="w-4 h-4" />
                )}
              </button>
              <button
                onClick={handleClose}
                className="p-1 hover:bg-white/20 rounded transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {!isMinimized && (
            <>
              {/* Threads List (if no sellerId) */}
              {!sellerId && threads.length > 0 && !selectedThreadId && (
                <div className="flex-1 overflow-y-auto p-2">
                  {threads.map((thread) => (
                    <div
                      key={thread.id}
                      onClick={() => setSelectedThreadId(thread.id)}
                      className="p-3 border-b border-gray-100 cursor-pointer hover:bg-gray-50 transition"
                    >
                      <div className="flex items-center gap-2">
                        <div className="w-10 h-10 bg-orange-500 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                          {thread.seller?.name?.charAt(0).toUpperCase() || 'S'}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-semibold text-sm text-gray-900 truncate">
                            {thread.seller?.name || t('chat.seller')}
                          </div>
                          {thread.messages && thread.messages.length > 0 && (
                            <div className="text-xs text-gray-500 truncate">
                              {thread.messages[0].content || t('chat.system_message_preview')}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Messages Area */}
              {selectedThreadId && (
                <div className="flex-1 overflow-y-auto p-3 space-y-1 bg-gray-50">
                  {messages.length > 0 ? (
                    <>
                      {messages.map((msg) => {
                        if (msg.sender_type === 'SYSTEM') {
                          return renderSystemMessage(msg);
                        }
                        return renderUserMessage(msg);
                      })}
                      <div ref={messagesEndRef} />
                    </>
                  ) : (
                    <div className="flex justify-center items-center h-full text-gray-500 text-sm">
                      {t('chat.no_messages')}
                    </div>
                  )}
                </div>
              )}

              {/* Input Area */}
              {selectedThreadId && (
                <div className="border-t p-3 bg-white">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      onKeyPress={handleKeyPress}
                      placeholder={t('chat.type_message')}
                      className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      disabled={sendMessage.isPending}
                    />
                    <button
                      onClick={handleSend}
                      disabled={!message.trim() || sendMessage.isPending}
                      className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center gap-2 transition"
                    >
                      <Send className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}

              {/* No thread selected */}
              {!selectedThreadId && (!sellerId || threads.length === 0) && (
                <div className="flex-1 flex items-center justify-center text-gray-500 text-sm">
                  {t('chat.select_thread')}
                </div>
              )}
            </>
          )}
        </div>
      )}
    </>
  );
}

