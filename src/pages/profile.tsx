import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/router';
import { Settings, Grid3X3, UserSquare, Share2, Check, Bookmark } from 'lucide-react';
import Avatar from '@/components/shared/Avatar';
import Button from '@/components/shared/Button';
import StoryHighlight from '@/components/profile/StoryHighlight';
import PostsGrid from '@/components/profile/PostsGrid';
import { useAuth } from '@/context/AuthContext';
import { useApi } from '@/hooks/useApi';

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
  highlights: Array<{ id: string; name: string; image: string }>;
}

interface StoryGroup {
  user: {
    id: string;
    username: string;
    avatar: string;
  };
  stories: Array<{ id: string; image: string }>;
  allViewed: boolean;
}

interface SavedPost {
  id: string;
  image: string;
  caption: string;
  user: {
    id: string;
    username: string;
    avatar: string;
  };
}

// Skeleton Components
function ProfileSkeleton() {
  return (
    <div className="animate-pulse">
      {/* Avatar and Stats */}
      <div className="flex items-center gap-6 mb-4">
        <div className="w-24 h-24 rounded-full bg-gray-200" />
        <div className="flex-1 flex justify-around">
          <div className="text-center">
            <div className="w-8 h-5 bg-gray-200 rounded mx-auto mb-1" />
            <div className="w-10 h-3 bg-gray-200 rounded mx-auto" />
          </div>
          <div className="text-center">
            <div className="w-8 h-5 bg-gray-200 rounded mx-auto mb-1" />
            <div className="w-14 h-3 bg-gray-200 rounded mx-auto" />
          </div>
          <div className="text-center">
            <div className="w-8 h-5 bg-gray-200 rounded mx-auto mb-1" />
            <div className="w-14 h-3 bg-gray-200 rounded mx-auto" />
          </div>
        </div>
      </div>

      {/* Name and Bio */}
      <div className="mb-4">
        <div className="w-32 h-4 bg-gray-200 rounded mb-2" />
        <div className="w-full h-3 bg-gray-200 rounded mb-1" />
        <div className="w-3/4 h-3 bg-gray-200 rounded" />
      </div>

      {/* Buttons */}
      <div className="flex gap-2 mb-6">
        <div className="flex-1 h-9 bg-gray-200 rounded-lg" />
        <div className="flex-1 h-9 bg-gray-200 rounded-lg" />
      </div>

      {/* Highlights */}
      <div className="flex gap-4 mb-4">
        {[1, 2, 3, 4, 5].map(i => (
          <div key={i} className="flex flex-col items-center gap-1">
            <div className="w-16 h-16 rounded-full bg-gray-200" />
            <div className="w-10 h-3 bg-gray-200 rounded" />
          </div>
        ))}
      </div>
    </div>
  );
}

function PostsGridSkeleton() {
  return (
    <div className="posts-grid animate-pulse">
      {Array.from({ length: 15 }).map((_, i) => (
        <div key={i} className="aspect-square bg-gray-200" />
      ))}
    </div>
  );
}

// Cache profile data between navigations
let cachedProfile: UserProfile | null = null;
let cachedHasStory = false;
let cachedStoryViewed = false;

// Function to clear cache (call after editing profile or creating content)
export function clearProfileCache() {
  cachedProfile = null;
  cachedHasStory = false;
  cachedStoryViewed = false;
}

export default function ProfilePage() {
  const router = useRouter();
  const { user } = useAuth();
  const { get } = useApi();
  const [profile, setProfile] = useState<UserProfile | null>(cachedProfile);
  const [isLoading, setIsLoading] = useState(!cachedProfile);
  const [hasStory, setHasStory] = useState(cachedHasStory);
  const [storyViewed, setStoryViewed] = useState(cachedStoryViewed);
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<'posts' | 'saved'>('posts');
  const [savedPosts, setSavedPosts] = useState<SavedPost[]>([]);
  const [savedLoading, setSavedLoading] = useState(false);

  useEffect(() => {
    // Only load if no cached data or user changed
    if (!cachedProfile || cachedProfile.username !== user?.username) {
      loadProfile();
    } else {
      // Use cached data
      setProfile(cachedProfile);
      setHasStory(cachedHasStory);
      setStoryViewed(cachedStoryViewed);
      setIsLoading(false);
    }
  }, [user?.username]);

  const loadProfile = async () => {
    if (!cachedProfile) {
      setIsLoading(true);
    }
    if (!user?.username) {
      setIsLoading(false);
      return;
    }

    const [profileData, storiesData] = await Promise.all([
      get<UserProfile>(`/api/users/${user.username}`),
      get<StoryGroup[]>('/api/stories'),
    ]);

    if (profileData) {
      setProfile(profileData);
      cachedProfile = profileData;
    }

    // Check if current user has stories
    if (storiesData && user?.id) {
      const myStories = storiesData.find(g => g.user.id === user.id);
      if (myStories && myStories.stories.length > 0) {
        setHasStory(true);
        setStoryViewed(myStories.allViewed);
        cachedHasStory = true;
        cachedStoryViewed = myStories.allViewed;
      }
    }

    setIsLoading(false);
  };

  const loadSavedPosts = async () => {
    if (savedPosts.length > 0) return; // Already loaded
    
    setSavedLoading(true);
    const data = await get<SavedPost[]>('/api/saved-posts');
    if (data) {
      setSavedPosts(data);
    }
    setSavedLoading(false);
  };

  const handleTabChange = (tab: 'posts' | 'saved') => {
    setActiveTab(tab);
    if (tab === 'saved') {
      loadSavedPosts();
    }
  };

  const handleShareProfile = async () => {
    const profileUrl = `${window.location.origin}/user/${profile?.username}`;
    
    // Try Web Share API first (mobile)
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${profile?.fullName} (@${profile?.username})`,
          text: `Check out ${profile?.username}'s profile on Instagram`,
          url: profileUrl,
        });
        return;
      } catch {
        // User cancelled or error
      }
    }
    
    // Fallback: copy to clipboard
    try {
      await navigator.clipboard.writeText(profileUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard failed
      alert(`Profile link: ${profileUrl}`);
    }
  };

  const highlights = profile?.highlights?.length 
    ? [{ id: '0', name: 'New', isNew: true }, ...profile.highlights.map(h => ({ ...h, isNew: false }))]
    : [{ id: '0', name: 'New', isNew: true }];

  return (
    <div className="bg-white pb-20 min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3">
        <span className="font-semibold text-lg">{profile?.username || user?.username || ''}</span>
        <Link href="/settings" className="p-2">
          <Settings className="w-6 h-6 text-gray-700" />
        </Link>
      </div>

      {/* Profile Info */}
      <div className="px-4 pb-4">
        {isLoading ? (
          <ProfileSkeleton />
        ) : profile ? (
          <>
            {/* Avatar and Stats */}
            <div className="flex items-center gap-6 mb-4">
              {hasStory ? (
                <Link href={`/story?userId=${user?.id}`}>
                  <Avatar 
                    src={profile.avatar || 'https://i.pravatar.cc/150'} 
                    size="xxl" 
                    hasStory={true}
                    isViewed={storyViewed}
                  />
                </Link>
              ) : (
                <Avatar 
                  src={profile.avatar || 'https://i.pravatar.cc/150'} 
                  size="xxl" 
                />
              )}
              <div className="flex-1 flex justify-around">
                <div className="text-center">
                  <p className="font-semibold text-lg">{profile.postsCount}</p>
                  <p className="text-sm text-gray-500">Posts</p>
                </div>
                <Link href={`/followers/${profile.username}`} className="text-center">
                  <p className="font-semibold text-lg">{profile.followersCount}</p>
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
              <Button variant="secondary" fullWidth onClick={() => router.push('/edit-profile')}>
                Edit profile
              </Button>
              <Button variant="secondary" fullWidth onClick={handleShareProfile}>
                {copied ? (
                  <span className="flex items-center justify-center gap-1">
                    <Check className="w-4 h-4" /> Copied!
                  </span>
                ) : (
                  'Share Profile'
                )}
              </Button>
            </div>

            {/* Story Highlights */}
            <div className="flex gap-4 overflow-x-auto md:overflow-x-scroll hide-scrollbar md:scrollbar-thin -mx-4 px-4 pb-4">
              {highlights.map((highlight) => (
                <div key={highlight.id} className="flex-shrink-0">
                  <StoryHighlight {...highlight} />
                </div>
              ))}
            </div>
          </>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <p>Could not load profile</p>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex border-t border-gray-200">
        <button 
          onClick={() => handleTabChange('posts')}
          className={`flex-1 py-3 flex justify-center border-b-2 ${activeTab === 'posts' ? 'border-gray-900' : 'border-transparent text-gray-400'}`}
        >
          <Grid3X3 className="w-6 h-6" />
        </button>
        <button 
          onClick={() => handleTabChange('saved')}
          className={`flex-1 py-3 flex justify-center border-b-2 ${activeTab === 'saved' ? 'border-gray-900' : 'border-transparent text-gray-400'}`}
        >
          <Bookmark className="w-6 h-6" />
        </button>
      </div>

      {/* Posts Grid */}
      {activeTab === 'posts' && (
        isLoading ? (
          <PostsGridSkeleton />
        ) : profile?.posts && profile.posts.length > 0 ? (
          <PostsGrid posts={profile.posts} username={profile.username} />
        ) : (
          <div className="text-center py-12 text-gray-400">
            <Grid3X3 className="w-12 h-12 mx-auto mb-2" />
            <p>No posts yet</p>
          </div>
        )
      )}

      {/* Saved Posts Grid */}
      {activeTab === 'saved' && (
        savedLoading ? (
          <PostsGridSkeleton />
        ) : savedPosts.length > 0 ? (
          <div className="grid grid-cols-3 gap-0.5">
            {savedPosts.map((post) => (
              <Link
                key={post.id}
                href={`/post/${post.id}`}
                className="relative aspect-square"
              >
                <Image
                  src={post.image}
                  alt={`Saved post ${post.id}`}
                  fill
                  className="object-cover"
                />
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 text-gray-400">
            <Bookmark className="w-12 h-12 mx-auto mb-2" />
            <p>No saved posts yet</p>
            <p className="text-sm mt-1">Save posts to see them here</p>
          </div>
        )
      )}
    </div>
  );
}
