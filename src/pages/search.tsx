import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/router';
import { Search, X } from 'lucide-react';
import Avatar from '@/components/shared/Avatar';
import { useApi } from '@/hooks/useApi';
import Link from 'next/link';

interface User {
  id: string;
  username: string;
  fullName: string;
  avatar: string | null;
}

function UserSkeleton() {
  return (
    <div className="flex items-center gap-3 p-4 animate-pulse">
      <div className="w-12 h-12 rounded-full bg-gray-200" />
      <div className="flex-1">
        <div className="w-24 h-4 bg-gray-200 rounded mb-1" />
        <div className="w-32 h-3 bg-gray-200 rounded" />
      </div>
    </div>
  );
}

export default function SearchPage() {
  const router = useRouter();
  const { get } = useApi();
  const [query, setQuery] = useState('');
  const [users, setUsers] = useState<User[]>([]);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSearching, setIsSearching] = useState(false);

  // Load all users initially
  useEffect(() => {
    const loadUsers = async () => {
      setIsLoading(true);
      const data = await get<User[]>('/api/users/search');
      if (data) {
        setAllUsers(data);
        setUsers(data);
      }
      setIsLoading(false);
    };
    loadUsers();
  }, [get]);

  // Filter users based on search query
  const handleSearch = useCallback((searchQuery: string) => {
    setQuery(searchQuery);
    setIsSearching(true);
    
    if (!searchQuery.trim()) {
      setUsers(allUsers);
      setIsSearching(false);
      return;
    }

    const filtered = allUsers.filter(user => 
      user.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.fullName.toLowerCase().includes(searchQuery.toLowerCase())
    );
    setUsers(filtered);
    setIsSearching(false);
  }, [allUsers]);

  const clearSearch = () => {
    setQuery('');
    setUsers(allUsers);
  };

  return (
    <div className="bg-white min-h-screen pb-24">
      {/* Header with Search Input */}
      <div className="sticky top-0 bg-white z-10 p-4 border-b">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search users..."
            value={query}
            onChange={(e) => handleSearch(e.target.value)}
            className="w-full pl-10 pr-10 py-3 bg-gray-100 rounded-xl outline-none focus:ring-2 focus:ring-pink-300 transition text-gray-800"
            autoFocus
          />
          {query && (
            <button 
              onClick={clearSearch}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      {/* Results */}
      <div>
        {isLoading ? (
          // Skeleton loading
          <>
            <UserSkeleton />
            <UserSkeleton />
            <UserSkeleton />
            <UserSkeleton />
            <UserSkeleton />
          </>
        ) : users.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <Search className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p>No users found</p>
            {query && <p className="text-sm mt-1">Try a different search term</p>}
          </div>
        ) : (
          users.map(user => (
            <Link 
              key={user.id} 
              href={`/user/${user.username}`}
              className="flex items-center gap-3 p-4 hover:bg-gray-50 transition"
            >
              <Avatar 
                src={user.avatar || 'https://i.pravatar.cc/150'} 
                alt={user.username} 
                size="md" 
              />
              <div className="flex-1">
                <p className="font-semibold text-sm">{user.username}</p>
                <p className="text-gray-500 text-sm">{user.fullName}</p>
              </div>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}

