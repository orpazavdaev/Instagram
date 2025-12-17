import Link from 'next/link';
import { Heart, ChevronRight } from 'lucide-react';
import Avatar from '@/components/shared/Avatar';

interface Comment {
  id: number;
  username: string;
  avatar: string;
  text: string;
  likes: number;
  timeAgo: string;
  isLiked?: boolean;
}

const postInfo = {
  username: 'orpaz_avdaev',
  avatar: 'https://i.pravatar.cc/150?img=33',
  mentionedUser: '@aspenvodka',
  brandName: 'Aspen Vodka',
  text: 'Lorem ipsum tincidunt vdsvdsvds',
};

const comments: Comment[] = [
  {
    id: 1,
    username: 'noakirel',
    avatar: 'https://i.pravatar.cc/150?img=5',
    text: 'Amazing!!!🔥🔥🔥',
    likes: 17,
    timeAgo: 'A week ago',
  },
  {
    id: 2,
    username: 'galgadot',
    avatar: 'https://i.pravatar.cc/150?img=9',
    text: 'great job :)',
    likes: 27,
    timeAgo: '52m ago',
    isLiked: true,
  },
  {
    id: 3,
    username: 'moshe_peretz',
    avatar: 'https://i.pravatar.cc/150?img=12',
    text: 'Lorem ipsum pellentesque purus',
    likes: 109,
    timeAgo: 'A week ago',
  },
  {
    id: 4,
    username: 'cora.reily',
    avatar: 'https://i.pravatar.cc/150?img=20',
    text: 'Lorem ipsum',
    likes: 51,
    timeAgo: 'A week ago',
  },
  {
    id: 5,
    username: 'madona',
    avatar: 'https://i.pravatar.cc/150?img=25',
    text: 'egestas in et',
    likes: 1,
    timeAgo: 'A week ago',
  },
  {
    id: 6,
    username: 'ran_danker123',
    avatar: 'https://i.pravatar.cc/150?img=8',
    text: 'Amazing!!!🔥🔥🔥',
    likes: 0,
    timeAgo: 'A week ago',
  },
  {
    id: 7,
    username: 'anna.zak',
    avatar: 'https://i.pravatar.cc/150?img=16',
    text: '⭐⭐⭐⭐⭐⭐⭐⭐',
    likes: 0,
    timeAgo: '4m ago',
  },
  {
    id: 8,
    username: 'mergi',
    avatar: 'https://i.pravatar.cc/150?img=30',
    text: 'love you :)))))',
    likes: 3,
    timeAgo: 'A day ago',
  },
];

export default function CommentsPage() {
  return (
    <div className="bg-white">
      {/* Header */}
      <div className="flex items-center justify-center px-4 py-3 border-b border-gray-200 relative">
        <span className="font-medium">Comments</span>
        <Link href="/" className="absolute right-4">
          <ChevronRight className="w-5 h-5 text-gray-400" />
        </Link>
      </div>

      {/* Post Info Card */}
      <div className="px-4 py-4 border-b border-gray-200">
        <div className="flex items-start gap-3">
          <div className="flex-1 text-right">
            <p className="text-sm">
              {postInfo.text}{' '}
              <span className="text-blue-500">🌟 {postInfo.username}</span>
            </p>
            <p className="text-sm">
              {postInfo.brandName}{' '}
              <span className="text-blue-500">✨🥂 {postInfo.mentionedUser}</span>
            </p>
            <p className="text-xs text-gray-400 mt-1">
              A week ago · See translation
            </p>
          </div>
          <Avatar src={postInfo.avatar} size="sm" />
        </div>
      </div>

      {/* Divider */}
      <div className="border-t border-gray-200" />

      {/* Comments List */}
      <div className="px-4 py-2">
        {comments.map((comment) => (
          <div key={comment.id} className="flex items-start gap-3 py-3">
            {/* Like button */}
            <button className="pt-1">
              <Heart 
                className={`w-4 h-4 ${comment.isLiked ? 'fill-red-500 text-red-500' : 'text-gray-300'}`} 
              />
            </button>

            {/* Comment content */}
            <div className="flex-1 text-right">
              <p className="text-xs text-gray-400">
                {comment.timeAgo}{' '}
                <span className="text-gray-900 font-semibold">{comment.username}</span>
              </p>
              <p className="text-sm mt-0.5">{comment.text}</p>
              <div className="flex items-center justify-end gap-3 mt-1 text-xs text-gray-400">
                <button>Reply</button>
                <span>{comment.likes} Likes</span>
              </div>
            </div>

            {/* Avatar */}
            <Avatar src={comment.avatar} alt={comment.username} size="sm" />
          </div>
        ))}
      </div>
    </div>
  );
}
