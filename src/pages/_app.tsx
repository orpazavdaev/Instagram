import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import type { AppProps } from 'next/app';
import Head from 'next/head';
import BottomNav from '@/components/layout/BottomNav';
import { AuthProvider } from '@/context/AuthContext';
import '@/styles/globals.css';

// Pages that don't require authentication
const publicPages = ['/login'];

  // Pages without bottom nav (full screen pages)
  const noNavPages = ['/login', '/create', '/story', '/comments'];
  const noNavPrefixes = ['/chat/', '/reel/'];

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

  // Show nothing while checking auth
  if (isLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-2xl font-serif italic text-gray-900">Instagram</div>
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
      <AppContent {...props} />
    </AuthProvider>
  );
}
