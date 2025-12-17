import Image from 'next/image';
import Link from 'next/link';
import { Heart, MessageCircle, Send, Bookmark, MoreHorizontal } from 'lucide-react';
import Avatar from '@/components/shared/Avatar';

const stories = [
  { id: 1, username: 'gal_gadot', avatar: 'https://i.pravatar.cc/150?img=5', hasStory: true },
  { id: 2, username: 'anna.zak', avatar: 'https://i.pravatar.cc/150?img=9', hasStory: true },
  { id: 3, username: 'leomessi', avatar: 'https://i.pravatar.cc/150?img=12', hasStory: true },
  { id: 4, username: 'noakirel', avatar: 'https://i.pravatar.cc/150?img=16', hasStory: true },
  { id: 5, username: 'selenagomez', avatar: 'https://i.pravatar.cc/150?img=20', hasStory: true },
];

const posts = [
  {
    id: 1,
    username: 'orpaz_avdaev',
    avatar: 'https://i.pravatar.cc/150?img=33',
    image: 'https://picsum.photos/seed/nature1/600/600',
    likes: 107,
    comments: 24,
    caption: 'Nature ✨🌿',
  },
  {
    id: 2,
    username: 'travel_adventures',
    avatar: 'https://i.pravatar.cc/150?img=8',
    image: 'https://picsum.photos/seed/beach1/600/600',
    likes: 234,
    comments: 18,
    caption: 'Paradise found 🏝️',
  },
  {
    id: 3,
    username: 'food_lover',
    avatar: 'https://i.pravatar.cc/150?img=15',
    image: 'https://picsum.photos/seed/food1/600/600',
    likes: 89,
    comments: 12,
    caption: 'Delicious 😋🍕',
  },
];

export default function Home() {
  return (
    <div className="bg-white min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
        <button className="p-1 relative">
          <Heart className="w-6 h-6" />
          <span className="absolute top-1 right-0.5 w-2 h-2 bg-red-500 rounded-full" />
        </button>
        <div className="flex-1" />
        <Link href="/messages" className="p-1">
          <Send className="w-6 h-6" />
        </Link>
      </div>

      {/* Stories */}
      <div className="flex gap-4 overflow-x-auto hide-scrollbar px-4 py-3 border-b border-gray-100">
        {stories.map((story) => (
          <Link 
            key={story.id} 
            href="/story"
            className="flex flex-col items-center gap-1 flex-shrink-0"
          >
            <Avatar 
              src={story.avatar}
              alt={story.username}
              size="lg"
              hasStory={story.hasStory}
            />
            <span className="text-xs text-center w-16 truncate">{story.username}</span>
          </Link>
        ))}
      </div>

      {/* Posts Feed */}
      <div>
        {posts.map((post) => (
          <article key={post.id} className="border-b border-gray-100">
            {/* Post Header */}
            <div className="flex items-center justify-between px-4 py-3">
              <div className="flex items-center gap-3">
                <Link href="/story">
                  <Avatar src={post.avatar} alt={post.username} size="sm" hasStory />
                </Link>
                <span className="font-semibold text-sm">{post.username}</span>
              </div>
              <button className="p-1">
                <MoreHorizontal className="w-5 h-5 text-gray-700" />
              </button>
            </div>

            {/* Post Image */}
            <div className="relative aspect-square w-full bg-gray-100">
              <Image
                src={post.image}
                alt={`Post by ${post.username}`}
                fill
                className="object-cover"
              />
            </div>

            {/* Post Actions */}
            <div className="px-4 pt-3 pb-3">
              {/* Likes, Comments, Share and Bookmark */}
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-4">
                  <button className="flex items-center gap-1">
                    <Heart className="w-5 h-5" />
                    <span className="text-sm">{post.likes}</span>
                  </button>
                  <Link href="/comments" className="flex items-center gap-1">
                    <MessageCircle className="w-5 h-5" />
                    <span className="text-sm">{post.comments}</span>
                  </Link>
                  <button>
                    <Send className="w-5 h-5" />
                  </button>
                </div>
                <button>
                  <Bookmark className="w-5 h-5" />
                </button>
              </div>

              {/* Caption */}
              <p className="text-sm">
                <span className="font-semibold mr-1">{post.username}</span>
                {post.caption}
              </p>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
