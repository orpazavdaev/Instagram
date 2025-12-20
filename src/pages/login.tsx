import { useState } from 'react';
import { useRouter } from 'next/router';
import { Eye, EyeOff } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

export default function LoginPage() {
  const router = useRouter();
  const { login, register } = useAuth();
  const [isRegister, setIsRegister] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      let success: boolean;
      
      if (isRegister) {
        success = await register(username, password, fullName);
      } else {
        success = await login(username, password);
      }

      if (success) {
        router.push('/');
      } else {
        setError(isRegister ? 'Username already exists' : 'Invalid credentials');
      }
    } catch (err) {
      setError('An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-500 via-pink-500 to-orange-400 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-serif italic text-white drop-shadow-lg">
            Instagram
          </h1>
        </div>

        {/* Form Card */}
        <div className="bg-white rounded-2xl shadow-2xl p-8">
          <h2 className="text-xl font-semibold text-center text-gray-800 mb-6">
            {isRegister ? 'Create Account' : 'Welcome Back'}
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            {isRegister && (
              <div>
                <input
                  type="text"
                  placeholder="Full Name"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full px-4 py-3 rounded-lg bg-gray-100 border border-gray-200 focus:border-pink-500 focus:ring-2 focus:ring-pink-200 outline-none transition text-gray-800"
                />
              </div>
            )}

            <div>
              <input
                type="text"
                placeholder="Username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                className="w-full px-4 py-3 rounded-lg bg-gray-100 border border-gray-200 focus:border-pink-500 focus:ring-2 focus:ring-pink-200 outline-none transition text-gray-800"
              />
            </div>

            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full px-4 py-3 pr-12 rounded-lg bg-gray-100 border border-gray-200 focus:border-pink-500 focus:ring-2 focus:ring-pink-200 outline-none transition text-gray-800"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>

            {error && (
              <p className="text-red-500 text-sm text-center">{error}</p>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 rounded-lg bg-gradient-to-r from-purple-500 via-pink-500 to-orange-400 text-white font-semibold hover:opacity-90 transition disabled:opacity-50"
            >
              {isLoading ? 'Loading...' : (isRegister ? 'Sign Up' : 'Log In')}
            </button>
          </form>

          <div className="mt-6 text-center">
            <button
              onClick={() => {
                setIsRegister(!isRegister);
                setError('');
              }}
              className="text-pink-500 font-medium hover:underline"
            >
              {isRegister
                ? 'Already have an account? Log In'
                : "Don't have an account? Sign Up"}
            </button>
          </div>
        </div>

        {/* Demo credentials */}
        <div className="mt-4 text-center text-white/80 text-sm">
          <p>Demo: username & password = &quot;1&quot;</p>
        </div>
      </div>
    </div>
  );
}
