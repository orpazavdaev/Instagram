import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import Image from 'next/image';
import { ChevronLeft, Camera } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useApi } from '@/hooks/useApi';

export default function EditProfilePage() {
  const router = useRouter();
  const { user, updateUser } = useAuth();
  const { get, post } = useApi();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [bio, setBio] = useState('');
  const [avatar, setAvatar] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    loadProfile();
  }, [user]);

  const loadProfile = async () => {
    if (!user?.username) return;
    
    setIsLoading(true);
    const profile = await get<{
      fullName: string;
      username: string;
      bio: string;
      avatar: string;
    }>(`/api/users/${user.username}`);
    
    if (profile) {
      setFullName(profile.fullName || '');
      setUsername(profile.username || '');
      setBio(profile.bio || '');
      setAvatar(profile.avatar || '');
    }
    setIsLoading(false);
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onloadend = () => {
      setAvatar(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleSave = async () => {
    setError('');
    setIsSaving(true);
    
    try {
      const result = await post('/api/users/update', {
        fullName,
        username,
        bio,
        avatar,
      });
      
      if (result) {
        // Update local user state
        if (updateUser) {
          updateUser({ ...user, fullName, username, bio, avatar });
        }
        router.push('/profile');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to save profile');
    }
    
    setIsSaving(false);
  };

  if (isLoading) {
    return (
      <div className="bg-white min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900" />
      </div>
    );
  }

  return (
    <div className="bg-white min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
        <button onClick={() => router.back()} className="p-1">
          <ChevronLeft className="w-6 h-6" />
        </button>
        <span className="font-semibold">Edit Profile</span>
        <button 
          onClick={handleSave}
          disabled={isSaving}
          className="text-blue-500 font-semibold disabled:opacity-50"
        >
          {isSaving ? 'Saving...' : 'Done'}
        </button>
      </div>

      {/* Avatar */}
      <div className="flex flex-col items-center py-6">
        <div className="relative">
          <div className="w-24 h-24 rounded-full overflow-hidden bg-gray-200">
            {avatar ? (
              <Image
                src={avatar}
                alt="Profile"
                width={96}
                height={96}
                className="object-cover w-full h-full"
              />
            ) : (
              <div className="w-full h-full bg-gray-300" />
            )}
          </div>
          <button 
            onClick={() => fileInputRef.current?.click()}
            className="absolute bottom-0 right-0 w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center border-2 border-white"
          >
            <Camera className="w-4 h-4 text-white" />
          </button>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleAvatarChange}
          className="hidden"
        />
        <button 
          onClick={() => fileInputRef.current?.click()}
          className="mt-3 text-blue-500 font-semibold text-sm"
        >
          Change Photo
        </button>
      </div>

      {/* Form */}
      <div className="px-4 space-y-4">
        {error && (
          <div className="p-3 bg-red-50 text-red-600 rounded-lg text-sm">
            {error}
          </div>
        )}

        <div>
          <label className="text-sm text-gray-500">Name</label>
          <input
            type="text"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            className="w-full py-2 border-b border-gray-200 focus:border-gray-900 outline-none"
            placeholder="Full Name"
          />
        </div>

        <div>
          <label className="text-sm text-gray-500">Username</label>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="w-full py-2 border-b border-gray-200 focus:border-gray-900 outline-none"
            placeholder="Username"
          />
        </div>

        <div>
          <label className="text-sm text-gray-500">Bio</label>
          <textarea
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            rows={3}
            className="w-full py-2 border-b border-gray-200 focus:border-gray-900 outline-none resize-none"
            placeholder="Tell something about yourself..."
          />
        </div>
      </div>

      {/* Additional Options */}
      <div className="mt-8 px-4 space-y-4">
        <button className="w-full py-3 text-left text-blue-500 font-semibold">
          Switch to Professional Account
        </button>
        <button className="w-full py-3 text-left text-blue-500 font-semibold">
          Personal Information Settings
        </button>
      </div>
    </div>
  );
}

