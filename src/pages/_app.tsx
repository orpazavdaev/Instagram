import type { AppProps } from 'next/app';
import Head from 'next/head';
import BottomNav from '@/components/layout/BottomNav';
import '@/styles/globals.css';

export default function App({ Component, pageProps }: AppProps) {
  return (
    <>
      <Head>
        <title>Instagram</title>
        <meta name="description" content="Instagram Clone - Share photos and videos with friends" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <div className="bg-white text-gray-900 min-h-screen pb-20">
        <main className="max-w-[430px] mx-auto min-h-screen bg-white">
          <Component {...pageProps} />
        </main>
        <BottomNav />
      </div>
    </>
  );
}

