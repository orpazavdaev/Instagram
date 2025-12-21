import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { ArrowLeft, Grid3X3, UserSquare } from 'lucide-react';
import Avatar from '@/components/shared/Avatar';
import Button from '@/components/shared/Button';
import PostsGrid from '@/components/profile/PostsGrid';
import { useApi } from '@/hooks/useApi';
import { useAuth } from '@/context/AuthContext';

interface UserProfile {
  id: string;
  username: string;
  fullName: string;
  bio: string;
  avatar: string;
  postsCount: number;
  followersCount: number;
  followingCount: number;
  posts: Array<{ id: string; image: string }>;
  isFollowing?: boolean;
}

function ProfileSkeleton() {
  return (
    <div className="px-4 animate-pulse">
      <div className="flex items-center gap-6 mb-4">
        <div className="w-24 h-24 rounded-full bg-gray-200" />
        <div className="flex-1 flex justify-around">
          {[1, 2, 3].map(i => (
            <div key={i} className="text-center">
              <div className="w-8 h-5 bg-gray-200 rounded mx-auto mb-1" />
              <div className="w-12 h-3 bg-gray-200 rounded mx-auto" />
            </div>
          ))}
        </div>
      </div>
      <div className="mb-4">
        <div className="w-32 h-4 bg-gray-200 rounded mb-2" />
        <div className="w-full h-3 bg-gray-200 rounded mb-1" />
        <div className="w-3/4 h-3 bg-gray-200 rounded" />
      </div>
      <div className="flex gap-2 mb-6">
        <div className="flex-1 h-9 bg-gray-200 rounded-lg" />
        <div className="flex-1 h-9 bg-gray-200 rounded-lg" />
      </div>
    </div>
  );
}

function PostsGridSkeleton() {
  return (
    <div className="grid grid-cols-3 gap-0.5 animate-pulse">
      {[1, 2, 3, 4, 5, 6].map(i => (
        <div key={i} className="aspect-square bg-gray-200" />
      ))}
    </div>
  );
}

export default function UserProfilePage() {
  const router = useRouter();
  const { username } = router.query;
  const { get, post: apiPost } = useApi();
  const { user: currentUser } = useAuth();
  
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followersCount, setFollowersCount] = useState(0);

  useEffect(() => {
    if (username) {
      loadProfile();
    }
  }, [username]);

  const loadProfile = async () => {
    setIsLoading(true);
    const data = await get<UserProfile>(`/api/users/${username}`);
    if (data) {
      setProfile(data);
      setIsFollowing(data.isFollowing || false);
      setFollowersCount(data.followersCount);
    }
    setIsLoading(false);
  };

  const handleFollow = async () => {
    if (!profile) return;
    
    // Optimistic update
    const wasFollowing = isFollowing;
    setIsFollowing(!isFollowing);
    setFollowersCount(prev => isFollowing ? prev - 1 : prev + 1);

    const result = await apiPost<{ following: boolean }>(`/api/users/${profile.username}/follow`, {});
    
    if (result) {
      setIsFollowing(result.following);
    } else {
      // Revert on error
      setIsFollowing(wasFollowing);
      setFollowersCount(prev => wasFollowing ? prev : prev - 1);
    }
  };

  // If viewing own profile, redirect to /profile
  useEffect(() => {
    if (username && currentUser?.username === username) {
      router.replace('/profile');
    }
  }, [username, currentUser?.username, router]);

  return (
    <div className="bg-white min-h-screen pb-20">
      {/* Header */}
      <div className="flex items-center gap-4 px-4 py-3 border-b sticky top-0 bg-white z-10">
        <button onClick={() => router.back()}>
          <ArrowLeft className="w-6 h-6" />
        </button>
        <span className="font-semibold text-lg">{username}</span>
      </div>

      {/* Profile Info */}
      {isLoading ? (
        <ProfileSkeleton />
      ) : profile ? (
        <div className="px-4 py-4">
          {/* Avatar and Stats */}
          <div className="flex items-center gap-6 mb-4">
            <Avatar 
              src={profile.avatar || 'https://i.pravatar.cc/150'} 
              size="xxl" 
            />
            <div className="flex-1 flex justify-around">
              <div className="text-center">
                <p className="font-semibold text-lg">{profile.postsCount}</p>
                <p className="text-sm text-gray-500">Posts</p>
              </div>
              <Link href={`/followers/${profile.username}`} className="text-center">
                <p className="font-semibold text-lg">{followersCount}</p>
                <p className="text-sm text-gray-500">Followers</p>
              </Link>
              <Link href={`/following/${profile.username}`} className="text-center">
                <p className="font-semibold text-lg">{profile.followingCount}</p>
                <p className="text-sm text-gray-500">Following</p>
              </Link>
            </div>
          </div>

          {/* Name and Bio */}
          <div className="mb-4">
            <p className="font-semibold">{profile.fullName}</p>
            {profile.bio && (
              <p className="text-sm text-gray-700 whitespace-pre-line">{profile.bio}</p>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 mb-6">
            <Button 
              variant={isFollowing ? 'secondary' : 'primary'} 
              fullWidth
              onClick={handleFollow}
            >
              {isFollowing ? 'Following' : 'Follow'}
            </Button>
            <Button 
              variant="secondary" 
              fullWidth
              onClick={() => router.push(`/chat/${profile.id}`)}
            >
              Message
            </Button>
          </div>
        </div>
      ) : (
        <div className="text-center py-12 text-gray-500">
          <p>User not found</p>
        </div>
      )}

      {/* Tabs */}
      <div className="flex border-t border-gray-200">
        <button className="flex-1 py-3 flex justify-center border-b-2 border-gray-900">
          <Grid3X3 className="w-6 h-6" />
        </button>
        <button className="flex-1 py-3 flex justify-center text-gray-400">
          <UserSquare className="w-6 h-6" />
        </button>
      </div>

      {/* Posts Grid */}
      {isLoading ? (
        <PostsGridSkeleton />
      ) : profile?.posts && profile.posts.length > 0 ? (
        <PostsGrid posts={profile.posts} username={profile.username} />
      ) : (
        <div className="text-center py-12 text-gray-400">
          <Grid3X3 className="w-12 h-12 mx-auto mb-2" />
          <p>No posts yet</p>
        </div>
      )}
    </div>
  );
}

