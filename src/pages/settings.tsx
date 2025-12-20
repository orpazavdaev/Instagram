import { 
  ChevronRight, 
  User,
  Bell,
  Lock,
  Users,
  EyeOff,
  Send,
  Shield,
  LogOut
} from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';

const accountCenterItems = [
  { icon: User, label: 'Personal Details' },
  { icon: Shield, label: 'Password and Security' },
  { icon: null, label: 'Ads', customIcon: '📢' },
];

const howToUseItems = [
  { icon: User, label: 'Edit profile' },
  { icon: Bell, label: 'Notifications' },
];

const whoCanSeeItems = [
  { icon: Lock, label: 'Account privacy' },
  { icon: Users, label: 'Close friends' },
  { icon: EyeOff, label: 'blocked' },
  { icon: EyeOff, label: 'Hide story' },
];

const howOthersInteractItems = [
  { icon: Send, label: 'Messages and replies to stories' },
];

export default function SettingsPage() {
  const { logout } = useAuth();

  return (
    <div className="bg-white">

      {/* Settings and Privacy Link */}
      <Link href="#" className="flex items-center justify-between px-4 py-4 border-b border-gray-100">
        <span className="text-base">Settings And Privacy</span>
        <ChevronRight className="w-5 h-5 text-gray-400" />
      </Link>

      {/* Meta Accounts Center */}
      <div className="mx-4 mt-4 p-4 bg-gray-50 rounded-xl">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-blue-500 font-semibold">∞ Meta</span>
        </div>
        <h3 className="font-semibold mb-3">Accounts center</h3>
        
        <div className="space-y-3">
          {accountCenterItems.map((item, index) => (
            <button key={index} className="flex items-center gap-3 w-full text-left">
              {item.icon ? (
                <item.icon className="w-5 h-5 text-gray-500" />
              ) : (
                <span className="text-lg">{item.customIcon}</span>
              )}
              <span className="text-sm text-gray-700">{item.label}</span>
            </button>
          ))}
        </div>
        
        <button className="text-blue-500 text-sm font-medium mt-4">
          More In Account Center
        </button>
      </div>

      {/* How to use Instagram */}
      <div className="mt-6">
        <p className="px-4 text-xs text-gray-500 uppercase tracking-wide mb-2">
          How to use Instagram
        </p>
        <div className="space-y-1">
          {howToUseItems.map((item, index) => (
            <button key={index} className="flex items-center gap-3 w-full px-4 py-3 hover:bg-gray-50">
              <item.icon className="w-6 h-6 text-gray-700" />
              <span className="text-base">{item.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Who can see your content */}
      <div className="mt-6">
        <p className="px-4 text-xs text-gray-500 uppercase tracking-wide mb-2">
          Who can see your content
        </p>
        <div className="space-y-1">
          {whoCanSeeItems.map((item, index) => (
            <button key={index} className="flex items-center gap-3 w-full px-4 py-3 hover:bg-gray-50">
              <item.icon className="w-6 h-6 text-gray-700" />
              <span className="text-base">{item.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* How others can interact with you */}
      <div className="mt-6">
        <p className="px-4 text-xs text-gray-500 uppercase tracking-wide mb-2">
          How others can interact with you
        </p>
        <div className="space-y-1">
          {howOthersInteractItems.map((item, index) => (
            <button key={index} className="flex items-center gap-3 w-full px-4 py-3 hover:bg-gray-50">
              <item.icon className="w-6 h-6 text-gray-700" />
              <span className="text-base">{item.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Logout */}
      <div className="mt-6 pb-24 px-4">
        <button 
          onClick={logout}
          className="flex items-center gap-3 w-full px-4 py-3 bg-red-50 hover:bg-red-100 rounded-xl text-red-500 transition-colors"
        >
          <LogOut className="w-6 h-6" />
          <span className="text-base font-medium">Log out</span>
        </button>
      </div>
    </div>
  );
}

