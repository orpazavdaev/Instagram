import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Image from 'next/image';
import { 
  ArrowLeft, 
  Heart, 
  MessageCircle, 
  Send, 
  Bookmark, 
  MoreHorizontal,
  Play,
  Volume2,
  VolumeX,
  X,
  Search
} from 'lucide-react';
import Avatar from '@/components/shared/Avatar';
import { useApi } from '@/hooks/useApi';
import { useAuth } from '@/context/AuthContext';

interface ShareUser {
  id: string;
  username: string;
  avatar: string;
  fullName: string;
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

// Single Reel Component
function ReelItem({ 
  reel, 
  isActive, 
  isMuted, 
  onToggleMute,
  onLike,
  onOpenComments,
  onShare
}: { 
  reel: Reel; 
  isActive: boolean; 
  isMuted: boolean;
  onToggleMute: () => void;
  onLike: (reelId: string) => void;
  onOpenComments: (reelId: string) => void;
  onShare: (reel: Reel) => void;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLiked, setIsLiked] = useState(reel.isLiked);
  const [likesCount, setLikesCount] = useState(reel.likesCount);

  useEffect(() => {
    if (videoRef.current) {
      if (isActive) {
        videoRef.current.play().catch(() => {});
        setIsPlaying(true);
      } else {
        videoRef.current.pause();
        videoRef.current.currentTime = 0;
        setIsPlaying(false);
      }
    }
  }, [isActive]);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.muted = isMuted;
    }
  }, [isMuted]);

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

  const handleLike = () => {
    setIsLiked(!isLiked);
    setLikesCount(prev => isLiked ? prev - 1 : prev + 1);
    onLike(reel.id);
  };

  const formatCount = (count: number) => {
    if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`;
    if (count >= 1000) return `${(count / 1000).toFixed(1)}K`;
    return count.toString();
  };

  return (
    <div className="h-screen w-full flex-shrink-0 relative bg-black snap-start">
      {/* Video */}
      <div className="absolute inset-0" onClick={togglePlay}>
        <video
          ref={videoRef}
          src={reel.video}
          className="w-full h-full object-contain"
          loop
          muted={isMuted}
          playsInline
          poster={reel.thumbnail || undefined}
        />
        
        {/* Play overlay */}
        {!isPlaying && isActive && (
          <div className="absolute inset-0 flex items-center justify-center">
            <Play className="w-20 h-20 text-white/80 fill-white/80" />
          </div>
        )}
      </div>

      {/* Right side actions */}
      <div className="absolute right-4 bottom-32 flex flex-col items-center gap-6 z-10">
        <button onClick={handleLike} className="flex flex-col items-center gap-1">
          <Heart className={`w-7 h-7 ${isLiked ? 'text-red-500 fill-red-500' : 'text-white'}`} />
          <span className="text-white text-xs">{formatCount(likesCount)}</span>
        </button>
        
        <button onClick={() => onOpenComments(reel.id)} className="flex flex-col items-center gap-1">
          <MessageCircle className="w-7 h-7 text-white" />
          <span className="text-white text-xs">{formatCount(reel.commentsCount)}</span>
        </button>
        
        <button onClick={() => onShare(reel)} className="flex flex-col items-center gap-1">
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
        <Link href={`/user/${reel.user.username}`} className="flex items-center gap-2 mb-2">
          <Avatar 
            src={reel.user.avatar || 'https://i.pravatar.cc/150'} 
            alt={reel.user.username} 
            size="sm" 
          />
          <span className="text-white font-semibold">{reel.user.username}</span>
          <button className="border border-white text-white text-xs px-3 py-1 rounded ml-2">
            Follow
          </button>
        </Link>
        {reel.caption && (
          <p className="text-white text-sm line-clamp-2">{reel.caption}</p>
        )}
      </div>
    </div>
  );
}

export default function ReelPage() {
  const router = useRouter();
  const { id } = router.query;
  const { get, post } = useApi();
  const { user } = useAuth();
  
  const [reels, setReels] = useState<Reel[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isMuted, setIsMuted] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [activeReelId, setActiveReelId] = useState<string | null>(null);
  
  // Share modal state
  const [showShareModal, setShowShareModal] = useState(false);
  const [shareUsers, setShareUsers] = useState<ShareUser[]>([]);
  const [shareSearch, setShareSearch] = useState('');
  const [sendingTo, setSendingTo] = useState<string | null>(null);
  const [shareReel, setShareReel] = useState<Reel | null>(null);
  
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadReels();
  }, []);

  useEffect(() => {
    // Find initial index based on URL id
    if (id && reels.length > 0) {
      const index = reels.findIndex(r => r.id === id);
      if (index !== -1) {
        setCurrentIndex(index);
        // Scroll to the reel
        setTimeout(() => {
          const container = containerRef.current;
          if (container) {
            container.scrollTo({ top: index * window.innerHeight, behavior: 'auto' });
          }
        }, 100);
      }
    }
  }, [id, reels]);

  const loadReels = async () => {
    setIsLoading(true);
    const data = await get<Reel[]>('/api/reels');
    if (data) {
      setReels(data);
    }
    setIsLoading(false);
  };

  const handleScroll = () => {
    const container = containerRef.current;
    if (container) {
      const scrollTop = container.scrollTop;
      const height = window.innerHeight;
      const newIndex = Math.round(scrollTop / height);
      
      if (newIndex !== currentIndex && newIndex >= 0 && newIndex < reels.length) {
        setCurrentIndex(newIndex);
        // Update URL without navigation
        const newId = reels[newIndex].id;
        window.history.replaceState(null, '', `/reel/${newId}`);
      }
    }
  };

  const handleLike = async (reelId: string) => {
    await post(`/api/reels/${reelId}/like`, {});
  };

  const handleOpenComments = async (reelId: string) => {
    setActiveReelId(reelId);
    setShowComments(true);
    const data = await get<Comment[]>(`/api/reels/${reelId}/comments`);
    if (data) {
      setComments(data);
    }
  };

  const handleAddComment = async () => {
    if (!newComment.trim() || !activeReelId) return;

    const result = await post<Comment>(`/api/reels/${activeReelId}/comments`, { text: newComment });
    if (result) {
      setComments(prev => [result, ...prev]);
      setNewComment('');
    }
  };

  // Open share modal
  const openShareModal = async (reel: Reel) => {
    setShareReel(reel);
    setShowShareModal(true);
    setShareSearch('');
    
    if (shareUsers.length === 0) {
      const users = await get<ShareUser[]>('/api/users');
      if (users) {
        setShareUsers(users.filter(u => u.id !== user?.id));
      }
    }
  };

  // Send reel to user
  const sendReelToUser = async (targetUserId: string) => {
    if (!shareReel) return;
    
    setSendingTo(targetUserId);
    
    const reelData = {
      type: 'shared_reel',
      reelId: shareReel.id,
      thumbnail: shareReel.thumbnail || shareReel.video,
      username: shareReel.user.username,
      caption: shareReel.caption,
    };
    
    await post(`/api/messages/${targetUserId}`, {
      text: JSON.stringify(reelData),
      type: 'reel',
    });
    
    setSendingTo(null);
    setShowShareModal(false);
    setShareReel(null);
  };

  const filteredShareUsers = shareUsers.filter(u =>
    u.username.toLowerCase().includes(shareSearch.toLowerCase()) ||
    u.fullName?.toLowerCase().includes(shareSearch.toLowerCase())
  );

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

  if (reels.length === 0) {
    return (
      <div className="fixed inset-0 bg-black z-50 flex items-center justify-center">
        <div className="text-center text-white">
          <p className="mb-4">No reels found</p>
          <button onClick={() => router.back()} className="text-blue-400">
            Go back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black z-50">
      {/* Top bar */}
      <div className="absolute top-0 left-0 right-0 p-4 flex items-center justify-between z-20 bg-gradient-to-b from-black/50 to-transparent">
        <button onClick={() => router.push('/reels')} className="text-white">
          <ArrowLeft className="w-6 h-6" />
        </button>
        <span className="text-white font-semibold">Reels</span>
        <button onClick={() => setIsMuted(!isMuted)} className="text-white">
          {isMuted ? <VolumeX className="w-6 h-6" /> : <Volume2 className="w-6 h-6" />}
        </button>
      </div>

      {/* Scrollable Reels Container */}
      <div 
        ref={containerRef}
        className="h-full overflow-y-scroll snap-y snap-mandatory hide-scrollbar"
        onScroll={handleScroll}
      >
        {reels.map((reel, index) => (
          <ReelItem
            key={reel.id}
            reel={reel}
            isActive={index === currentIndex}
            isMuted={isMuted}
            onToggleMute={() => setIsMuted(!isMuted)}
            onLike={handleLike}
            onOpenComments={handleOpenComments}
            onShare={openShareModal}
          />
        ))}
      </div>

      {/* Comments Modal */}
      {showComments && (
        <div className="fixed inset-0 z-50 flex items-end justify-center">
          <div 
            className="absolute inset-0 bg-black/50" 
            onClick={() => setShowComments(false)} 
          />
          <div className="relative bg-white w-full max-h-[70vh] rounded-t-2xl flex flex-col animate-slide-up">
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

      {/* Share Modal */}
      {showShareModal && shareReel && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end justify-center">
          <div className="bg-white w-full max-w-[430px] rounded-t-2xl max-h-[70vh] flex flex-col animate-slide-up">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 border-b">
              <span className="font-semibold">Share to...</span>
              <button onClick={() => { setShowShareModal(false); setShareReel(null); }}>
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Reel Preview */}
            <div className="flex items-center gap-3 p-4 border-b bg-gray-50">
              <div className="w-12 h-16 relative rounded overflow-hidden flex-shrink-0 bg-black">
                <video src={shareReel.video} className="w-full h-full object-cover" muted />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm">@{shareReel.user.username}</p>
                <p className="text-xs text-gray-500 truncate">{shareReel.caption || 'Reel'}</p>
              </div>
            </div>

            {/* Search */}
            <div className="p-3 border-b">
              <div className="flex items-center gap-2 bg-gray-100 rounded-lg px-3 py-2">
                <Search className="w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search"
                  value={shareSearch}
                  onChange={(e) => setShareSearch(e.target.value)}
                  className="flex-1 bg-transparent text-sm outline-none"
                />
              </div>
            </div>

            {/* Users List */}
            <div className="flex-1 overflow-y-auto">
              {filteredShareUsers.length === 0 ? (
                <p className="text-center text-gray-500 py-8">No users found</p>
              ) : (
                filteredShareUsers.map((shareUser) => (
                  <div 
                    key={shareUser.id}
                    className="flex items-center justify-between px-4 py-3 hover:bg-gray-50"
                  >
                    <div className="flex items-center gap-3">
                      <Avatar src={shareUser.avatar || 'https://i.pravatar.cc/150'} alt={shareUser.username} size="md" />
                      <div>
                        <p className="font-semibold text-sm">{shareUser.username}</p>
                        <p className="text-xs text-gray-500">{shareUser.fullName}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => sendReelToUser(shareUser.id)}
                      disabled={sendingTo === shareUser.id}
                      className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition-colors ${
                        sendingTo === shareUser.id
                          ? 'bg-gray-200 text-gray-500'
                          : 'bg-blue-500 text-white hover:bg-blue-600'
                      }`}
                    >
                      {sendingTo === shareUser.id ? 'Sent!' : 'Send'}
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
