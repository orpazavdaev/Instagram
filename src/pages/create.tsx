import Image from 'next/image';
import Link from 'next/link';
import { X, ChevronRight, Camera, Maximize2, Copy } from 'lucide-react';

const galleryImages = [
  'https://picsum.photos/seed/create1/400/400',
  'https://picsum.photos/seed/create2/400/400',
  'https://picsum.photos/seed/create3/400/400',
  'https://picsum.photos/seed/create4/400/400',
  'https://picsum.photos/seed/create5/400/400',
  'https://picsum.photos/seed/create6/400/400',
  'https://picsum.photos/seed/create7/400/400',
  'https://picsum.photos/seed/create8/400/400',
  'https://picsum.photos/seed/create9/400/400',
  'https://picsum.photos/seed/create10/400/400',
  'https://picsum.photos/seed/create11/400/400',
  'https://picsum.photos/seed/create12/400/400',
];

const selectedImage = 'https://picsum.photos/seed/window/600/600';

export default function CreatePage() {
  return (
    <div className="fixed inset-0 bg-black z-[100] flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-black">
        <Link href="/" className="text-white">
          <X className="w-6 h-6" />
        </Link>
        <span className="text-white font-semibold">New post</span>
        <button className="text-blue-500 font-semibold">
          Next
        </button>
      </div>

      {/* Selected Image Preview */}
      <div className="relative aspect-square bg-gray-900">
        <Image
          src={selectedImage}
          alt="Selected"
          fill
          className="object-contain"
        />
        
        {/* Bottom left - Expand */}
        <button className="absolute bottom-4 left-4 w-8 h-8 bg-black/50 rounded-full flex items-center justify-center">
          <Maximize2 className="w-4 h-4 text-white" />
        </button>
      </div>

      {/* Recents Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-black">
        <button className="flex items-center gap-1 text-white">
          <span className="font-medium">Recents</span>
          <ChevronRight className="w-4 h-4 rotate-90" />
        </button>
        <button className="w-8 h-8 bg-gray-800 rounded-full flex items-center justify-center">
          <Copy className="w-4 h-4 text-white" />
        </button>
      </div>

      {/* Gallery Grid */}
      <div className="flex-1 bg-black overflow-y-auto">
        <div className="grid grid-cols-4 gap-0.5">
          {/* Camera button */}
          <button className="aspect-square bg-gray-800 flex items-center justify-center">
            <Camera className="w-8 h-8 text-white" />
          </button>
          
          {/* Selected image thumbnail */}
          <div className="aspect-square relative ring-2 ring-white ring-inset">
            <Image
              src={selectedImage}
              alt="Selected"
              fill
              className="object-cover"
            />
          </div>
          
          {/* Other gallery images */}
          {galleryImages.slice(0, 2).map((image, index) => (
            <button key={index} className="aspect-square relative">
              <Image
                src={image}
                alt={`Gallery ${index + 1}`}
                fill
                className="object-cover"
              />
            </button>
          ))}
          
          {/* More images */}
          {galleryImages.slice(2).map((image, index) => (
            <button key={index + 2} className="aspect-square relative">
              <Image
                src={image}
                alt={`Gallery ${index + 3}`}
                fill
                className="object-cover"
              />
              {/* Duration badge for some */}
              {index === 0 && (
                <span className="absolute bottom-1 right-1 text-xs text-white bg-black/50 px-1 rounded">
                  1:18
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Bottom Tabs */}
      <div className="bg-black py-4">
        <div className="flex justify-center gap-2">
          <button className="px-6 py-2 bg-gray-800 rounded-full text-white text-sm font-medium">
            POST
          </button>
          <button className="px-6 py-2 bg-gray-800 rounded-full text-white text-sm font-medium">
            STORY
          </button>
          <button className="px-6 py-2 bg-gray-800 rounded-full text-white text-sm font-medium">
            REEL
          </button>
        </div>
      </div>
    </div>
  );
}

