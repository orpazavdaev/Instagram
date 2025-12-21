import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import type { AppProps } from 'next/app';
import Head from 'next/head';
import BottomNav from '@/components/layout/BottomNav';
import NotificationToast from '@/components/shared/NotificationToast';
import { AuthProvider } from '@/context/AuthContext';
import { NotificationProvider } from '@/context/NotificationContext';
import '@/styles/globals.css';

// Pages that don't require authentication
const publicPages = ['/login'];

  // Pages without bottom nav (full screen pages)
  const noNavPages = ['/login', '/create', '/story', '/comments'];
  const noNavPrefixes = ['/chat/', '/reel/', '/followers/', '/following/', '/user/', '/post/', '/highlight/'];

function AppContent({ Component, pageProps }: AppProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    // Check if user is logged in
    const loggedIn = localStorage.getItem('isLoggedIn') === 'true';
    setIsLoggedIn(loggedIn);
    setIsLoading(false);

    // If not logged in and not on a public page, redirect to login
    if (!loggedIn && !publicPages.includes(router.pathname)) {
      router.push('/login');
    }
  }, [router.pathname]);

  // Show beautiful loading screen while checking auth
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-600 via-pink-500 to-orange-400 flex flex-col items-center justify-center">
        {/* Instagram Logo */}
        <div className="relative mb-8">
          <div className="w-24 h-24 rounded-3xl bg-white/20 backdrop-blur-sm flex items-center justify-center animate-pulse">
            <svg 
              className="w-14 h-14 text-white" 
              viewBox="0 0 24 24" 
              fill="currentColor"
            >
              <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
            </svg>
          </div>
          
          {/* Spinning ring */}
          <div className="absolute inset-0 rounded-3xl border-4 border-white/30 border-t-white animate-spin" style={{ animationDuration: '1s' }} />
        </div>
        
        {/* Instagram text */}
        <h1 className="text-3xl font-serif italic text-white mb-4 animate-pulse">
          Instagram
        </h1>
        
        {/* Loading dots */}
        <div className="flex gap-1">
          <div className="w-2 h-2 bg-white rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
          <div className="w-2 h-2 bg-white rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
          <div className="w-2 h-2 bg-white rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
        </div>
        
        {/* From Meta text */}
        <p className="absolute bottom-8 text-white/60 text-sm">
          from <span className="font-semibold">Meta</span>
        </p>
      </div>
    );
  }

  const isNoNavPage = noNavPages.includes(router.pathname) || 
    noNavPrefixes.some(prefix => router.pathname.startsWith(prefix));
  
  if (isNoNavPage) {
    return (
      <>
        <Head>
          <title>Instagram</title>
          <meta name="description" content="Instagram Clone" />
          <meta name="viewport" content="width=device-width, initial-scale=1" />
          <link rel="icon" href="/favicon.ico" />
        </Head>
        <Component {...pageProps} />
      </>
    );
  }

  // If not logged in, don't render anything (will redirect)
  if (!isLoggedIn) {
    return null;
  }

  return (
    <>
      <Head>
        <title>Instagram</title>
        <meta name="description" content="Instagram Clone - Share photos and videos with friends" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <div className="bg-white text-gray-900">
        <main className="max-w-[430px] mx-auto bg-white">
          <Component {...pageProps} />
        </main>
        <BottomNav />
      </div>
    </>
  );
}

export default function App(props: AppProps) {
  return (
    <AuthProvider>
      <NotificationProvider>
        <AppContent {...props} />
        <NotificationToast />
      </NotificationProvider>
    </AuthProvider>
  );
}
