import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Play, Heart, MessageCircle } from 'lucide-react';
import { useApi } from '@/hooks/useApi';

interface Reel {
  id: string;
  video: string;
  thumbnail: string | null;
  caption: string | null;
  user: {
    id: string;
    username: string;
    avatar: string | null;
  };
  likesCount: number;
  commentsCount: number;
  isLiked: boolean;
}

// Skeleton Component
function ReelSkeleton() {
  return (
    <div className="aspect-[9/16] bg-gradient-to-b from-gray-800 to-gray-900 animate-pulse relative overflow-hidden">
      {/* Shimmer effect */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full animate-[shimmer_1.5s_infinite]" />
      
      {/* Play icon placeholder */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="w-12 h-12 rounded-full bg-white/10" />
      </div>
      
      {/* Bottom content placeholder */}
      <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/50 to-transparent">
        <div className="h-3 bg-white/20 rounded w-1/2 mb-2" />
        <div className="flex gap-3">
          <div className="h-3 bg-white/20 rounded w-10" />
          <div className="h-3 bg-white/20 rounded w-10" />
        </div>
      </div>
    </div>
  );
}

export default function ReelsPage() {
  const [reels, setReels] = useState<Reel[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { get } = useApi();

  useEffect(() => {
    loadReels();
  }, []);

  const loadReels = async () => {
    setIsLoading(true);
    const data = await get<Reel[]>('/api/reels');
    if (data) {
      setReels(data);
    }
    setIsLoading(false);
  };

  // Format numbers (e.g., 1000 -> 1K)
  const formatCount = (count: number) => {
    if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`;
    if (count >= 1000) return `${(count / 1000).toFixed(1)}K`;
    return count.toString();
  };

  return (
    <div className="bg-black min-h-screen">
      {/* Reels Grid */}
      <div className="grid grid-cols-3 gap-0.5">
        {isLoading ? (
          // Skeleton grid - 12 items to fill more of the screen
          Array.from({ length: 12 }).map((_, i) => (
            <ReelSkeleton key={i} />
          ))
        ) : reels.length === 0 ? (
          <div className="col-span-3 py-20 text-center text-gray-500">
            <Play className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <p>No reels yet</p>
          </div>
        ) : (
          reels.map((reel) => (
            <Link 
              key={reel.id} 
              href={`/reel/${reel.id}`}
              className="relative aspect-[9/16] group cursor-pointer bg-black"
            >
              {/* Thumbnail or Video Preview */}
              <Image
                src={reel.thumbnail || `https://picsum.photos/seed/${reel.id}/300/533`}
                alt={reel.caption || 'Reel'}
                fill
                className="object-cover"
              />
              
              {/* Play icon overlay */}
              <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                <Play className="w-8 h-8 text-white fill-white opacity-80" />
              </div>
              
              {/* Stats overlay */}
              <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/70 to-transparent">
                <p className="text-white text-xs font-medium truncate mb-1">
                  @{reel.user.username}
                </p>
                <div className="flex items-center gap-3 text-white text-xs">
                  <span className="flex items-center gap-1">
                    <Heart className={`w-3 h-3 ${reel.isLiked ? 'fill-red-500 text-red-500' : ''}`} />
                    {formatCount(reel.likesCount)}
                  </span>
                  <span className="flex items-center gap-1">
                    <MessageCircle className="w-3 h-3" />
                    {formatCount(reel.commentsCount)}
                  </span>
                </div>
              </div>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
