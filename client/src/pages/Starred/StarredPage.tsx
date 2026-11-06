import React, { useState } from 'react';
import { Star, Download, Eye } from 'lucide-react';
import { mockFiles } from '../../utils/mockData';
import { formatFileSize, formatRelativeTime } from '../../utils/formatters';
import { FileTypeIcon } from '../../components/common/FileTypeIcon';
import { Modal } from '../../components/ui/Modal';
import { FileItem } from '../../types/storage.types';

export const StarredPage: React.FC = () => {
  const [files, setFiles] = useState<FileItem[]>(mockFiles.filter((f) => f.isStarred));
  const [previewFile, setPreviewFile] = useState<FileItem | null>(null);

  const toggleStar = (id: string) => {
    setFiles((prev) => prev.filter((f) => f.id !== id));
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/[0.08]">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight flex items-center gap-2.5">
            <Star className="w-5 h-5 text-white fill-white" />
            Starred Documents & Assets
          </h1>
          <p className="text-xs text-gray-400 mt-1 font-sans">
            Quickly access priority master recordings, documents, and 4K media reels.
          </p>
        </div>
      </div>

      {files.length === 0 ? (
        <div className="py-16 text-center">
          <Star className="w-10 h-10 mx-auto text-gray-700 mb-3" />
          <h3 className="text-sm font-semibold text-white">
            No Starred Files
          </h3>
          <p className="text-xs text-gray-500 mt-1 max-w-sm mx-auto font-sans">
            Star important items across your folders to access them quickly from this dedicated bookmark view.
          </p>
        </div>
      ) : (
        <div className="space-y-0">
          {/* Header Row */}
          <div className="grid grid-cols-12 text-[11px] font-mono uppercase tracking-wider text-gray-500 pb-3 border-b border-white/[0.08] px-2">
            <div className="col-span-6 sm:col-span-5 flex items-center gap-4">
              <span className="w-4" />
              <span>Name</span>
            </div>
            <div className="hidden sm:block sm:col-span-2">Category</div>
            <div className="col-span-3 sm:col-span-2">Size</div>
            <div className="hidden sm:block sm:col-span-2">Modified</div>
            <div className="col-span-3 sm:col-span-1 text-right">Actions</div>
          </div>

          {/* Rows */}
          {files.map((file) => (
            <div
              key={file.id}
              onClick={() => setPreviewFile(file)}
              className="grid grid-cols-12 items-center py-3.5 border-b border-white/[0.06] hover:bg-white/[0.03] px-2 transition-colors cursor-pointer group"
            >
              <div className="col-span-6 sm:col-span-5 flex items-center gap-3 min-w-0 pr-2">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleStar(file.id);
                  }}
                  className="text-white hover:text-gray-400 transition-colors shrink-0"
                  title="Remove from Starred"
                >
                  <Star className="w-3.5 h-3.5 fill-white text-white" />
                </button>
                <FileTypeIcon category={file.category} />
                <span className="text-xs font-medium text-white truncate group-hover:text-gray-300 transition-colors">
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

              <div className="col-span-3 sm:col-span-1 text-right" onClick={(e) => e.stopPropagation()}>
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
      )}

      {/* Preview Modal */}
      <Modal
        isOpen={!!previewFile}
        onClose={() => setPreviewFile(null)}
        title={previewFile?.name}
        description={`Starred Asset • ${previewFile ? formatFileSize(previewFile.size) : ''}`}
      >
        <div className="space-y-4 pt-1">
          <div className="p-6 rounded-2xl bg-[#0C0C10] border border-white/10 text-center">
            {previewFile?.thumbnailUrl ? (
              <img
                src={previewFile.thumbnailUrl}
                alt={previewFile.name}
                className="max-h-56 mx-auto rounded-lg object-contain"
              />
            ) : (
              <div className="flex flex-col items-center justify-center py-6">
                <FileTypeIcon category={previewFile?.category} className="w-12 h-12 mb-2" />
                <p className="text-xs font-mono text-gray-400">[ HIGH FIDELITY PREVIEW ]</p>
              </div>
            )}
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
