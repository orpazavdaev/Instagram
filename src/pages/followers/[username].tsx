import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import Avatar from '@/components/shared/Avatar';
import Button from '@/components/shared/Button';
import { useApi } from '@/hooks/useApi';
import { useAuth } from '@/context/AuthContext';

interface User {
  id: string;
  username: string;
  fullName: string | null;
  avatar: string | null;
}

function UserSkeleton() {
  return (
    <div className="flex items-center gap-3 p-4 animate-pulse">
      <div className="w-12 h-12 rounded-full bg-gray-200" />
      <div className="flex-1">
        <div className="w-24 h-4 bg-gray-200 rounded mb-1" />
        <div className="w-32 h-3 bg-gray-200 rounded" />
      </div>
      <div className="w-20 h-8 bg-gray-200 rounded-lg" />
    </div>
  );
}

export default function FollowersPage() {
  const router = useRouter();
  const { username } = router.query;
  const { get, post } = useApi();
  const { user: currentUser } = useAuth();
  
  const [followers, setFollowers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [followingIds, setFollowingIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (username) {
      loadFollowers();
    }
  }, [username]);

  const loadFollowers = async () => {
    setIsLoading(true);
    
    const [followersData, myFollowingData] = await Promise.all([
      get<User[]>(`/api/users/${username}/followers`),
      currentUser?.username ? get<User[]>(`/api/users/${currentUser.username}/following`) : Promise.resolve(null),
    ]);

    if (followersData) {
      setFollowers(followersData);
    }

    if (myFollowingData) {
      setFollowingIds(new Set(myFollowingData.map(u => u.id)));
    }

    setIsLoading(false);
  };

  const handleFollow = async (userId: string, username: string) => {
    const result = await post<{ following: boolean }>(`/api/users/${username}/follow`, {});
    if (result) {
      setFollowingIds(prev => {
        const newSet = new Set(prev);
        if (result.following) {
          newSet.add(userId);
        } else {
          newSet.delete(userId);
        }
        return newSet;
      });
    }
  };

  return (
    <div className="bg-white min-h-screen">
      {/* Header */}
      <div className="flex items-center gap-4 px-4 py-3 border-b sticky top-0 bg-white z-10">
        <button onClick={() => router.back()}>
          <ArrowLeft className="w-6 h-6" />
        </button>
        <div>
          <h1 className="font-semibold">Followers</h1>
          <p className="text-sm text-gray-500">@{username}</p>
        </div>
      </div>

      {/* Followers List */}
      <div className="pb-20">
        {isLoading ? (
          <>
            <UserSkeleton />
            <UserSkeleton />
            <UserSkeleton />
            <UserSkeleton />
          </>
        ) : followers.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <p>No followers yet</p>
          </div>
        ) : (
          followers.map(follower => (
            <div key={follower.id} className="flex items-center gap-3 p-4 border-b">
              <Link href={`/user/${follower.username}`}>
                <Avatar 
                  src={follower.avatar || 'https://i.pravatar.cc/150'} 
                  alt={follower.username} 
                  size="md" 
                />
              </Link>
              <div className="flex-1 min-w-0">
                <Link href={`/user/${follower.username}`}>
                  <p className="font-semibold text-sm truncate">{follower.username}</p>
                  {follower.fullName && (
                    <p className="text-sm text-gray-500 truncate">{follower.fullName}</p>
                  )}
                </Link>
              </div>
              {follower.id !== currentUser?.id && (
                <Button
                  variant={followingIds.has(follower.id) ? 'secondary' : 'primary'}
                  size="sm"
                  onClick={() => handleFollow(follower.id, follower.username)}
                >
                  {followingIds.has(follower.id) ? 'Following' : 'Follow'}
                </Button>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}

