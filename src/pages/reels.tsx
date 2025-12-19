import { useState, useEffect } from 'react';
import Image from 'next/image';
import { Search, Play } from 'lucide-react';

interface Reel {
  id: string;
  image: string;
}

// Skeleton Component
function ReelSkeleton() {
  return <div className="aspect-square bg-gray-200 animate-pulse" />;
}

export default function ReelsPage() {
  const [reels, setReels] = useState<Reel[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadReels();
  }, []);

  const loadReels = async () => {
    setIsLoading(true);
    // Simulate loading - in future this could be real API
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Generate reels
    const reelsData = Array.from({ length: 30 }, (_, i) => ({
      id: String(i + 1),
      image: `https://picsum.photos/seed/reel${i + 1}/300/300`,
    }));
    
    setReels(reelsData);
    setIsLoading(false);
  };

  return (
    <div className="bg-white pb-20">
      {/* Search Bar */}
      <div className="px-4 py-3">
        <div className="flex items-center gap-2 bg-gray-100 rounded-lg px-4 py-2.5">
          <span className="text-gray-400 text-sm">search</span>
          <Search className="w-4 h-4 text-gray-400 ml-auto" />
        </div>
      </div>

      {/* Reels Grid */}
      <div className="grid grid-cols-3 gap-0.5">
        {isLoading ? (
          // Skeleton grid
          Array.from({ length: 12 }).map((_, i) => (
            <ReelSkeleton key={i} />
          ))
        ) : (
          reels.map((reel) => (
            <div key={reel.id} className="relative aspect-square group cursor-pointer">
              <Image
                src={reel.image}
                alt={`Reel ${reel.id}`}
                fill
                className="object-cover"
              />
              {/* Play icon overlay on hover */}
              <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <Play className="w-8 h-8 text-white fill-white" />
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
