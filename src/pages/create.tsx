import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import Image from 'next/image';
import Link from 'next/link';
import { X, ChevronRight, Camera, Image as ImageIcon, Film, Upload, FolderOpen } from 'lucide-react';
import { useApi } from '@/hooks/useApi';
import { clearHomeCache } from './index';

type CreateType = 'POST' | 'STORY' | 'REEL';

interface MediaItem {
  id: string;
  url: string;
  type: 'post' | 'story' | 'reel';
}

// Sample videos for reels
const sampleVideos = [
  'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
  'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',
  'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4',
  'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4',
];

// Fallback sample images if DB is empty
const fallbackImages = [
  'https://picsum.photos/seed/create1/400/400',
  'https://picsum.photos/seed/create2/400/400',
  'https://picsum.photos/seed/create3/400/400',
  'https://picsum.photos/seed/create4/400/400',
  'https://picsum.photos/seed/create5/400/400',
  'https://picsum.photos/seed/create6/400/400',
  'https://picsum.photos/seed/create7/400/400',
  'https://picsum.photos/seed/create8/400/400',
];

export default function CreatePage() {
  const router = useRouter();
  const { get, post, isLoading } = useApi();
  const [createType, setCreateType] = useState<CreateType>('POST');
  const [selectedMedia, setSelectedMedia] = useState('');
  const [customUrl, setCustomUrl] = useState('');
  const [caption, setCaption] = useState('');
  const [error, setError] = useState('');
  const [dbMedia, setDbMedia] = useState<MediaItem[]>([]);
  const [isLoadingMedia, setIsLoadingMedia] = useState(true);
  const [showUrlInput, setShowUrlInput] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadMediaFromDb();
  }, []);

  const loadMediaFromDb = async () => {
    setIsLoadingMedia(true);
    const data = await get<MediaItem[]>('/api/media');
    if (data && data.length > 0) {
      setDbMedia(data);
    }
    setIsLoadingMedia(false);
  };

  const handleSelectMedia = (url: string) => {
    setSelectedMedia(url);
    setCustomUrl(url);
    setError('');
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Create a local URL for preview
      const url = URL.createObjectURL(file);
      setSelectedMedia(url);
      setCustomUrl(url);
      setError('');
      
      // Note: In a real app, you would upload this file to a storage service
      // and get back a URL. For now, we'll just use the local preview.
    }
  };

  const handleSubmit = async () => {
    const mediaUrl = customUrl || selectedMedia;
    
    if (!mediaUrl) {
      setError(createType === 'REEL' ? 'Please select a video' : 'Please select an image');
      return;
    }

    setError('');

    if (createType === 'POST') {
      const result = await post('/api/posts', {
        image: mediaUrl,
        caption: caption,
      });

      if (result) {
        clearHomeCache(); // Clear cache so new post appears
        router.push('/');
      } else {
        setError('Failed to create post');
      }
    } else if (createType === 'STORY') {
      const result = await post('/api/stories', {
        image: mediaUrl,
      });

      if (result) {
        clearHomeCache(); // Clear cache so new story appears
        router.push('/');
      } else {
        setError('Failed to create story');
      }
    } else if (createType === 'REEL') {
      const result = await post('/api/reels', {
        video: mediaUrl,
        caption: caption,
      });

      if (result) {
        router.push('/reels');
      } else {
        setError('Failed to create reel');
      }
    }
  };

  // Get display media - from DB or fallback
  const displayImages = dbMedia.length > 0 
    ? dbMedia.map(m => m.url) 
    : fallbackImages;

  const isVideo = createType === 'REEL';
  const displayVideos = sampleVideos;

  return (
    <div className="bg-black min-h-screen flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-black sticky top-0 z-10">
        <Link href="/" className="text-white">
          <X className="w-6 h-6" />
        </Link>
        <span className="text-white font-semibold">
          New {createType.toLowerCase()}
        </span>
        <button 
          onClick={handleSubmit}
          disabled={isLoading || (!selectedMedia && !customUrl)}
          className="text-blue-500 font-semibold disabled:opacity-50"
        >
          {isLoading ? 'Posting...' : 'Share'}
        </button>
      </div>

      {/* Selected Media Preview */}
      <div className="relative aspect-square bg-gray-900 flex items-center justify-center">
        {selectedMedia || customUrl ? (
          isVideo && (selectedMedia.includes('.mp4') || customUrl.includes('.mp4')) ? (
            <video
              src={customUrl || selectedMedia}
              className="w-full h-full object-contain"
              controls
              muted
            />
          ) : (
            <Image
              src={customUrl || selectedMedia}
              alt="Selected"
              fill
              className="object-contain"
              onError={() => setError('Invalid image URL')}
            />
          )
        ) : (
          <div className="text-center text-gray-500">
            {isVideo ? (
              <>
                <Film className="w-16 h-16 mx-auto mb-2" />
                <p>Select a video</p>
              </>
            ) : (
              <>
                <ImageIcon className="w-16 h-16 mx-auto mb-2" />
                <p>Select an image</p>
              </>
            )}
          </div>
        )}
      </div>

      {/* Options Buttons */}
      <div className="flex gap-2 px-4 py-3 bg-gray-900">
        <button 
          onClick={() => fileInputRef.current?.click()}
          className="flex-1 flex items-center justify-center gap-2 bg-gray-800 text-white px-4 py-3 rounded-lg hover:bg-gray-700 transition-colors"
        >
          <Upload className="w-5 h-5" />
          <span className="text-sm">Upload from device</span>
        </button>
        <button 
          onClick={() => setShowUrlInput(!showUrlInput)}
          className="flex-1 flex items-center justify-center gap-2 bg-gray-800 text-white px-4 py-3 rounded-lg hover:bg-gray-700 transition-colors"
        >
          <FolderOpen className="w-5 h-5" />
          <span className="text-sm">Paste URL</span>
        </button>
        <input 
          ref={fileInputRef}
          type="file" 
          accept={isVideo ? "video/*" : "image/*"}
          onChange={handleFileSelect}
          className="hidden" 
        />
      </div>

      {/* Custom URL Input */}
      {showUrlInput && (
        <div className="px-4 py-3 bg-gray-900">
          <input
            type="text"
            placeholder={isVideo ? "Paste video URL here..." : "Paste image URL here..."}
            value={customUrl}
            onChange={(e) => {
              setCustomUrl(e.target.value);
              setSelectedMedia('');
              setError('');
            }}
            className="w-full bg-gray-800 text-white px-4 py-3 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      )}

      {/* Caption Input (for posts and reels) */}
      {createType !== 'STORY' && (
        <div className="px-4 py-3 bg-gray-900 border-t border-gray-800">
          <textarea
            placeholder="Write a caption..."
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            rows={3}
            className="w-full bg-gray-800 text-white px-4 py-3 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 resize-none"
          />
        </div>
      )}

      {error && (
        <div className="px-4 py-2 bg-red-500/20 text-red-400 text-sm text-center">
          {error}
        </div>
      )}

      {/* Media Selection Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-black">
        <span className="text-white font-medium">
          {isVideo ? 'Sample Videos:' : (dbMedia.length > 0 ? 'From your posts:' : 'Sample images:')}
        </span>
      </div>

      {/* Media Grid */}
      <div className="grid grid-cols-4 gap-0.5 flex-1">
        {isVideo ? (
          // Video selection for reels
          displayVideos.map((video, index) => (
            <button 
              key={index} 
              className={`aspect-square relative ${selectedMedia === video ? 'ring-2 ring-blue-500 ring-inset' : ''}`}
              onClick={() => handleSelectMedia(video)}
            >
              <video
                src={video}
                className="w-full h-full object-cover"
                muted
              />
              <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                <Film className="w-6 h-6 text-white" />
              </div>
            </button>
          ))
        ) : (
          // Image selection for posts and stories
          isLoadingMedia ? (
            // Loading skeleton
            Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="aspect-square bg-gray-800 animate-pulse" />
            ))
          ) : (
            displayImages.map((image, index) => (
              <button 
                key={index} 
                className={`aspect-square relative ${selectedMedia === image ? 'ring-2 ring-blue-500 ring-inset' : ''}`}
                onClick={() => handleSelectMedia(image)}
              >
                <Image
                  src={image}
                  alt={`Media ${index + 1}`}
                  fill
                  className="object-cover"
                />
              </button>
            ))
          )
        )}
      </div>

      {/* Floating Bottom Tabs */}
      <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50">
        <div className="bg-neutral-700/90 backdrop-blur-sm rounded-full p-1 flex gap-1">
          <button 
            onClick={() => {
              setCreateType('POST');
              setSelectedMedia('');
              setCustomUrl('');
            }}
            className={`px-5 py-2 rounded-full text-xs font-semibold tracking-wide transition-colors ${
              createType === 'POST' 
                ? 'bg-neutral-500 text-white' 
                : 'text-neutral-300 hover:text-white'
            }`}
          >
            POST
          </button>
          <button 
            onClick={() => {
              setCreateType('STORY');
              setSelectedMedia('');
              setCustomUrl('');
            }}
            className={`px-5 py-2 rounded-full text-xs font-semibold tracking-wide transition-colors ${
              createType === 'STORY' 
                ? 'bg-neutral-500 text-white' 
                : 'text-neutral-300 hover:text-white'
            }`}
          >
            STORY
          </button>
          <button 
            onClick={() => {
              setCreateType('REEL');
              setSelectedMedia('');
              setCustomUrl('');
            }}
            className={`px-5 py-2 rounded-full text-xs font-semibold tracking-wide transition-colors ${
              createType === 'REEL' 
                ? 'bg-neutral-500 text-white' 
                : 'text-neutral-300 hover:text-white'
            }`}
          >
            REEL
          </button>
        </div>
      </div>
    </div>
  );
}
