import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/router';
import Image from 'next/image';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';
import Avatar from '@/components/shared/Avatar';
import { useApi } from '@/hooks/useApi';

interface Story {
  id: string;
  image: string;
  createdAt: string;
}

interface Highlight {
  id: string;
  name: string;
  user: {
    id: string;
    username: string;
    avatar: string;
  };
  stories: Story[];
}

const STORY_DURATION = 5000;

function isVideoUrl(url: string): boolean {
  return url.includes('.mp4') || url.includes('.webm') || url.includes('.mov');
}

function getTimeAgo(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  
  if (seconds < 60) return 'Just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
  if (seconds < 2592000) return `${Math.floor(seconds / 604800)}w ago`;
  
  // Format as date for older content
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export default function HighlightViewPage() {
  const router = useRouter();
  const { id } = router.query;
  const { get } = useApi();
  
  const [highlight, setHighlight] = useState<Highlight | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isPaused, setIsPaused] = useState(false);
  
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (id) {
      loadHighlight();
    }
  }, [id]);

  const loadHighlight = async () => {
    setIsLoading(true);
    const data = await get<Highlight>(`/api/highlights/${id}`);
    if (data) {
      setHighlight(data);
    }
    setIsLoading(false);
  };

  const clearTimer = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const goToNext = useCallback(() => {
    clearTimer();
    if (!highlight) return;
    
    if (currentIndex < highlight.stories.length - 1) {
      setCurrentIndex(prev => prev + 1);
    } else {
      router.back();
    }
  }, [highlight, currentIndex, clearTimer, router]);

  const goToPrev = useCallback(() => {
    clearTimer();
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
    }
  }, [currentIndex, clearTimer]);

  const startProgress = useCallback((duration: number = STORY_DURATION) => {
    if (isPaused) return;
    clearTimer();
    setProgress(0);
    
    const increment = 100 / (duration / 50);
    
    intervalRef.current = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          goToNext();
          return 100;
        }
        return prev + increment;
      });
    }, 50);
  }, [clearTimer, goToNext, isPaused]);

  useEffect(() => {
    if (highlight && highlight.stories.length > 0 && !isLoading) {
      const currentStory = highlight.stories[currentIndex];
      if (currentStory && !isVideoUrl(currentStory.image)) {
        startProgress(STORY_DURATION);
      }
    }
    return () => clearTimer();
  }, [currentIndex, highlight, isLoading, startProgress, clearTimer]);

  const handleVideoLoaded = (e: React.SyntheticEvent<HTMLVideoElement>) => {
    const video = e.currentTarget;
    startProgress(video.duration * 1000);
    video.play();
  };

  const handleScreenClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const { clientX, currentTarget } = e;
    const { offsetWidth } = currentTarget;
    
    if (clientX < offsetWidth / 3) {
      goToPrev();
    } else if (clientX > (offsetWidth * 2) / 3) {
      goToNext();
    }
  };

  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-black z-[100] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!highlight || highlight.stories.length === 0) {
    return (
      <div className="fixed inset-0 bg-black z-[100] flex items-center justify-center">
        <div className="text-center text-white">
          <p>No stories in this highlight</p>
          <button onClick={() => router.back()} className="mt-4 text-blue-400">Go back</button>
        </div>
      </div>
    );
  }

  const currentStory = highlight.stories[currentIndex];
  const isVideo = isVideoUrl(currentStory.image);

  return (
    <div 
      className="fixed inset-0 bg-black z-[100] flex flex-col"
      onClick={handleScreenClick}
      onMouseDown={() => { setIsPaused(true); clearTimer(); }}
      onMouseUp={() => { setIsPaused(false); startProgress(); }}
      onMouseLeave={() => { setIsPaused(false); startProgress(); }}
    >
      {/* Top gradient */}
      <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-black/60 to-transparent z-10 pointer-events-none" />

      {/* Progress Bars */}
      <div className="absolute top-0 left-0 right-0 flex gap-0.5 p-2 pt-3 z-20">
        {highlight.stories.map((_, index) => (
          <div key={index} className="flex-1 h-0.5 bg-white/30 rounded-full overflow-hidden">
            <div
              className="h-full bg-white rounded-full"
              style={{ 
                width: `${index === currentIndex ? progress : (index < currentIndex ? 100 : 0)}%`,
                transition: index === currentIndex ? 'none' : 'width 0.2s'
              }}
            />
          </div>
        ))}
      </div>

      {/* Header */}
      <div className="absolute top-6 left-0 right-0 flex items-center justify-between px-3 py-2 z-20">
        <div className="flex items-center gap-2">
          <Avatar src={highlight.user.avatar || 'https://i.pravatar.cc/150'} alt={highlight.user.username} size="sm" />
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <span className="text-white font-semibold text-sm">{highlight.user.username}</span>
              <span className="text-white/60 text-xs">•</span>
              <span className="text-white/60 text-xs">{getTimeAgo(currentStory.createdAt)}</span>
            </div>
            <span className="text-white/70 text-xs">{highlight.name}</span>
          </div>
        </div>
        
        <button onClick={(e) => { e.stopPropagation(); router.back(); }} className="p-2 text-white">
          <X className="w-6 h-6" />
        </button>
      </div>

      {/* Content */}
      <div className="relative flex-1 flex items-center justify-center">
        {isVideo ? (
          <video
            ref={videoRef}
            src={currentStory.image}
            className="w-full h-full object-cover"
            playsInline
            muted
            onLoadedMetadata={handleVideoLoaded}
          />
        ) : (
          <Image
            src={currentStory.image}
            alt="Highlight story"
            fill
            className="object-cover"
            priority
          />
        )}

        {/* Navigation arrows */}
        {currentIndex > 0 && (
          <button 
            onClick={(e) => { e.stopPropagation(); goToPrev(); }}
            className="absolute left-2 top-1/2 -translate-y-1/2 p-2 text-white/80 hover:text-white z-20"
          >
            <ChevronLeft className="w-8 h-8" />
          </button>
        )}
        {currentIndex < highlight.stories.length - 1 && (
          <button 
            onClick={(e) => { e.stopPropagation(); goToNext(); }}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-white/80 hover:text-white z-20"
          >
            <ChevronRight className="w-8 h-8" />
          </button>
        )}
      </div>

      {/* Bottom gradient */}
      <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-black/60 to-transparent z-10 pointer-events-none" />
    </div>
  );
}

