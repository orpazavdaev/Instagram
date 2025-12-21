import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Image from 'next/image';
import { ArrowLeft, Check } from 'lucide-react';
import { useApi } from '@/hooks/useApi';
import { useAuth } from '@/context/AuthContext';

interface Story {
  id: string;
  image: string;
  createdAt: string;
}

interface Highlight {
  id: string;
  name: string;
  storiesCount: number;
}

export default function NewHighlightPage() {
  const router = useRouter();
  const { addTo } = router.query; // If adding to existing highlight
  const { get, post, put } = useApi();
  const { user } = useAuth();
  
  const [stories, setStories] = useState<Story[]>([]);
  const [existingHighlights, setExistingHighlights] = useState<Highlight[]>([]);
  const [selectedStories, setSelectedStories] = useState<Set<string>>(new Set());
  const [highlightName, setHighlightName] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [mode, setMode] = useState<'select' | 'name' | 'existing'>('select');

  useEffect(() => {
    loadData();
  }, [user]);

  const loadData = async () => {
    if (!user?.username) return;
    
    setIsLoading(true);
    const [storiesData, highlightsData] = await Promise.all([
      get<Story[]>(`/api/users/${user.username}/stories`),
      get<Highlight[]>(`/api/highlights?userId=${user.id}`),
    ]);
    
    if (storiesData) setStories(storiesData);
    if (highlightsData) setExistingHighlights(highlightsData);
    setIsLoading(false);
  };

  const toggleStory = (storyId: string) => {
    setSelectedStories(prev => {
      const newSet = new Set(prev);
      if (newSet.has(storyId)) {
        newSet.delete(storyId);
      } else {
        newSet.add(storyId);
      }
      return newSet;
    });
  };

  const handleNext = () => {
    if (selectedStories.size === 0) return;
    
    if (addTo) {
      // Adding to existing highlight
      handleAddToExisting(addTo as string);
    } else {
      setMode('name');
    }
  };

  const handleAddToExisting = async (highlightId: string) => {
    setIsSaving(true);
    
    // Get current stories in highlight
    const highlight = await get<{ stories: Story[] }>(`/api/highlights/${highlightId}`);
    if (highlight) {
      const currentIds = highlight.stories.map(s => s.id);
      const newIds = [...currentIds, ...Array.from(selectedStories)];
      
      await put(`/api/highlights/${highlightId}`, {
        storyIds: newIds,
      });
    }
    
    setIsSaving(false);
    router.push('/profile');
  };

  const handleCreate = async () => {
    if (!highlightName.trim() || selectedStories.size === 0) return;
    
    setIsSaving(true);
    const result = await post('/api/highlights', {
      name: highlightName.trim(),
      storyIds: Array.from(selectedStories),
    });
    
    setIsSaving(false);
    
    if (result) {
      router.push('/profile');
    }
  };

  const handleSelectExisting = async (highlightId: string) => {
    await handleAddToExisting(highlightId);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-pink-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="sticky top-0 bg-white z-10 flex items-center justify-between px-4 py-3 border-b">
        <button onClick={() => {
          if (mode === 'name') setMode('select');
          else if (mode === 'existing') setMode('select');
          else router.back();
        }}>
          <ArrowLeft className="w-6 h-6" />
        </button>
        
        <span className="font-semibold">
          {mode === 'select' ? 'Select Stories' : mode === 'name' ? 'New Highlight' : 'Add to Highlight'}
        </span>
        
        {mode === 'select' && (
          <button 
            onClick={handleNext}
            disabled={selectedStories.size === 0}
            className={`font-semibold ${selectedStories.size > 0 ? 'text-blue-500' : 'text-gray-300'}`}
          >
            Next
          </button>
        )}
        {mode === 'name' && (
          <button 
            onClick={handleCreate}
            disabled={!highlightName.trim() || isSaving}
            className={`font-semibold ${highlightName.trim() ? 'text-blue-500' : 'text-gray-300'}`}
          >
            {isSaving ? 'Saving...' : 'Create'}
          </button>
        )}
        {mode === 'existing' && <div className="w-6" />}
      </div>

      {mode === 'select' && (
        <>
          {/* Options */}
          {existingHighlights.length > 0 && (
            <div className="p-4 border-b">
              <button 
                onClick={() => setMode('existing')}
                className="text-blue-500 font-medium"
              >
                Add to existing highlight
              </button>
            </div>
          )}

          {/* Stories Grid */}
          {stories.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <p>No stories yet</p>
              <p className="text-sm mt-1">Upload some stories first</p>
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-0.5">
              {stories.map(story => (
                <button
                  key={story.id}
                  onClick={() => toggleStory(story.id)}
                  className="relative aspect-square"
                >
                  <Image
                    src={story.image}
                    alt="Story"
                    fill
                    className="object-cover"
                  />
                  {/* Selection overlay */}
                  <div className={`absolute inset-0 ${selectedStories.has(story.id) ? 'bg-blue-500/30' : ''}`} />
                  {/* Checkmark */}
                  {selectedStories.has(story.id) && (
                    <div className="absolute top-2 right-2 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                      <Check className="w-4 h-4 text-white" />
                    </div>
                  )}
                </button>
              ))}
            </div>
          )}
        </>
      )}

      {mode === 'name' && (
        <div className="p-4">
          {/* Preview of selected stories */}
          <div className="flex gap-2 overflow-x-auto hide-scrollbar mb-6">
            {Array.from(selectedStories).map(storyId => {
              const story = stories.find(s => s.id === storyId);
              if (!story) return null;
              return (
                <div key={storyId} className="relative w-16 h-16 flex-shrink-0 rounded-lg overflow-hidden">
                  <Image src={story.image} alt="" fill className="object-cover" />
                </div>
              );
            })}
          </div>

          {/* Name input */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Highlight Name
            </label>
            <input
              type="text"
              value={highlightName}
              onChange={(e) => setHighlightName(e.target.value)}
              placeholder="Enter a name..."
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              autoFocus
            />
          </div>
        </div>
      )}

      {mode === 'existing' && (
        <div className="p-4">
          <p className="text-gray-500 text-sm mb-4">Select a highlight to add {selectedStories.size} stories to:</p>
          
          <div className="space-y-3">
            {existingHighlights.map(highlight => (
              <button
                key={highlight.id}
                onClick={() => handleSelectExisting(highlight.id)}
                disabled={isSaving}
                className="w-full flex items-center gap-3 p-3 border rounded-lg hover:bg-gray-50 transition"
              >
                <div className="w-12 h-12 rounded-full bg-gray-200 overflow-hidden">
                  {/* Could show highlight cover here */}
                </div>
                <div className="flex-1 text-left">
                  <p className="font-semibold">{highlight.name}</p>
                  <p className="text-sm text-gray-500">{highlight.storiesCount} stories</p>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}


