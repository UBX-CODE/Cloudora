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
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useTheme } from '../../hooks/useTheme';
import { formatDate, formatFileSize } from '../../utils/formatters';
import { Input } from '../../components/ui/Input';
import { authService } from '../../services/auth.service';
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
        <p className="text-xs text-gray-400 mt-1 font-sans">
          Manage your account credentials, storage quota telemetry, and system preferences.
        </p>
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
          Profile Information
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
          Storage & Quota Telemetry
        </button>

        <button
          onClick={() => setActiveTab('theme')}
          className={`pb-3 flex items-center gap-2 transition-colors relative whitespace-nowrap ${
            activeTab === 'theme'
              ? 'text-white border-b-2 border-white'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          <Palette className="w-4 h-4" />
          Appearance & Theme
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
          Security & Access
        </button>
      </div>

      {/* Tab 1: Profile Information */}
      {activeTab === 'profile' && (
        <div className="space-y-6 max-w-2xl">
          <div className="p-6 rounded-2xl bg-[#111116] space-y-6 border border-white/5">
            <div className="flex items-center gap-4 pb-6 border-b border-white/[0.06]">
              <div className="w-12 h-12 rounded-xl bg-white/10 text-white flex items-center justify-center font-bold text-base shadow-sm">
                {user?.name?.charAt(0) || 'U'}
              </div>
              <div>
                <h2 className="text-base font-bold text-white">
                  {user?.name || 'Cloudora Member'}
                </h2>
                <p className="text-xs text-gray-400 font-mono mt-0.5">{user?.email}</p>
                <div className="mt-2 flex items-center gap-2">
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-white/10 text-gray-300">
                    ROLE: {user?.role || 'USER'}
                  </span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                    5 GB FREE TIER
                  </span>
                </div>
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
                leftIcon={<Mail className="w-4 h-4" />}
                className="opacity-70 cursor-not-allowed"
              />

              <Input
                label="Tenant Identifier (UUID)"
                value={user?.id || ''}
                readOnly
                disabled
                className="font-mono text-xs text-gray-400 opacity-70 cursor-not-allowed"
              />

              <Input
                label="Account Registered Date"
                value={user?.createdAt ? formatDate(user.createdAt) : 'Recently'}
                readOnly
                disabled
                className="font-mono text-xs opacity-70 cursor-not-allowed"
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
                      bytes: storageSummary.breakdown.documents,
                    },
                    {
                      label: 'Images & Thumbnails',
                      icon: <ImageIcon className="w-4 h-4 text-emerald-400" />,
                      bytes: storageSummary.breakdown.images,
                    },
                    {
                      label: 'Videos (MP4 / WebM)',
                      icon: <Film className="w-4 h-4 text-purple-400" />,
                      bytes: storageSummary.breakdown.videos,
                    },
                    {
                      label: 'Audio (MP3 / FLAC)',
                      icon: <Music className="w-4 h-4 text-amber-400" />,
                      bytes: storageSummary.breakdown.audio,
                    },
                    {
                      label: 'Archives & Other',
                      icon: <Archive className="w-4 h-4 text-gray-400" />,
                      bytes: storageSummary.breakdown.archives + storageSummary.breakdown.other,
                    },
                  ].map((cat) => {
                    const pct = storageSummary.totalUsedBytes > 0
                      ? ((cat.bytes / storageSummary.totalUsedBytes) * 100).toFixed(1)
                      : '0.0';

                    return (
                      <div key={cat.label} className="p-3 rounded-xl bg-white/[0.02] border border-white/5 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-lg bg-white/5">{cat.icon}</div>
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

              {/* System Architecture Guardrails */}
              <div className="p-5 rounded-2xl bg-[#111116] border border-white/5 space-y-3">
                <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-gray-400 flex items-center gap-2">
                  <Database className="w-3.5 h-3.5" />
                  Distributed Engine Architecture
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-mono text-gray-400">
                  <div className="p-2.5 rounded-lg bg-white/[0.02] border border-white/5">
                    • MinIO S3 Object Storage Active
                  </div>
                  <div className="p-2.5 rounded-lg bg-white/[0.02] border border-white/5">
                    • Redis Cache-Aside & Quota Engine (TTL: 60s)
                  </div>
                  <div className="p-2.5 rounded-lg bg-white/[0.02] border border-white/5">
                    • BullMQ Asynchronous WebP Workers
                  </div>
                  <div className="p-2.5 rounded-lg bg-white/[0.02] border border-white/5">
                    • Multipart Threshold: 16 MiB / Chunk: 8 MiB
                  </div>
                </div>
              </div>
            </>
          ) : null}
        </div>
      )}

      {/* Tab 3: Theme Settings */}
      {activeTab === 'theme' && (
        <div className="space-y-6 max-w-2xl">
          <div className="p-6 rounded-2xl bg-[#111116] space-y-4 border border-white/5">
            <h2 className="text-sm font-bold text-white">Interface Color Theme</h2>
            <p className="text-xs text-gray-400">
              Select your preferred appearance mode for the dashboard and vault tools.
            </p>

            <div className="grid grid-cols-2 gap-4 pt-2">
              <button
                onClick={() => setTheme('dark')}
                className={`p-4 rounded-xl border text-left transition-all ${
                  theme === 'dark'
                    ? 'border-white bg-white/10 ring-1 ring-white'
                    : 'border-white/10 hover:border-white/20 bg-[#0E0E14]'
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <Moon className="w-5 h-5 text-white" />
                  {theme === 'dark' && <CheckCircle2 className="w-4 h-4 text-white" />}
                </div>
                <h4 className="text-xs font-bold text-white">Obsidian Dark</h4>
                <p className="text-[11px] text-gray-400 mt-1">Deep clean monochrome slate</p>
              </button>

              <button
                onClick={() => setTheme('light')}
                className={`p-4 rounded-xl border text-left transition-all ${
                  theme === 'light'
                    ? 'border-white bg-white/10 ring-1 ring-white'
                    : 'border-white/10 hover:border-white/20 bg-[#0E0E14]'
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <Sun className="w-5 h-5 text-white" />
                  {theme === 'light' && <CheckCircle2 className="w-4 h-4 text-white" />}
                </div>
                <h4 className="text-xs font-bold text-white">Studio Daylight</h4>
                <p className="text-[11px] text-gray-400 mt-1">Light interface mode</p>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tab 4: Security & Password */}
      {activeTab === 'security' && (
        <div className="space-y-6 max-w-2xl">
          <div className="p-6 rounded-2xl bg-[#111116] space-y-4 border border-white/5">
            <h2 className="text-sm font-bold text-white">Change Account Password</h2>
            <p className="text-xs text-gray-400">
              Passwords are automatically hashed using Bcrypt with 10 salt rounds on the Node.js backend.
            </p>

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
                leftIcon={<Lock className="w-4 h-4" />}
                required
              />

              <Input
                label="New Password"
                isPassword
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="At least 8 characters"
                leftIcon={<Lock className="w-4 h-4" />}
                required
              />

              <Input
                label="Confirm New Password"
                isPassword
                value={confirmNewPassword}
                onChange={(e) => setConfirmNewPassword(e.target.value)}
                placeholder="Re-enter new password"
                leftIcon={<Lock className="w-4 h-4" />}
                required
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

          <div className="p-6 rounded-2xl bg-[#111116] space-y-4 border border-white/5">
            <h2 className="text-sm font-bold text-white">Active JWT Session Telemetry</h2>
            <div className="p-3.5 rounded-xl bg-[#0E0E14] border border-white/10 text-xs space-y-1 font-mono text-gray-400">
              <p className="text-gray-300">Header: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...</p>
              <p>Algorithm: HMAC SHA-256 (Signed with JWT_SECRET)</p>
              <p>User Context: {user?.email} [{user?.role}]</p>
            </div>

            <div className="pt-2">
              <button
                onClick={handleLogout}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-white hover:bg-white/10 bg-white/5 border border-white/15 transition-colors flex items-center gap-2"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Sign Out of All Sessions</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
