import React, { useState } from 'react';
import { Clock, Download, Eye, Calendar } from 'lucide-react';
import { mockFiles } from '../../utils/mockData';
import { formatFileSize, formatRelativeTime } from '../../utils/formatters';
import { FileTypeIcon } from '../../components/common/FileTypeIcon';
import { Modal } from '../../components/ui/Modal';
import { FileItem } from '../../types/storage.types';

export const RecentPage: React.FC = () => {
  const [filter, setFilter] = useState<'all' | 'today' | 'week'>('all');
  const [previewFile, setPreviewFile] = useState<FileItem | null>(null);

  const todayFiles = mockFiles.slice(0, 3);
  const thisWeekFiles = mockFiles.slice(3, 6);

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

      {/* Timeline Section (Borderless Minimal Stream - Only Bottom Lines) */}
      <div className="space-y-6">
        {(filter === 'all' || filter === 'today') && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 px-2">
              <Calendar className="w-3.5 h-3.5 text-gray-400" />
              <h2 className="text-xs font-mono font-bold uppercase tracking-wider text-gray-400">
                Today
              </h2>
            </div>
            <div>
              {todayFiles.map((file) => (
                <div
                  key={file.id}
                  onClick={() => setPreviewFile(file)}
                  className="py-3.5 px-2 border-b border-white/[0.06] hover:bg-white/[0.03] transition-colors flex items-center justify-between gap-4 cursor-pointer group"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <FileTypeIcon category={file.category} />
                    <div className="truncate">
                      <p className="text-xs font-medium text-white truncate group-hover:text-gray-300 transition-colors">
                        {file.name}
                      </p>
                      <p className="text-[11px] text-gray-500 font-mono mt-0.5">
                        {formatFileSize(file.size)} • Opened {formatRelativeTime(file.updatedAt)}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setPreviewFile(file);
                      }}
                      className="p-1.5 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
                      title="Preview"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        alert(`Downloading: ${file.name}`);
                      }}
                      className="p-1.5 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
                      title="Download"
                    >
                      <Download className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {(filter === 'all' || filter === 'week') && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 px-2">
              <Calendar className="w-3.5 h-3.5 text-gray-400" />
              <h2 className="text-xs font-mono font-bold uppercase tracking-wider text-gray-400">
                Earlier This Week
              </h2>
            </div>
            <div>
              {thisWeekFiles.map((file) => (
                <div
                  key={file.id}
                  onClick={() => setPreviewFile(file)}
                  className="py-3.5 px-2 border-b border-white/[0.06] hover:bg-white/[0.03] transition-colors flex items-center justify-between gap-4 cursor-pointer group"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <FileTypeIcon category={file.category} />
                    <div className="truncate">
                      <p className="text-xs font-medium text-white truncate group-hover:text-gray-300 transition-colors">
                        {file.name}
                      </p>
                      <p className="text-[11px] text-gray-500 font-mono mt-0.5">
                        {formatFileSize(file.size)} • Modified {formatRelativeTime(file.updatedAt)}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setPreviewFile(file);
                      }}
                      className="p-1.5 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
                      title="Preview"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        alert(`Downloading: ${file.name}`);
                      }}
                      className="p-1.5 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
                      title="Download"
                    >
                      <Download className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Preview Modal */}
      <Modal
        isOpen={!!previewFile}
        onClose={() => setPreviewFile(null)}
        title={previewFile?.name}
        description={`Category: ${previewFile?.category} • Size: ${
          previewFile ? formatFileSize(previewFile.size) : ''
        }`}
      >
        <div className="space-y-4 pt-1">
          <div className="p-6 rounded-2xl bg-[#0C0C10] border border-white/10 text-center">
            <FileTypeIcon category={previewFile?.category} className="w-12 h-12 mx-auto mb-2" />
            <p className="text-sm font-semibold text-white">{previewFile?.name}</p>
          </div>
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setPreviewFile(null)}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-gray-400 hover:text-white hover:bg-white/5 border border-white/10"
            >
              Close
            </button>
            <button
              type="button"
              className="px-4 py-2 rounded-xl text-xs font-bold text-black bg-white hover:bg-gray-200 transition-colors flex items-center gap-1.5"
              onClick={() => {
                alert(`Downloaded: ${previewFile?.name}`);
                setPreviewFile(null);
              }}
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download</span>
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
