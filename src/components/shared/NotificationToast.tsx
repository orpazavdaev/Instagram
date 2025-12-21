import { useEffect, useState } from 'react';
import Link from 'next/link';
import { X, Heart, UserPlus, MessageCircle } from 'lucide-react';
import Avatar from './Avatar';
import { useNotifications } from '@/context/NotificationContext';

function getIcon(type: string) {
  switch (type) {
    case 'post_like':
    case 'reel_like':
    case 'story_like':
      return <Heart className="w-4 h-4 text-red-500 fill-red-500" />;
    case 'new_follower':
      return <UserPlus className="w-4 h-4 text-blue-500" />;
    case 'comment':
      return <MessageCircle className="w-4 h-4 text-green-500" />;
    default:
      return null;
  }
}

export default function NotificationToast() {
  const { showToast, dismissToast } = useNotifications();
  const [isVisible, setIsVisible] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);

  useEffect(() => {
    if (showToast) {
      setIsLeaving(false);
      // Small delay for animation
      setTimeout(() => setIsVisible(true), 50);
    } else {
      setIsLeaving(true);
      setTimeout(() => {
        setIsVisible(false);
        setIsLeaving(false);
      }, 300);
    }
  }, [showToast]);

  if (!showToast && !isLeaving) return null;

  const handleDismiss = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dismissToast();
  };

  return (
    <div className="fixed top-0 left-0 right-0 z-[200] flex justify-center pointer-events-none md:top-4 md:left-1/2 md:-translate-x-1/2 md:right-auto md:w-[414px]">
      <Link 
        href="/activity"
        className={`
          pointer-events-auto
          mx-4 mt-4 md:mt-8 max-w-[380px] w-full
          bg-white rounded-2xl shadow-2xl border border-gray-100
          transform transition-all duration-300 ease-out
          ${isVisible && !isLeaving ? 'translate-y-0 opacity-100' : '-translate-y-full opacity-0'}
        `}
      >
        <div className="flex items-center gap-3 p-4">
          {/* Avatar with icon */}
          <div className="relative flex-shrink-0">
            <Avatar 
              src={showToast?.user.avatar || 'https://i.pravatar.cc/150'} 
              alt={showToast?.user.username || ''}
              size="md"
            />
            <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-white flex items-center justify-center shadow-sm border">
              {getIcon(showToast?.type || '')}
            </div>
          </div>

          {/* Message */}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">
              {showToast?.message}
            </p>
            <p className="text-xs text-gray-500">Just now</p>
          </div>

          {/* Close button */}
          <button 
            onClick={handleDismiss}
            className="flex-shrink-0 p-1 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-4 h-4 text-gray-400" />
          </button>
        </div>

        {/* Progress bar */}
        <div className="h-1 bg-gray-100 rounded-b-2xl overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-pink-500 via-purple-500 to-blue-500 animate-shrink"
            style={{ animationDuration: '4s' }}
          />
        </div>
      </Link>
    </div>
  );
}

