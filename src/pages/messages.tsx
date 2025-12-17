import { ChevronDown, Search, PenSquare } from 'lucide-react';
import Avatar from '@/components/shared/Avatar';

interface Message {
  id: number;
  username: string;
  avatar: string;
  lastMessage: string;
  timeAgo: string;
  unread?: boolean;
}

const messages: Message[] = [
  {
    id: 1,
    username: 'cora.reily',
    avatar: 'https://i.pravatar.cc/150?img=5',
    lastMessage: 'vitae facilisis condimentum blandit ...',
    timeAgo: '10 hours',
    unread: true,
  },
  {
    id: 2,
    username: 'galgadot',
    avatar: 'https://i.pravatar.cc/150?img=9',
    lastMessage: '😊',
    timeAgo: '22 hours',
    unread: true,
  },
  {
    id: 3,
    username: 'anna.zak',
    avatar: 'https://i.pravatar.cc/150?img=16',
    lastMessage: 'Great!!',
    timeAgo: '1 day',
  },
  {
    id: 4,
    username: 'mergi',
    avatar: 'https://i.pravatar.cc/150?img=12',
    lastMessage: 'lacus hendrerit',
    timeAgo: '3 days',
  },
  {
    id: 5,
    username: 'madona',
    avatar: 'https://i.pravatar.cc/150?img=25',
    lastMessage: 'mattis',
    timeAgo: '1 week',
  },
  {
    id: 6,
    username: 'ran_danker123',
    avatar: 'https://i.pravatar.cc/150?img=8',
    lastMessage: 'Lorem ipsum arcu sapien prfeeas...',
    timeAgo: '3 weeks',
  },
  {
    id: 7,
    username: 'moshe_peretz',
    avatar: 'https://i.pravatar.cc/150?img=11',
    lastMessage: 'ullamcorper morbi',
    timeAgo: '17 weeks',
  },
  {
    id: 8,
    username: 'shakira',
    avatar: 'https://i.pravatar.cc/150?img=20',
    lastMessage: 'neque',
    timeAgo: '1 year',
  },
];

export default function MessagesPage() {
  return (
    <div className="bg-white min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
        <button className="p-1">
          <PenSquare className="w-6 h-6" />
        </button>
        <button className="flex items-center gap-1">
          <span className="font-semibold">orpaz_avdaev</span>
          <ChevronDown className="w-4 h-4" />
        </button>
        <div className="w-8" />
      </div>

      {/* Search */}
      <div className="px-4 py-3">
        <div className="flex items-center justify-between bg-gray-100 rounded-lg px-4 py-2.5">
          <span className="text-gray-400 text-sm">search</span>
          <Search className="w-4 h-4 text-gray-400" />
        </div>
      </div>

      {/* Your Note */}
      <div className="flex justify-end px-4 py-2">
        <div className="flex flex-col items-center">
          <Avatar src="https://i.pravatar.cc/150?img=33" size="lg" />
          <span className="text-xs text-gray-500 mt-1">your note</span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center justify-between px-4 py-2">
        <span className="text-sm text-gray-500">Requests</span>
        <span className="font-semibold text-sm">Messages</span>
      </div>

      {/* Messages List */}
      <div className="divide-y divide-gray-50">
        {messages.map((message) => (
          <button
            key={message.id}
            className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors"
          >
            {/* Unread indicator */}
            <div className="w-2 flex-shrink-0">
              {message.unread && (
                <div className="w-2 h-2 bg-blue-500 rounded-full" />
              )}
            </div>

            {/* Message content */}
            <div className="flex-1 min-w-0 text-right">
              <div className="flex items-center justify-end gap-2">
                <span className="text-xs text-gray-400">{message.timeAgo}</span>
                <span className="font-semibold text-sm">{message.username}</span>
              </div>
              {message.lastMessage && (
                <p className={`text-sm truncate ${message.unread ? 'text-gray-900 font-semibold' : 'text-gray-500'}`}>
                  {message.lastMessage}
                </p>
              )}
            </div>

            {/* Avatar */}
            <Avatar src={message.avatar} alt={message.username} size="md" />
          </button>
        ))}
      </div>
    </div>
  );
}

