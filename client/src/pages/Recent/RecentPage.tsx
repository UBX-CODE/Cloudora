import React, { useState, useEffect, useMemo } from 'react';
import { Clock, Download, Eye, Calendar, Loader2 } from 'lucide-react';
import { formatFileSize, formatRelativeTime } from '../../utils/formatters';
import { FileTypeIcon } from '../../components/common/FileTypeIcon';
import { FilePreviewModal } from '../../components/common/FilePreviewModal';
import { FileItem } from '../../types/storage.types';
import { fetchRecentFiles } from '../../services/file.service';
import { downloadFile } from '../../utils/download';

export const RecentPage: React.FC = () => {
  const [filter, setFilter] = useState<'all' | 'today' | 'week'>('all');
  const [files, setFiles] = useState<FileItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [previewFile, setPreviewFile] = useState<FileItem | null>(null);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);

    fetchRecentFiles(50)
      .then((data) => {
        if (isMounted) {
          setFiles(data);
          setLoading(false);
        }
      })
      .catch((err) => {
        console.error('[Recent Load Error]:', err);
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const filteredFiles = useMemo(() => {
    const now = new Date().getTime();
    const oneDayMs = 24 * 60 * 60 * 1000;
    const sevenDaysMs = 7 * oneDayMs;

    return files.filter((f) => {
      const fileTime = new Date(f.updatedAt).getTime();
      if (filter === 'today') {
        return now - fileTime <= oneDayMs;
      }
      if (filter === 'week') {
        return now - fileTime <= sevenDaysMs;
      }
      return true;
    });
  }, [files, filter]);

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/[0.08]">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight flex items-center gap-2.5">
            <Clock className="w-5 h-5 text-gray-300" />
            Recent Files & Activity
          </h1>
          <p className="text-xs text-gray-400 mt-1 font-sans">
            Documents and assets accessed or synchronized across your devices over the last 30 days.
          </p>
        </div>

        {/* Filter Tabs */}
        <div className="inline-flex p-1 rounded-xl bg-[#111116] gap-1 text-xs font-mono">
          <button
            onClick={() => setFilter('all')}
            className={`px-3 py-1.5 rounded-lg transition-colors font-medium ${
              filter === 'all'
                ? 'bg-white text-black font-bold'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            All Activity
          </button>
          <button
            onClick={() => setFilter('today')}
            className={`px-3 py-1.5 rounded-lg transition-colors font-medium ${
              filter === 'today'
                ? 'bg-white text-black font-bold'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Today
          </button>
          <button
            onClick={() => setFilter('week')}
            className={`px-3 py-1.5 rounded-lg transition-colors font-medium ${
              filter === 'week'
                ? 'bg-white text-black font-bold'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            This Week
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 text-gray-400 gap-3">
          <Loader2 className="w-7 h-7 animate-spin text-white" />
          <span className="text-xs font-mono">Loading recent activity...</span>
        </div>
      ) : filteredFiles.length === 0 ? (
        <div className="py-20 text-center text-xs text-gray-500 font-mono">
          [ NO RECENT ACTIVITY FOUND FOR THIS PERIOD ]
        </div>
      ) : (
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

          {filteredFiles.map((file) => (
            <div
              key={file.id}
              onClick={() => setPreviewFile(file)}
              className="grid grid-cols-12 items-center py-3.5 border-b border-white/[0.06] hover:bg-white/[0.03] px-2 transition-colors cursor-pointer group"
            >
              <div className="col-span-6 sm:col-span-5 flex items-center gap-3 min-w-0 pr-2">
                <FileTypeIcon category={file.category} />
                <span className="text-xs font-medium text-white group-hover:text-gray-300 transition-colors truncate">
                  {file.name}
                </span>
              </div>

              <div className="hidden sm:block sm:col-span-2">
                <span className="capitalize text-gray-400 font-mono text-[11px] px-2 py-0.5 rounded bg-white/[0.04]">
                  {file.category}
                </span>
              </div>

              <div className="col-span-3 sm:col-span-2 font-mono text-gray-400 text-xs">
                {formatFileSize(file.size)}
              </div>

              <div className="hidden sm:block sm:col-span-2 font-mono text-gray-500 text-xs">
                {formatRelativeTime(file.updatedAt)}
              </div>

              <div
                className="col-span-3 sm:col-span-1 text-right"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="inline-flex items-center gap-1">
                  <button
                    onClick={() => setPreviewFile(file)}
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
          ))}
        </div>
      )}

      {/* Live Preview Modal */}
      <FilePreviewModal
        file={previewFile}
        isOpen={!!previewFile}
        onClose={() => setPreviewFile(null)}
      />
    </div>
  );
};
