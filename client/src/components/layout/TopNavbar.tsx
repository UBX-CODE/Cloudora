import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Search,
  Upload,
  Bell,
  Menu,
  User as UserIcon,
  LogOut,
  Settings,
  ShieldCheck,
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { Modal } from '../ui/Modal';

interface TopNavbarProps {
  onToggleSidebar: () => void;
}

export const TopNavbar: React.FC<TopNavbarProps> = ({ onToggleSidebar }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const profileRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setIsProfileOpen(false);
      }
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setIsNotificationsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    setIsProfileOpen(false);
    await logout();
    navigate('/login');
  };

  const notifications = [
    {
      id: '1',
      title: 'Lossless audio synced',
      description: 'Pulsar Echoes (Master 192kHz) ingested successfully',
      time: '5m ago',
    },
    {
      id: '2',
      title: 'Collaborator added',
      description: 'Mara Voss shared "Vinyl Pressings 2026"',
      time: '1h ago',
    },
    {
      id: '3',
      title: 'Security check passed',
      description: 'JWT session authenticated with Bcrypt verified hash',
      time: '2h ago',
    },
  ];

  const getInitials = (name?: string) => {
    if (!name) return 'U';
    return name
      .split(' ')
      .map((part) => part[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  return (
    <>
      <header className="sticky top-0 z-20 h-16 bg-[#0A0A0E] border-b border-white/[0.06] px-4 sm:px-8 flex items-center justify-between gap-4">
        {/* Left: Mobile hamburger & Clean Google Drive Search Bar */}
        <div className="flex items-center gap-3 flex-1 max-w-lg">
          <button
            onClick={onToggleSidebar}
            className="p-2 -ml-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 lg:hidden focus:outline-none"
            aria-label="Toggle navigation menu"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div className="relative w-full">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search files, folders, and master tapes..."
              className="w-full bg-[#121217] text-xs text-white placeholder-gray-500 pl-10 pr-12 py-2 rounded-xl border border-white/10 focus:border-white/30 focus:outline-none transition-colors"
            />
            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none hidden sm:flex items-center">
              <kbd className="px-1.5 py-0.5 text-[9px] font-mono text-gray-400 bg-white/5 rounded border border-white/10">
                ⌘K
              </kbd>
            </div>
          </div>
        </div>

        {/* Right: Cloudflare-style Telemetry, Actions & Profile */}
        <div className="flex items-center gap-3 shrink-0">


          

          {/* Notifications Dropdown */}
          <div className="relative" ref={notifRef}>
            <button
              onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
              className="relative p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition-colors focus:outline-none"
              aria-label="Notifications"
            >
              <Bell className="w-4 h-4" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-pix-pink" />
            </button>

            {isNotificationsOpen && (
              <div className="absolute right-0 mt-2 w-80 rounded-xl bg-[#13121C] border border-[#232135] shadow-2xl py-2 z-50 animate-in fade-in zoom-in-95 duration-100">
                <div className="px-4 py-2 border-b border-[#232135] flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-white font-mono">
                    Notifications
                  </span>
                  <span className="text-[10px] font-mono text-pix-pink bg-pix-pink/10 px-2 py-0.5 rounded-full border border-pix-pink/20">
                    3 New
                  </span>
                </div>
                <div className="divide-y divide-[#1D1B2C] max-h-72 overflow-y-auto">
                  {notifications.map((n) => (
                    <div
                      key={n.id}
                      className="p-3 hover:bg-white/5 transition-colors cursor-pointer"
                    >
                      <p className="text-xs font-semibold text-white">
                        {n.title}
                      </p>
                      <p className="text-[11px] text-gray-400 truncate mt-0.5">
                        {n.description}
                      </p>
                      <span className="text-[10px] text-gray-500 font-mono mt-1 block">
                        {n.time}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* User Avatar & Dropdown */}
          <div className="relative" ref={profileRef}>
            <button
              onClick={() => setIsProfileOpen(!isProfileOpen)}
              className="flex items-center gap-2.5 p-1 rounded-lg hover:bg-white/5 transition-colors focus:outline-none"
              aria-label="User Profile Menu"
            >
              <div className="w-8 h-8 rounded-full bg-pix-purple text-white flex items-center justify-center text-xs font-bold border border-white/20">
                {getInitials(user?.name)}
              </div>
              
            </button>

            {isProfileOpen && (
              <div className="absolute right-0 mt-2 w-60 rounded-xl bg-[#13121C] border border-[#232135] shadow-2xl py-2 z-50 animate-in fade-in zoom-in-95 duration-100">
                <div className="px-4 py-2.5 border-b border-[#232135]">
                  <p className="text-xs font-bold text-white truncate">
                    {user?.name}
                  </p>
                  <p className="text-[11px] text-gray-400 truncate font-mono mt-0.5">
                    {user?.email}
                  </p>
                </div>

                <div className="py-1">
                  <Link
                    to="/settings"
                    onClick={() => setIsProfileOpen(false)}
                    className="flex items-center gap-2.5 px-4 py-2 text-xs font-medium text-gray-300 hover:text-white hover:bg-white/5 transition-colors"
                  >
                    <UserIcon className="w-3.5 h-3.5 text-gray-400" />
                    Account Profile
                  </Link>
                  <Link
                    to="/settings"
                    onClick={() => setIsProfileOpen(false)}
                    className="flex items-center gap-2.5 px-4 py-2 text-xs font-medium text-gray-300 hover:text-white hover:bg-white/5 transition-colors"
                  >
                    <Settings className="w-3.5 h-3.5 text-gray-400" />
                    Vault Settings
                  </Link>
                </div>

                <div className="pt-1 border-t border-[#232135]">
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-2.5 px-4 py-2 text-xs font-bold text-pix-pink hover:bg-pix-pink/10 transition-colors"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    Sign Out
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Quick Upload Modal */}
      <Modal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        title="Deposit Assets into Vault"
        description="Select high-resolution masters, 4K video reels, and lossless digital tracks."
        maxWidth="lg"
      >
        <div className="space-y-4">
          <div className="border-2 border-dashed border-[#232135] rounded-xl p-8 text-center hover:border-pix-cyan transition-colors cursor-pointer bg-[#0E0D17]">
            <div className="w-12 h-12 mx-auto rounded-full bg-pix-cyan/15 text-pix-cyan flex items-center justify-center mb-3">
              <Upload className="w-6 h-6" />
            </div>
            <p className="text-sm font-bold text-white">
              Drag & Drop master files here, or <span className="text-pix-cyan underline">browse workspace</span>
            </p>
            <p className="text-xs text-gray-400 mt-1 font-mono">
              FLAC 192kHz/24-bit, WAV, ProRes 422HQ, and Encrypted Archives
            </p>
          </div>

          <div className="flex items-center justify-between pt-2">
            <span className="text-xs text-gray-500 font-mono">
              [ DIRECT HIGH-SPEED STREAM ]
            </span>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setIsUploadModalOpen(false)}
                className="px-4 py-2 rounded-lg text-xs font-bold text-gray-400 hover:text-white hover:bg-white/5 border border-[#222436]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsUploadModalOpen(false);
                  navigate('/uploads');
                }}
                className="px-4 py-2 rounded-lg text-xs font-bold text-black bg-pix-cyan hover:bg-pix-cyan/90 transition-colors"
              >
                Open Transfer Queue ↗
              </button>
            </div>
          </div>
        </div>
      </Modal>
    </>
  );
};
