import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { ChevronLeft, Phone, Video, Send, Image as ImageIcon, Mic, Heart, Square } from 'lucide-react';
import NextImage from 'next/image';
import Avatar from '@/components/shared/Avatar';
import { useAuth } from '@/context/AuthContext';
import { useApi } from '@/hooks/useApi';

interface Message {
  id: string;
  text: string;
  type?: string;
  createdAt: string;
  sender: {
    id: string;
    username: string;
    avatar: string;
  };
}

interface SharedPost {
  type: 'shared_post';
  postId: string;
  image: string;
  username: string;
  caption: string;
}

interface SharedStory {
  type: 'shared_story';
  storyId: string;
  image: string;
  username: string;
}

interface SharedReel {
  type: 'shared_reel';
  reelId: string;
  thumbnail: string;
  username: string;
  caption: string;
}

type SharedContent = SharedPost | SharedStory | SharedReel;

// Helper to parse shared content
function parseSharedContent(text: string): SharedContent | null {
  try {
    const data = JSON.parse(text);
    console.log('Parsed shared content:', data);
    if (data.type === 'shared_post' || data.type === 'shared_story' || data.type === 'shared_reel') {
      return data as SharedContent;
    }
  } catch (e) {
    // Not shared content - not JSON or parsing error
  }
  return null;
}

interface UserInfo {
  id: string;
  username: string;
  avatar: string;
  fullName: string;
}

// Audio Player Component
function AudioPlayer({ src, isOwn }: { src: string; isOwn: boolean }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const audioRef = useRef<HTMLAudioElement>(null);

  const togglePlay = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      const current = audioRef.current.currentTime;
      const total = audioRef.current.duration;
      setProgress((current / total) * 100);
    }
  };

  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration);
    }
  };

  const handleEnded = () => {
    setIsPlaying(false);
    setProgress(0);
  };

  const formatTime = (time: number) => {
    const mins = Math.floor(time / 60);
    const secs = Math.floor(time % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex items-center gap-3 min-w-[180px]">
      <audio
        ref={audioRef}
        src={src}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onEnded={handleEnded}
      />
      <button
        onClick={togglePlay}
        className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 transition-colors ${
          isOwn ? 'bg-blue-400 hover:bg-blue-300' : 'bg-gray-300 hover:bg-gray-400'
        }`}
      >
        {isPlaying ? (
          <div className="flex gap-0.5">
            <div className={`w-1 h-4 rounded-full ${isOwn ? 'bg-white' : 'bg-gray-700'}`} />
            <div className={`w-1 h-4 rounded-full ${isOwn ? 'bg-white' : 'bg-gray-700'}`} />
          </div>
        ) : (
          <div className={`w-0 h-0 border-t-[6px] border-t-transparent border-b-[6px] border-b-transparent border-l-[10px] ml-1 ${
            isOwn ? 'border-l-white' : 'border-l-gray-700'
          }`} />
        )}
      </button>
      <div className="flex-1 min-w-[100px]">
        {/* Waveform visualization */}
        <div className="flex items-center gap-[2px] h-6 mb-1">
          {[...Array(20)].map((_, i) => {
            const heights = [40, 70, 50, 90, 60, 80, 45, 95, 55, 75, 40, 85, 50, 70, 60, 90, 45, 80, 55, 65];
            const isActive = i < (progress / 100) * 20;
            return (
              <div
                key={i}
                className={`w-[3px] rounded-full transition-colors ${
                  isActive 
                    ? (isOwn ? 'bg-white' : 'bg-gray-700') 
                    : (isOwn ? 'bg-blue-300' : 'bg-gray-300')
                }`}
                style={{ height: `${heights[i]}%` }}
              />
            );
          })}
        </div>
        <p className={`text-xs ${isOwn ? 'text-blue-100' : 'text-gray-500'}`}>
          {formatTime(duration || 0)}
        </p>
      </div>
    </div>
  );
}

// Skeleton Components
function MessageSkeleton({ isOwn }: { isOwn: boolean }) {
  return (
    <div className={`flex mb-3 ${isOwn ? 'justify-end' : 'justify-start'} animate-pulse`}>
      {!isOwn && <div className="w-6 h-6 rounded-full bg-gray-200 mr-2" />}
      <div className={`${isOwn ? 'w-48' : 'w-40'} h-10 rounded-3xl bg-gray-200`} />
    </div>
  );
}

export default function ChatPage() {
  const router = useRouter();
  const { userId } = router.query;
  const { user } = useAuth();
  const { get, post: apiPost } = useApi();
  
  const [messages, setMessages] = useState<Message[]>([]);
  const [partner, setPartner] = useState<UserInfo | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (userId) {
      loadData();
    }
  }, [userId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadData = async () => {
    setIsLoading(true);
    const [messagesData, users] = await Promise.all([
      get<Message[]>(`/api/messages/${userId}`),
      get<UserInfo[]>('/api/users'),
    ]);
    
    if (messagesData) {
      console.log('Loaded messages:', messagesData);
      setMessages(messagesData);
    }
    if (users) {
      const found = users.find(u => u.id === userId);
      if (found) {
        setPartner(found);
      }
    }
    setIsLoading(false);
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newMessage.trim() || !userId) return;
    
    // Optimistic update
    const optimisticMessage: Message = {
      id: `temp-${Date.now()}`,
      text: newMessage,
      createdAt: new Date().toISOString(),
      sender: {
        id: user?.id || '',
        username: user?.username || '',
        avatar: user?.avatar || '',
      },
    };
    setMessages([...messages, optimisticMessage]);
    setNewMessage('');
    setIsSubmitting(true);
    
    const result = await apiPost<Message>(`/api/messages/${userId}`, {
      text: optimisticMessage.text,
    });
    
    if (result) {
      // Replace optimistic message with real one
      setMessages(prev => prev.map(m => m.id === optimisticMessage.id ? result : m));
    }
    
    setIsSubmitting(false);
  };

  // Send heart emoji
  const handleSendHeart = async () => {
    if (!userId) return;
    
    const optimisticMessage: Message = {
      id: `temp-${Date.now()}`,
      text: '❤️',
      type: 'text',
      createdAt: new Date().toISOString(),
      sender: {
        id: user?.id || '',
        username: user?.username || '',
        avatar: user?.avatar || '',
      },
    };
    setMessages([...messages, optimisticMessage]);
    
    const result = await apiPost<Message>(`/api/messages/${userId}`, {
      text: '❤️',
    });
    
    if (result) {
      setMessages(prev => prev.map(m => m.id === optimisticMessage.id ? result : m));
    }
  };

  // Handle file selection
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // Check if it's an image
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }
    
    // Convert to base64
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = reader.result as string;
      sendImageMessage(base64);
    };
    reader.readAsDataURL(file);
    
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Send image message
  const sendImageMessage = async (imageData: string) => {
    if (!userId) return;
    
    const optimisticMessage: Message = {
      id: `temp-${Date.now()}`,
      text: imageData,
      type: 'image',
      createdAt: new Date().toISOString(),
      sender: {
        id: user?.id || '',
        username: user?.username || '',
        avatar: user?.avatar || '',
      },
    };
    setMessages(prev => [...prev, optimisticMessage]);
    
    // Save the image data to database
    const result = await apiPost<Message>(`/api/messages/${userId}`, {
      text: imageData,
      type: 'image',
    });
    
    if (result) {
      setMessages(prev => prev.map(m => 
        m.id === optimisticMessage.id ? { ...result, type: 'image' as const } : m
      ));
    }
  };

  // Voice recording
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];
      
      mediaRecorder.ondataavailable = (e) => {
        audioChunksRef.current.push(e.data);
      };
      
      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        // Convert to base64 for sending
        const reader = new FileReader();
        reader.onloadend = async () => {
          const base64Audio = reader.result as string;
          const duration = recordingTime;
          
          const optimisticMessage: Message = {
            id: `temp-${Date.now()}`,
            text: base64Audio,
            type: 'audio',
            createdAt: new Date().toISOString(),
            sender: {
              id: user?.id || '',
              username: user?.username || '',
              avatar: user?.avatar || '',
            },
          };
          setMessages(prev => [...prev, optimisticMessage]);
          
          // Send audio data to API
          const result = await apiPost<Message>(`/api/messages/${userId}`, {
            text: base64Audio,
            type: 'audio',
          });
          
          if (result) {
            setMessages(prev => prev.map(m => 
              m.id === optimisticMessage.id ? { ...result, type: 'audio' as const } : m
            ));
          }
        };
        reader.readAsDataURL(audioBlob);
        
        stream.getTracks().forEach(track => track.stop());
      };
      
      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);
      
      recordingIntervalRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
    } catch (error) {
      console.error('Error accessing microphone:', error);
      alert('Could not access microphone. Please allow microphone access.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current);
      }
    }
  };

  return (
    <div className="bg-white min-h-screen flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <Link href="/messages" className="p-1">
            <ChevronLeft className="w-6 h-6 text-gray-700" />
          </Link>
          {isLoading ? (
            <div className="flex items-center gap-3 animate-pulse">
              <div className="w-8 h-8 rounded-full bg-gray-200" />
              <div>
                <div className="w-20 h-4 bg-gray-200 rounded mb-1" />
                <div className="w-16 h-3 bg-gray-200 rounded" />
              </div>
            </div>
          ) : (
            <>
              <Avatar 
                src={partner?.avatar || 'https://i.pravatar.cc/150'} 
                alt={partner?.username || 'User'} 
                size="sm" 
              />
              <div>
                <p className="font-semibold text-sm">{partner?.username || 'User'}</p>
                <p className="text-xs text-gray-500">Active now</p>
              </div>
            </>
          )}
        </div>
        <div className="flex items-center gap-4">
          <button className="p-1">
            <Phone className="w-5 h-5 text-gray-700" />
          </button>
          <button className="p-1">
            <Video className="w-5 h-5 text-gray-700" />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 pb-20">
        {isLoading ? (
          <>
            <MessageSkeleton isOwn={false} />
            <MessageSkeleton isOwn={true} />
            <MessageSkeleton isOwn={false} />
            <MessageSkeleton isOwn={true} />
          </>
        ) : messages.length === 0 ? (
          <div className="text-center text-gray-500 py-8">
            <Avatar 
              src={partner?.avatar || 'https://i.pravatar.cc/150'} 
              size="xxl" 
            />
            <p className="font-semibold mt-4">{partner?.fullName || partner?.username || 'User'}</p>
            <p className="text-sm text-gray-400">@{partner?.username || 'user'}</p>
            <p className="text-sm mt-4">Start a conversation!</p>
          </div>
        ) : (
          messages.map((message) => {
            const isOwn = message.sender.id === user?.id;
            return (
              <div 
                key={message.id} 
                className={`flex mb-3 ${isOwn ? 'justify-end' : 'justify-start'}`}
              >
                {!isOwn && (
                  <Avatar 
                    src={message.sender.avatar || 'https://i.pravatar.cc/150'} 
                    size="xs" 
                  />
                )}
                {(() => {
                  const sharedContent = parseSharedContent(message.text);
                  
                  if (sharedContent) {
                    if (sharedContent.type === 'shared_post') {
                      // Shared Post
                      return (
                        <Link href={`/post/${sharedContent.postId}`} className="block max-w-[250px]">
                          <div className={`rounded-2xl overflow-hidden border ${isOwn ? 'border-blue-400' : 'border-gray-200'}`}>
                            <div className="relative aspect-square w-full">
                              <NextImage
                                src={sharedContent.image}
                                alt="Shared post"
                                fill
                                className="object-cover"
                              />
                            </div>
                            <div className={`p-3 ${isOwn ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-900'}`}>
                              <p className="font-semibold text-sm">@{sharedContent.username}</p>
                              <p className="text-xs opacity-80 truncate">{sharedContent.caption}</p>
                              <p className={`text-xs mt-1 ${isOwn ? 'text-blue-200' : 'text-blue-500'}`}>Tap to view post</p>
                            </div>
                          </div>
                        </Link>
                      );
                    }
                    
                    if (sharedContent.type === 'shared_story') {
                      // Shared Story
                      return (
                        <div className="max-w-[200px]">
                          <div className={`rounded-2xl overflow-hidden border ${isOwn ? 'border-blue-400' : 'border-gray-200'}`}>
                            <div className="relative aspect-[9/16] w-full">
                              <NextImage
                                src={sharedContent.image}
                                alt="Shared story"
                                fill
                                className="object-cover"
                              />
                              <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                              <div className="absolute bottom-2 left-2 right-2">
                                <p className="text-white font-semibold text-sm">@{sharedContent.username}</p>
                                <p className="text-white/80 text-xs">Story</p>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    }
                    
                    if (sharedContent.type === 'shared_reel') {
                      // Shared Reel
                      return (
                        <Link href={`/reel/${sharedContent.reelId}`} className="block max-w-[200px]">
                          <div className={`rounded-2xl overflow-hidden border ${isOwn ? 'border-blue-400' : 'border-gray-200'}`}>
                            <div className="relative aspect-[9/16] w-full bg-black">
                              <NextImage
                                src={sharedContent.thumbnail}
                                alt="Shared reel"
                                fill
                                className="object-cover"
                              />
                              <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                              <div className="absolute bottom-2 left-2 right-2">
                                <p className="text-white font-semibold text-sm">@{sharedContent.username}</p>
                                <p className="text-white/80 text-xs truncate">{sharedContent.caption || 'Reel'}</p>
                                <p className="text-blue-300 text-xs mt-1">Tap to view reel</p>
                              </div>
                            </div>
                          </div>
                        </Link>
                      );
                    }
                  }
                  
                  return (
                    <div 
                      className={`max-w-[70%] rounded-3xl ${
                        message.type === 'image' || message.text.startsWith('data:image') ? 'p-1' : 'px-4 py-2'
                      } ${
                        isOwn 
                          ? 'bg-blue-500 text-white' 
                          : 'bg-gray-100 text-gray-900 ml-2'
                      }`}
                    >
                      {message.type === 'image' || message.text.startsWith('data:image') ? (
                        <NextImage
                          src={message.text}
                          alt="Shared image"
                          width={200}
                          height={200}
                          className="rounded-2xl object-cover"
                        />
                      ) : message.type === 'audio' || message.text.startsWith('data:audio') ? (
                        <div className="flex items-center gap-3 min-w-[180px] py-1">
                          {message.text.startsWith('data:audio') ? (
                            <AudioPlayer src={message.text} isOwn={isOwn} />
                          ) : (
                            <>
                              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${isOwn ? 'bg-blue-400' : 'bg-gray-200'}`}>
                                <Mic className={`w-5 h-5 ${isOwn ? 'text-white' : 'text-gray-600'}`} />
                              </div>
                              <div className="flex-1">
                                <div className={`h-1 rounded-full ${isOwn ? 'bg-blue-300' : 'bg-gray-300'}`}>
                                  <div className={`h-1 rounded-full w-1/2 ${isOwn ? 'bg-white' : 'bg-gray-500'}`} />
                                </div>
                                <p className={`text-xs mt-1 ${isOwn ? 'text-blue-100' : 'text-gray-500'}`}>Voice message</p>
                              </div>
                            </>
                          )}
                        </div>
                      ) : (
                        <p className="text-sm">{message.text}</p>
                      )}
                    </div>
                  );
                })()}
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
      />

      {/* Recording Indicator */}
      {isRecording && (
        <div className="fixed bottom-20 left-1/2 -translate-x-1/2 bg-red-500 text-white px-4 py-2 rounded-full flex items-center gap-2 z-50">
          <div className="w-3 h-3 bg-white rounded-full animate-pulse" />
          <span>Recording... {recordingTime}s</span>
          <button onClick={stopRecording} className="ml-2 p-1 bg-white/20 rounded-full">
            <Square className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Message Input */}
      <form 
        onSubmit={handleSendMessage}
        className="fixed bottom-0 left-0 right-0 border-t border-gray-100 p-3 flex items-center gap-3 bg-white max-w-[430px] mx-auto"
      >
        <button 
          type="button" 
          onClick={() => fileInputRef.current?.click()}
          className="p-2 bg-blue-500 rounded-full"
        >
          <ImageIcon className="w-5 h-5 text-white" />
        </button>
        <div className="flex-1 flex items-center bg-gray-100 rounded-full px-4 py-2">
          <input
            type="text"
            placeholder="Message..."
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            className="flex-1 bg-transparent border-none focus:ring-0 text-sm outline-none"
          />
        </div>
        {newMessage.trim() ? (
          <button 
            type="submit"
            disabled={isSubmitting}
            className="p-2 text-blue-500"
          >
            <Send className="w-5 h-5" />
          </button>
        ) : (
          <>
            <button 
              type="button" 
              onClick={isRecording ? stopRecording : startRecording}
              className={`p-2 ${isRecording ? 'text-red-500' : 'text-gray-700'}`}
            >
              <Mic className="w-5 h-5" />
            </button>
            <button 
              type="button" 
              onClick={handleSendHeart}
              className="p-2"
            >
              <Heart className="w-5 h-5 text-gray-700 hover:text-red-500 hover:fill-red-500 transition-colors" />
            </button>
          </>
        )}
      </form>
    </div>
  );
}
