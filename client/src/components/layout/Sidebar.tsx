import React from 'react';
import { NavLink, Link } from 'react-router-dom';
import {
  LayoutDashboard,
  FolderOpen,
  Clock,
  Share2,
  Star,
  Film,
  UploadCloud,
  Trash2,
  Settings,
  HardDrive,
  Plus,
} from 'lucide-react';
import { CloudoraLogo } from '../common/CloudoraLogo';

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen = true, onClose }) => {
  const navItems = [
    { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { label: 'My Files', path: '/files', icon: FolderOpen },
    { label: 'Recent', path: '/recent', icon: Clock },
    { label: 'Shared with me', path: '/shared', icon: Share2 },
    { label: 'Starred', path: '/starred', icon: Star },
    { label: 'Media Library', path: '/media', icon: Film },
    { label: 'Upload Manager', path: '/uploads', icon: UploadCloud, badge: 'Active' },
    { label: 'Trash', path: '/trash', icon: Trash2 },
    { label: 'Settings', path: '/settings', icon: Settings },
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/70 z-30 lg:hidden backdrop-blur-xs"
          onClick={onClose}
        />
      )}

      <aside
        className={`fixed top-0 bottom-0 left-0 z-40 w-64 bg-[#0A0A0E] border-r border-white/[0.06] flex flex-col justify-between transition-transform duration-200 ease-in-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div>
          {/* Brand header */}
          <div className="h-16 px-6 flex items-center border-b border-white/[0.06] shrink-0">
            <CloudoraLogo size="md" showBadge />
          </div>

          {/* Clean "+ New Upload" action button */}
          <div className="p-4 pb-2">
            <Link
              to="/uploads"
              onClick={onClose}
              className="flex items-center justify-center gap-2.5 w-full py-2.5 px-4 rounded-xl bg-white hover:bg-gray-100 text-black font-bold text-xs uppercase tracking-wide transition-all shadow-sm"
            >
              <Plus className="w-4 h-4 text-black stroke-[2.5]" />
              <span>New Upload</span>
            </Link>
          </div>

          {/* Navigation list (Google Drive / Cloudflare style) */}
          <div className="overflow-y-auto px-3 py-2 space-y-0.5">
            <div className="px-3 py-1.5 text-[10px] font-mono font-bold uppercase tracking-widest text-gray-500">
              Workspace
            </div>

            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  onClick={onClose}
                  className={({ isActive }) =>
                    `flex items-center justify-between px-3.5 py-2.5 text-xs font-medium rounded-xl transition-colors duration-150 ${
                      isActive
                        ? 'bg-white/10 text-white font-semibold'
                        : 'text-gray-400 hover:text-white hover:bg-white/[0.04]'
                    }`
                  }
                >
                  {({ isActive }) => (
                    <>
                      <div className="flex items-center gap-3">
                        <Icon
                          className={`w-4 h-4 transition-colors ${
                            isActive ? 'text-white' : 'text-gray-400'
                          }`}
                        />
                        <span>{item.label}</span>
                      </div>
                      {item.badge && (
                        <span className="px-2 py-0.5 text-[9px] font-mono font-bold uppercase rounded-full bg-white/10 text-gray-300 border border-white/10">
                          {item.badge}
                        </span>
                      )}
                    </>
                  )}
                </NavLink>
              );
            })}
          </div>
        </div>

        {/* Storage Quota Bar */}
        <div className="p-4 border-t border-white/[0.06] space-y-2.5 bg-[#07070A]">
          <div className="flex items-center justify-between text-xs">
            <span className="text-gray-400 font-medium flex items-center gap-1.5">
              <HardDrive className="w-3.5 h-3.5 text-gray-300" />
              Storage
            </span>
            <span className="text-gray-300 font-mono text-[11px]">9.6 GB of 15 GB</span>
          </div>

          <div className="w-full bg-white/10 h-1.5 rounded-full overflow-hidden">
            <div
              className="bg-white h-full rounded-full transition-all duration-300"
              style={{ width: '64%' }}
            />
          </div>

          <div className="pt-1 flex items-center justify-between text-[11px]">
            <span className="text-gray-500 font-mono">64% allocated</span>
            <span className="text-gray-300 font-mono text-[10px] font-bold">
              15 GB FREE
            </span>
          </div>
        </div>
      </aside>
    </>
  );
};
