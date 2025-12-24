import Image from 'next/image';

interface AvatarProps {
  src?: string;
  alt?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'xxl';
  hasStory?: boolean;
  isViewed?: boolean;
}

const sizeClasses = {
  xs: 'w-6 h-6',
  sm: 'w-8 h-8',
  md: 'w-12 h-12',
  lg: 'w-16 h-16',
  xl: 'w-20 h-20',
  xxl: 'w-24 h-24',
};

export default function Avatar({ 
  src = 'https://i.pravatar.cc/150?img=1', 
  alt = 'User avatar',
  size = 'md',
  hasStory = false,
  isViewed = false
}: AvatarProps) {
  const gradientStyle = hasStory && !isViewed 
    ? { background: 'linear-gradient(45deg, #f09433, #e6683c, #dc2743, #cc2366, #bc1888)' } 
    : hasStory && isViewed 
    ? { background: '#DBDBDB' }
    : {};

  return (
    <div 
      className={`rounded-full ${hasStory ? 'p-[2px]' : ''}`}
      style={gradientStyle}
    >
      <div className={`${hasStory ? 'bg-white p-[2px] rounded-full' : ''}`}>
        <div className={`${sizeClasses[size]} rounded-full overflow-hidden relative bg-gray-100`}>
          <Image
            src={src}
            alt={alt}
            fill
            className="object-cover"
          />
        </div>
      </div>
    </div>
  );
}







