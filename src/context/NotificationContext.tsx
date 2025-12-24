import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { useAuth } from './AuthContext';

interface Notification {
  id: string;
  type: 'post_like' | 'reel_like' | 'story_like' | 'new_follower' | 'comment';
  message: string;
  user: {
    username: string;
    avatar: string | null;
  };
  createdAt: string;
}

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  showToast: Notification | null;
  dismissToast: () => void;
  markAllAsRead: () => void;
}

const NotificationContext = createContext<NotificationContextType | null>(null);

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within NotificationProvider');
  }
  return context;
}

function getNotificationMessage(type: string, username: string, text?: string): string {
  switch (type) {
    case 'post_like':
      return `${username} liked your post`;
    case 'reel_like':
      return `${username} liked your reel`;
    case 'story_like':
      return `${username} liked your story`;
    case 'new_follower':
      return `${username} started following you`;
    case 'comment':
      return `${username} commented: "${text?.substring(0, 30) || ''}"`;
    default:
      return `New activity from ${username}`;
  }
}

export function NotificationProvider({ children }: { children: ReactNode }) {
  const { user, token } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [lastChecked, setLastChecked] = useState<string | null>(null);
  const [showToast, setShowToast] = useState<Notification | null>(null);
  const [seenIds, setSeenIds] = useState<Set<string>>(new Set());

  const isAuthenticated = !!user && !!token;

  const fetchNewActivity = useCallback(async () => {
    if (!isAuthenticated || !user) return;

    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const res = await fetch('/api/activity', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) return;

      const data = await res.json();
      
      if (data && data.length > 0) {
        // Find new notifications (not seen before)
        const newNotifications: Notification[] = [];
        
        data.forEach((activity: { 
          id: string; 
          type: string; 
          createdAt: string; 
          user: { username: string; avatar: string | null };
          content?: { text?: string };
        }) => {
          if (!seenIds.has(activity.id)) {
            // Check if this is truly new (after last checked time)
            if (!lastChecked || new Date(activity.createdAt) > new Date(lastChecked)) {
              newNotifications.push({
                id: activity.id,
                type: activity.type as Notification['type'],
                message: getNotificationMessage(activity.type, activity.user.username, activity.content?.text),
                user: activity.user,
                createdAt: activity.createdAt,
              });
            }
          }
        });

        if (newNotifications.length > 0) {
          // Show the most recent notification as toast
          const mostRecent = newNotifications[0];
          setShowToast(mostRecent);
          
          // Auto-hide toast after 4 seconds
          setTimeout(() => {
            setShowToast(null);
          }, 4000);

          // Add to seen IDs
          setSeenIds(prev => {
            const next = new Set(prev);
            newNotifications.forEach(n => next.add(n.id));
            return next;
          });

          // Update notifications list
          setNotifications(prev => [...newNotifications, ...prev].slice(0, 50));
        }

        // Update last checked time
        if (data[0]?.createdAt) {
          setLastChecked(data[0].createdAt);
        }
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  }, [isAuthenticated, user, lastChecked, seenIds]);

  // Poll for new activity every 30 seconds
  useEffect(() => {
    if (!isAuthenticated) return;

    // Initial fetch
    fetchNewActivity();

    // Set up polling
    const interval = setInterval(fetchNewActivity, 30000);

    return () => clearInterval(interval);
  }, [isAuthenticated, fetchNewActivity]);

  const dismissToast = useCallback(() => {
    setShowToast(null);
  }, []);

  const markAllAsRead = useCallback(() => {
    setNotifications([]);
  }, []);

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount: notifications.length,
        showToast,
        dismissToast,
        markAllAsRead,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
}



