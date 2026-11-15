import React, { useState, useEffect, useCallback } from 'react';
import { NavLink, Link, useLocation } from 'react-router-dom';
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
import { useAuth } from '../../context/AuthContext';
import { fetchStorageSummary, StorageSummaryResponse } from '../../services/file.service';
import { formatFileSize } from '../../utils/formatters';
import { getAvatarUrl } from '../../services/auth.service';

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen = true, onClose }) => {
  const { user } = useAuth();
  const location = useLocation();
  const [summary, setSummary] = useState<StorageSummaryResponse | null>(null);

  const loadStorage = useCallback(async () => {
    try {
      const data = await fetchStorageSummary();
      setSummary(data);
    } catch {
      // Quiet fail if not yet authenticated
    }
  }, []);

  useEffect(() => {
    loadStorage();

    // Listen to live storage update events across the application
    const handleStorageUpdate = () => {
      loadStorage();
    };

    window.addEventListener('cloudora:storage-updated', handleStorageUpdate);

    // Refresh every 30 seconds
    const interval = setInterval(loadStorage, 30000);

    return () => {
      window.removeEventListener('cloudora:storage-updated', handleStorageUpdate);
      clearInterval(interval);
    };
  }, [loadStorage]);

  // Refresh whenever the user navigates between views
  useEffect(() => {
    loadStorage();
  }, [location.pathname, loadStorage]);

  const totalUsed = summary?.totalUsedBytes ?? user?.storageUsed ?? 0;
  const totalLimit = summary?.storageLimitBytes ?? user?.storageLimit ?? 5 * 1024 * 1024 * 1024;
  const percentage =
    summary?.percentageUsed ??
    (totalLimit > 0 ? Math.min(100, Number(((totalUsed / totalLimit) * 100).toFixed(1))) : 0);

  const barColor =
    percentage >= 90
      ? 'bg-red-500'
      : percentage >= 75
      ? 'bg-amber-400'
      : 'bg-white';
  const navItems = [
    { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard, color: 'text-sky-400', activeBg: 'bg-sky-500/10 border-sky-500/20' },
    { label: 'My Files', path: '/files', icon: FolderOpen, color: 'text-cyan-400', activeBg: 'bg-cyan-500/10 border-cyan-500/20' },
    { label: 'Recent', path: '/recent', icon: Clock, color: 'text-blue-400', activeBg: 'bg-blue-500/10 border-blue-500/20' },
    { label: 'Shared with me', path: '/shared', icon: Share2, color: 'text-emerald-400', activeBg: 'bg-emerald-500/10 border-emerald-500/20' },
    { label: 'Starred', path: '/starred', icon: Star, color: 'text-amber-400', activeBg: 'bg-amber-500/10 border-amber-500/20' },
    { label: 'Media Library', path: '/media', icon: Film, color: 'text-purple-400', activeBg: 'bg-purple-500/10 border-purple-500/20' },
    { label: 'Upload Manager', path: '/uploads', icon: UploadCloud, color: 'text-violet-400', activeBg: 'bg-violet-500/10 border-violet-500/20', badge: 'Active' },
    { label: 'Trash', path: '/trash', icon: Trash2, color: 'text-rose-400', activeBg: 'bg-rose-500/10 border-rose-500/20' },
    { label: 'Settings', path: '/settings', icon: Settings, color: 'text-slate-400', activeBg: 'bg-white/10 border-white/20' },
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

          {/* Navigation list */}
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
                    `group flex items-center justify-between px-3.5 py-2.5 text-xs font-medium rounded-xl transition-all duration-150 border ${
                      isActive
                        ? `${item.activeBg} text-white font-semibold shadow-xs`
                        : 'border-transparent text-gray-400 hover:text-white hover:bg-white/[0.04]'
                    }`
                  }
                >
                  {({ isActive }) => (
                    <>
                      <div className="flex items-center gap-3">
                        <Icon
                          className={`w-4 h-4 transition-colors shrink-0 ${
                            isActive ? item.color : `text-gray-400 group-hover:${item.color}`
                          }`}
                        />
                        <span>{item.label}</span>
                      </div>
                      {item.badge && (
                        <span className="px-2 py-0.5 text-[9px] font-mono font-bold uppercase rounded-full bg-violet-500/20 text-violet-300 border border-violet-500/30">
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

        {/* Footer: User Profile & Storage Bar */}
        <div className="border-t border-white/[0.06] bg-[#07070A]">
          {/* User Profile Card */}
          {user && (
            <Link
              to="/settings"
              onClick={onClose}
              className="flex items-center gap-3 px-4 py-3 hover:bg-white/[0.04] transition-colors border-b border-white/[0.04] group cursor-pointer"
              title="Manage Account Profile & Settings"
            >
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-purple-600 to-indigo-500 text-white flex items-center justify-center text-xs font-bold border border-white/20 overflow-hidden shrink-0 shadow-sm">
                {getAvatarUrl(user.avatar) ? (
                  <img
                    src={getAvatarUrl(user.avatar)!}
                    alt={user.name || 'User'}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  user.name?.charAt(0)?.toUpperCase() || 'U'
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold text-white truncate group-hover:text-cyan-400 transition-colors">
                  {user.name || 'Cloudora User'}
                </p>
                <p className="text-[10px] text-gray-400 font-mono truncate">{user.email}</p>
              </div>
            </Link>
          )}

          {/* Storage Quota Bar (Live Reactive Telemetry) */}
          <Link
            to="/settings"
            onClick={onClose}
            className="p-4 space-y-2.5 hover:bg-white/[0.02] transition-colors block group cursor-pointer"
            title="Click to view detailed storage telemetry in Settings"
          >
            <div className="flex items-center justify-between text-xs">
              <span className="text-gray-400 font-medium flex items-center gap-1.5 group-hover:text-white transition-colors">
                <HardDrive className="w-3.5 h-3.5 text-gray-300" />
                Storage
              </span>
              <span className="text-gray-300 font-mono text-[11px]">
                {formatFileSize(totalUsed)} of {formatFileSize(totalLimit)}
              </span>
            </div>

            <div className="w-full bg-white/10 h-1.5 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${barColor}`}
                style={{ width: `${Math.max(percentage, totalUsed > 0 ? 1 : 0)}%` }}
              />
            </div>

            <div className="pt-0.5 flex items-center justify-between text-[11px]">
              <span className="text-gray-500 font-mono">{percentage}% allocated</span>
              <span className="text-gray-400 font-mono text-[10px] font-bold">
                {formatFileSize(totalLimit)} TIER
              </span>
            </div>
          </Link>
        </div>
      </aside>
    </>
  );
};
