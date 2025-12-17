import Image from 'next/image';
import Link from 'next/link';
import { X, MoreHorizontal, Volume2, Heart, Send, Music } from 'lucide-react';
import Avatar from '@/components/shared/Avatar';

const storyData = {
  user: {
    username: 'orpaz_avdaev',
    avatar: 'https://i.pravatar.cc/150?img=33',
  },
  image: 'https://picsum.photos/seed/storysunset/1080/1920',
  timestamp: '10 min',
  music: {
    artist: 'BTS',
    song: 'Black Swan',
  },
};

export default function StoryPage() {
  return (
    <div className="fixed inset-0 bg-black z-[100] flex flex-col">
      {/* Story Image */}
      <div className="flex-1 relative">
        <Image
          src={storyData.image}
          alt="Story"
          fill
          className="object-cover"
        />

        {/* Progress bar */}
        <div className="absolute top-2 left-2 right-2 z-20">
          <div className="story-progress">
            <div className="story-progress-fill" />
          </div>
        </div>

        {/* Top controls */}
        <div className="absolute top-6 left-0 right-0 px-4 z-20">
          <div className="flex items-center justify-between">
            {/* Left controls */}
            <div className="flex items-center gap-3">
              <Link href="/" className="text-white">
                <X className="w-6 h-6" />
              </Link>
              <button className="text-white">
                <MoreHorizontal className="w-6 h-6" />
              </button>
              <button className="text-white">
                <Volume2 className="w-6 h-6" />
              </button>
            </div>

            {/* Right - User info and music */}
            <div className="flex items-center gap-3">
              <div className="text-right">
                <div className="flex items-center gap-2">
                  <span className="text-white text-sm">{storyData.timestamp}</span>
                  <span className="text-white font-semibold text-sm">{storyData.user.username}</span>
                </div>
                <div className="flex items-center gap-1 text-white/80 text-xs">
                  <Music className="w-3 h-3" />
                  <span>{storyData.music.artist} · {storyData.music.song}</span>
                  <span className="animate-pulse">🎵</span>
                </div>
              </div>
              <Avatar src={storyData.user.avatar} size="sm" />
            </div>
          </div>
        </div>
      </div>

      {/* Bottom controls */}
      <div className="bg-black px-4 py-4">
        <div className="flex items-center gap-3">
          <button className="text-white">
            <Send className="w-6 h-6" />
          </button>
          <button className="text-white">
            <Heart className="w-6 h-6" />
          </button>
          <input
            type="text"
            placeholder={`Replay to ${storyData.user.username}...`}
            className="flex-1 bg-transparent border border-white/30 rounded-full px-4 py-2 text-sm text-white placeholder:text-white/50 outline-none"
          />
        </div>
      </div>
    </div>
  );
}

