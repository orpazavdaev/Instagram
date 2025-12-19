import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Heart, MessageCircle, Send, Bookmark, MoreHorizontal } from 'lucide-react';
import Avatar from '@/components/shared/Avatar';
import { useApi } from '@/hooks/useApi';

interface Post {
  id: string;
  image: string;
  caption: string;
  createdAt: string;
  user: {
    id: string;
    username: string;
    avatar: string;
  };
  likesCount: number;
  commentsCount: number;
  likedByUser: string[];
}

interface StoryGroup {
  user: {
    id: string;
    username: string;
    avatar: string;
  };
  stories: Array<{
    id: string;
    image: string;
  }>;
}

// Fallback data for when DB is empty
const fallbackStories = [
  { id: '1', username: 'gal_gadot', avatar: 'https://i.pravatar.cc/150?img=5', hasStory: true },
  { id: '2', username: 'anna.zak', avatar: 'https://i.pravatar.cc/150?img=9', hasStory: true },
  { id: '3', username: 'leomessi', avatar: 'https://i.pravatar.cc/150?img=12', hasStory: true },
  { id: '4', username: 'noakirel', avatar: 'https://i.pravatar.cc/150?img=16', hasStory: true },
  { id: '5', username: 'selenagomez', avatar: 'https://i.pravatar.cc/150?img=20', hasStory: true },
];

const fallbackPosts = [
  {
    id: '1',
    username: 'orpaz_avdaev',
    avatar: 'https://i.pravatar.cc/150?img=33',
    image: 'https://picsum.photos/seed/nature1/600/600',
    likes: 107,
    comments: 24,
    caption: 'Nature ✨🌿',
  },
  {
    id: '2',
    username: 'travel_adventures',
    avatar: 'https://i.pravatar.cc/150?img=8',
    image: 'https://picsum.photos/seed/beach1/600/600',
    likes: 234,
    comments: 18,
    caption: 'Paradise found 🏝️',
  },
  {
    id: '3',
    username: 'food_lover',
    avatar: 'https://i.pravatar.cc/150?img=15',
    image: 'https://picsum.photos/seed/food1/600/600',
    likes: 89,
    comments: 12,
    caption: 'Delicious 😋🍕',
  },
];

export default function Home() {
  const { get, post: apiPost } = useApi();
  const [posts, setPosts] = useState<Post[]>([]);
  const [stories, setStories] = useState<StoryGroup[]>([]);
  const [useFallback, setUseFallback] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const [postsData, storiesData] = await Promise.all([
      get<Post[]>('/api/posts'),
      get<StoryGroup[]>('/api/stories'),
    ]);

    if (postsData && postsData.length > 0) {
      setPosts(postsData);
    } else {
      setUseFallback(true);
    }

    if (storiesData) {
      setStories(storiesData);
    }
  };

  const handleLike = async (postId: string) => {
    const result = await apiPost<{ liked: boolean }>(`/api/posts/${postId}/like`, {});
    if (result) {
      loadData(); // Refresh posts
    }
  };

  const currentUserId = typeof window !== 'undefined' 
    ? JSON.parse(localStorage.getItem('user') || '{}').id 
    : null;

  return (
    <div className="bg-white">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
        <div className="relative">
          <button className="p-1">
            <Heart className="w-6 h-6" />
          </button>
          <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
        </div>
        <div className="flex-1" />
        <Link href="/messages" className="p-1">
          <Send className="w-6 h-6" />
        </Link>
      </div>

      {/* Stories */}
      <div className="flex gap-4 overflow-x-auto hide-scrollbar px-4 py-3 border-b border-gray-100">
        {stories.length > 0 ? (
          stories.map((storyGroup) => (
            <Link
              key={storyGroup.user.id}
              href={`/story?userId=${storyGroup.user.id}`}
              className="flex flex-col items-center gap-1 flex-shrink-0"
            >
              <Avatar
                src={storyGroup.user.avatar || 'https://i.pravatar.cc/150'}
                alt={storyGroup.user.username}
                size="lg"
                hasStory
              />
              <span className="text-xs text-center w-16 truncate">{storyGroup.user.username}</span>
            </Link>
          ))
        ) : (
          fallbackStories.map((story) => (
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
          ))
        )}
      </div>

      {/* Posts Feed */}
      <div className="pb-20">
        {(useFallback ? fallbackPosts : posts).map((post) => {
          const isFromApi = 'user' in post;
          const username = isFromApi ? (post as Post).user.username : (post as typeof fallbackPosts[0]).username;
          const avatar = isFromApi ? (post as Post).user.avatar : (post as typeof fallbackPosts[0]).avatar;
          const likes = isFromApi ? (post as Post).likesCount : (post as typeof fallbackPosts[0]).likes;
          const comments = isFromApi ? (post as Post).commentsCount : (post as typeof fallbackPosts[0]).comments;
          const image = post.image;
          const caption = post.caption;
          const isLiked = isFromApi && currentUserId 
            ? (post as Post).likedByUser.includes(currentUserId) 
            : false;

          return (
            <article key={post.id} className="border-b border-gray-100">
              {/* Post Header */}
              <div className="flex items-center justify-between px-4 py-3">
                <div className="flex items-center gap-3">
                  <Link href="/story">
                    <Avatar src={avatar || 'https://i.pravatar.cc/150'} alt={username} size="sm" hasStory />
                  </Link>
                  <span className="font-semibold text-sm">{username}</span>
                </div>
                <button className="p-1">
                  <MoreHorizontal className="w-5 h-5 text-gray-700" />
                </button>
              </div>

              {/* Post Image */}
              <div className="relative aspect-square w-full bg-gray-100">
                <Image
                  src={image}
                  alt={`Post by ${username}`}
                  fill
                  className="object-cover"
                />
              </div>

              {/* Post Actions */}
              <div className="px-4 pt-3 pb-2">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-4">
                    <button onClick={() => isFromApi && handleLike(post.id)} className="flex items-center gap-1">
                      <Heart className={`w-6 h-6 ${isLiked ? 'text-red-500 fill-red-500' : ''}`} />
                      <span className="text-sm">{likes}</span>
                    </button>
                    <Link href={`/comments?postId=${post.id}`} className="flex items-center gap-1">
                      <MessageCircle className="w-6 h-6" />
                      <span className="text-sm">{comments}</span>
                    </Link>
                    <button>
                      <Send className="w-6 h-6" />
                    </button>
                  </div>
                  <button>
                    <Bookmark className="w-6 h-6" />
                  </button>
                </div>

                {/* Caption */}
                <p className="text-sm">
                  <span className="font-semibold mr-1">{username}</span>
                  {caption}
                </p>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}
