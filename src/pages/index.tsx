import Link from 'next/link';

export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-8">
      <h1 className="text-2xl font-semibold mb-8">Instagram Clone</h1>
      <div className="grid grid-cols-2 gap-4">
        <Link href="/profile" className="bg-gray-100 hover:bg-gray-200 px-6 py-4 rounded-xl text-center">
          Profile
        </Link>
        <Link href="/comments" className="bg-gray-100 hover:bg-gray-200 px-6 py-4 rounded-xl text-center">
          Comments
        </Link>
        <Link href="/settings" className="bg-gray-100 hover:bg-gray-200 px-6 py-4 rounded-xl text-center">
          Settings
        </Link>
        <Link href="/story" className="bg-gray-100 hover:bg-gray-200 px-6 py-4 rounded-xl text-center">
          Story
        </Link>
        <Link href="/reels" className="bg-gray-100 hover:bg-gray-200 px-6 py-4 rounded-xl text-center">
          Reels
        </Link>
        <Link href="/create" className="bg-gray-100 hover:bg-gray-200 px-6 py-4 rounded-xl text-center">
          Add Post
        </Link>
      </div>
    </div>
  );
}

