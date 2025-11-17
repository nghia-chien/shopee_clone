import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useUserMessages, useSendUserMessage } from '../../hooks/useChat';
import { useSellerMessages, useSendSellerMessage } from '../../hooks/useChat';
import { parseSystemMessage, type Message, type SystemMessageContent } from '../../api/chat';
import { useAuthStore } from '../../store/auth';
import { useSellerAuthStore } from '../../store/SellerAuth';
import { Send } from 'lucide-react';

interface ChatBoxProps {
  threadId: string;
  isSeller?: boolean;
}

export function ChatBox({ threadId, isSeller = false }: ChatBoxProps) {
  const { t } = useTranslation();
  const [message, setMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { user } = useAuthStore();
  const { seller } = useSellerAuthStore();

  // Use appropriate hooks based on user type
  const { data: userMessagesData, isLoading: isLoadingUserMessages } = useUserMessages(
    !isSeller ? threadId : null
  );
  const { data: sellerMessagesData, isLoading: isLoadingSellerMessages } = useSellerMessages(
    isSeller ? threadId : null
  );

  const sendUserMessage = useSendUserMessage();
  const sendSellerMessage = useSendSellerMessage();

  const messages = isSeller ? sellerMessagesData?.messages : userMessagesData?.messages;
  const isLoading = isSeller ? isLoadingSellerMessages : isLoadingUserMessages;

  // Auto scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!message.trim()) return;

    const content = message.trim();
    setMessage('');

    try {
      if (isSeller) {
        await sendSellerMessage.mutateAsync({ threadId, content });
      } else {
        await sendUserMessage.mutateAsync({ threadId, content });
      }
    } catch (error) {
      console.error('Error sending message:', error);
      // Restore message on error
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
          <div className="bg-gray-100 text-gray-600 text-sm px-4 py-2 rounded-lg">
            {msg.content}
          </div>
        </div>
      );
    }

    return (
      <div className="flex justify-center my-4">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 max-w-md w-full">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-blue-600 font-semibold text-sm">
              {t('chat.system_message')}
            </span>
          </div>
          
          {systemContent.image && (
            <img
              src={systemContent.image}
              alt={systemContent.orderName}
              className="w-full h-32 object-cover rounded mb-3"
            />
          )}
          
          <div className="space-y-1">
            <div className="font-semibold text-gray-900">{systemContent.orderName}</div>
            <div className="text-orange-500 font-bold">
              ₫{parseFloat(systemContent.price).toLocaleString('vi-VN')}
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">{t('chat.status')}:</span>
              <span
                className={`text-sm font-semibold ${
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
    const isOwnMessage = isSeller
      ? msg.sender_type === 'SELLER'
      : msg.sender_type === 'USER';

    return (
      <div
        className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'} my-2`}
        key={msg.id}
      >
        <div
          className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
            isOwnMessage
              ? 'bg-orange-500 text-white'
              : 'bg-gray-200 text-gray-900'
          }`}
        >
          <div className="text-sm">{msg.content}</div>
          <div
            className={`text-xs mt-1 ${
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

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {isLoading ? (
          <div className="flex justify-center items-center h-full">
            <div className="text-gray-500">{t('chat.loading')}</div>
          </div>
        ) : messages && messages.length > 0 ? (
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
          <div className="flex justify-center items-center h-full text-gray-500">
            {t('chat.no_messages')}
          </div>
        )}
      </div>

      {/* Input Area */}
      <div className="border-t p-4">
        <div className="flex gap-2">
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={t('chat.type_message')}
            className="flex-1 border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
            disabled={sendUserMessage.isPending || sendSellerMessage.isPending}
          />
          <button
            onClick={handleSend}
            disabled={!message.trim() || sendUserMessage.isPending || sendSellerMessage.isPending}
            className="bg-orange-500 text-white px-6 py-2 rounded-lg hover:bg-orange-600 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center gap-2 transition"
          >
            <Send className="w-4 h-4" />
            {t('chat.send')}
          </button>
        </div>
      </div>
    </div>
  );
}

