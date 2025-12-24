import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowLeft, Heart, UserPlus, MessageCircle } from 'lucide-react';
import Avatar from '@/components/shared/Avatar';
import { useApi } from '@/hooks/useApi';

interface Activity {
  id: string;
  type: 'post_like' | 'reel_like' | 'story_like' | 'new_follower' | 'comment';
  createdAt: string;
  user: {
    id: string;
    username: string;
    avatar: string | null;
  };
  content?: {
    id: string;
    image?: string;
    thumbnail?: string;
    text?: string;
  };
  isFollowingBack?: boolean;
}

function getTimeAgo(date: string): string {
  const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (seconds < 60) return 'now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d`;
  return `${Math.floor(seconds / 604800)}w`;
}

function ActivitySkeleton() {
  return (
    <div className="animate-pulse">
      {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
        <div key={i} className="flex items-center gap-3 px-4 py-3">
          <div className="w-11 h-11 rounded-full bg-gray-200" />
          <div className="flex-1">
            <div className="w-48 h-4 bg-gray-200 rounded mb-1" />
            <div className="w-16 h-3 bg-gray-200 rounded" />
          </div>
          <div className="w-11 h-11 bg-gray-200 rounded" />
        </div>
      ))}
    </div>
  );
}

function getActivityIcon(type: Activity['type']) {
  switch (type) {
    case 'post_like':
    case 'reel_like':
    case 'story_like':
      return <Heart className="w-3 h-3 text-red-500 fill-red-500" />;
    case 'new_follower':
      return <UserPlus className="w-3 h-3 text-blue-500" />;
    case 'comment':
      return <MessageCircle className="w-3 h-3 text-green-500" />;
    default:
      return null;
  }
}

function getActivityText(activity: Activity): string {
  switch (activity.type) {
    case 'post_like':
      return 'liked your post.';
    case 'reel_like':
      return 'liked your reel.';
    case 'story_like':
      return 'liked your story.';
    case 'new_follower':
      return 'started following you.';
    case 'comment':
      return `commented: "${activity.content?.text?.substring(0, 30)}${(activity.content?.text?.length || 0) > 30 ? '...' : ''}"`;
    default:
      return '';
  }
}

function getActivityLink(activity: Activity): string {
  switch (activity.type) {
    case 'post_like':
    case 'comment':
      return `/post/${activity.content?.id}`;
    case 'reel_like':
      return `/reel/${activity.content?.id}`;
    case 'story_like':
      return `/story`;
    case 'new_follower':
      return `/user/${activity.user.username}`;
    default:
      return '#';
  }
}

export default function ActivityPage() {
  const router = useRouter();
  const { get, post } = useApi();
  const [activities, setActivities] = useState<Activity[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [followedUsers, setFollowedUsers] = useState<Set<string>>(new Set());
  const [followingInProgress, setFollowingInProgress] = useState<string | null>(null);

  useEffect(() => {
    loadActivity();
  }, []);

  const loadActivity = async () => {
    setIsLoading(true);
    const data = await get<Activity[]>('/api/activity');
    if (data) {
      setActivities(data);
      
      // Initialize followed users from those we're already following back
      const alreadyFollowing = data
        .filter(a => a.type === 'new_follower' && a.isFollowingBack)
        .map(a => a.user.id);
      setFollowedUsers(new Set(alreadyFollowing));
    }
    setIsLoading(false);
  };

  const handleFollowToggle = async (username: string, userId: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    setFollowingInProgress(userId);
    const result = await post<{ following: boolean }>(`/api/users/${username}/follow`, {});
    setFollowingInProgress(null);
    
    if (result) {
      if (result.following) {
        // Now following
        setFollowedUsers(prev => new Set([...prev, userId]));
      } else {
        // Unfollowed
        setFollowedUsers(prev => {
          const next = new Set(prev);
          next.delete(userId);
          return next;
        });
      }
    }
  };

  // Group activities by time period
  const groupedActivities = {
    today: [] as Activity[],
    thisWeek: [] as Activity[],
    thisMonth: [] as Activity[],
    earlier: [] as Activity[],
  };

  const now = Date.now();
  const oneDay = 24 * 60 * 60 * 1000;
  const oneWeek = 7 * oneDay;
  const oneMonth = 30 * oneDay;

  activities.forEach(activity => {
    const activityTime = new Date(activity.createdAt).getTime();
    const diff = now - activityTime;

    if (diff < oneDay) {
      groupedActivities.today.push(activity);
    } else if (diff < oneWeek) {
      groupedActivities.thisWeek.push(activity);
    } else if (diff < oneMonth) {
      groupedActivities.thisMonth.push(activity);
    } else {
      groupedActivities.earlier.push(activity);
    }
  });

  const renderActivityItem = (activity: Activity) => (
    <Link 
      key={activity.id} 
      href={getActivityLink(activity)}
      className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50"
    >
      <div className="relative">
        <Avatar 
          src={activity.user.avatar || 'https://i.pravatar.cc/150'} 
          alt={activity.user.username}
          size="md"
        />
        <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-white flex items-center justify-center shadow-sm">
          {getActivityIcon(activity.type)}
        </div>
      </div>
      
      <div className="flex-1 min-w-0">
        <p className="text-sm">
          <span className="font-semibold">{activity.user.username}</span>
          {' '}
          <span className="text-gray-700">{getActivityText(activity)}</span>
          {' '}
          <span className="text-gray-400">{getTimeAgo(activity.createdAt)}</span>
        </p>
      </div>

      {/* Content thumbnail */}
      {(activity.content?.image || activity.content?.thumbnail) && (
        <div className="w-11 h-11 relative rounded overflow-hidden flex-shrink-0">
          <Image
            src={activity.content.image || activity.content.thumbnail || ''}
            alt=""
            fill
            className="object-cover"
          />
        </div>
      )}

      {/* Follow button for new followers */}
      {activity.type === 'new_follower' && (
        <button 
          onClick={(e) => handleFollowToggle(activity.user.username, activity.user.id, e)}
          disabled={followingInProgress === activity.user.id}
          className={`min-w-[90px] px-4 py-1.5 text-sm font-semibold rounded-lg transition-colors ${
            followedUsers.has(activity.user.id)
              ? 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              : 'bg-blue-500 text-white hover:bg-blue-600'
          }`}
        >
          {followingInProgress === activity.user.id 
            ? '...' 
            : followedUsers.has(activity.user.id) 
              ? 'Following' 
              : 'Follow'}
        </button>
      )}
    </Link>
  );

  const renderSection = (title: string, items: Activity[]) => {
    if (items.length === 0) return null;
    
    return (
      <div className="mb-4">
        <h2 className="px-4 py-2 text-sm font-semibold text-gray-900">{title}</h2>
        {items.map(renderActivityItem)}
      </div>
    );
  };

  return (
    <div className="bg-white min-h-screen pb-20">
      {/* Header */}
      <div className="flex items-center gap-4 px-4 py-3 border-b sticky top-0 bg-white z-10">
        <button onClick={() => router.back()}>
          <ArrowLeft className="w-6 h-6" />
        </button>
        <h1 className="font-semibold text-lg">Activity</h1>
      </div>

      {isLoading ? (
        <ActivitySkeleton />
      ) : activities.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 px-4">
          <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center mb-4">
            <Heart className="w-10 h-10 text-gray-400" />
          </div>
          <h2 className="text-xl font-semibold mb-2">Activity On Your Posts</h2>
          <p className="text-gray-500 text-center text-sm">
            When someone likes or comments on your posts, you&apos;ll see it here.
          </p>
        </div>
      ) : (
        <div>
          {renderSection('Today', groupedActivities.today)}
          {renderSection('This Week', groupedActivities.thisWeek)}
          {renderSection('This Month', groupedActivities.thisMonth)}
          {renderSection('Earlier', groupedActivities.earlier)}
        </div>
      )}
    </div>
  );
}

