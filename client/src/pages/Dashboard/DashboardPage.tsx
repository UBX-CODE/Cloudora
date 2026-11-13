import React, { useState, useMemo, useEffect } from 'react';
import {
  Star,
  Download,
  Eye,
  Search,
  HardDrive,
  Loader2,
  FolderOpen,
} from 'lucide-react';
import { formatFileSize, formatRelativeTime } from '../../utils/formatters';
import { FileTypeIcon } from '../../components/common/FileTypeIcon';
import { FilePreviewModal } from '../../components/common/FilePreviewModal';
import { FileItem } from '../../types/storage.types';
import {
  fetchFiles,
  fetchStorageSummary,
  toggleStarFile,
  StorageSummaryResponse,
} from '../../services/file.service';
import { downloadFile } from '../../utils/download';

export const DashboardPage: React.FC = () => {
  const [files, setFiles] = useState<FileItem[]>([]);
  const [selectedFile, setSelectedFile] = useState<FileItem | null>(null);
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [storageSummary, setStorageSummary] = useState<StorageSummaryResponse | null>(null);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);

    Promise.all([
      fetchFiles({ isTrashed: false, limit: 100 }),
      fetchStorageSummary().catch(() => null),
    ])
      .then(([filesData, summaryData]) => {
        if (isMounted) {
          setFiles(filesData);
          setStorageSummary(summaryData);
          setLoading(false);
        }
      })
      .catch((err) => {
        console.error('[Dashboard Load Error]:', err);
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const toggleStar = async (fileId: string) => {
    try {
      const updated = await toggleStarFile(fileId);
      setFiles((prev) =>
        prev.map((f) => (f.id === fileId ? { ...f, isStarred: updated.isStarred } : f))
      );
    } catch (err) {
      console.error('Failed to toggle star:', err);
    }
  };

  const filteredFiles = useMemo(() => {
    return files.filter((f) => {
      const matchesCategory =
        activeCategory === 'all' || f.category === activeCategory;
      const matchesSearch = f.name
        .toLowerCase()
        .includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [files, activeCategory, searchQuery]);

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      {/* 1. Storage Quota Metric Card */}
      {storageSummary && (
        <div className="p-5 rounded-2xl bg-[#111116] border border-white/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-white">
              <HardDrive className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Storage Overview</h3>
              <p className="text-xs text-gray-400 font-mono mt-0.5">
                {formatFileSize(storageSummary.totalUsedBytes)} of{' '}
                {formatFileSize(storageSummary.storageLimitBytes)} Used ({storageSummary.percentageUsed}%)
              </p>
            </div>
          </div>

          <div className="w-full sm:w-64 space-y-1.5">
            <div className="w-full h-2 rounded-full bg-white/10 overflow-hidden">
              <div
                className="h-full bg-white transition-all duration-300"
                style={{ width: `${Math.min(100, storageSummary.percentageUsed)}%` }}
              />
            </div>
            <div className="flex justify-between text-[10px] text-gray-500 font-mono">
              <span>{storageSummary.fileCount} Active Files</span>
              <span>Free Tier (5 GB)</span>
            </div>
          </div>
        </div>
      )}

      {/* 2. Filter Tabs & Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pb-3 border-b border-white/[0.08]">
        {/* Category Pills */}
        <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0 text-xs font-mono">
          {[
            { id: 'all', label: 'All Assets' },
            { id: 'document', label: 'Documents' },
            { id: 'image', label: 'Images' },
            { id: 'audio', label: 'Audio' },
            { id: 'video', label: 'Video' },
            { id: 'archive', label: 'Archives' },
          ].map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap ${
                activeCategory === cat.id
                  ? 'bg-white text-black font-bold'
                  : 'text-gray-400 hover:text-white hover:bg-white/[0.04]'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Inline Search */}
        <div className="relative min-w-[200px]">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Quick search..."
            className="w-full text-xs pl-8 pr-3 py-1.5 rounded-lg bg-[#111116] text-white placeholder-gray-500 border border-white/10 focus:outline-none focus:border-white/30"
          />
        </div>
      </div>

      {/* 3. File Stream */}
      <div className="space-y-0">
        {/* Header Row */}
        <div className="grid grid-cols-12 text-[11px] font-mono uppercase tracking-wider text-gray-500 pb-3 border-b border-white/[0.08] px-2">
          <div className="col-span-6 sm:col-span-5 flex items-center gap-4">
            <span className="w-4" />
            <span>Name</span>
          </div>
          <div className="hidden sm:block sm:col-span-2">Type</div>
          <div className="col-span-3 sm:col-span-2">Size</div>
          <div className="hidden sm:block sm:col-span-2">Modified</div>
          <div className="col-span-3 sm:col-span-1 text-right">Actions</div>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-16 text-gray-400 gap-3">
            <Loader2 className="w-7 h-7 animate-spin text-white" />
            <span className="text-xs font-mono">Loading assets...</span>
          </div>
        ) : filteredFiles.length === 0 ? (
          <div className="py-16 text-center text-xs text-gray-500 font-mono">
            [ NO ASSETS FOUND MATCHING CRITERIA ]
          </div>
        ) : (
          filteredFiles.map((file) => (
            <div
              key={file.id}
              onClick={() => setSelectedFile(file)}
              className="grid grid-cols-12 items-center py-3.5 border-b border-white/[0.06] hover:bg-white/[0.03] px-2 transition-colors cursor-pointer group"
            >
              {/* Name & Star */}
              <div className="col-span-6 sm:col-span-5 flex items-center gap-3 min-w-0 pr-2">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleStar(file.id);
                  }}
                  className="text-gray-600 hover:text-white transition-colors shrink-0"
                  title={file.isStarred ? 'Unstar' : 'Star'}
                >
                  <Star
                    className={`w-3.5 h-3.5 ${
                      file.isStarred ? 'fill-white text-white' : ''
                    }`}
                  />
                </button>
                <FileTypeIcon category={file.category} />
                <span className="text-xs font-medium text-white group-hover:text-gray-300 transition-colors truncate">
                  {file.name}
                </span>
              </div>

              {/* Category */}
              <div className="hidden sm:block sm:col-span-2">
                <span className="capitalize text-gray-400 font-mono text-[11px] px-2 py-0.5 rounded bg-white/[0.04]">
                  {file.category}
                </span>
              </div>

              {/* Size */}
              <div className="col-span-3 sm:col-span-2 font-mono text-gray-400 text-xs">
                {formatFileSize(file.size)}
              </div>

              {/* Modified */}
              <div className="hidden sm:block sm:col-span-2 font-mono text-gray-500 text-xs">
                {formatRelativeTime(file.updatedAt)}
              </div>

              {/* Actions */}
              <div
                className="col-span-3 sm:col-span-1 text-right"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="inline-flex items-center gap-1">
                  <button
                    onClick={() => setSelectedFile(file)}
                    className="p-1.5 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
                    title="Preview / Stream"
                  >
                    <Eye className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => downloadFile(file.id, file.name)}
                    className="p-1.5 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
                    title="Download"
                  >
                    <Download className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Live Presigned File Preview Modal */}
      <FilePreviewModal
        file={selectedFile}
        isOpen={!!selectedFile}
        onClose={() => setSelectedFile(null)}
      />
    </div>
  );
};
