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
  allViewed?: boolean;
}

// Skeleton Components
function StorySkeleton() {
  return (
    <div className="flex flex-col items-center gap-1 flex-shrink-0 animate-pulse">
      <div className="w-16 h-16 rounded-full bg-gray-200" />
      <div className="w-12 h-3 bg-gray-200 rounded" />
    </div>
  );
}

function PostSkeleton() {
  return (
    <article className="animate-pulse">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3">
        <div className="w-8 h-8 rounded-full bg-gray-200" />
        <div className="w-24 h-3 bg-gray-200 rounded" />
      </div>
      {/* Image */}
      <div className="aspect-square w-full bg-gray-200" />
      {/* Actions */}
      <div className="px-4 pt-3 pb-2">
        <div className="flex gap-4 mb-3">
          <div className="w-6 h-6 bg-gray-200 rounded" />
          <div className="w-6 h-6 bg-gray-200 rounded" />
          <div className="w-6 h-6 bg-gray-200 rounded" />
        </div>
        <div className="w-20 h-3 bg-gray-200 rounded mb-2" />
        <div className="w-48 h-3 bg-gray-200 rounded" />
      </div>
    </article>
  );
}

// Cache data between navigations
let cachedPosts: Post[] | null = null;
let cachedStories: StoryGroup[] | null = null;

export default function Home() {
  const { get, post: apiPost } = useApi();
  const [posts, setPosts] = useState<Post[]>(cachedPosts || []);
  const [stories, setStories] = useState<StoryGroup[]>(cachedStories || []);
  const [isLoading, setIsLoading] = useState(!cachedPosts);

  useEffect(() => {
    // Only load if no cached data
    if (!cachedPosts) {
      loadData();
    }
  }, []);

  const loadData = async (forceRefresh = false) => {
    if (!forceRefresh && cachedPosts && cachedStories) {
      setPosts(cachedPosts);
      setStories(cachedStories);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    const [postsData, storiesData] = await Promise.all([
      get<Post[]>('/api/posts'),
      get<StoryGroup[]>('/api/stories'),
    ]);

    if (postsData) {
      setPosts(postsData);
      cachedPosts = postsData;
    }

    if (storiesData) {
      setStories(storiesData);
      cachedStories = storiesData;
    }
    setIsLoading(false);
  };

  const handleLike = async (postId: string) => {
    if (!currentUserId) return;
    
    // Optimistic update - update UI immediately
    setPosts(prevPosts => {
      const updatedPosts = prevPosts.map(post => {
        if (post.id === postId) {
          const isCurrentlyLiked = post.likedByUser.includes(currentUserId);
          return {
            ...post,
            likesCount: isCurrentlyLiked ? post.likesCount - 1 : post.likesCount + 1,
            likedByUser: isCurrentlyLiked 
              ? post.likedByUser.filter(id => id !== currentUserId)
              : [...post.likedByUser, currentUserId],
          };
        }
        return post;
      });
      cachedPosts = updatedPosts; // Update cache
      return updatedPosts;
    });

    // Send to server (no need to wait or refresh)
    await apiPost<{ liked: boolean }>(`/api/posts/${postId}/like`, {});
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
        {isLoading ? (
          // Skeleton stories
          <>
            <StorySkeleton />
            <StorySkeleton />
            <StorySkeleton />
            <StorySkeleton />
            <StorySkeleton />
          </>
        ) : stories.length > 0 ? (
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
                isViewed={storyGroup.allViewed}
              />
              <span className="text-xs text-center w-16 truncate">{storyGroup.user.username}</span>
            </Link>
          ))
        ) : (
          <p className="text-gray-400 text-sm py-4">No stories yet</p>
        )}
      </div>

      {/* Posts Feed */}
      <div className="pb-20">
        {isLoading ? (
          // Skeleton posts
          <>
            <PostSkeleton />
            <PostSkeleton />
          </>
        ) : posts.length > 0 ? (
          posts.map((post) => {
            const isLiked = currentUserId 
              ? post.likedByUser.includes(currentUserId) 
              : false;

            return (
              <article key={post.id}>
                {/* Post Header */}
                <div className="flex items-center justify-between px-4 py-3">
                  <div className="flex items-center gap-3">
                    <Link href={`/story?userId=${post.user.id}`}>
                      <Avatar src={post.user.avatar || 'https://i.pravatar.cc/150'} alt={post.user.username} size="sm" hasStory />
                    </Link>
                    <span className="font-semibold text-sm">{post.user.username}</span>
                  </div>
                  <button className="p-1">
                    <MoreHorizontal className="w-5 h-5 text-gray-700" />
                  </button>
                </div>

                {/* Post Image */}
                <div className="relative aspect-square w-full bg-gray-100">
                  <Image
                    src={post.image}
                    alt={`Post by ${post.user.username}`}
                    fill
                    className="object-cover"
                  />
                </div>

                {/* Post Actions */}
                <div className="px-4 pt-3 pb-2">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-4">
                      <button onClick={() => handleLike(post.id)} className="flex items-center gap-1">
                        <Heart className={`w-6 h-6 ${isLiked ? 'text-red-500 fill-red-500' : ''}`} />
                        <span className="text-sm">{post.likesCount}</span>
                      </button>
                      <Link href={`/comments?postId=${post.id}`} className="flex items-center gap-1">
                        <MessageCircle className="w-6 h-6" />
                        <span className="text-sm">{post.commentsCount}</span>
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
                    <span className="font-semibold mr-1">{post.user.username}</span>
                    {post.caption}
                  </p>
                </div>
              </article>
            );
          })
        ) : (
          <div className="flex flex-col items-center justify-center py-20 text-gray-400">
            <p className="text-lg">No posts yet</p>
            <p className="text-sm">Be the first to share something!</p>
          </div>
        )}
      </div>
    </div>
  );
}
