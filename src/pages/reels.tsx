import Image from 'next/image';
import { Search, Play } from 'lucide-react';

const reelsData = [
  { id: 1, image: 'https://picsum.photos/seed/reel1/300/300' },
  { id: 2, image: 'https://picsum.photos/seed/reel2/300/300' },
  { id: 3, image: 'https://picsum.photos/seed/reel3/300/300' },
  { id: 4, image: 'https://picsum.photos/seed/reel4/300/300' },
  { id: 5, image: 'https://picsum.photos/seed/reel5/300/300' },
  { id: 6, image: 'https://picsum.photos/seed/reel6/300/300' },
  { id: 7, image: 'https://picsum.photos/seed/reel7/300/300' },
  { id: 8, image: 'https://picsum.photos/seed/reel8/300/300' },
  { id: 9, image: 'https://picsum.photos/seed/reel9/300/300' },
  { id: 10, image: 'https://picsum.photos/seed/reel10/300/300' },
  { id: 11, image: 'https://picsum.photos/seed/reel11/300/300' },
  { id: 12, image: 'https://picsum.photos/seed/reel12/300/300' },
  { id: 13, image: 'https://picsum.photos/seed/reel13/300/300' },
  { id: 14, image: 'https://picsum.photos/seed/reel14/300/300' },
  { id: 15, image: 'https://picsum.photos/seed/reel15/300/300' },
];

export default function ReelsPage() {
  return (
    <div className="bg-white min-h-screen">
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-200">
        <span className="text-sm text-gray-400">Reels</span>
      </div>

      {/* Search Bar */}
      <div className="px-4 py-3">
        <div className="flex items-center gap-2 bg-gray-100 rounded-lg px-4 py-2.5">
          <span className="text-gray-400 text-sm">search</span>
          <Search className="w-4 h-4 text-gray-400 ml-auto" />
        </div>
      </div>

      {/* Reels Grid */}
      <div className="grid grid-cols-3 gap-0.5">
        {reelsData.map((reel) => (
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
        ))}
      </div>
    </div>
  );
}

