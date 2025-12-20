import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import { 
  ArrowLeft, 
  Heart, 
  MessageCircle, 
  Send, 
  Bookmark, 
  MoreHorizontal,
  Play,
  Pause,
  Volume2,
  VolumeX,
  X
} from 'lucide-react';
import Avatar from '@/components/shared/Avatar';
import { useApi } from '@/hooks/useApi';

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

interface Reel {
  id: string;
  video: string;
  thumbnail: string | null;
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

export default function ReelPage() {
  const router = useRouter();
  const { id } = router.query;
  const { get, post } = useApi();
  
  const [reel, setReel] = useState<Reel | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showComments, setShowComments] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(0);
  
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (id) {
      loadReel();
    }
  }, [id]);

  const loadReel = async () => {
    setIsLoading(true);
    const data = await get<Reel>(`/api/reels/${id}`);
    if (data) {
      setReel(data);
      setIsLiked(data.isLiked);
      setLikesCount(data.likesCount);
    }
    setIsLoading(false);
  };

  const loadComments = async () => {
    const data = await get<Comment[]>(`/api/reels/${id}/comments`);
    if (data) {
      setComments(data);
    }
  };

  const handleLike = async () => {
    if (!reel) return;
    
    // Optimistic update
    setIsLiked(!isLiked);
    setLikesCount(prev => isLiked ? prev - 1 : prev + 1);
    
    const result = await post<{ liked: boolean }>(`/api/reels/${reel.id}/like`, {});
    if (result) {
      setIsLiked(result.liked);
    } else {
      // Revert on error
      setIsLiked(isLiked);
      setLikesCount(prev => isLiked ? prev + 1 : prev - 1);
    }
  };

  const handleAddComment = async () => {
    if (!newComment.trim() || !reel) return;

    const result = await post<Comment>(`/api/reels/${reel.id}/comments`, { text: newComment });
    if (result) {
      setComments(prev => [result, ...prev]);
      setNewComment('');
    }
  };

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const openComments = () => {
    setShowComments(true);
    loadComments();
  };

  const formatCount = (count: number) => {
    if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`;
    if (count >= 1000) return `${(count / 1000).toFixed(1)}K`;
    return count.toString();
  };

  const getTimeAgo = (date: string): string => {
    const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
    if (seconds < 60) return 'now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h`;
    return `${Math.floor(seconds / 86400)}d`;
  };

  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-black z-50 flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    );
  }

  if (!reel) {
    return (
      <div className="fixed inset-0 bg-black z-50 flex items-center justify-center">
        <div className="text-center text-white">
          <p className="mb-4">Reel not found</p>
          <button onClick={() => router.back()} className="text-blue-400">
            Go back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black z-50">
      {/* Video */}
      <div className="absolute inset-0" onClick={togglePlay}>
        <video
          ref={videoRef}
          src={reel.video}
          className="w-full h-full object-contain"
          loop
          autoPlay
          muted={isMuted}
          playsInline
          poster={reel.thumbnail || undefined}
        />
        
        {/* Play/Pause overlay */}
        {!isPlaying && (
          <div className="absolute inset-0 flex items-center justify-center">
            <Play className="w-20 h-20 text-white/80 fill-white/80" />
          </div>
        )}
      </div>

      {/* Top bar */}
      <div className="absolute top-0 left-0 right-0 p-4 flex items-center justify-between z-10 bg-gradient-to-b from-black/50 to-transparent">
        <button onClick={() => router.back()} className="text-white">
          <ArrowLeft className="w-6 h-6" />
        </button>
        <span className="text-white font-semibold">Reels</span>
        <button onClick={toggleMute} className="text-white">
          {isMuted ? <VolumeX className="w-6 h-6" /> : <Volume2 className="w-6 h-6" />}
        </button>
      </div>

      {/* Right side actions */}
      <div className="absolute right-4 bottom-32 flex flex-col items-center gap-6 z-10">
        <button onClick={handleLike} className="flex flex-col items-center gap-1">
          <Heart className={`w-7 h-7 ${isLiked ? 'text-red-500 fill-red-500' : 'text-white'}`} />
          <span className="text-white text-xs">{formatCount(likesCount)}</span>
        </button>
        
        <button onClick={openComments} className="flex flex-col items-center gap-1">
          <MessageCircle className="w-7 h-7 text-white" />
          <span className="text-white text-xs">{formatCount(reel.commentsCount)}</span>
        </button>
        
        <button className="flex flex-col items-center gap-1">
          <Send className="w-7 h-7 text-white" />
        </button>
        
        <button className="flex flex-col items-center gap-1">
          <Bookmark className="w-7 h-7 text-white" />
        </button>
        
        <button className="flex flex-col items-center gap-1">
          <MoreHorizontal className="w-7 h-7 text-white" />
        </button>
      </div>

      {/* Bottom info */}
      <div className="absolute left-0 right-16 bottom-8 p-4 z-10">
        <div className="flex items-center gap-2 mb-2">
          <Avatar 
            src={reel.user.avatar || 'https://i.pravatar.cc/150'} 
            alt={reel.user.username} 
            size="sm" 
          />
          <span className="text-white font-semibold">{reel.user.username}</span>
          <button className="border border-white text-white text-xs px-3 py-1 rounded ml-2">
            Follow
          </button>
        </div>
        {reel.caption && (
          <p className="text-white text-sm line-clamp-2">{reel.caption}</p>
        )}
      </div>

      {/* Comments Modal */}
      {showComments && (
        <div className="fixed inset-0 z-50 flex items-end justify-center">
          <div 
            className="absolute inset-0 bg-black/50" 
            onClick={() => setShowComments(false)} 
          />
          <div className="relative bg-white w-full max-h-[70vh] rounded-t-2xl flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b">
              <span className="font-semibold">Comments</span>
              <button onClick={() => setShowComments(false)}>
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Comments list */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {comments.length === 0 ? (
                <p className="text-center text-gray-500 py-8">No comments yet</p>
              ) : (
                comments.map(comment => (
                  <div key={comment.id} className="flex gap-3">
                    <Avatar 
                      src={comment.user.avatar || 'https://i.pravatar.cc/150'} 
                      alt={comment.user.username} 
                      size="sm" 
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm">{comment.user.username}</span>
                        <span className="text-gray-400 text-xs">{getTimeAgo(comment.createdAt)}</span>
                      </div>
                      <p className="text-sm mt-1">{comment.text}</p>
                      <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                        <button className="flex items-center gap-1">
                          <Heart className={`w-3 h-3 ${comment.isLiked ? 'text-red-500 fill-red-500' : ''}`} />
                          {comment.likesCount}
                        </button>
                        <button>Reply</button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Comment input */}
            <div className="border-t p-4 flex items-center gap-3">
              <input
                type="text"
                placeholder="Add a comment..."
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddComment()}
                className="flex-1 bg-gray-100 rounded-full px-4 py-2 text-sm outline-none"
              />
              <button 
                onClick={handleAddComment}
                disabled={!newComment.trim()}
                className="text-blue-500 font-semibold text-sm disabled:opacity-50"
              >
                Post
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


