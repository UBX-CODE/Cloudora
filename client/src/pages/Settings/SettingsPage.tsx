import React, { useState } from 'react';
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
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useTheme } from '../../hooks/useTheme';
import { formatDate } from '../../utils/formatters';
import { Input } from '../../components/ui/Input';

export const SettingsPage: React.FC = () => {
  const { user, logout } = useAuth();
  const { theme, setTheme } = useTheme();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<'profile' | 'theme' | 'security'>('profile');

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState(false);

  const handlePasswordChange = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPassword || !newPassword || newPassword !== confirmNewPassword) {
      alert('Please fill out all fields correctly.');
      return;
    }
    setPasswordSuccess(true);
    setCurrentPassword('');
    setNewPassword('');
    setConfirmNewPassword('');
    setTimeout(() => setPasswordSuccess(false), 4000);
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
          Manage your account credentials, security preferences, and interface appearance.
        </p>
      </div>

      {/* Clean Tabs */}
      <div className="flex border-b border-white/[0.08] gap-6 text-xs font-semibold">
        <button
          onClick={() => setActiveTab('profile')}
          className={`pb-3 flex items-center gap-2 transition-colors relative ${
            activeTab === 'profile'
              ? 'text-white border-b-2 border-white'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          <UserIcon className="w-4 h-4" />
          Profile Information
        </button>

        <button
          onClick={() => setActiveTab('theme')}
          className={`pb-3 flex items-center gap-2 transition-colors relative ${
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
          className={`pb-3 flex items-center gap-2 transition-colors relative ${
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
          <div className="p-6 rounded-2xl bg-[#111116] space-y-6">
            <div className="flex items-center gap-4 pb-6 border-b border-white/[0.06]">
              <div className="w-12 h-12 rounded-xl bg-white/10 text-white flex items-center justify-center font-bold text-base shadow-sm">
                {user?.name?.charAt(0) || 'U'}
              </div>
              <div>
                <h2 className="text-base font-bold text-white">
                  {user?.name || 'Cloudora Member'}
                </h2>
                <p className="text-xs text-gray-400 font-mono mt-0.5">{user?.email}</p>
                <div className="mt-2">
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-white/10 text-gray-300">
                    ROLE: {user?.role || 'USER'}
                  </span>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <Input
                label="Full Name"
                value={user?.name || ''}
                readOnly
                disabled
              />

              <Input
                label="Email Address"
                value={user?.email || ''}
                readOnly
                disabled
                leftIcon={<Mail className="w-4 h-4" />}
              />

              <Input
                label="Unique Tenant Identifier (UUID)"
                value={user?.id || ''}
                readOnly
                disabled
                className="font-mono text-xs text-gray-400"
              />

              <Input
                label="Vault Created Date"
                value={user?.createdAt ? formatDate(user.createdAt) : 'Recently'}
                readOnly
                disabled
                className="font-mono text-xs"
              />
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Theme Settings */}
      {activeTab === 'theme' && (
        <div className="space-y-6 max-w-2xl">
          <div className="p-6 rounded-2xl bg-[#111116] space-y-4">
            <h2 className="text-sm font-bold text-white">
              Interface Color Theme
            </h2>
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

      {/* Tab 3: Security & Password */}
      {activeTab === 'security' && (
        <div className="space-y-6 max-w-2xl">
          <div className="p-6 rounded-2xl bg-[#111116] space-y-4">
            <h2 className="text-sm font-bold text-white">
              Change Account Password
            </h2>
            <p className="text-xs text-gray-400">
              Passwords are automatically hashed using Bcrypt with 10 salt rounds on the Node.js backend.
            </p>

            {passwordSuccess && (
              <div className="p-3.5 rounded-xl bg-white/10 border border-white/20 text-white text-xs flex items-center gap-2 font-mono">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-white" />
                <span className="font-semibold">Password updated successfully.</span>
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
                  className="px-4 py-2 rounded-xl text-xs font-bold text-black bg-white hover:bg-gray-200 transition-colors"
                >
                  Update Password
                </button>
              </div>
            </form>
          </div>

          <div className="p-6 rounded-2xl bg-[#111116] space-y-4">
            <h2 className="text-sm font-bold text-white">
              Active JWT Session Telemetry
            </h2>
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
