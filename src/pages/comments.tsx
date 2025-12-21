import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { ChevronLeft, Heart } from 'lucide-react';
import Avatar from '@/components/shared/Avatar';
import { useAuth } from '@/context/AuthContext';
import { useApi } from '@/hooks/useApi';

interface Comment {
  id: string;
  text: string;
  createdAt: string;
  likesCount: number;
  user: {
    id: string;
    username: string;
    avatar: string;
  };
}

function getTimeAgo(date: string): string {
  const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  
  if (seconds < 60) return 'now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h`;
  return `${Math.floor(seconds / 86400)}d`;
}

// Skeleton Component
function CommentSkeleton() {
  return (
    <div className="flex items-start gap-3 px-4 py-3 animate-pulse">
      <div className="w-8 h-8 rounded-full bg-gray-200" />
      <div className="flex-1">
        <div className="w-48 h-4 bg-gray-200 rounded mb-2" />
        <div className="w-24 h-3 bg-gray-200 rounded" />
      </div>
      <div className="w-4 h-4 bg-gray-200 rounded" />
    </div>
  );
}

export default function CommentsPage() {
  const router = useRouter();
  const { postId } = router.query;
  const { user } = useAuth();
  const { get, post: apiPost } = useApi();
  
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [likedComments, setLikedComments] = useState<Set<string>>(new Set());
  const [likeCounts, setLikeCounts] = useState<Record<string, number>>({});

  useEffect(() => {
    if (postId) {
      loadComments();
    }
  }, [postId]);

  const loadComments = async () => {
    setIsLoading(true);
    const data = await get<Comment[]>(`/api/posts/${postId}/comments`);
    if (data) {
      setComments(data);
      // Initialize like counts
      const counts: Record<string, number> = {};
      data.forEach(c => { counts[c.id] = c.likesCount; });
      setLikeCounts(counts);
    }
    setIsLoading(false);
  };

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newComment.trim() || !postId) return;
    
    setIsSubmitting(true);
    
    const result = await apiPost<Comment>(`/api/posts/${postId}/comments`, {
      text: newComment,
    });
    
    if (result) {
      setComments([result, ...comments]);
      setNewComment('');
    }
    
    setIsSubmitting(false);
  };

  const handleLikeComment = async (commentId: string) => {
    const isCurrentlyLiked = likedComments.has(commentId);
    
    // Optimistic update
    setLikedComments(prev => {
      const newSet = new Set(prev);
      if (isCurrentlyLiked) {
        newSet.delete(commentId);
      } else {
        newSet.add(commentId);
      }
      return newSet;
    });
    
    setLikeCounts(prev => ({
      ...prev,
      [commentId]: (prev[commentId] || 0) + (isCurrentlyLiked ? -1 : 1),
    }));

    await apiPost(`/api/comments/${commentId}/like`, {});
  };

  return (
    <div className="bg-white min-h-screen flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
        <Link href="/" className="p-1">
          <ChevronLeft className="w-6 h-6 text-gray-700" />
        </Link>
        <span className="font-semibold text-lg">Comments</span>
        <div className="w-8" />
      </div>

      {/* Comments List */}
      <div className="flex-1 overflow-y-auto pb-20">
        {isLoading ? (
          <>
            <CommentSkeleton />
            <CommentSkeleton />
            <CommentSkeleton />
          </>
        ) : comments.length === 0 ? (
          <div className="text-center text-gray-500 py-8">
            <p>No comments yet</p>
            <p className="text-sm">Be the first to comment!</p>
          </div>
        ) : (
          comments.map((comment) => (
            <div key={comment.id} className="flex items-start gap-3 px-4 py-3">
              <Avatar 
                src={comment.user.avatar || 'https://i.pravatar.cc/150'} 
                alt={comment.user.username} 
                size="sm" 
              />
              <div className="flex-1">
                <p className="text-sm">
                  <span className="font-semibold mr-1">{comment.user.username}</span>
                  {comment.text}
                </p>
                <div className="flex items-center gap-3 text-xs text-gray-500 mt-1">
                  <span>{getTimeAgo(comment.createdAt)}</span>
                  <button className="font-semibold">Reply</button>
                </div>
              </div>
              <div className="flex flex-col items-center">
                <button 
                  className="p-1"
                  onClick={() => handleLikeComment(comment.id)}
                >
                  <Heart 
                    className={`w-4 h-4 ${likedComments.has(comment.id) ? 'text-red-500 fill-red-500' : 'text-gray-400'}`} 
                  />
              </button>
                {(likeCounts[comment.id] || 0) > 0 && (
                  <span className="text-xs text-gray-400">
                    {likeCounts[comment.id]}
                  </span>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Comment Input */}
      <form 
        onSubmit={handleSubmitComment}
        className="fixed bottom-0 left-0 right-0 border-t border-gray-100 p-4 flex items-center gap-3 bg-white max-w-[430px] mx-auto"
      >
        <Avatar 
          src={user?.avatar || 'https://i.pravatar.cc/150?img=33'} 
          size="sm" 
        />
        <input
          type="text"
          placeholder="Add a comment..."
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          className="flex-1 bg-transparent border-none focus:ring-0 text-sm outline-none"
        />
        <button 
          type="submit"
          disabled={!newComment.trim() || isSubmitting}
          className="text-blue-500 font-semibold text-sm disabled:opacity-50"
        >
          {isSubmitting ? '...' : 'Post'}
        </button>
      </form>
    </div>
  );
}
