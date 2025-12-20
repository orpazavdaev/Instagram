import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { ChevronLeft, Phone, Video, Send, Image, Mic, Heart } from 'lucide-react';
import Avatar from '@/components/shared/Avatar';
import { useAuth } from '@/context/AuthContext';
import { useApi } from '@/hooks/useApi';

interface Message {
  id: string;
  text: string;
  createdAt: string;
  sender: {
    id: string;
    username: string;
    avatar: string;
  };
}

interface UserInfo {
  id: string;
  username: string;
  avatar: string;
  fullName: string;
}

// Skeleton Components
function MessageSkeleton({ isOwn }: { isOwn: boolean }) {
  return (
    <div className={`flex mb-3 ${isOwn ? 'justify-end' : 'justify-start'} animate-pulse`}>
      {!isOwn && <div className="w-6 h-6 rounded-full bg-gray-200 mr-2" />}
      <div className={`${isOwn ? 'w-48' : 'w-40'} h-10 rounded-3xl bg-gray-200`} />
    </div>
  );
}

export default function ChatPage() {
  const router = useRouter();
  const { userId } = router.query;
  const { user } = useAuth();
  const { get, post: apiPost } = useApi();
  
  const [messages, setMessages] = useState<Message[]>([]);
  const [partner, setPartner] = useState<UserInfo | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (userId) {
      loadData();
    }
  }, [userId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadData = async () => {
    setIsLoading(true);
    const [messagesData, users] = await Promise.all([
      get<Message[]>(`/api/messages/${userId}`),
      get<UserInfo[]>('/api/users'),
    ]);
    
    if (messagesData) {
      setMessages(messagesData);
    }
    if (users) {
      const found = users.find(u => u.id === userId);
      if (found) {
        setPartner(found);
      }
    }
    setIsLoading(false);
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newMessage.trim() || !userId) return;
    
    // Optimistic update
    const optimisticMessage: Message = {
      id: `temp-${Date.now()}`,
      text: newMessage,
      createdAt: new Date().toISOString(),
      sender: {
        id: user?.id || '',
        username: user?.username || '',
        avatar: user?.avatar || '',
      },
    };
    setMessages([...messages, optimisticMessage]);
    setNewMessage('');
    setIsSubmitting(true);
    
    const result = await apiPost<Message>(`/api/messages/${userId}`, {
      text: optimisticMessage.text,
    });
    
    if (result) {
      // Replace optimistic message with real one
      setMessages(prev => prev.map(m => m.id === optimisticMessage.id ? result : m));
    }
    
    setIsSubmitting(false);
  };

  return (
    <div className="bg-white min-h-screen flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <Link href="/messages" className="p-1">
            <ChevronLeft className="w-6 h-6 text-gray-700" />
          </Link>
          {isLoading ? (
            <div className="flex items-center gap-3 animate-pulse">
              <div className="w-8 h-8 rounded-full bg-gray-200" />
              <div>
                <div className="w-20 h-4 bg-gray-200 rounded mb-1" />
                <div className="w-16 h-3 bg-gray-200 rounded" />
              </div>
            </div>
          ) : (
            <>
              <Avatar 
                src={partner?.avatar || 'https://i.pravatar.cc/150'} 
                alt={partner?.username || 'User'} 
                size="sm" 
              />
              <div>
                <p className="font-semibold text-sm">{partner?.username || 'User'}</p>
                <p className="text-xs text-gray-500">Active now</p>
              </div>
            </>
          )}
        </div>
        <div className="flex items-center gap-4">
          <button className="p-1">
            <Phone className="w-5 h-5 text-gray-700" />
          </button>
          <button className="p-1">
            <Video className="w-5 h-5 text-gray-700" />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 pb-20">
        {isLoading ? (
          <>
            <MessageSkeleton isOwn={false} />
            <MessageSkeleton isOwn={true} />
            <MessageSkeleton isOwn={false} />
            <MessageSkeleton isOwn={true} />
          </>
        ) : messages.length === 0 ? (
          <div className="text-center text-gray-500 py-8">
            <Avatar 
              src={partner?.avatar || 'https://i.pravatar.cc/150'} 
              size="xxl" 
            />
            <p className="font-semibold mt-4">{partner?.fullName || partner?.username || 'User'}</p>
            <p className="text-sm text-gray-400">@{partner?.username || 'user'}</p>
            <p className="text-sm mt-4">Start a conversation!</p>
          </div>
        ) : (
          messages.map((message) => {
            const isOwn = message.sender.id === user?.id;
            return (
              <div 
                key={message.id} 
                className={`flex mb-3 ${isOwn ? 'justify-end' : 'justify-start'}`}
              >
                {!isOwn && (
                  <Avatar 
                    src={message.sender.avatar || 'https://i.pravatar.cc/150'} 
                    size="xs" 
                  />
                )}
                <div 
                  className={`max-w-[70%] px-4 py-2 rounded-3xl ${
                    isOwn 
                      ? 'bg-blue-500 text-white' 
                      : 'bg-gray-100 text-gray-900 ml-2'
                  }`}
                >
                  <p className="text-sm">{message.text}</p>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <form 
        onSubmit={handleSendMessage}
        className="fixed bottom-0 left-0 right-0 border-t border-gray-100 p-3 flex items-center gap-3 bg-white max-w-[430px] mx-auto"
      >
        <button type="button" className="p-2 bg-blue-500 rounded-full">
          <Image className="w-5 h-5 text-white" />
        </button>
        <div className="flex-1 flex items-center bg-gray-100 rounded-full px-4 py-2">
          <input
            type="text"
            placeholder="Message..."
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            className="flex-1 bg-transparent border-none focus:ring-0 text-sm outline-none"
          />
        </div>
        {newMessage.trim() ? (
          <button 
            type="submit"
            disabled={isSubmitting}
            className="p-2 text-blue-500"
          >
            <Send className="w-5 h-5" />
          </button>
        ) : (
          <>
            <button type="button" className="p-2">
              <Mic className="w-5 h-5 text-gray-700" />
            </button>
            <button type="button" className="p-2">
              <Heart className="w-5 h-5 text-gray-700" />
            </button>
          </>
        )}
      </form>
    </div>
  );
}
