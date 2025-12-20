import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Heart, MessageCircle, Send, Bookmark, MoreHorizontal, Plus } from 'lucide-react';
import Avatar from '@/components/shared/Avatar';
import { useApi } from '@/hooks/useApi';
import { useAuth } from '@/context/AuthContext';

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

interface Story {
  id: string;
  image: string;
  isViewed?: boolean;
}

interface StoryGroup {
  user: {
    id: string;
    username: string;
    avatar: string;
  };
  stories: Story[];
  allViewed?: boolean;
  isOwnStories?: boolean;
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

// Function to clear cache (call after creating new content)
export function clearHomeCache() {
  cachedPosts = null;
  cachedStories = null;
}

// Function to mark a story as viewed in cache
export function markStoryAsViewedInCache(storyId: string, userId: string) {
  if (!cachedStories) return;
  
  cachedStories = cachedStories.map(group => {
    if (group.user.id === userId) {
      const updatedStories = group.stories.map(s => 
        s.id === storyId ? { ...s, isViewed: true } : s
      );
      const allViewed = updatedStories.every(s => s.isViewed);
      return { ...group, stories: updatedStories, allViewed };
    }
    return group;
  });
}

// Sort stories: own first, then unviewed, then viewed
function sortStories(storyGroups: StoryGroup[]): StoryGroup[] {
  return [...storyGroups].sort((a, b) => {
    // Own stories always first
    if (a.isOwnStories && !b.isOwnStories) return -1;
    if (!a.isOwnStories && b.isOwnStories) return 1;
    // Then unviewed before viewed
    if (a.allViewed && !b.allViewed) return 1;
    if (!a.allViewed && b.allViewed) return -1;
    return 0;
  });
}

export default function Home() {
  const { get, post: apiPost } = useApi();
  const { user: currentUser } = useAuth();
  const [posts, setPosts] = useState<Post[]>(cachedPosts || []);
  const [stories, setStories] = useState<StoryGroup[]>(cachedStories ? sortStories(cachedStories) : []);
  const [isLoading, setIsLoading] = useState(!cachedPosts);
  const [myStory, setMyStory] = useState<StoryGroup | null>(null);

  const refreshFromCache = useCallback(() => {
    if (cachedStories) {
      const myStories = cachedStories.find(g => g.user.id === currentUser?.id);
      const otherStories = cachedStories.filter(g => g.user.id !== currentUser?.id);
      setMyStory(myStories || null);
      setStories(sortStories(otherStories));
    }
    if (cachedPosts) {
      setPosts(cachedPosts);
    }
  }, [currentUser?.id]);

  useEffect(() => {
    // Only load if no cached data
    if (!cachedPosts || !cachedStories) {
      loadData();
    } else {
      // Refresh from cache (in case stories were viewed)
      refreshFromCache();
      setIsLoading(false);
    }
  }, [refreshFromCache]);

  const loadData = async () => {
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
      // Separate own stories from others
      const myStories = storiesData.find(g => g.user.id === currentUser?.id);
      const otherStories = storiesData.filter(g => g.user.id !== currentUser?.id);
      const sorted = sortStories(otherStories);
      
      setMyStory(myStories || null);
      setStories(sorted);
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
      <div className="flex gap-3 overflow-x-auto hide-scrollbar px-4 py-3 border-b border-gray-100">
        {isLoading ? (
          // Skeleton stories
          <>
            <StorySkeleton />
            <StorySkeleton />
            <StorySkeleton />
            <StorySkeleton />
            <StorySkeleton />
          </>
        ) : (
          <>
            {/* Your Story - always first */}
            <div className="flex flex-col items-center gap-1 flex-shrink-0">
              <div className="relative">
                {myStory ? (
                  // Has stories - click to view, with + button to add more
                  <>
                    <Link href={`/story?userId=${currentUser?.id}`}>
                      <Avatar
                        src={currentUser?.avatar || 'https://i.pravatar.cc/150'}
                        alt="Your story"
                        size="lg"
                        hasStory
                        isViewed={myStory.allViewed}
                      />
                    </Link>
                    <Link 
                      href="/create"
                      className="absolute -bottom-0.5 -right-0.5 w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center border-2 border-white"
                    >
                      <Plus className="w-3 h-3 text-white" />
                    </Link>
                  </>
                ) : (
                  // No stories - click to add
                  <Link href="/create">
                    <div className="relative">
                      <Avatar
                        src={currentUser?.avatar || 'https://i.pravatar.cc/150'}
                        alt="Your story"
                        size="lg"
                      />
                      <div className="absolute -bottom-0.5 -right-0.5 w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center border-2 border-white">
                        <Plus className="w-3 h-3 text-white" />
                      </div>
                    </div>
                  </Link>
                )}
              </div>
              <span className="text-xs text-center w-16 truncate">Your story</span>
            </div>

            {/* Other users' stories */}
            {stories.map((storyGroup) => (
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
            ))}

            {stories.length === 0 && !myStory && (
              <p className="text-gray-400 text-sm py-4 pl-4">No stories yet</p>
            )}
          </>
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
                    <Link href={`/user/${post.user.username}`}>
                      <Avatar src={post.user.avatar || 'https://i.pravatar.cc/150'} alt={post.user.username} size="sm" />
                    </Link>
                    <Link href={`/user/${post.user.username}`} className="font-semibold text-sm">
                      {post.user.username}
                    </Link>
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
