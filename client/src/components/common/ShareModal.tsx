import React, { useState } from 'react';
import {
  Share2,
  Copy,
  Check,
  Lock,
  Globe,
  Clock,
  Trash2,
  UserPlus,
  Loader2,
  AlertCircle,
  Shield,
  Eye,
  CheckCircle2,
} from 'lucide-react';
import { Modal } from '../ui/Modal';
import { FileItem, FolderItem } from '../../types/storage.types';
import { createShare, ShareItem, revokeShare } from '../../services/share.service';
import { FileTypeIcon } from './FileTypeIcon';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  target: FileItem | FolderItem | null;
  targetType: 'file' | 'folder';
  onShareCreated?: () => void;
}

export const ShareModal: React.FC<ShareModalProps> = ({
  isOpen,
  onClose,
  target,
  targetType,
  onShareCreated,
}) => {
  const [activeTab, setActiveTab] = useState<'public' | 'collaborator'>('public');

  // Public link configuration state
  const [role, setRole] = useState<'VIEW' | 'EDIT'>('VIEW');
  const [enablePassword, setEnablePassword] = useState(false);
  const [password, setPassword] = useState('');
  const [expiresInDays, setExpiresInDays] = useState<number | undefined>(undefined);

  // Collaborator email state
  const [collaboratorEmail, setCollaboratorEmail] = useState('');
  const [collaboratorRole, setCollaboratorRole] = useState<'VIEW' | 'EDIT'>('VIEW');

  // Action status state
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [generatedShare, setGeneratedShare] = useState<ShareItem | null>(null);
  const [copied, setCopied] = useState(false);

  if (!isOpen || !target) return null;

  const handleCreatePublicLink = async () => {
    try {
      setIsLoading(true);
      setError(null);
      setSuccessMessage(null);

      const payload = {
        fileId: targetType === 'file' ? target.id : undefined,
        folderId: targetType === 'folder' ? target.id : undefined,
        role,
        password: enablePassword && password.trim() ? password.trim() : undefined,
        expiresInDays,
      };

      const result = await createShare(payload);
      setGeneratedShare(result);
      setSuccessMessage('Share link generated successfully!');
      onShareCreated?.();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create share link.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleShareWithCollaborator = async () => {
    if (!collaboratorEmail.trim()) {
      setError('Please enter a collaborator email.');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      setSuccessMessage(null);

      const payload = {
        fileId: targetType === 'file' ? target.id : undefined,
        folderId: targetType === 'folder' ? target.id : undefined,
        sharedWithEmail: collaboratorEmail.trim().toLowerCase(),
        role: collaboratorRole,
      };

      await createShare(payload);
      setSuccessMessage(`Asset shared successfully with ${collaboratorEmail}!`);
      setCollaboratorEmail('');
      onShareCreated?.();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to share with user.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyLink = () => {
    if (!generatedShare) return;
    navigator.clipboard.writeText(generatedShare.shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleRevoke = async () => {
    if (!generatedShare) return;
    try {
      setIsLoading(true);
      setError(null);
      await revokeShare(generatedShare.id);
      setGeneratedShare(null);
      setSuccessMessage('Share link has been revoked.');
      onShareCreated?.();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to revoke link.');
    } finally {
      setIsLoading(false);
    }
  };

  const itemName = target.name;
  const isFile = targetType === 'file';

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Share Asset" maxWidth="lg">
      <div className="space-y-5 text-gray-200">
        {/* Asset Header Banner */}
        <div className="p-3.5 rounded-xl bg-white/[0.03] border border-white/[0.08] flex items-center justify-between">
          <div className="flex items-center gap-3 min-w-0">
            {isFile ? (
              <FileTypeIcon category={(target as FileItem).category || 'other'} />
            ) : (
              <div className="w-9 h-9 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                <Share2 className="w-4 h-4" />
              </div>
            )}
            <div className="min-w-0">
              <h4 className="text-sm font-semibold text-white truncate">{itemName}</h4>
              <p className="text-[11px] text-gray-400 font-mono capitalize">
                {targetType} • {isFile ? 'Direct file asset' : 'Directory asset'}
              </p>
            </div>
          </div>
          <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded-full bg-white/[0.06] text-gray-400">
            End-to-End
          </span>
        </div>

        {/* Tab Selection */}
        <div className="flex rounded-lg bg-black/40 p-1 border border-white/[0.06]">
          <button
            type="button"
            onClick={() => {
              setActiveTab('public');
              setError(null);
              setSuccessMessage(null);
            }}
            className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'public'
                ? 'bg-white text-black font-semibold shadow-sm'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <Globe className="w-3.5 h-3.5" />
            Public Link
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveTab('collaborator');
              setError(null);
              setSuccessMessage(null);
            }}
            className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'collaborator'
                ? 'bg-white text-black font-semibold shadow-sm'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <UserPlus className="w-3.5 h-3.5" />
            Invite Collaborator
          </button>
        </div>

        {/* Alerts */}
        {error && (
          <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center gap-2.5 text-xs text-red-400">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}
        {successMessage && (
          <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center gap-2.5 text-xs text-emerald-400">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{successMessage}</span>
          </div>
        )}

        {/* TAB 1: Public Link */}
        {activeTab === 'public' && (
          <div className="space-y-4">
            {generatedShare ? (
              /* Generated Link State */
              <div className="space-y-4 p-4 rounded-xl bg-white/[0.02] border border-white/[0.08]">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-400 flex items-center gap-1.5">
                    <Globe className="w-3.5 h-3.5 text-emerald-400" />
                    Public Link Active
                  </span>
                  <span className="text-[11px] font-mono text-gray-500">
                    {generatedShare.viewsCount} {generatedShare.viewsCount === 1 ? 'view' : 'views'}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value={generatedShare.shareUrl}
                    className="flex-1 bg-black/50 border border-white/[0.1] rounded-lg px-3 py-2 text-xs font-mono text-gray-200 select-all focus:outline-none focus:border-white/30"
                  />
                  <button
                    type="button"
                    onClick={handleCopyLink}
                    className="px-3.5 py-2 rounded-lg bg-white text-black font-semibold text-xs hover:bg-gray-200 transition-colors flex items-center gap-1.5 shrink-0"
                  >
                    {copied ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                        Copied!
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        Copy
                      </>
                    )}
                  </button>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-white/[0.06] text-xs">
                  <div className="flex items-center gap-2 text-gray-400 text-[11px]">
                    {generatedShare.isPasswordProtected && (
                      <span className="flex items-center gap-1 text-amber-400">
                        <Lock className="w-3 h-3" /> Password Protected
                      </span>
                    )}
                    {generatedShare.expiresAt && (
                      <span className="flex items-center gap-1 text-gray-400">
                        <Clock className="w-3 h-3" /> Expires{' '}
                        {new Date(generatedShare.expiresAt).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={handleRevoke}
                    disabled={isLoading}
                    className="text-[11px] text-red-400 hover:text-red-300 font-medium flex items-center gap-1 transition-colors"
                  >
                    <Trash2 className="w-3 h-3" /> Revoke Link
                  </button>
                </div>
              </div>
            ) : (
              /* Link Configuration Form */
              <div className="space-y-4">
                {/* Permissions Setting */}
                <div>
                  <label className="block text-xs font-medium text-gray-300 mb-1.5">
                    Access Permission
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setRole('VIEW')}
                      className={`p-2.5 rounded-lg border text-left text-xs transition-all ${
                        role === 'VIEW'
                          ? 'border-white/40 bg-white/[0.06] text-white font-medium'
                          : 'border-white/[0.06] bg-black/20 text-gray-400 hover:border-white/20'
                      }`}
                    >
                      <div className="flex items-center gap-1.5 mb-0.5">
                        <Eye className="w-3.5 h-3.5" />
                        <span>Can View</span>
                      </div>
                      <p className="text-[10px] text-gray-500">Preview & download only</p>
                    </button>
                    <button
                      type="button"
                      onClick={() => setRole('EDIT')}
                      className={`p-2.5 rounded-lg border text-left text-xs transition-all ${
                        role === 'EDIT'
                          ? 'border-white/40 bg-white/[0.06] text-white font-medium'
                          : 'border-white/[0.06] bg-black/20 text-gray-400 hover:border-white/20'
                      }`}
                    >
                      <div className="flex items-center gap-1.5 mb-0.5">
                        <Share2 className="w-3.5 h-3.5" />
                        <span>Can Edit</span>
                      </div>
                      <p className="text-[10px] text-gray-500">Collaborator rights</p>
                    </button>
                  </div>
                </div>

                {/* Expiration Options */}
                <div>
                  <label className="block text-xs font-medium text-gray-300 mb-1.5 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-gray-400" />
                    Link Expiration
                  </label>
                  <select
                    value={expiresInDays || ''}
                    onChange={(e) =>
                      setExpiresInDays(e.target.value ? Number(e.target.value) : undefined)
                    }
                    className="w-full bg-[#121217] border border-white/[0.1] rounded-lg px-3 py-2 text-xs text-gray-200 focus:outline-none focus:border-white/30"
                  >
                    <option value="">Never expires</option>
                    <option value="1">Expires in 24 hours</option>
                    <option value="7">Expires in 7 days</option>
                    <option value="30">Expires in 30 days</option>
                  </select>
                </div>

                {/* Password Protection */}
                <div className="pt-2 border-t border-white/[0.06] space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-medium text-gray-300 flex items-center gap-1.5 cursor-pointer">
                      <Lock className="w-3.5 h-3.5 text-gray-400" />
                      Require Password
                    </label>
                    <input
                      type="checkbox"
                      checked={enablePassword}
                      onChange={(e) => setEnablePassword(e.target.checked)}
                      className="w-4 h-4 rounded bg-[#121217] border-white/20 text-white focus:ring-0 focus:ring-offset-0 cursor-pointer"
                    />
                  </div>
                  {enablePassword && (
                    <input
                      type="password"
                      placeholder="Set access password (min 4 characters)..."
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full bg-[#121217] border border-white/[0.1] rounded-lg px-3 py-2 text-xs text-gray-200 placeholder-gray-500 focus:outline-none focus:border-white/30"
                    />
                  )}
                </div>

                {/* Generate Button */}
                <button
                  type="button"
                  onClick={handleCreatePublicLink}
                  disabled={isLoading}
                  className="w-full py-2.5 rounded-lg bg-white text-black font-semibold text-xs hover:bg-gray-200 transition-colors flex items-center justify-center gap-2 mt-2"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      Generating Share Link...
                    </>
                  ) : (
                    <>
                      <Globe className="w-3.5 h-3.5" />
                      Generate Public Link
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: Invite Collaborator */}
        {activeTab === 'collaborator' && (
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-gray-300 mb-1.5">
                Collaborator Email Address
              </label>
              <input
                type="email"
                placeholder="colleague@example.com"
                value={collaboratorEmail}
                onChange={(e) => setCollaboratorEmail(e.target.value)}
                className="w-full bg-[#121217] border border-white/[0.1] rounded-lg px-3 py-2 text-xs text-gray-200 placeholder-gray-500 focus:outline-none focus:border-white/30"
              />
              <p className="text-[10px] text-gray-500 mt-1">
                The collaborator will receive direct access in their "Shared With Me" tab.
              </p>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-300 mb-1.5">
                Collaborator Role
              </label>
              <select
                value={collaboratorRole}
                onChange={(e) => setCollaboratorRole(e.target.value as 'VIEW' | 'EDIT')}
                className="w-full bg-[#121217] border border-white/[0.1] rounded-lg px-3 py-2 text-xs text-gray-200 focus:outline-none focus:border-white/30"
              >
                <option value="VIEW">Viewer (Read-only)</option>
                <option value="EDIT">Editor (Can edit & organize)</option>
              </select>
            </div>

            <button
              type="button"
              onClick={handleShareWithCollaborator}
              disabled={isLoading || !collaboratorEmail.trim()}
              className="w-full py-2.5 rounded-lg bg-white text-black font-semibold text-xs hover:bg-gray-200 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  Granting Access...
                </>
              ) : (
                <>
                  <UserPlus className="w-3.5 h-3.5" />
                  Share with Collaborator
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </Modal>
  );
};
