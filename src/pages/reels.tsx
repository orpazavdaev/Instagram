import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Search, Play, Heart, MessageCircle } from 'lucide-react';
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
    <div className="aspect-[9/16] bg-gray-200 animate-pulse relative">
      <div className="absolute bottom-2 left-2 right-2 space-y-1">
        <div className="h-3 bg-gray-300 rounded w-1/2" />
        <div className="flex gap-2">
          <div className="h-3 bg-gray-300 rounded w-8" />
          <div className="h-3 bg-gray-300 rounded w-8" />
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
    <div className="bg-white min-h-screen">
      {/* Search Bar */}
      <div className="px-4 py-3">
        <div className="flex items-center gap-2 bg-gray-100 rounded-lg px-4 py-2.5">
          <span className="text-gray-400 text-sm">search</span>
          <Search className="w-4 h-4 text-gray-400 ml-auto" />
        </div>
      </div>

      {/* Reels Grid */}
      <div className="grid grid-cols-3 gap-0.5 pb-24">
        {isLoading ? (
          // Skeleton grid
          Array.from({ length: 9 }).map((_, i) => (
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
