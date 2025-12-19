import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import Image from 'next/image';
import { X, MoreHorizontal, Send, Heart, VolumeX, Music } from 'lucide-react';
import Avatar from '@/components/shared/Avatar';
import { useApi } from '@/hooks/useApi';

interface Story {
  id: string;
  image: string;
  music?: string;
  createdAt: string;
  isViewed?: boolean;
}

interface StoryGroup {
  user: {
    id: string;
    username: string;
    avatar: string;
  };
  stories: Story[];
  allViewed: boolean;
}

function getTimeAgo(date: string): string {
  const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  
  if (seconds < 60) return 'now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)} min`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h`;
  return `${Math.floor(seconds / 86400)}d`;
}

export default function StoryPage() {
  const router = useRouter();
  const { userId } = router.query;
  const { get, post } = useApi();
  
  const [storyGroups, setStoryGroups] = useState<StoryGroup[]>([]);
  const [currentGroupIndex, setCurrentGroupIndex] = useState(0);
  const [currentStoryIndex, setCurrentStoryIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [likedStories, setLikedStories] = useState<Set<string>>(new Set());
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const viewedStoriesRef = useRef<Set<string>>(new Set());

  const handleLikeStory = async (storyId: string) => {
    const result = await post<{ liked: boolean }>(`/api/stories/${storyId}/like`, {});
    if (result) {
      setLikedStories(prev => {
        const newSet = new Set(prev);
        if (result.liked) {
          newSet.add(storyId);
        } else {
          newSet.delete(storyId);
        }
        return newSet;
      });
    }
  };

  // Load stories on mount
  useEffect(() => {
    loadStories();
  }, []);

  // Find the correct group when userId changes
  useEffect(() => {
    if (userId && storyGroups.length > 0) {
      const groupIndex = storyGroups.findIndex(g => g.user.id === userId);
      if (groupIndex !== -1) {
        setCurrentGroupIndex(groupIndex);
        // Find first unviewed story in this group
        const firstUnviewedIndex = storyGroups[groupIndex].stories.findIndex(s => !s.isViewed);
        setCurrentStoryIndex(firstUnviewedIndex !== -1 ? firstUnviewedIndex : 0);
      }
    }
  }, [userId, storyGroups]);

  // Start progress timer when story changes
  useEffect(() => {
    if (storyGroups.length > 0) {
      startProgress();
      markCurrentStoryAsViewed();
    }
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [currentGroupIndex, currentStoryIndex, storyGroups]);

  const loadStories = async () => {
    setIsLoading(true);
    const data = await get<StoryGroup[]>('/api/stories');
    if (data && data.length > 0) {
      setStoryGroups(data);
    }
    setIsLoading(false);
  };

  const markCurrentStoryAsViewed = async () => {
    const currentGroup = storyGroups[currentGroupIndex];
    if (!currentGroup) return;
    
    const currentStory = currentGroup.stories[currentStoryIndex];
    if (!currentStory || viewedStoriesRef.current.has(currentStory.id)) return;
    
    viewedStoriesRef.current.add(currentStory.id);
    await post(`/api/stories/${currentStory.id}/view`, {});
  };

  const startProgress = () => {
    setProgress(0);
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    intervalRef.current = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(intervalRef.current!);
          handleNextStory();
          return 100;
        }
        return prev + 0.5;
      });
    }, 25);
  };

  const handleNextStory = () => {
    const currentGroup = storyGroups[currentGroupIndex];
    if (!currentGroup) return;

    // If there are more stories in current group
    if (currentStoryIndex < currentGroup.stories.length - 1) {
      setCurrentStoryIndex(currentStoryIndex + 1);
    } 
    // Move to next user's stories
    else if (currentGroupIndex < storyGroups.length - 1) {
      setCurrentGroupIndex(currentGroupIndex + 1);
      setCurrentStoryIndex(0);
    } 
    // No more stories, go back home
    else {
      router.push('/');
    }
  };

  const handlePrevStory = () => {
    // If there are previous stories in current group
    if (currentStoryIndex > 0) {
      setCurrentStoryIndex(currentStoryIndex - 1);
    }
    // Move to previous user's stories
    else if (currentGroupIndex > 0) {
      const prevGroup = storyGroups[currentGroupIndex - 1];
      setCurrentGroupIndex(currentGroupIndex - 1);
      setCurrentStoryIndex(prevGroup.stories.length - 1);
    }
  };

  const handleScreenClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const { clientX, currentTarget } = e;
    const { offsetWidth } = currentTarget;
    if (clientX < offsetWidth / 3) {
      handlePrevStory();
    } else {
      handleNextStory();
    }
  };

  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-black z-[100] flex items-center justify-center">
        <p className="text-white">Loading...</p>
      </div>
    );
  }

  if (storyGroups.length === 0) {
    return (
      <div className="fixed inset-0 bg-black z-[100] flex items-center justify-center">
        <div className="text-center">
          <p className="text-white mb-4">No stories available</p>
          <button 
            onClick={() => router.push('/')}
            className="text-blue-400"
          >
            Go back
          </button>
        </div>
      </div>
    );
  }

  const currentGroup = storyGroups[currentGroupIndex];
  const currentStory = currentGroup?.stories[currentStoryIndex];

  if (!currentGroup || !currentStory) {
    router.push('/');
    return null;
  }

  const { user } = currentGroup;
  const time = getTimeAgo(currentStory.createdAt);

  return (
    <div
      className="fixed inset-0 bg-black z-[100] flex flex-col"
      onClick={handleScreenClick}
    >
      {/* Progress Bars - only for current user's stories */}
      <div className="absolute top-0 left-0 right-0 flex gap-1 p-2 z-10">
        {currentGroup.stories.map((_, index) => (
          <div key={index} className="flex-1 h-1 bg-white/30 rounded-full overflow-hidden">
            <div
              className="h-full bg-white rounded-full transition-all"
              style={{ 
                width: `${index === currentStoryIndex ? progress : (index < currentStoryIndex ? 100 : 0)}%` 
              }}
            />
          </div>
        ))}
      </div>

      {/* Story Content */}
      <div className="relative flex-1 flex items-center justify-center">
        <Image
          src={currentStory.image}
          alt={`Story by ${user.username}`}
          fill
          className="object-contain"
          priority
        />

        {/* Dark gradient overlay for text readability */}
        <div className="absolute inset-x-0 top-0 h-1/4 bg-gradient-to-b from-black/70 to-transparent z-0" />
        <div className="absolute inset-x-0 bottom-0 h-1/4 bg-gradient-to-t from-black/70 to-transparent z-0" />

        {/* Story Header */}
        <div className="absolute top-8 left-0 right-0 flex items-center justify-between px-4 py-2 z-10">
          {/* Left side - controls */}
          <div className="flex items-center gap-2">
            <button 
              onClick={(e) => {
                e.stopPropagation();
                router.push('/');
              }} 
              className="p-1 text-white"
            >
              <X className="w-6 h-6" />
            </button>
            <button onClick={(e) => e.stopPropagation()} className="p-1 text-white">
              <MoreHorizontal className="w-6 h-6" />
            </button>
            <button onClick={(e) => e.stopPropagation()} className="p-1 text-white">
              <VolumeX className="w-6 h-6" />
            </button>
          </div>
          
          {/* Right side - user info */}
          <div className="flex items-center gap-2">
            <div className="flex flex-col items-end">
              <div className="flex items-center gap-1">
                <span className="text-white/70 text-xs">{time}</span>
                <span className="text-white font-semibold text-sm">{user.username}</span>
              </div>
              <div className="flex items-center gap-1 text-white/70 text-xs">
                <span>BTS · Black Swan</span>
                <Music className="w-3 h-3" />
              </div>
            </div>
            <Avatar src={user.avatar || 'https://i.pravatar.cc/150'} alt={user.username} size="sm" />
          </div>
        </div>

      </div>

      {/* Story Input */}
      <div 
        onClick={(e) => e.stopPropagation()}
        className="absolute bottom-0 left-0 right-0 p-4 flex items-center gap-3 bg-black z-10"
      >
        <button className="text-white">
          <Send className="w-6 h-6" />
        </button>
        <button 
          className="text-white"
          onClick={() => currentStory && handleLikeStory(currentStory.id)}
        >
          <Heart className={`w-6 h-6 ${likedStories.has(currentStory?.id || '') ? 'text-red-500 fill-red-500' : ''}`} />
        </button>
        <input
          type="text"
          placeholder={`Reply to ${user.username}...`}
          className="flex-1 bg-transparent border border-white/30 rounded-full px-4 py-2 text-white text-sm placeholder-gray-400 focus:ring-0 outline-none"
        />
      </div>
    </div>
  );
}
