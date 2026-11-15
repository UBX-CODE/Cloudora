import React, { useState, useEffect } from 'react';
import {
  Share2,
  Eye,
  Download,
  Loader2,
  Folder,
  Globe,
  Copy,
  Check,
  Trash2,
  Lock,
  Clock,
  ExternalLink,
  Users,
} from 'lucide-react';
import { formatFileSize, formatRelativeTime } from '../../utils/formatters';
import { FileTypeIcon } from '../../components/common/FileTypeIcon';
import { FilePreviewModal } from '../../components/common/FilePreviewModal';
import {
  getSharedWithMe,
  getMyCreatedShares,
  revokeShare,
  ShareItem,
} from '../../services/share.service';
import { downloadFile } from '../../utils/download';
import { FileItem } from '../../types/storage.types';

export const SharedPage: React.FC = () => {
  const [mainTab, setMainTab] = useState<'received' | 'created'>('received');
  const [filter, setFilter] = useState<'all' | 'edit' | 'view'>('all');

  const [sharedWithMe, setSharedWithMe] = useState<ShareItem[]>([]);
  const [myCreatedShares, setMyCreatedShares] = useState<ShareItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Copy feedback tracking
  const [copiedToken, setCopiedToken] = useState<string | null>(null);

  // Preview Modal State
  const [previewFile, setPreviewFile] = useState<FileItem | null>(null);

  const loadData = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const [received, created] = await Promise.all([
        getSharedWithMe().catch(() => []),
        getMyCreatedShares().catch(() => []),
      ]);
      setSharedWithMe(received);
      setMyCreatedShares(created);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load shared assets.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCopyLink = (share: ShareItem) => {
    navigator.clipboard.writeText(share.shareUrl);
    setCopiedToken(share.token);
    setTimeout(() => setCopiedToken(null), 2000);
  };

  const handleRevokeShare = async (shareId: string) => {
    if (!window.confirm('Are you sure you want to revoke this share link? Anyone with this link will immediately lose access.')) {
      return;
    }
    try {
      await revokeShare(shareId);
      setMyCreatedShares((prev) => prev.filter((s) => s.id !== shareId));
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to revoke link.');
    }
  };

  const handleOpenPreview = (item: ShareItem) => {
    if (item.targetType === 'folder' || !item.file) {
      window.open(item.shareUrl, '_blank');
      return;
    }

    const ext = item.file.name.includes('.')
      ? item.file.name.split('.').pop()?.toLowerCase() || ''
      : '';

    const mockFileItem: FileItem = {
      id: item.file.id,
      name: item.file.name,
      extension: ext,
      size: item.file.size,
      category: 'document',
      isStarred: false,
      isShared: true,
      permission: item.role === 'EDIT' ? 'edit' : 'view',
      sharedBy: {
        name: item.owner.name,
        email: item.owner.email,
      },
      updatedAt: item.updatedAt,
    };

    setPreviewFile(mockFileItem);
  };

  const handleDownload = (item: ShareItem) => {
    if (item.targetType === 'file' && item.file) {
      downloadFile(item.file.id, item.file.name);
    } else {
      window.open(item.shareUrl, '_blank');
    }
  };

  const filteredReceived = sharedWithMe.filter((item) => {
    if (filter === 'edit') return item.role === 'EDIT';
    if (filter === 'view') return item.role === 'VIEW';
    return true;
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/[0.08]">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <Share2 className="w-4 h-4" />
            </div>
            Share Management
          </h1>
        </div>

        {/* Tab Switcher: Shared With Me vs My Active Links */}
        <div className="inline-flex p-1 rounded-xl bg-[#111116] border border-white/[0.06] text-xs font-mono">
          <button
            onClick={() => setMainTab('received')}
            className={`px-3.5 py-1.5 rounded-lg transition-all flex items-center gap-1.5 font-medium ${
              mainTab === 'received'
                ? 'bg-white text-black font-bold shadow-sm'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            Shared With Me ({sharedWithMe.length})
          </button>
          <button
            onClick={() => setMainTab('created')}
            className={`px-3.5 py-1.5 rounded-lg transition-all flex items-center gap-1.5 font-medium ${
              mainTab === 'created'
                ? 'bg-white text-black font-bold shadow-sm'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <Globe className="w-3.5 h-3.5" />
            My Active Links ({myCreatedShares.length})
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="py-20 flex flex-col items-center justify-center gap-3">
          <Loader2 className="w-6 h-6 animate-spin text-white" />
          <p className="text-xs font-mono text-gray-500">Retrieving sharing telemetry...</p>
        </div>
      ) : error ? (
        <div className="py-12 text-center text-xs text-red-400">{error}</div>
      ) : mainTab === 'received' ? (
        /* TAB 1: SHARED WITH ME */
        <div className="space-y-4">
          {/* Subfilter Pills */}
          <div className="flex justify-end">
            <div className="inline-flex p-1 rounded-lg bg-[#111116] gap-1 text-[11px] font-mono">
              <button
                onClick={() => setFilter('all')}
                className={`px-2.5 py-1 rounded-md transition-colors ${
                  filter === 'all' ? 'bg-white/10 text-white font-bold' : 'text-gray-400 hover:text-white'
                }`}
              >
                All ({sharedWithMe.length})
              </button>
              <button
                onClick={() => setFilter('edit')}
                className={`px-2.5 py-1 rounded-md transition-colors ${
                  filter === 'edit' ? 'bg-white/10 text-white font-bold' : 'text-gray-400 hover:text-white'
                }`}
              >
                Can Edit
              </button>
              <button
                onClick={() => setFilter('view')}
                className={`px-2.5 py-1 rounded-md transition-colors ${
                  filter === 'view' ? 'bg-white/10 text-white font-bold' : 'text-gray-400 hover:text-white'
                }`}
              >
                View Only
              </button>
            </div>
          </div>

          {filteredReceived.length === 0 ? (
            <div className="py-20 text-center space-y-3">
              <div className="w-14 h-14 rounded-2xl bg-white/[0.03] border border-white/[0.08] flex items-center justify-center mx-auto text-gray-500">
                <Users className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-semibold text-white">No Assets Shared With You</h3>
              <p className="text-xs text-gray-500 max-w-sm mx-auto">
                When teammates invite your email to collaborate on documents or folders, they will show up here.
              </p>
            </div>
          ) : (
            <div className="space-y-0">
              <div className="grid grid-cols-12 text-[11px] font-mono uppercase tracking-wider text-gray-500 pb-3 border-b border-white/[0.08] px-2">
                <div className="col-span-5 sm:col-span-4">Asset Name</div>
                <div className="col-span-3 sm:col-span-3">Shared By</div>
                <div className="hidden sm:block sm:col-span-2">Access</div>
                <div className="col-span-2 sm:col-span-1">Size</div>
                <div className="hidden sm:block sm:col-span-1">Date</div>
                <div className="col-span-2 sm:col-span-1 text-right">Actions</div>
              </div>

              {filteredReceived.map((item) => (
                <div
                  key={item.id}
                  onClick={() => handleOpenPreview(item)}
                  className="grid grid-cols-12 items-center py-3.5 border-b border-white/[0.06] hover:bg-white/[0.03] px-2 transition-colors cursor-pointer group"
                >
                  <div className="col-span-5 sm:col-span-4 font-medium flex items-center gap-3 min-w-0 pr-2">
                    {item.targetType === 'folder' ? (
                      <div className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 shrink-0">
                        <Folder className="w-4 h-4" />
                      </div>
                    ) : (
                      <FileTypeIcon category="document" />
                    )}
                    <span className="text-xs font-medium text-white truncate group-hover:text-gray-300 transition-colors">
                      {item.targetName}
                    </span>
                  </div>

                  <div className="col-span-3 sm:col-span-3">
                    <div className="flex items-center gap-2">
                      <div className="w-5 h-5 rounded-full bg-white/10 flex items-center justify-center text-[9px] font-bold text-gray-300 shrink-0">
                        {item.owner.name.charAt(0).toUpperCase()}
                      </div>
                      <span className="text-xs text-gray-300 truncate">{item.owner.name}</span>
                    </div>
                  </div>

                  <div className="hidden sm:block sm:col-span-2">
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono font-medium uppercase bg-white/[0.05] text-gray-400">
                      {item.role === 'EDIT' ? 'Can Edit' : 'Read Only'}
                    </span>
                  </div>

                  <div className="col-span-2 sm:col-span-1 font-mono text-gray-400 text-xs">
                    {item.file ? formatFileSize(item.file.size) : 'Folder'}
                  </div>

                  <div className="hidden sm:block sm:col-span-1 font-mono text-gray-500 text-xs">
                    {formatRelativeTime(item.createdAt)}
                  </div>

                  <div className="col-span-2 sm:col-span-1 text-right" onClick={(e) => e.stopPropagation()}>
                    <div className="inline-flex items-center gap-1">
                      <button
                        onClick={() => handleOpenPreview(item)}
                        className="p-1.5 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
                        title="Preview / Open"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDownload(item)}
                        className="p-1.5 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
                        title="Download / Visit"
                      >
                        <Download className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        /* TAB 2: MY CREATED ACTIVE SHARE LINKS */
        <div className="space-y-4">
          {myCreatedShares.length === 0 ? (
            <div className="py-20 text-center space-y-3">
              <div className="w-14 h-14 rounded-2xl bg-white/[0.03] border border-white/[0.08] flex items-center justify-center mx-auto text-gray-500">
                <Globe className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-semibold text-white">No Active Share Links</h3>
              <p className="text-xs text-gray-500 max-w-sm mx-auto">
                Select any file or folder from your Files dashboard and click "Share Asset" to generate public links.
              </p>
            </div>
          ) : (
            <div className="space-y-0">
              <div className="grid grid-cols-12 text-[11px] font-mono uppercase tracking-wider text-gray-500 pb-3 border-b border-white/[0.08] px-2">
                <div className="col-span-4 sm:col-span-4">Shared Asset</div>
                <div className="col-span-3 sm:col-span-2">Security / Role</div>
                <div className="hidden sm:block sm:col-span-2">Telemetry</div>
                <div className="hidden sm:block sm:col-span-2">Expiration</div>
                <div className="col-span-5 sm:col-span-2 text-right">Link & Actions</div>
              </div>

              {myCreatedShares.map((share) => (
                <div
                  key={share.id}
                  className="grid grid-cols-12 items-center py-3.5 border-b border-white/[0.06] hover:bg-white/[0.03] px-2 transition-colors"
                >
                  {/* Asset Name & Type */}
                  <div className="col-span-4 sm:col-span-4 flex items-center gap-3 min-w-0 pr-2">
                    {share.targetType === 'folder' ? (
                      <div className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 shrink-0">
                        <Folder className="w-4 h-4" />
                      </div>
                    ) : (
                      <FileTypeIcon category="document" />
                    )}
                    <div className="min-w-0">
                      <div className="text-xs font-medium text-white truncate">{share.targetName}</div>
                      <div className="text-[10px] font-mono text-gray-500 capitalize">
                        {share.sharedWith ? `Shared with ${share.sharedWith.email}` : 'Public Link'}
                      </div>
                    </div>
                  </div>

                  {/* Security / Role */}
                  <div className="col-span-3 sm:col-span-2 flex flex-wrap items-center gap-1.5">
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono font-medium uppercase bg-white/[0.06] text-gray-300">
                      {share.role}
                    </span>
                    {share.isPasswordProtected && (
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center gap-1">
                        <Lock className="w-2.5 h-2.5" />
                        Pass
                      </span>
                    )}
                  </div>

                  {/* Telemetry (Views) */}
                  <div className="hidden sm:block sm:col-span-2 font-mono text-xs text-gray-400">
                    <span className="px-2 py-0.5 rounded bg-white/[0.03] border border-white/[0.06]">
                      {share.viewsCount} {share.viewsCount === 1 ? 'view' : 'views'}
                    </span>
                  </div>

                  {/* Expiration */}
                  <div className="hidden sm:block sm:col-span-2 font-mono text-xs">
                    {share.expiresAt ? (
                      <span
                        className={`flex items-center gap-1 text-[11px] ${
                          share.isExpired ? 'text-red-400' : 'text-gray-400'
                        }`}
                      >
                        <Clock className="w-3 h-3" />
                        {share.isExpired
                          ? 'Expired'
                          : new Date(share.expiresAt).toLocaleDateString()}
                      </span>
                    ) : (
                      <span className="text-gray-500 text-[11px]">Never</span>
                    )}
                  </div>

                  {/* Link Copy & Revoke */}
                  <div className="col-span-5 sm:col-span-2 text-right">
                    <div className="inline-flex items-center gap-1.5">
                      <button
                        onClick={() => handleCopyLink(share)}
                        className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white text-xs font-mono transition-colors flex items-center gap-1"
                        title="Copy Link"
                      >
                        {copiedToken === share.token ? (
                          <>
                            <Check className="w-3 h-3 text-emerald-400" />
                            <span className="text-[10px] text-emerald-400 font-semibold">Copied</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3" />
                            <span className="text-[10px]">Copy</span>
                          </>
                        )}
                      </button>

                      <a
                        href={share.shareUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="p-1.5 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
                        title="Open Public Link"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>

                      <button
                        onClick={() => handleRevokeShare(share.id)}
                        className="p-1.5 rounded-lg hover:bg-red-500/10 text-gray-400 hover:text-red-400 transition-colors"
                        title="Revoke Share Link"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* File Preview Modal */}
      <FilePreviewModal
        isOpen={Boolean(previewFile)}
        onClose={() => setPreviewFile(null)}
        file={previewFile}
      />
    </div>
  );
};
