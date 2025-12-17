import { Settings, Grid3X3, Film, UserSquare } from 'lucide-react';
import Avatar from '@/components/shared/Avatar';
import Button from '@/components/shared/Button';
import StoryHighlight from '@/components/profile/StoryHighlight';
import PostsGrid from '@/components/profile/PostsGrid';

const profileData = {
  username: 'orpaz_avdaev',
  fullName: 'orpaz_avdaev',
  avatar: 'https://i.pravatar.cc/150?img=33',
  bio: `Lorem ipsum dolor sit amet consectetur. Arcu facilisis sed orci augue at augue❤️
Vitae vitae sed duis eu elit dapibus aenean tellus sed.
Diam massa at fringilla donec. Orci odio ac aliquam sit proin nulla elit ut tellus.`,
  posts: 27,
  followers: 137,
  following: 154,
};

const highlights = [
  { id: 0, name: 'New', isNew: true },
  { id: 1, name: 'Me', image: 'https://i.pravatar.cc/150?img=33' },
  { id: 2, name: 'Food', image: 'https://picsum.photos/seed/food/150/150' },
  { id: 3, name: 'Life', image: 'https://picsum.photos/seed/life/150/150' },
  { id: 4, name: 'Sea', image: 'https://picsum.photos/seed/sea/150/150' },
];

const posts = [
  { id: 1, image: 'https://picsum.photos/seed/bird1/400/400' },
  { id: 2, image: 'https://picsum.photos/seed/cat1/400/400' },
  { id: 3, image: 'https://picsum.photos/seed/turtle1/400/400' },
  { id: 4, image: 'https://picsum.photos/seed/bird2/400/400' },
  { id: 5, image: 'https://picsum.photos/seed/fish1/400/400' },
  { id: 6, image: 'https://picsum.photos/seed/bird3/400/400' },
  { id: 7, image: 'https://picsum.photos/seed/bird4/400/400' },
  { id: 8, image: 'https://picsum.photos/seed/hamster1/400/400' },
  { id: 9, image: 'https://picsum.photos/seed/bird5/400/400' },
];

export default function ProfilePage() {
  return (
    <div className="bg-white min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3">
        <span className="text-sm text-gray-400">Profile page</span>
        <button className="p-2">
          <Settings className="w-6 h-6 text-gray-700" />
        </button>
      </div>

      {/* Profile Info */}
      <div className="px-4 pb-4">
        {/* Avatar and Stats */}
        <div className="flex items-center gap-6 mb-4">
          <Avatar src={profileData.avatar} size="xxl" hasStory />
          <div className="flex-1 flex justify-around">
            <div className="text-center">
              <p className="font-semibold text-lg">{profileData.posts}</p>
              <p className="text-sm text-gray-500">Posts</p>
            </div>
            <div className="text-center">
              <p className="font-semibold text-lg">{profileData.followers}</p>
              <p className="text-sm text-gray-500">Followers</p>
            </div>
            <div className="text-center">
              <p className="font-semibold text-lg">{profileData.following}</p>
              <p className="text-sm text-gray-500">Following</p>
            </div>
          </div>
        </div>

        {/* Name and Bio */}
        <div className="mb-4">
          <p className="font-semibold">{profileData.fullName}</p>
          <p className="text-sm text-gray-700 whitespace-pre-line">{profileData.bio}</p>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2 mb-6">
          <Button variant="secondary" fullWidth>Edit profile</Button>
          <Button variant="secondary" fullWidth>Share Profile</Button>
        </div>

        {/* Story Highlights */}
        <div className="flex gap-4 overflow-x-auto hide-scrollbar -mx-4 px-4 pb-4">
          {highlights.map((highlight) => (
            <StoryHighlight key={highlight.id} {...highlight} />
          ))}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-t border-gray-200">
        <button className="flex-1 py-3 flex justify-center border-b-2 border-gray-900">
          <Grid3X3 className="w-6 h-6" />
        </button>
        <button className="flex-1 py-3 flex justify-center text-gray-400">
          <Film className="w-6 h-6" />
        </button>
        <button className="flex-1 py-3 flex justify-center text-gray-400">
          <UserSquare className="w-6 h-6" />
        </button>
      </div>

      {/* Posts Grid */}
      <PostsGrid posts={posts} />
    </div>
  );
}

