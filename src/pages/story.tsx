import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/router';
import Image from 'next/image';
import Link from 'next/link';
import { X, MoreHorizontal, Send, Heart, Volume2, VolumeX, Pause, Search } from 'lucide-react';
import Avatar from '@/components/shared/Avatar';
import { useApi } from '@/hooks/useApi';
import { useAuth } from '@/context/AuthContext';
import { markStoryAsViewedInCache } from './index';

interface ShareUser {
  id: string;
  username: string;
  avatar: string;
  fullName: string;
}

interface Story {
  id: string;
  image: string;
  music?: string;
  createdAt: string;
  isViewed?: boolean;
  isLiked?: boolean;
}

interface StoryGroup {
  user: {
    id: string;
    username: string;
    avatar: string;
  };
  stories: Story[];
  allViewed: boolean;
  isOwnStories?: boolean;
}

const STORY_DURATION = 5000; // 5 seconds for images

function getTimeAgo(date: string): string {
  const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (seconds < 60) return 'now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h`;
  return `${Math.floor(seconds / 86400)}d`;
}

function isVideoUrl(url: string): boolean {
  return url.includes('.mp4') || url.includes('.webm') || url.includes('.mov') || url.includes('.ogg');
}

export default function StoryPage() {
  const router = useRouter();
  const { userId } = router.query;
  const { get, post } = useApi();
  const { user: currentUser } = useAuth();
  
  // Story data
  const [storyGroups, setStoryGroups] = useState<StoryGroup[]>([]);
  const [currentGroupIndex, setCurrentGroupIndex] = useState(0);
  const [currentStoryIndex, setCurrentStoryIndex] = useState(0);
  
  // UI state
  const [progress, setProgress] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [likedStories, setLikedStories] = useState<Set<string>>(new Set());
  const [isMuted, setIsMuted] = useState(true);
  const [isPaused, setIsPaused] = useState(false);
  const isPausedRef = useRef(false);
  
  // Share modal state
  const [showShareModal, setShowShareModal] = useState(false);
  const [shareUsers, setShareUsers] = useState<ShareUser[]>([]);
  const [shareSearch, setShareSearch] = useState('');
  const [sendingTo, setSendingTo] = useState<string | null>(null);
  
  // Mode: false = unviewed stories mode, true = viewed stories mode
  const [isViewedMode, setIsViewedMode] = useState(false);
  
  // Refs for callbacks
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const viewedStoriesRef = useRef<Set<string>>(new Set());
  const storyGroupsRef = useRef<StoryGroup[]>([]);
  const currentGroupIndexRef = useRef(0);
  const currentStoryIndexRef = useRef(0);
  const isNavigatingRef = useRef(false);
  const isViewedModeRef = useRef(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const progressRef = useRef(0);
  const touchStartX = useRef(0);
  const touchStartY = useRef(0);

  // Sync refs
  useEffect(() => { storyGroupsRef.current = storyGroups; }, [storyGroups]);
  useEffect(() => { currentGroupIndexRef.current = currentGroupIndex; }, [currentGroupIndex]);
  useEffect(() => { currentStoryIndexRef.current = currentStoryIndex; }, [currentStoryIndex]);
  useEffect(() => { isViewedModeRef.current = isViewedMode; }, [isViewedMode]);
  useEffect(() => { progressRef.current = progress; }, [progress]);

  // Like story
  const handleLikeStory = async (storyId: string) => {
    // Optimistic update - toggle immediately
    const wasLiked = likedStories.has(storyId);
    setLikedStories(prev => {
      const newSet = new Set(prev);
      if (wasLiked) {
        newSet.delete(storyId);
      } else {
        newSet.add(storyId);
      }
      return newSet;
    });
    
    // Send to server
    const result = await post<{ liked: boolean }>(`/api/stories/${storyId}/like`, {});
    
    // If server response differs, sync with server
    if (result && result.liked !== !wasLiked) {
      setLikedStories(prev => {
        const newSet = new Set(prev);
        if (result.liked) newSet.add(storyId);
        else newSet.delete(storyId);
        return newSet;
      });
    }
  };

  // Open share modal
  const openShareModal = async () => {
    clearTimer(); // Stop the progress timer
    setIsPaused(true);
    isPausedRef.current = true;
    setShowShareModal(true);
    setShareSearch('');
    
    // Pause video if playing
    if (videoRef.current) {
      videoRef.current.pause();
    }
    
    if (shareUsers.length === 0) {
      const users = await get<ShareUser[]>('/api/users');
      if (users) {
        setShareUsers(users.filter(u => u.id !== currentUser?.id));
      }
    }
  };

  // Close share modal
  const closeShareModal = () => {
    setShowShareModal(false);
    setIsPaused(false);
    isPausedRef.current = false;
    
    // Resume video if it's a video story
    if (videoRef.current) {
      videoRef.current.play().catch(() => {});
    }
  };

  // Send story to user
  const sendStoryToUser = async (targetUserId: string) => {
    const currentGroup = storyGroups[currentGroupIndex];
    const currentStory = currentGroup?.stories[currentStoryIndex];
    if (!currentStory || !currentGroup) return;
    
    setSendingTo(targetUserId);
    
    const storyData = {
      type: 'shared_story',
      storyId: currentStory.id,
      image: currentStory.image,
      username: currentGroup.user.username,
    };
    
    await post(`/api/messages/${targetUserId}`, {
      text: JSON.stringify(storyData),
      type: 'story',
    });
    
    setSendingTo(null);
    closeShareModal();
  };

  const filteredShareUsers = shareUsers.filter(u =>
    u.username.toLowerCase().includes(shareSearch.toLowerCase()) ||
    u.fullName?.toLowerCase().includes(shareSearch.toLowerCase())
  );

  // Timer control
  const clearTimer = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  // Find next group based on mode
  const findNextGroup = useCallback((groups: StoryGroup[], currentIdx: number, viewedMode: boolean): number => {
    for (let i = currentIdx + 1; i < groups.length; i++) {
      const group = groups[i];
      if (group.isOwnStories) continue; // Skip own stories
      
      if (viewedMode) {
        // In viewed mode, find groups with all viewed
        if (group.allViewed) return i;
      } else {
        // In unviewed mode, find groups with unviewed stories
        if (!group.allViewed) return i;
      }
    }
    return -1;
  }, []);

  // Go to next story
  const goToNextStory = useCallback(() => {
    if (isNavigatingRef.current) return;
    isNavigatingRef.current = true;
    clearTimer();
    
    const groups = storyGroupsRef.current;
    const groupIdx = currentGroupIndexRef.current;
    const storyIdx = currentStoryIndexRef.current;
    const currentGroup = groups[groupIdx];
    const viewedMode = isViewedModeRef.current;
    
    if (!currentGroup) {
      isNavigatingRef.current = false;
      router.push('/');
      return;
    }

    // === OWN STORIES ===
    if (currentGroup.isOwnStories) {
      if (storyIdx < currentGroup.stories.length - 1) {
        setCurrentStoryIndex(storyIdx + 1);
      } else {
        // Finished own stories, go home
        isNavigatingRef.current = false;
        router.push('/');
        return;
      }
      setTimeout(() => { isNavigatingRef.current = false; }, 100);
      return;
    }

    // === VIEWED MODE ===
    if (viewedMode) {
      // Show all stories of current user, then find next user with all viewed
      if (storyIdx < currentGroup.stories.length - 1) {
        setCurrentStoryIndex(storyIdx + 1);
      } else {
        // Find next user with all viewed stories
        const nextGroup = findNextGroup(groups, groupIdx, true);
        if (nextGroup !== -1) {
          setCurrentGroupIndex(nextGroup);
          setCurrentStoryIndex(0);
        } else {
          // No more, go home
          isNavigatingRef.current = false;
          router.push('/');
          return;
        }
      }
    } 
    // === UNVIEWED MODE ===
    else {
      // Only show unviewed stories of current user
      const nextUnviewedInGroup = currentGroup.stories.findIndex(
        (s, idx) => idx > storyIdx && !s.isViewed
      );

      if (nextUnviewedInGroup !== -1) {
        setCurrentStoryIndex(nextUnviewedInGroup);
      } else {
        // Find next user with unviewed stories
        const nextGroup = findNextGroup(groups, groupIdx, false);
        if (nextGroup !== -1) {
          const firstUnviewed = groups[nextGroup].stories.findIndex(s => !s.isViewed);
          setCurrentGroupIndex(nextGroup);
          setCurrentStoryIndex(firstUnviewed !== -1 ? firstUnviewed : 0);
        } else {
          // No more unviewed, go home
          isNavigatingRef.current = false;
          router.push('/');
          return;
        }
      }
    }
    
    setTimeout(() => { isNavigatingRef.current = false; }, 100);
  }, [clearTimer, router, findNextGroup]);

  // Go to previous story
  const goToPrevStory = useCallback(() => {
    if (isNavigatingRef.current) return;
    isNavigatingRef.current = true;
    clearTimer();
    
    const storyIdx = currentStoryIndexRef.current;
    const groupIdx = currentGroupIndexRef.current;
    const groups = storyGroupsRef.current;

    if (storyIdx > 0) {
      // Go to previous story in current group
      setCurrentStoryIndex(storyIdx - 1);
    } else if (groupIdx > 0) {
      // Go to previous group, last story
      const prevGroup = groups[groupIdx - 1];
      setCurrentGroupIndex(groupIdx - 1);
      setCurrentStoryIndex(prevGroup.stories.length - 1);
    }
    // If at very first story, do nothing
    
    setTimeout(() => { isNavigatingRef.current = false; }, 100);
  }, [clearTimer]);

  // Swipe to next user (follows same mode logic)
  const goToNextUser = useCallback(() => {
    if (isNavigatingRef.current) return;
    isNavigatingRef.current = true;
    clearTimer();
    
    const groups = storyGroupsRef.current;
    const groupIdx = currentGroupIndexRef.current;
    const currentGroup = groups[groupIdx];
    const viewedMode = isViewedModeRef.current;
    
    // Own stories: finish and go home
    if (currentGroup?.isOwnStories) {
      isNavigatingRef.current = false;
      router.push('/');
      return;
    }
    
    // Find next group based on mode
    const nextGroup = findNextGroup(groups, groupIdx, viewedMode);
    if (nextGroup !== -1) {
      const group = groups[nextGroup];
      setCurrentGroupIndex(nextGroup);
      if (viewedMode) {
        setCurrentStoryIndex(0);
      } else {
        const firstUnviewed = group.stories.findIndex(s => !s.isViewed);
        setCurrentStoryIndex(firstUnviewed !== -1 ? firstUnviewed : 0);
      }
    } else {
      isNavigatingRef.current = false;
      router.push('/');
      return;
    }
    
    setTimeout(() => { isNavigatingRef.current = false; }, 100);
  }, [clearTimer, router, findNextGroup]);

  // Swipe to previous user
  const goToPrevUser = useCallback(() => {
    if (isNavigatingRef.current) return;
    isNavigatingRef.current = true;
    clearTimer();
    
    const groupIdx = currentGroupIndexRef.current;
    const groups = storyGroupsRef.current;
    
    if (groupIdx > 0) {
      setCurrentGroupIndex(groupIdx - 1);
      setCurrentStoryIndex(0);
    }
    
    setTimeout(() => { isNavigatingRef.current = false; }, 100);
  }, [clearTimer]);

  // Progress timer
  const startProgress = useCallback((duration: number = STORY_DURATION) => {
    if (isPausedRef.current) return;
    clearTimer();
    setProgress(0);
    
    const increment = 100 / (duration / 50);
    
    intervalRef.current = setInterval(() => {
      // Check if paused during interval
      if (isPausedRef.current) {
        return;
      }
      setProgress((prev) => {
        if (prev >= 100) {
          goToNextStory();
          return 100;
        }
        return prev + increment;
      });
    }, 50);
  }, [clearTimer, goToNextStory]);

  // Pause/Resume
  const pauseProgress = useCallback(() => {
    setIsPaused(true);
    isPausedRef.current = true;
    clearTimer();
    if (videoRef.current) videoRef.current.pause();
  }, [clearTimer]);

  const resumeProgress = useCallback(() => {
    setIsPaused(false);
    isPausedRef.current = false;
    clearTimer();
    
    const currentGroup = storyGroupsRef.current[currentGroupIndexRef.current];
    const currentStory = currentGroup?.stories[currentStoryIndexRef.current];
    
    if (currentStory && isVideoUrl(currentStory.image)) {
      if (videoRef.current) videoRef.current.play();
    } else {
      const remaining = 100 - progressRef.current;
      const remainingTime = (remaining / 100) * STORY_DURATION;
      const increment = 100 / (remainingTime / 50);
      
      intervalRef.current = setInterval(() => {
        if (isPausedRef.current) return;
        setProgress((prev) => {
          if (prev >= 100) {
            goToNextStory();
            return 100;
          }
          return prev + increment;
        });
      }, 50);
    }
  }, [goToNextStory, clearTimer]);

  // Mark story as viewed
  const markCurrentStoryAsViewed = useCallback(async () => {
    const groups = storyGroupsRef.current;
    const groupIdx = currentGroupIndexRef.current;
    const storyIdx = currentStoryIndexRef.current;
    
    const currentGroup = groups[groupIdx];
    if (!currentGroup) return;
    
    const currentStory = currentGroup.stories[storyIdx];
    if (!currentStory || viewedStoriesRef.current.has(currentStory.id)) return;
    
    viewedStoriesRef.current.add(currentStory.id);
    
    // Update local state
    setStoryGroups(prev => prev.map((group, gIdx) => {
      if (gIdx === groupIdx) {
        const updatedStories = group.stories.map((s, sIdx) => 
          sIdx === storyIdx ? { ...s, isViewed: true } : s
        );
        const allViewed = updatedStories.every(s => s.isViewed);
        return { ...group, stories: updatedStories, allViewed };
      }
      return group;
    }));
    
    markStoryAsViewedInCache(currentStory.id, currentGroup.user.id);
    post(`/api/stories/${currentStory.id}/view`, {});
  }, [post]);

  // Video loaded handler
  const handleVideoLoaded = useCallback((e: React.SyntheticEvent<HTMLVideoElement>) => {
    const video = e.currentTarget;
    const duration = video.duration * 1000;
    startProgress(duration);
    video.play();
  }, [startProgress]);

  // Load stories on mount
  useEffect(() => {
    const loadStories = async () => {
      setIsLoading(true);
      const data = await get<StoryGroup[]>('/api/stories');
      if (data && data.length > 0) {
        setStoryGroups(data);
        storyGroupsRef.current = data;
        
        // Initialize liked stories from fetched data
        const likedIds = new Set<string>();
        data.forEach(group => {
          group.stories.forEach(story => {
            if (story.isLiked) {
              likedIds.add(story.id);
            }
          });
        });
        setLikedStories(likedIds);
      }
      setIsLoading(false);
    };
    loadStories();
    return () => clearTimer();
  }, [get, clearTimer]);

  // Initialize when userId changes
  useEffect(() => {
    if (userId && storyGroups.length > 0 && !isLoading) {
      const groupIndex = storyGroups.findIndex(g => g.user.id === userId);
      
      if (groupIndex !== -1) {
        const group = storyGroups[groupIndex];
        setCurrentGroupIndex(groupIndex);
        
        if (group.isOwnStories) {
          // Own stories: show all from beginning, don't set viewed mode
          setIsViewedMode(false);
          isViewedModeRef.current = false;
          setCurrentStoryIndex(0);
        } else if (group.allViewed) {
          // All viewed: show all from beginning, set viewed mode
          setIsViewedMode(true);
          isViewedModeRef.current = true;
          setCurrentStoryIndex(0);
        } else {
          // Has unviewed: start from first unviewed, set unviewed mode
          setIsViewedMode(false);
          isViewedModeRef.current = false;
          const firstUnviewed = group.stories.findIndex(s => !s.isViewed);
          setCurrentStoryIndex(firstUnviewed !== -1 ? firstUnviewed : 0);
        }
      }
    }
  }, [userId, storyGroups.length, isLoading]);

  // Start progress when story changes (not when paused state changes)
  useEffect(() => {
    if (storyGroups.length > 0 && !isLoading) {
      const currentGroup = storyGroups[currentGroupIndex];
      const currentStory = currentGroup?.stories[currentStoryIndex];
      
      if (currentStory && !isVideoUrl(currentStory.image)) {
        startProgress(STORY_DURATION);
      }
      markCurrentStoryAsViewed();
    }
    return () => clearTimer();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentGroupIndex, currentStoryIndex, storyGroups.length, isLoading]);

  // Touch handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    const touchEndX = e.changedTouches[0].clientX;
    const touchEndY = e.changedTouches[0].clientY;
    const diffX = touchStartX.current - touchEndX;
    const diffY = Math.abs(touchStartY.current - touchEndY);
    
    if (Math.abs(diffX) > 50 && Math.abs(diffX) > diffY) {
      if (diffX > 0) goToNextUser();
      else goToPrevUser();
    }
  };

  const handleMouseDown = () => pauseProgress();
  const handleMouseUp = () => resumeProgress();

  const handleScreenClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const { clientX, currentTarget } = e;
    const { offsetWidth } = currentTarget;
    if (clientX < offsetWidth / 3) {
      goToPrevStory();
    } else if (clientX > (offsetWidth * 2) / 3) {
      goToNextStory();
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-black z-[100] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // No stories
  if (storyGroups.length === 0) {
    return (
      <div className="fixed inset-0 bg-black z-[100] flex items-center justify-center">
        <div className="text-center">
          <p className="text-white mb-4">No stories available</p>
          <button onClick={() => router.push('/')} className="text-blue-400">Go back</button>
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
  const isVideo = isVideoUrl(currentStory.image);

  return (
    <div
      className="fixed inset-0 bg-black z-[100] flex flex-col select-none"
      onClick={handleScreenClick}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onTouchStart={(e) => { handleTouchStart(e); pauseProgress(); }}
      onTouchEnd={(e) => { handleTouchEnd(e); resumeProgress(); }}
    >
      {/* Top gradient for visibility on bright images */}
      <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-black/60 via-black/30 to-transparent z-10 pointer-events-none" />

      {/* Progress Bars */}
      <div className="absolute top-0 left-0 right-0 flex gap-0.5 p-2 pt-3 z-20">
        {currentGroup.stories.map((story, index) => {
          // In unviewed mode, only show progress for unviewed stories
          const shouldShow = isViewedMode || currentGroup.isOwnStories || !story.isViewed || index <= currentStoryIndex;
          if (!shouldShow && !isViewedMode && !currentGroup.isOwnStories) {
            // Show grayed out for viewed stories we're skipping
            if (story.isViewed && index < currentStoryIndex) {
              return (
                <div key={index} className="flex-1 h-0.5 bg-white/30 rounded-full overflow-hidden">
                  <div className="h-full bg-white/50 rounded-full w-full" />
                </div>
              );
            }
          }
          
          return (
            <div key={index} className="flex-1 h-0.5 bg-white/30 rounded-full overflow-hidden">
              <div
                className="h-full bg-white rounded-full"
                style={{ 
                  width: `${index === currentStoryIndex ? progress : (index < currentStoryIndex ? 100 : 0)}%`,
                  transition: index === currentStoryIndex ? 'none' : 'width 0.2s ease-out'
                }}
              />
            </div>
          );
        })}
      </div>

      {/* Header */}
      <div className="absolute top-6 left-0 right-0 flex items-center justify-between px-3 py-2 z-20">
        <div className="flex items-center gap-2">
          <Link 
            href={`/user/${user.username}`} 
            onClick={(e) => e.stopPropagation()}
            onMouseDown={(e) => e.stopPropagation()}
            onTouchStart={(e) => e.stopPropagation()}
          >
            <Avatar src={user.avatar || 'https://i.pravatar.cc/150'} alt={user.username} size="sm" />
          </Link>
          <Link 
            href={`/user/${user.username}`} 
            onClick={(e) => e.stopPropagation()}
            onMouseDown={(e) => e.stopPropagation()}
            onTouchStart={(e) => e.stopPropagation()}
            className="text-white font-semibold text-sm drop-shadow-md"
          >
            {user.username}
          </Link>
          <span className="text-white/80 text-sm drop-shadow-md">{time}</span>
          {isPaused && <Pause className="w-4 h-4 text-white/60" />}
        </div>
        
        <div className="flex items-center gap-1">
          {isVideo && (
            <button onClick={(e) => { e.stopPropagation(); setIsMuted(!isMuted); }} className="p-2 text-white drop-shadow-md">
              {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
            </button>
          )}
          <button onClick={(e) => e.stopPropagation()} className="p-2 text-white drop-shadow-md">
            <MoreHorizontal className="w-5 h-5" />
          </button>
          <button onClick={(e) => { e.stopPropagation(); router.push('/'); }} className="p-2 text-white drop-shadow-md">
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Story Content */}
      <div className="relative flex-1 flex items-center justify-center">
        {isVideo ? (
          <video
            ref={videoRef}
            src={currentStory.image}
            className="w-full h-full object-cover"
            muted={isMuted}
            playsInline
            onLoadedMetadata={handleVideoLoaded}
          />
        ) : (
          <Image
            src={currentStory.image}
            alt={`Story by ${user.username}`}
            fill
            className="object-cover"
            priority
          />
        )}
      </div>

      {/* Bottom gradient for visibility on bright images */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-black/60 via-black/30 to-transparent z-10 pointer-events-none"></div>

      {/* Bottom Input */}
      <div 
        onClick={(e) => e.stopPropagation()}
        onMouseDown={(e) => e.stopPropagation()}
        onTouchStart={(e) => e.stopPropagation()}
        className="absolute bottom-0 left-0 right-0 p-4 flex items-center gap-3 z-20"
      >
        <input
          type="text"
          placeholder={`Reply to ${user.username}...`}
          className="flex-1 bg-transparent border border-white/40 rounded-full px-4 py-2 text-white text-sm placeholder-white/60 focus:ring-0 outline-none"
        />
        <button className="text-white" onClick={() => currentStory && handleLikeStory(currentStory.id)}>
          <Heart className={`w-6 h-6 ${likedStories.has(currentStory?.id || '') ? 'text-red-500 fill-red-500' : ''}`} />
        </button>
        <button className="text-white" onClick={openShareModal}>
          <Send className="w-6 h-6" />
        </button>
      </div>

      {/* Share Modal */}
      {showShareModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end justify-center">
          <div className="bg-white w-full max-w-[430px] rounded-t-2xl max-h-[70vh] flex flex-col animate-slide-up">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 border-b">
              <span className="font-semibold">Share to...</span>
              <button onClick={closeShareModal}>
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Story Preview */}
            <div className="flex items-center gap-3 p-4 border-b bg-gray-50">
              <div className="w-12 h-12 relative rounded overflow-hidden flex-shrink-0">
                {currentStory && (
                  <Image src={currentStory.image} alt="Story" fill className="object-cover" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm">{currentGroup?.user.username}'s story</p>
                <p className="text-xs text-gray-500">Share this story</p>
              </div>
            </div>

            {/* Search */}
            <div className="p-3 border-b">
              <div className="flex items-center gap-2 bg-gray-100 rounded-lg px-3 py-2">
                <Search className="w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search"
                  value={shareSearch}
                  onChange={(e) => setShareSearch(e.target.value)}
                  className="flex-1 bg-transparent text-sm outline-none"
                />
              </div>
            </div>

            {/* Users List */}
            <div className="flex-1 overflow-y-auto">
              {filteredShareUsers.length === 0 ? (
                <p className="text-center text-gray-500 py-8">No users found</p>
              ) : (
                filteredShareUsers.map((user) => (
                  <div 
                    key={user.id}
                    className="flex items-center justify-between px-4 py-3 hover:bg-gray-50"
                  >
                    <div className="flex items-center gap-3">
                      <Avatar src={user.avatar || 'https://i.pravatar.cc/150'} alt={user.username} size="md" />
                      <div>
                        <p className="font-semibold text-sm">{user.username}</p>
                        <p className="text-xs text-gray-500">{user.fullName}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => sendStoryToUser(user.id)}
                      disabled={sendingTo === user.id}
                      className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition-colors ${
                        sendingTo === user.id
                          ? 'bg-gray-200 text-gray-500'
                          : 'bg-blue-500 text-white hover:bg-blue-600'
                      }`}
                    >
                      {sendingTo === user.id ? 'Sent!' : 'Send'}
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
