import Image from 'next/image';
import { Plus } from 'lucide-react';

interface StoryHighlightProps {
  id: number;
  name: string;
  image?: string;
  isNew?: boolean;
}

export default function StoryHighlight({ name, image, isNew }: StoryHighlightProps) {
  return (
    <button className="flex flex-col items-center gap-1 flex-shrink-0">
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
        ) : null}
      </div>
      <span className="text-xs text-gray-900 w-16 text-center truncate">{name}</span>
    </button>
  );
}




