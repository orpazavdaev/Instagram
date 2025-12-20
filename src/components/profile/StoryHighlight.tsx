import Image from 'next/image';
import Link from 'next/link';
import { Plus } from 'lucide-react';

interface StoryHighlightProps {
  id: string;
  name: string;
  image?: string;
  isNew?: boolean;
}

export default function StoryHighlight({ id, name, image, isNew }: StoryHighlightProps) {
  const href = isNew ? '/highlight/new' : `/highlight/${id}`;
  
  return (
    <Link href={href} className="flex flex-col items-center gap-1 flex-shrink-0">
      <div 
        className="w-16 h-16 rounded-full border-2 border-gray-200 flex items-center justify-center overflow-hidden bg-gray-50"
      >
        {isNew ? (
          <Plus className="w-8 h-8 text-gray-400" />
        ) : image ? (
          <Image
            src={image}
            alt={name}
            width={60}
            height={60}
            className="object-cover w-full h-full"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-purple-400 to-pink-400" />
        )}
      </div>
      <span className="text-xs text-gray-900 w-16 text-center truncate">{name}</span>
    </Link>
  );
}




