import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ChevronDown, Search, PenSquare } from 'lucide-react';
import Avatar from '@/components/shared/Avatar';
import { useAuth } from '@/context/AuthContext';
import { useApi } from '@/hooks/useApi';

interface Conversation {
  user: {
    id: string;
    username: string;
    avatar: string;
  };
  lastMessage: {
    id: string;
    text: string;
    createdAt: string;
  };
  unread: boolean;
}

interface User {
  id: string;
  username: string;
  avatar: string;
  fullName: string;
}

function getTimeAgo(date: string): string {
  const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  
  if (seconds < 60) return 'now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h`;
  return `${Math.floor(seconds / 86400)}d`;
}

function formatMessagePreview(text: string): string {
  if (text.startsWith('data:audio')) return '🎤 Voice message';
  if (text.startsWith('data:image')) return '📷 Photo';
  // Check for shared content
  try {
    const data = JSON.parse(text);
    if (data.type === 'shared_post') return '📸 Shared a post';
    if (data.type === 'shared_story') return '📖 Shared a story';
    if (data.type === 'shared_reel') return '🎬 Shared a reel';
  } catch {
    // Not JSON
  }
  return text;
}

// Skeleton Component
function ConversationSkeleton() {
  return (
    <div className="flex items-center gap-3 px-4 py-3 animate-pulse">
      <div className="w-14 h-14 rounded-full bg-gray-200" />
      <div className="flex-1">
        <div className="w-24 h-4 bg-gray-200 rounded mb-2" />
        <div className="w-40 h-3 bg-gray-200 rounded" />
      </div>
    </div>
  );
}

export default function MessagesPage() {
  const { user } = useAuth();
  const { get } = useApi();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [showNewChat, setShowNewChat] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    const [convData, usersData] = await Promise.all([
      get<Conversation[]>('/api/messages'),
      get<User[]>('/api/users'),
    ]);
    
    if (convData) {
      setConversations(convData);
    }
    if (usersData) {
      setAllUsers(usersData.filter(u => u.id !== user?.id));
    }
    setIsLoading(false);
  };

  const filteredUsers = allUsers.filter(u => 
    u.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.fullName?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="bg-white min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <span className="font-bold text-lg">{user?.username || 'Messages'}</span>
          <ChevronDown className="w-4 h-4 text-gray-700" />
        </div>
        <button 
          onClick={() => setShowNewChat(!showNewChat)}
          className="p-1"
        >
          <PenSquare className="w-6 h-6 text-gray-700" />
        </button>
      </div>

      {/* Search Bar */}
      <div className="px-4 py-3">
        <div className="flex items-center gap-2 bg-gray-100 rounded-lg px-4 py-2.5">
          <Search className="w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1 bg-transparent text-sm outline-none"
          />
        </div>
      </div>

      {/* New Chat - User List */}
      {showNewChat && (
        <div className="border-b border-gray-100">
          <p className="px-4 py-2 text-sm font-semibold text-gray-500">Start new chat with:</p>
          <div className="max-h-48 overflow-y-auto">
            {filteredUsers.map((u) => (
              <Link 
                key={u.id} 
                href={`/chat/${u.id}`}
                className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50"
              >
                <Avatar src={u.avatar || 'https://i.pravatar.cc/150'} alt={u.username} size="md" />
                <div>
                  <p className="font-semibold text-sm">{u.username}</p>
                  <p className="text-xs text-gray-500">{u.fullName}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Your Note */}
      <div className="px-4 py-3 border-b border-gray-100 flex items-center gap-3">
        <Avatar src={user?.avatar || 'https://i.pravatar.cc/150?img=33'} size="md" />
        <span className="text-sm text-gray-500">Your note</span>
      </div>

      {/* Requests / Messages */}
      <div className="flex items-center justify-between px-4 py-3">
        <span className="font-semibold text-sm">Messages</span>
        <button className="text-blue-500 text-sm font-semibold">Requests</button>
      </div>

      {/* Message List */}
      <div className="pb-20">
        {isLoading ? (
          <>
            <ConversationSkeleton />
            <ConversationSkeleton />
            <ConversationSkeleton />
          </>
        ) : conversations.length === 0 ? (
          <div className="text-center text-gray-500 py-8">
            <p>No messages yet</p>
            <p className="text-sm">Click the pen icon to start a new chat!</p>
          </div>
        ) : (
          conversations.map((conv) => (
            <Link 
              key={conv.user.id} 
              href={`/chat/${conv.user.id}`}
              className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50"
            >
              <Avatar 
                src={conv.user.avatar || 'https://i.pravatar.cc/150'} 
                alt={conv.user.username} 
                size="lg" 
              />
              <div className="flex-1">
                <p className="font-semibold text-sm">{conv.user.username}</p>
<p className="text-xs text-gray-500">
                  <span className={conv.unread ? 'font-semibold text-gray-900' : ''}>
                    {formatMessagePreview(conv.lastMessage.text)}
                  </span>
                  {' • '}
                  {getTimeAgo(conv.lastMessage.createdAt)}
                </p>
              </div>
              {conv.unread && (
                <span className="w-2 h-2 bg-blue-500 rounded-full" />
              )}
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
