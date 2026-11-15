import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  User as UserIcon,
  Shield,
  Palette,
  LogOut,
  CheckCircle2,
  Lock,
  Mail,
  Sun,
  Moon,
  HardDrive,
  FileText,
  Image as ImageIcon,
  Film,
  Music,
  Archive,
  Loader2,
  AlertCircle,
  Database,
  Cpu,
  RefreshCw,
  Camera,
  Upload,
  Trash2,
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useTheme } from '../../hooks/useTheme';
import { formatDate, formatFileSize } from '../../utils/formatters';
import { Input } from '../../components/ui/Input';
import { authService, getAvatarUrl } from '../../services/auth.service';
import { fetchStorageSummary, StorageSummaryResponse } from '../../services/file.service';

export const SettingsPage: React.FC = () => {
  const { user, logout, refreshProfile } = useAuth();
  const { theme, setTheme } = useTheme();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<'profile' | 'storage' | 'theme' | 'security'>('profile');

  // Profile Edit State
  const [name, setName] = useState(user?.name || '');
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileMessage, setProfileMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const avatarInputRef = React.useRef<HTMLInputElement>(null);
  const avatarUrl = getAvatarUrl(user?.avatar);

  // Password Change State
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Storage Telemetry State
  const [storageSummary, setStorageSummary] = useState<StorageSummaryResponse | null>(null);
  const [storageLoading, setStorageLoading] = useState(false);

  useEffect(() => {
    if (user?.name) {
      setName(user.name);
    }
  }, [user?.name]);

  useEffect(() => {
    if (activeTab === 'storage') {
      loadStorageData();
    }
  }, [activeTab]);

  const loadStorageData = async () => {
    setStorageLoading(true);
    try {
      const data = await fetchStorageSummary();
      setStorageSummary(data);
    } catch (err: any) {
      console.error('Failed to load storage telemetry:', err);
    } finally {
      setStorageLoading(false);
    }
  };

  const handleProfileSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setProfileSaving(true);
    setProfileMessage(null);
    try {
      await authService.updateProfile(name.trim());
      await refreshProfile();
      setProfileMessage({ type: 'success', text: 'Display name updated successfully.' });
      setTimeout(() => setProfileMessage(null), 4000);
    } catch (err: any) {
      setProfileMessage({
        type: 'error',
        text: err.response?.data?.message || 'Failed to update profile.',
      });
    } finally {
      setProfileSaving(false);
    }
  };

  const handleAvatarFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setProfileMessage({ type: 'error', text: 'Please select an image file (PNG, JPG, WebP).' });
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setProfileMessage({ type: 'error', text: 'Image file size must be less than 5 MB.' });
      return;
    }

    try {
      setAvatarUploading(true);
      setProfileMessage(null);

      const reader = new FileReader();
      reader.onload = async () => {
        try {
          const base64 = reader.result as string;
          await authService.updateProfile({ avatar: base64 });
          await refreshProfile();
          setProfileMessage({ type: 'success', text: 'Avatar icon image updated successfully!' });
        } catch (err: any) {
          setProfileMessage({
            type: 'error',
            text: err.response?.data?.message || 'Failed to upload avatar image.',
          });
        } finally {
          setAvatarUploading(false);
        }
      };
      reader.readAsDataURL(file);
    } catch (err: any) {
      setProfileMessage({
        type: 'error',
        text: err.response?.data?.message || 'Failed to process avatar file.',
      });
      setAvatarUploading(false);
    } finally {
      if (avatarInputRef.current) avatarInputRef.current.value = '';
    }
  };

  const handleRemoveAvatar = async () => {
    try {
      setAvatarUploading(true);
      setProfileMessage(null);
      await authService.updateProfile({ avatar: null });
      await refreshProfile();
      setProfileMessage({ type: 'success', text: 'Custom avatar removed.' });
    } catch (err: any) {
      setProfileMessage({
        type: 'error',
        text: err.response?.data?.message || 'Failed to remove avatar.',
      });
    } finally {
      setAvatarUploading(false);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordMessage(null);

    if (!currentPassword) {
      setPasswordMessage({ type: 'error', text: 'Current password is required.' });
      return;
    }

    if (newPassword.length < 8) {
      setPasswordMessage({ type: 'error', text: 'New password must be at least 8 characters long.' });
      return;
    }

    if (newPassword !== confirmNewPassword) {
      setPasswordMessage({ type: 'error', text: 'New passwords do not match.' });
      return;
    }

    setPasswordSaving(true);
    try {
      const msg = await authService.changePassword(currentPassword, newPassword);
      setPasswordMessage({ type: 'success', text: msg });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmNewPassword('');
      setTimeout(() => setPasswordMessage(null), 4000);
    } catch (err: any) {
      setPasswordMessage({
        type: 'error',
        text: err.response?.data?.message || 'Failed to change password.',
      });
    } finally {
      setPasswordSaving(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      <div className="pb-4 border-b border-white/[0.08]">
        <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
          Settings & Preferences
        </h1>
        
      </div>

      {/* Tabs */}
      <div className="flex border-b border-white/[0.08] gap-6 text-xs font-semibold overflow-x-auto">
        <button
          onClick={() => setActiveTab('profile')}
          className={`pb-3 flex items-center gap-2 transition-colors relative whitespace-nowrap ${
            activeTab === 'profile'
              ? 'text-white border-b-2 border-white'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          <UserIcon className="w-4 h-4" />
          Profile
        </button>

        <button
          onClick={() => setActiveTab('storage')}
          className={`pb-3 flex items-center gap-2 transition-colors relative whitespace-nowrap ${
            activeTab === 'storage'
              ? 'text-white border-b-2 border-white'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          <HardDrive className="w-4 h-4" />
          Storage
        </button>
        
        <button
          onClick={() => setActiveTab('security')}
          className={`pb-3 flex items-center gap-2 transition-colors relative whitespace-nowrap ${
            activeTab === 'security'
              ? 'text-white border-b-2 border-white'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          <Shield className="w-4 h-4" />
          Security
        </button>
      </div>

      {/* Tab 1: Profile Information */}
      {activeTab === 'profile' && (
        <div className="space-y-6 max-w-2xl">
          <div className="p-6 rounded-2xl bg-[#111116] space-y-6 border border-white/5">
            {/* Profile Avatar & Details Header */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5 pb-6 border-b border-white/[0.06]">
              <div className="flex items-center gap-4">
                {/* Avatar Preview Box */}
                <div className="relative group shrink-0">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-white/10 to-white/5 border border-white/10 flex items-center justify-center font-bold text-xl text-white shadow-lg overflow-hidden relative">
                    {avatarUrl ? (
                      <img
                        src={avatarUrl}
                        alt={user?.name || 'Avatar'}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-white/80">{user?.name?.charAt(0)?.toUpperCase() || 'U'}</span>
                    )}

                    {avatarUploading && (
                      <div className="absolute inset-0 bg-black/70 flex items-center justify-center">
                        <Loader2 className="w-5 h-5 text-white animate-spin" />
                      </div>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => avatarInputRef.current?.click()}
                    disabled={avatarUploading}
                    className="absolute -bottom-1 -right-1 p-1.5 rounded-lg bg-white text-black hover:bg-gray-200 shadow-md transition-transform hover:scale-110 disabled:opacity-50 cursor-pointer"
                    title="Upload Avatar Image"
                  >
                    <Camera className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div>
                  <h2 className="text-base font-bold text-white">
                    {user?.name || 'Cloudora Member'}
                  </h2>
                  <p className="text-xs text-gray-400 font-mono mt-0.5">{user?.email}</p>
                  <p className="text-[11px] text-gray-500 mt-1 font-mono">
                    {user?.avatar ? 'Custom profile photo active' : 'Default monogram avatar'}
                  </p>
                </div>
              </div>

              {/* Avatar Actions */}
              <div className="flex items-center gap-2">
                <input
                  type="file"
                  ref={avatarInputRef}
                  onChange={handleAvatarFileSelect}
                  accept="image/png,image/jpeg,image/webp,image/gif"
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => avatarInputRef.current?.click()}
                  disabled={avatarUploading}
                  className="px-3.5 py-2 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors disabled:opacity-50 cursor-pointer"
                >
                  <Upload className="w-3.5 h-3.5 text-gray-300" />
                  <span>{avatarUploading ? 'Uploading...' : 'Upload Photo'}</span>
                </button>

                {user?.avatar && (
                  <button
                    type="button"
                    onClick={handleRemoveAvatar}
                    disabled={avatarUploading}
                    className="px-3.5 py-2 rounded-xl border border-red-500/20 bg-red-500/10 hover:bg-red-500/20 text-red-400 text-xs font-semibold flex items-center gap-1.5 transition-colors disabled:opacity-50 cursor-pointer"
                    title="Remove custom photo and reset to initials"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Remove</span>
                  </button>
                )}
              </div>
            </div>

            {profileMessage && (
              <div
                className={`p-3.5 rounded-xl border text-xs flex items-center gap-2 font-mono ${
                  profileMessage.type === 'success'
                    ? 'bg-emerald-950/30 border-emerald-500/30 text-emerald-400'
                    : 'bg-red-950/30 border-red-500/30 text-red-400'
                }`}
              >
                {profileMessage.type === 'success' ? (
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                ) : (
                  <AlertCircle className="w-4 h-4 shrink-0" />
                )}
                <span>{profileMessage.text}</span>
              </div>
            )}

            <form onSubmit={handleProfileSave} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-gray-300 block mb-1.5">
                  Display Name
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your full name"
                  className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-white/10 bg-[#121217] text-white focus:outline-none focus:border-white/30"
                />
              </div>

              <Input
                label="Registered Email Address"
                value={user?.email || ''}
                readOnly
                disabled
                className="opacity-70 cursor-not-allowed"
              />
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={profileSaving || name === user?.name}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-black bg-white hover:bg-gray-200 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {profileSaving ? 'Saving...' : 'Save Profile Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Tab 2: Storage & Quota Telemetry */}
      {activeTab === 'storage' && (
        <div className="space-y-6 max-w-3xl">
          {storageLoading && !storageSummary ? (
            <div className="p-12 rounded-2xl bg-[#111116] border border-white/5 flex flex-col items-center justify-center gap-3 text-gray-400">
              <Loader2 className="w-7 h-7 animate-spin text-white" />
              <span className="text-xs font-mono">Querying Redis storage telemetry cache...</span>
            </div>
          ) : storageSummary ? (
            <>
              {/* Overall Progress Card */}
              <div className="p-6 rounded-2xl bg-[#111116] border border-white/5 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h2 className="text-sm font-bold text-white flex items-center gap-2">
                      <HardDrive className="w-4 h-4 text-gray-300" />
                      Storage Allocation & Usage
                    </h2>
                    <p className="text-xs text-gray-400 font-mono mt-1">
                      {formatFileSize(storageSummary.totalUsedBytes)} used of{' '}
                      {formatFileSize(storageSummary.storageLimitBytes)} ({storageSummary.percentageUsed}%)
                    </p>
                  </div>
                  <button
                    onClick={loadStorageData}
                    className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-colors self-start sm:self-auto"
                    title="Refresh Cache"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${storageLoading ? 'animate-spin' : ''}`} />
                  </button>
                </div>

                {/* Progress bar */}
                <div className="w-full h-3 rounded-full bg-white/10 overflow-hidden">
                  <div
                    className={`h-full transition-all duration-500 ${
                      storageSummary.percentageUsed > 90
                        ? 'bg-red-500'
                        : storageSummary.percentageUsed > 75
                        ? 'bg-amber-400'
                        : 'bg-white'
                    }`}
                    style={{ width: `${Math.max(2, Math.min(100, storageSummary.percentageUsed))}%` }}
                  />
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
                  <div className="p-3 rounded-xl bg-white/[0.03] border border-white/5">
                    <span className="text-[10px] text-gray-500 font-mono uppercase block">Active Files</span>
                    <span className="text-sm font-bold text-white font-mono">{storageSummary.fileCount}</span>
                  </div>
                  <div className="p-3 rounded-xl bg-white/[0.03] border border-white/5">
                    <span className="text-[10px] text-gray-500 font-mono uppercase block">Space Used</span>
                    <span className="text-sm font-bold text-white font-mono">{formatFileSize(storageSummary.totalUsedBytes)}</span>
                  </div>
                  <div className="p-3 rounded-xl bg-white/[0.03] border border-white/5">
                    <span className="text-[10px] text-gray-500 font-mono uppercase block">Space Available</span>
                    <span className="text-sm font-bold text-white font-mono">
                      {formatFileSize(Math.max(0, storageSummary.storageLimitBytes - storageSummary.totalUsedBytes))}
                    </span>
                  </div>
                  <div className="p-3 rounded-xl bg-white/[0.03] border border-white/5">
                    <span className="text-[10px] text-gray-500 font-mono uppercase block">Account Plan</span>
                    <span className="text-sm font-bold text-emerald-400 font-mono">Free Tier (5 GB)</span>
                  </div>
                </div>
              </div>

              {/* Usage Breakdown by Category */}
              <div className="p-6 rounded-2xl bg-[#111116] border border-white/5 space-y-4">
                <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-gray-400">
                  Storage Breakdown by Asset Category
                </h3>

                <div className="space-y-3">
                  {[
                    {
                      label: 'Documents & Code',
                      icon: <FileText className="w-4 h-4 text-blue-400" />,
                      badgeBg: 'bg-blue-500/10 border-blue-500/20',
                      bytes: storageSummary.breakdown.documents,
                    },
                    {
                      label: 'Images & Photos',
                      icon: <ImageIcon className="w-4 h-4 text-fuchsia-400" />,
                      badgeBg: 'bg-fuchsia-500/10 border-fuchsia-500/20',
                      bytes: storageSummary.breakdown.images,
                    },
                    {
                      label: 'Videos (MP4 / WebM)',
                      icon: <Film className="w-4 h-4 text-purple-400" />,
                      badgeBg: 'bg-purple-500/10 border-purple-500/20',
                      bytes: storageSummary.breakdown.videos,
                    },
                    {
                      label: 'Audio (MP3 / FLAC)',
                      icon: <Music className="w-4 h-4 text-pink-400" />,
                      badgeBg: 'bg-pink-500/10 border-pink-500/20',
                      bytes: storageSummary.breakdown.audio,
                    },
                    {
                      label: 'Archives & Other',
                      icon: <Archive className="w-4 h-4 text-amber-400" />,
                      badgeBg: 'bg-amber-500/10 border-amber-500/20',
                      bytes: storageSummary.breakdown.archives + storageSummary.breakdown.other,
                    },
                  ].map((cat) => {
                    const pct = storageSummary.totalUsedBytes > 0
                      ? ((cat.bytes / storageSummary.totalUsedBytes) * 100).toFixed(1)
                      : '0.0';

                    return (
                      <div key={cat.label} className="p-3 rounded-xl bg-white/[0.02] border border-white/5 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-xl border ${cat.badgeBg}`}>{cat.icon}</div>
                          <div>
                            <span className="text-xs font-semibold text-white block">{cat.label}</span>
                            <span className="text-[11px] text-gray-500 font-mono">{pct}% of total used space</span>
                          </div>
                        </div>
                        <span className="text-xs font-mono font-bold text-gray-300">
                          {formatFileSize(cat.bytes)}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              
            </>
          ) : null}
        </div>
      )}

      

      {/* Tab 4: Security & Password */}
      {activeTab === 'security' && (
        <div className="space-y-6 max-w-2xl">
          <div className="p-6 rounded-2xl bg-[#111116] space-y-4 border border-white/5">
            <h2 className="text-sm font-bold text-white">Change Account Password</h2>

            {passwordMessage && (
              <div
                className={`p-3.5 rounded-xl border text-xs flex items-center gap-2 font-mono ${
                  passwordMessage.type === 'success'
                    ? 'bg-emerald-950/30 border-emerald-500/30 text-emerald-400'
                    : 'bg-red-950/30 border-red-500/30 text-red-400'
                }`}
              >
                {passwordMessage.type === 'success' ? (
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                ) : (
                  <AlertCircle className="w-4 h-4 shrink-0" />
                )}
                <span>{passwordMessage.text}</span>
              </div>
            )}

            <form onSubmit={handlePasswordChange} className="space-y-3 pt-1">
              <Input
                label="Current Password"
                isPassword
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="••••••••••••"
              />

              <Input
                label="New Password"
                isPassword
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="At least 8 characters"
              />

              <Input
                label="Confirm New Password"
                isPassword
                value={confirmNewPassword}
                onChange={(e) => setConfirmNewPassword(e.target.value)}
                placeholder="Re-enter new password"
              />

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={passwordSaving}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-black bg-white hover:bg-gray-200 transition-colors disabled:opacity-50"
                >
                  {passwordSaving ? 'Verifying & Updating...' : 'Update Password'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
