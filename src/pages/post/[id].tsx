import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/router';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowLeft, Heart, MessageCircle, Send, Bookmark, MoreHorizontal, Trash2 } from 'lucide-react';
import Avatar from '@/components/shared/Avatar';
import { useApi } from '@/hooks/useApi';
import { useAuth } from '@/context/AuthContext';

interface Post {
  id: string;
  image: string;
  caption: string | null;
  createdAt: string;
  user: {
    id: string;
    username: string;
    avatar: string | null;
  };
  likesCount: number;
  commentsCount: number;
  isLiked: boolean;
}

interface Comment {
  id: string;
  text: string;
  createdAt: string;
  user: {
    id: string;
    username: string;
    avatar: string | null;
  };
  likesCount: number;
  isLiked: boolean;
}

function PostSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="flex items-center gap-3 px-4 py-3">
        <div className="w-10 h-10 rounded-full bg-gray-200" />
        <div className="w-24 h-4 bg-gray-200 rounded" />
      </div>
      <div className="aspect-square w-full bg-gray-200" />
      <div className="px-4 pt-3 pb-2">
        <div className="flex gap-4 mb-3">
          <div className="w-6 h-6 bg-gray-200 rounded" />
          <div className="w-6 h-6 bg-gray-200 rounded" />
          <div className="w-6 h-6 bg-gray-200 rounded" />
        </div>
        <div className="w-20 h-4 bg-gray-200 rounded mb-2" />
        <div className="w-48 h-3 bg-gray-200 rounded" />
      </div>
    </div>
  );
}

function getTimeAgo(date: string): string {
  const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (seconds < 60) return 'now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d`;
  return `${Math.floor(seconds / 604800)}w`;
}

// Single Post Item Component
function PostItem({ 
  post, 
  currentUserId,
  onLike,
  onDelete,
  isDeleting,
}: { 
  post: Post;
  currentUserId?: string;
  onLike: (postId: string) => void;
  onDelete: (postId: string) => void;
  isDeleting: boolean;
}) {
  const [showMenu, setShowMenu] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isLiked, setIsLiked] = useState(post.isLiked);
  const [likesCount, setLikesCount] = useState(post.likesCount);
  const menuRef = useRef<HTMLDivElement>(null);
  
  const isOwner = currentUserId === post.user.id;

  const handleLike = () => {
    setIsLiked(!isLiked);
    setLikesCount(prev => isLiked ? prev - 1 : prev + 1);
    onLike(post.id);
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(false);
      }
    };

    if (showMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showMenu]);

  return (
    <div className="border-b border-gray-100">
      {/* Post Header */}
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-3">
          <Link href={`/user/${post.user.username}`}>
            <Avatar 
              src={post.user.avatar || 'https://i.pravatar.cc/150'} 
              alt={post.user.username} 
              size="sm" 
            />
          </Link>
          <div>
            <Link href={`/user/${post.user.username}`}>
              <span className="font-semibold text-sm">{post.user.username}</span>
            </Link>
          </div>
        </div>
        {isOwner && (
          <div className="relative" ref={menuRef}>
            <button className="p-1" onClick={() => setShowMenu(!showMenu)}>
              <MoreHorizontal className="w-5 h-5 text-gray-700" />
            </button>
            
            {showMenu && (
              <div className="absolute right-0 top-8 bg-white rounded-lg shadow-lg border z-20 min-w-[150px]">
                <button 
                  onClick={() => {
                    setShowMenu(false);
                    setShowDeleteConfirm(true);
                  }}
                  className="w-full flex items-center gap-2 px-4 py-3 text-red-500 hover:bg-gray-50"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Delete</span>
                </button>
              </div>
            )}
          </div>
        )}
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
            <button onClick={handleLike} className="flex items-center gap-1">
              <Heart className={`w-6 h-6 ${isLiked ? 'text-red-500 fill-red-500' : ''}`} />
            </button>
            <Link href={`/comments?postId=${post.id}`}>
              <MessageCircle className="w-6 h-6" />
            </Link>
            <button>
              <Send className="w-6 h-6" />
            </button>
          </div>
          <button>
            <Bookmark className="w-6 h-6" />
          </button>
        </div>

        {/* Likes count */}
        <p className="font-semibold text-sm mb-1">{likesCount} likes</p>

        {/* Caption */}
        {post.caption && (
          <p className="text-sm mb-1">
            <Link href={`/user/${post.user.username}`} className="font-semibold mr-1">
              {post.user.username}
            </Link>
            {post.caption}
          </p>
        )}

        {/* View all comments */}
        {post.commentsCount > 0 && (
          <Link 
            href={`/comments?postId=${post.id}`}
            className="text-sm text-gray-500 mb-1 block"
          >
            View all {post.commentsCount} comments
          </Link>
        )}

        {/* Time */}
        <p className="text-xs text-gray-400 uppercase">{getTimeAgo(post.createdAt)}</p>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-sm w-full overflow-hidden">
            <div className="p-6 text-center">
              <Trash2 className="w-12 h-12 text-red-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Delete Post?</h3>
              <p className="text-gray-500 text-sm">
                This action cannot be undone. The post will be permanently deleted.
              </p>
            </div>
            <div className="border-t flex">
              <button 
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 py-3 font-semibold text-gray-700 hover:bg-gray-50"
                disabled={isDeleting}
              >
                Cancel
              </button>
              <button 
                onClick={() => onDelete(post.id)}
                className="flex-1 py-3 font-semibold text-red-500 hover:bg-red-50 border-l"
                disabled={isDeleting}
              >
                {isDeleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function PostPage() {
  const router = useRouter();
  const { id, username } = router.query;
  const { get, post: apiPost, del } = useApi();
  const { user } = useAuth();
  
  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const postRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  const initialScrollDone = useRef(false);

  useEffect(() => {
    if (id) {
      loadPosts();
    }
  }, [id, username]);

  const loadPosts = async () => {
    setIsLoading(true);
    
    if (username) {
      // Load all posts from this user
      const userData = await get<{ posts: { id: string; image: string }[] }>(`/api/users/${username}`);
      if (userData?.posts) {
        // Fetch full details for each post
        const postPromises = userData.posts.map(p => get<Post>(`/api/posts/${p.id}`));
        const postResults = await Promise.all(postPromises);
        const validPosts = postResults.filter((p): p is Post => p !== null);
        setPosts(validPosts);
      }
    } else {
      // Load single post
      const postResult = await get<Post>(`/api/posts/${id}`);
      if (postResult) {
        setPosts([postResult]);
      }
    }
    
    setIsLoading(false);
  };

  // Scroll to the selected post after loading
  useEffect(() => {
    if (!isLoading && posts.length > 0 && id && !initialScrollDone.current) {
      const targetRef = postRefs.current.get(id as string);
      if (targetRef) {
        setTimeout(() => {
          targetRef.scrollIntoView({ behavior: 'auto', block: 'start' });
          initialScrollDone.current = true;
        }, 100);
      }
    }
  }, [isLoading, posts, id]);

  const handleLike = async (postId: string) => {
    await apiPost(`/api/posts/${postId}/like`, {});
  };

  const handleDelete = async (postId: string) => {
    setIsDeleting(true);
    const result = await del(`/api/posts/${postId}`);
    setIsDeleting(false);
    
    if (result) {
      // Remove from list
      const newPosts = posts.filter(p => p.id !== postId);
      if (newPosts.length === 0) {
        router.push('/profile');
      } else {
        setPosts(newPosts);
      }
    }
  };

  // Update URL when scrolling
  const handleScroll = useCallback(() => {
    if (!containerRef.current || posts.length <= 1) return;
    
    const container = containerRef.current;
    const scrollTop = container.scrollTop;
    
    // Find which post is most visible
    let visiblePostId = posts[0]?.id;
    let minDistance = Infinity;
    
    postRefs.current.forEach((element, postId) => {
      const rect = element.getBoundingClientRect();
      const containerRect = container.getBoundingClientRect();
      const distance = Math.abs(rect.top - containerRect.top);
      
      if (distance < minDistance) {
        minDistance = distance;
        visiblePostId = postId;
      }
    });
    
    // Update URL without navigation
    if (visiblePostId && visiblePostId !== id) {
      const newUrl = username 
        ? `/post/${visiblePostId}?username=${username}`
        : `/post/${visiblePostId}`;
      window.history.replaceState(null, '', newUrl);
    }
  }, [posts, id, username]);

  const setPostRef = useCallback((postId: string) => (el: HTMLDivElement | null) => {
    if (el) {
      postRefs.current.set(postId, el);
    } else {
      postRefs.current.delete(postId);
    }
  }, []);

  return (
    <div className="bg-white min-h-screen">
      {/* Header */}
      <div className="flex items-center gap-4 px-4 py-3 border-b sticky top-0 bg-white z-10">
        <button onClick={() => router.back()}>
          <ArrowLeft className="w-6 h-6" />
        </button>
        <span className="font-semibold">Posts</span>
      </div>

      {isLoading ? (
        <PostSkeleton />
      ) : posts.length > 0 ? (
        <div 
          ref={containerRef}
          className="overflow-y-auto"
          style={{ height: 'calc(100vh - 57px)' }}
          onScroll={handleScroll}
        >
          {posts.map((post) => (
            <div key={post.id} ref={setPostRef(post.id)}>
              <PostItem
                post={post}
                currentUserId={user?.id}
                onLike={handleLike}
                onDelete={handleDelete}
                isDeleting={isDeleting}
              />
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 text-gray-500">
          <p>Post not found</p>
        </div>
      )}
    </div>
  );
}
