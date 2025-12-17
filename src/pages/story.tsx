import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Image from 'next/image';
import Link from 'next/link';
import { X, MoreHorizontal, Volume2, Heart, Send, Music } from 'lucide-react';
import Avatar from '@/components/shared/Avatar';

const stories = [
  {
    id: 1,
    user: {
      username: 'orpaz_avdaev',
      avatar: 'https://i.pravatar.cc/150?img=33',
    },
    image: 'https://picsum.photos/seed/story1/1080/1920',
    timestamp: '10 min',
    music: { artist: 'BTS', song: 'Black Swan' },
  },
  {
    id: 2,
    user: {
      username: 'gal_gadot',
      avatar: 'https://i.pravatar.cc/150?img=5',
    },
    image: 'https://picsum.photos/seed/story2/1080/1920',
    timestamp: '25 min',
    music: { artist: 'Dua Lipa', song: 'Levitating' },
  },
  {
    id: 3,
    user: {
      username: 'anna.zak',
      avatar: 'https://i.pravatar.cc/150?img=9',
    },
    image: 'https://picsum.photos/seed/story3/1080/1920',
    timestamp: '1 hour',
    music: { artist: 'The Weeknd', song: 'Blinding Lights' },
  },
  {
    id: 4,
    user: {
      username: 'leomessi',
      avatar: 'https://i.pravatar.cc/150?img=12',
    },
    image: 'https://picsum.photos/seed/story4/1080/1920',
    timestamp: '2 hours',
    music: { artist: 'Bad Bunny', song: 'Tití Me Preguntó' },
  },
  {
    id: 5,
    user: {
      username: 'noakirel',
      avatar: 'https://i.pravatar.cc/150?img=16',
    },
    image: 'https://picsum.photos/seed/story5/1080/1920',
    timestamp: '3 hours',
    music: { artist: 'Noa Kirel', song: 'Unicorn' },
  },
];

const STORY_DURATION = 5000; // 5 seconds per story

export default function StoryPage() {
  const router = useRouter();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [progress, setProgress] = useState(0);

  const currentStory = stories[currentIndex];

  useEffect(() => {
    // Reset progress when story changes
    setProgress(0);

    // Progress animation
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          return prev;
        }
        return prev + (100 / (STORY_DURATION / 100));
      });
    }, 100);

    // Move to next story after duration
    const timeout = setTimeout(() => {
      if (currentIndex < stories.length - 1) {
        setCurrentIndex(currentIndex + 1);
      } else {
        // After 5 stories, go back to home
        router.push('/');
      }
    }, STORY_DURATION);

    return () => {
      clearInterval(interval);
      clearTimeout(timeout);
    };
  }, [currentIndex, router]);

  const handleNext = () => {
    if (currentIndex < stories.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      router.push('/');
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  return (
    <div className="fixed inset-0 bg-black z-[100] flex flex-col">
      {/* Story Image */}
      <div className="flex-1 relative">
        <Image
          src={currentStory.image}
          alt="Story"
          fill
          className="object-cover"
        />

        {/* Dark gradient overlays for text readability */}
        <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-black/60 to-transparent z-10" />
        <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-black/60 to-transparent z-10" />

        {/* Progress bars */}
        <div className="absolute top-2 left-2 right-2 z-20 flex gap-1">
          {stories.map((_, index) => (
            <div key={index} className="flex-1 h-0.5 bg-white/30 rounded-full overflow-hidden">
              <div 
                className="h-full bg-white transition-all duration-100 ease-linear"
                style={{ 
                  width: index < currentIndex ? '100%' : 
                         index === currentIndex ? `${progress}%` : '0%' 
                }}
              />
            </div>
          ))}
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
                  <span className="text-white text-sm">{currentStory.timestamp}</span>
                  <span className="text-white font-semibold text-sm">{currentStory.user.username}</span>
                </div>
                <div className="flex items-center gap-1 text-white/80 text-xs">
                  <Music className="w-3 h-3" />
                  <span>{currentStory.music.artist} · {currentStory.music.song}</span>
                  <span className="animate-pulse">🎵</span>
                </div>
              </div>
              <Avatar src={currentStory.user.avatar} size="sm" />
            </div>
          </div>
        </div>

        {/* Touch zones for navigation */}
        <div className="absolute inset-0 flex z-10">
          <div className="w-1/2 h-full cursor-pointer" onClick={handlePrev} />
          <div className="w-1/2 h-full cursor-pointer" onClick={handleNext} />
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
            placeholder={`Replay to ${currentStory.user.username}...`}
            className="flex-1 bg-transparent border border-white/30 rounded-full px-4 py-2 text-sm text-white placeholder:text-white/50 outline-none"
          />
        </div>
      </div>
    </div>
  );
}
