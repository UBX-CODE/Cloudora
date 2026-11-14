import React, { useState, useEffect } from 'react';
import { Share2, Eye, Download, Loader2, Folder } from 'lucide-react';
import { formatFileSize, formatRelativeTime } from '../../utils/formatters';
import { FileTypeIcon } from '../../components/common/FileTypeIcon';
import { FilePreviewModal } from '../../components/common/FilePreviewModal';
import { getSharedWithMe, ShareItem } from '../../services/share.service';
import { downloadFile } from '../../utils/download';
import { FileItem } from '../../types/storage.types';

export const SharedPage: React.FC = () => {
  const [filter, setFilter] = useState<'all' | 'edit' | 'view'>('all');
  const [sharedItems, setSharedItems] = useState<ShareItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Preview Modal State
  const [previewFile, setPreviewFile] = useState<FileItem | null>(null);

  const loadSharedItems = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const items = await getSharedWithMe();
      setSharedItems(items);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load shared assets.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadSharedItems();
  }, []);

  const filtered = sharedItems.filter((item) => {
    if (filter === 'edit') return item.role === 'EDIT';
    if (filter === 'view') return item.role === 'VIEW';
    return true;
  });

  const handleOpenPreview = (item: ShareItem) => {
    if (item.targetType === 'folder' || !item.file) {
      // If folder, navigate to public view
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

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/[0.08]">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight flex items-center gap-2.5">
            <Share2 className="w-5 h-5 text-gray-300" />
            Shared With Me
          </h1>
          <p className="text-xs text-gray-400 mt-1 font-sans">
            Files and folders shared directly with your account by team members and collaborators.
          </p>
        </div>

        {/* Filter Pills */}
        <div className="inline-flex p-1 rounded-xl bg-[#111116] gap-1 text-xs font-mono">
          <button
            onClick={() => setFilter('all')}
            className={`px-3 py-1.5 rounded-lg transition-colors font-medium ${
              filter === 'all'
                ? 'bg-white text-black font-bold'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            All Shared ({sharedItems.length})
          </button>
          <button
            onClick={() => setFilter('edit')}
            className={`px-3 py-1.5 rounded-lg transition-colors font-medium ${
              filter === 'edit'
                ? 'bg-white text-black font-bold'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Can Edit
          </button>
          <button
            onClick={() => setFilter('view')}
            className={`px-3 py-1.5 rounded-lg transition-colors font-medium ${
              filter === 'view'
                ? 'bg-white text-black font-bold'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            View Only
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="py-20 flex flex-col items-center justify-center gap-3">
          <Loader2 className="w-6 h-6 animate-spin text-white" />
          <p className="text-xs font-mono text-gray-500">Retrieving shared assets...</p>
        </div>
      ) : error ? (
        <div className="py-12 text-center text-xs text-red-400">{error}</div>
      ) : filtered.length === 0 ? (
        <div className="py-20 text-center space-y-3">
          <div className="w-14 h-14 rounded-2xl bg-white/[0.03] border border-white/[0.08] flex items-center justify-center mx-auto text-gray-500">
            <Share2 className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-semibold text-white">No Shared Assets Found</h3>
          <p className="text-xs text-gray-500 max-w-sm mx-auto">
            When teammates share files or directories with your email address, they will appear here.
          </p>
        </div>
      ) : (
        <div className="space-y-0">
          {/* Header Row */}
          <div className="grid grid-cols-12 text-[11px] font-mono uppercase tracking-wider text-gray-500 pb-3 border-b border-white/[0.08] px-2">
            <div className="col-span-5 sm:col-span-4">Asset Name</div>
            <div className="col-span-3 sm:col-span-3">Shared By</div>
            <div className="hidden sm:block sm:col-span-2">Access</div>
            <div className="col-span-2 sm:col-span-1">Size</div>
            <div className="hidden sm:block sm:col-span-1">Date</div>
            <div className="col-span-2 sm:col-span-1 text-right">Actions</div>
          </div>

          {/* Rows */}
          {filtered.map((item) => (
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

      {/* File Preview Modal */}
      <FilePreviewModal
        isOpen={Boolean(previewFile)}
        onClose={() => setPreviewFile(null)}
        file={previewFile}
      />
    </div>
  );
};
