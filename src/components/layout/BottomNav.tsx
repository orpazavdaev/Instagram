import Link from 'next/link';
import { useRouter } from 'next/router';
import { Home, Search, PlusCircle, Clapperboard } from 'lucide-react';
import Avatar from '../shared/Avatar';

const navItems = [
  { href: '/', icon: Home, label: 'Home' },
  { href: '/search', icon: Search, label: 'Search' },
  { href: '/create', icon: PlusCircle, label: 'Create' },
  { href: '/reels', icon: Clapperboard, label: 'Reels' },
];

export default function BottomNav() {
  const router = useRouter();
  const pathname = router.pathname;

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50">
      <nav className="bg-neutral-800 rounded-full flex items-center gap-9 px-8 py-4 shadow-lg">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          
          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center justify-center"
            >
              <Icon 
                className={`w-6 h-6 text-white ${isActive ? 'opacity-100' : 'opacity-60'}`}
                strokeWidth={isActive ? 2.5 : 2}
              />
            </Link>
          );
        })}
        
        {/* Profile with gradient ring */}
        <Link href="/profile" className="flex items-center justify-center">
          <div 
            className="rounded-full p-[2px]"
            style={{ background: 'linear-gradient(45deg, #f09433, #e6683c, #dc2743, #cc2366, #bc1888)' }}
          >
            <div className="bg-neutral-800 rounded-full p-[1px]">
              <Avatar size="xs" src="https://i.pravatar.cc/150?img=33" />
            </div>
          </div>
        </Link>
      </nav>
    </div>
  );
}
