import React, { useState } from 'react';
import { Share2, Eye, Download } from 'lucide-react';
import { mockFiles } from '../../utils/mockData';
import { formatFileSize, formatRelativeTime } from '../../utils/formatters';
import { FileTypeIcon } from '../../components/common/FileTypeIcon';
import { Modal } from '../../components/ui/Modal';
import { FileItem } from '../../types/storage.types';

export const SharedPage: React.FC = () => {
  const [filter, setFilter] = useState<'all' | 'edit' | 'view'>('all');
  const [previewFile, setPreviewFile] = useState<FileItem | null>(null);

  const sharedFiles = mockFiles.filter((f) => f.isShared);

  const filtered = sharedFiles.filter((f) => {
    if (filter === 'edit') return f.permission === 'edit';
    if (filter === 'view') return f.permission === 'view';
    return true;
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/[0.08]">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight flex items-center gap-2.5">
            <Share2 className="w-5 h-5 text-gray-300" />
            Shared With Me
          </h1>
          <p className="text-xs text-gray-400 mt-1 font-sans">
            Files and folders shared with your account by team members and collaborators.
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
            All Shared ({sharedFiles.length})
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

      {/* Shared Files Stream (Borderless Minimal List - Only Bottom Lines) */}
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
        {filtered.map((file) => (
          <div
            key={file.id}
            onClick={() => setPreviewFile(file)}
            className="grid grid-cols-12 items-center py-3.5 border-b border-white/[0.06] hover:bg-white/[0.03] px-2 transition-colors cursor-pointer group"
          >
            <div className="col-span-5 sm:col-span-4 font-medium flex items-center gap-3 min-w-0 pr-2">
              <FileTypeIcon category={file.category} />
              <span className="text-xs font-medium text-white truncate group-hover:text-gray-300 transition-colors">
                {file.name}
              </span>
            </div>

            <div className="col-span-3 sm:col-span-3">
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 rounded-full bg-white/10 flex items-center justify-center text-[9px] font-bold text-gray-300 shrink-0">
                  {file.sharedBy?.name.charAt(0) || 'U'}
                </div>
                <span className="text-xs text-gray-300 truncate">
                  {file.sharedBy?.name || 'Collaborator'}
                </span>
              </div>
            </div>

            <div className="hidden sm:block sm:col-span-2">
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-medium uppercase bg-white/[0.05] text-gray-400">
                {file.permission === 'edit' ? 'Can Edit' : 'Read Only'}
              </span>
            </div>

            <div className="col-span-2 sm:col-span-1 font-mono text-gray-400 text-xs">
              {formatFileSize(file.size)}
            </div>

            <div className="hidden sm:block sm:col-span-1 font-mono text-gray-500 text-xs">
              {formatRelativeTime(file.updatedAt)}
            </div>

            <div className="col-span-2 sm:col-span-1 text-right" onClick={(e) => e.stopPropagation()}>
              <div className="inline-flex items-center gap-1">
                <button
                  onClick={() => setPreviewFile(file)}
                  className="p-1.5 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
                  title="Preview"
                >
                  <Eye className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => alert(`Downloading: ${file.name}`)}
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

      {/* Preview Modal */}
      <Modal
        isOpen={!!previewFile}
        onClose={() => setPreviewFile(null)}
        title={previewFile?.name}
        description={`Shared by ${previewFile?.sharedBy?.name || 'Collaborator'} • Permission: ${
          previewFile?.permission || 'Read'
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
