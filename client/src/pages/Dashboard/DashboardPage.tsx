import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  Upload,
  Star,
  Download,
  Eye,
  Search,
  ArrowUpRight,
  Filter,
} from 'lucide-react';
import { mockFiles } from '../../utils/mockData';
import { formatFileSize, formatRelativeTime } from '../../utils/formatters';
import { FileTypeIcon } from '../../components/common/FileTypeIcon';
import { Modal } from '../../components/ui/Modal';
import { FileItem } from '../../types/storage.types';

export const DashboardPage: React.FC = () => {
  const [files, setFiles] = useState<FileItem[]>(mockFiles);
  const [selectedFile, setSelectedFile] = useState<FileItem | null>(null);
  const [previewModalOpen, setPreviewModalOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const toggleStar = (fileId: string) => {
    setFiles((prev) =>
      prev.map((f) => (f.id === fileId ? { ...f, isStarred: !f.isStarred } : f))
    );
  };

  const handlePreview = (file: FileItem) => {
    setSelectedFile(file);
    setPreviewModalOpen(true);
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
      

      {/* 2. Filter Tabs & Search Bar (Borderless, Clean Separator) */}
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

      {/* 3. Borderless Minimal File Stream (Only Bottom Divider Lines, No Full Outer Box Border) */}
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

        {/* Rows */}
        {filteredFiles.length === 0 ? (
          <div className="py-12 text-center text-xs text-gray-500 font-mono">
            [ NO ASSETS FOUND MATCHING CRITERIA ]
          </div>
        ) : (
          filteredFiles.map((file) => (
            <div
              key={file.id}
              onClick={() => handlePreview(file)}
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
              <div className="col-span-3 sm:col-span-1 text-right" onClick={(e) => e.stopPropagation()}>
                <div className="inline-flex items-center gap-1">
                  <button
                    onClick={() => handlePreview(file)}
                    className="p-1.5 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
                    title="Preview"
                  >
                    <Eye className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => alert(`Downloading ${file.name}`)}
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

      {/* Preview Modal */}
      <Modal
        isOpen={previewModalOpen}
        onClose={() => setPreviewModalOpen(false)}
        title={selectedFile?.name}
        description={`Size: ${selectedFile ? formatFileSize(selectedFile.size) : ''} • Category: ${selectedFile?.category || ''}`}
      >
        <div className="space-y-4 pt-1">
          <div className="p-8 rounded-xl bg-[#0C0C10] border border-white/10 text-center">
            {selectedFile?.thumbnailUrl ? (
              <img
                src={selectedFile.thumbnailUrl}
                alt={selectedFile.name}
                className="max-h-60 mx-auto rounded-lg object-contain"
              />
            ) : (
              <div className="flex flex-col items-center justify-center py-6">
                <FileTypeIcon category={selectedFile?.category} className="w-12 h-12 mb-3" />
                <p className="text-xs font-mono text-gray-400">[ HIGH FIDELITY PREVIEW ]</p>
              </div>
            )}
          </div>

          <div className="flex items-center justify-between text-xs font-mono text-gray-400 px-1">
            <span>MODIFIED: {selectedFile?.updatedAt ? formatRelativeTime(selectedFile.updatedAt) : ''}</span>
            <button
              onClick={() => alert(`Downloaded ${selectedFile?.name}`)}
              className="px-4 py-2 rounded-xl text-xs font-bold text-black bg-white hover:bg-gray-200 transition-colors flex items-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download File</span>
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
