import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  LayoutGrid,
  List as ListIcon,
  Search,
  Upload,
  FolderPlus,
  ChevronRight,
  Folder,
  Star,
  Download,
  Trash2,
  CheckSquare,
  Square,
  ArrowUpDown,
  Eye,
  Share2,
  History,
  Check,
  Copy,
  Clock,
  RotateCcw,
  Shield,
} from 'lucide-react';
import { mockFiles, mockFolders } from '../../utils/mockData';
import { formatFileSize, formatRelativeTime } from '../../utils/formatters';
import { FileTypeIcon } from '../../components/common/FileTypeIcon';
import { Modal } from '../../components/ui/Modal';
import { FileItem } from '../../types/storage.types';

export const FilesPage: React.FC = () => {
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'date' | 'size'>('date');
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  const [selectedFileIds, setSelectedFileIds] = useState<string[]>([]);
  const [files, setFiles] = useState<FileItem[]>(mockFiles);

  const [previewFile, setPreviewFile] = useState<FileItem | null>(null);
  const [newFolderModalOpen, setNewFolderModalOpen] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');

  // Feature 4: Secure File Sharing State
  const [shareModalFile, setShareModalFile] = useState<FileItem | null>(null);
  const [shareRole, setShareRole] = useState<'view' | 'edit'>('view');
  const [linkCopied, setLinkCopied] = useState(false);

  // Feature 6: File Versioning State
  const [versionModalFile, setVersionModalFile] = useState<FileItem | null>(null);
  const [versionHistory, setVersionHistory] = useState([
    { version: 'v1.3', date: '2026-11-06T09:12:00Z', size: '4.8 MB', author: 'Elena Rostova', current: true },
    { version: 'v1.2', date: '2026-11-04T16:30:00Z', size: '4.5 MB', author: 'You (Owner)', current: false },
    { version: 'v1.1', date: '2026-10-29T11:05:00Z', size: '4.1 MB', author: 'You (Owner)', current: false },
  ]);

  const currentFolder = mockFolders.find((f) => f.id === selectedFolderId);

  const handleCopyLink = () => {
    setLinkCopied(true);
    setTimeout(() => setLinkCopied(false), 2500);
  };

  const handleRollback = (ver: string) => {
    setVersionHistory((prev) =>
      prev.map((v) => ({ ...v, current: v.version === ver }))
    );
    alert(`Rolled back ${versionModalFile?.name} to version ${ver} successfully.`);
  };

  const toggleSelectFile = (id: string) => {
    setSelectedFileIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (selectedFileIds.length === filteredFiles.length) {
      setSelectedFileIds([]);
    } else {
      setSelectedFileIds(filteredFiles.map((f) => f.id));
    }
  };

  const toggleStar = (id: string) => {
    setFiles((prev) =>
      prev.map((f) => (f.id === id ? { ...f, isStarred: !f.isStarred } : f))
    );
  };

  const filteredFiles = useMemo(() => {
    return files
      .filter((file) => {
        const matchesSearch = file.name
          .toLowerCase()
          .includes(searchQuery.toLowerCase());
        return matchesSearch;
      })
      .sort((a, b) => {
        if (sortBy === 'name') return a.name.localeCompare(b.name);
        if (sortBy === 'size') return b.size - a.size;
        return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
      });
  }, [files, searchQuery, sortBy]);

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      {/* Header with Breadcrumb & Action Toolbar */}
      

      {/* Filter / Search & View Controls Bar (Borderless Minimal Separator) */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-white/[0.08]">
        {/* Search */}
        <div className="relative flex-1 min-w-[220px] max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search across all files in drive..."
            className="w-full text-xs pl-9 pr-4 py-2 rounded-xl bg-[#111116] text-white placeholder-gray-500 border border-white/10 focus:outline-none focus:border-white/30 transition-colors"
          />
        </div>

        {/* Actions & View Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={toggleSelectAll}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium text-gray-300 hover:text-white bg-[#111116] border border-white/10 transition-colors"
          >
            {selectedFileIds.length === filteredFiles.length && filteredFiles.length > 0 ? (
              <CheckSquare className="w-3.5 h-3.5 text-white" />
            ) : (
              <Square className="w-3.5 h-3.5 text-gray-500" />
            )}
            <span>
              {selectedFileIds.length > 0
                ? `${selectedFileIds.length} Selected`
                : 'Select All'}
            </span>
          </button>

          {/* Sort dropdown */}
          <div className="inline-flex items-center gap-1.5 text-xs text-gray-300 border border-white/10 rounded-xl px-3 py-1.5 bg-[#111116]">
            <ArrowUpDown className="w-3 h-3 text-gray-400" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="bg-transparent text-white font-medium focus:outline-none cursor-pointer text-xs"
            >
              <option value="date" className="bg-[#111116]">Modified Date</option>
              <option value="name" className="bg-[#111116]">Name</option>
              <option value="size" className="bg-[#111116]">Size</option>
            </select>
          </div>

          {/* View mode toggle */}
          <div className="flex items-center p-0.5 rounded-xl border border-white/10 bg-[#111116]">
            <button
              onClick={() => setViewMode('list')}
              className={`p-1.5 rounded-lg transition-colors ${
                viewMode === 'list'
                  ? 'bg-white text-black font-bold'
                  : 'text-gray-400 hover:text-white'
              }`}
              title="List View"
            >
              <ListIcon className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-lg transition-colors ${
                viewMode === 'grid'
                  ? 'bg-white text-black font-bold'
                  : 'text-gray-400 hover:text-white'
              }`}
              title="Grid View"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Batch Selection Banner */}
      {selectedFileIds.length > 0 && (
        <div className="p-3 rounded-xl bg-white/[0.04] border border-white/20 flex items-center justify-between animate-in fade-in duration-100">
          <div className="text-xs font-semibold text-white flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
            <span>{selectedFileIds.length} files selected</span>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => alert(`Simulating batch download for ${selectedFileIds.length} files.`)}
              className="px-3 py-1.5 rounded-xl text-xs font-medium text-gray-300 hover:text-white bg-white/5 border border-white/10 flex items-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download</span>
            </button>
            <button
              onClick={() => {
                setFiles((prev) => prev.filter((f) => !selectedFileIds.includes(f.id)));
                setSelectedFileIds([]);
              }}
              className="px-3 py-1.5 rounded-xl text-xs font-medium text-white hover:bg-white/15 bg-white/10 border border-white/20 flex items-center gap-1.5"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Delete</span>
            </button>
          </div>
        </div>
      )}

      {/* Folders Section (Minimalist, No Boxy Borders) */}
      {!selectedFolderId && (
        <div className="space-y-2 pb-4 border-b border-white/[0.08]">
          <h2 className="text-xs font-mono font-bold uppercase tracking-wider text-gray-400 px-1">
            Directories ({mockFolders.length})
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            {mockFolders.map((folder) => (
              <div
                key={folder.id}
                onClick={() => setSelectedFolderId(folder.id)}
                className="p-3 rounded-xl bg-[#111116] hover:bg-[#181820] transition-colors cursor-pointer group flex items-center gap-3"
              >
                <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center shrink-0 text-white group-hover:scale-105 transition-transform">
                  <Folder className="w-4 h-4 fill-white/20" />
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="text-xs font-semibold text-white group-hover:text-gray-300 transition-colors truncate">
                    {folder.name}
                  </h3>
                  <p className="text-[10px] text-gray-500 font-mono mt-0.5 truncate">
                    {folder.itemsCount} items
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Files Section (Borderless Minimal Stream - Only Bottom Lines) */}
      <div className="space-y-0">
        {viewMode === 'list' ? (
          <div>
            {/* Header Row */}
            <div className="grid grid-cols-12 text-[11px] font-mono uppercase tracking-wider text-gray-500 pb-3 border-b border-white/[0.08] px-2">
              <div className="col-span-1 w-6"></div>
              <div className="col-span-6 sm:col-span-5">Name</div>
              <div className="hidden sm:block sm:col-span-2">Category</div>
              <div className="col-span-2 sm:col-span-2">Size</div>
              <div className="hidden sm:block sm:col-span-1">Modified</div>
              <div className="col-span-3 sm:col-span-1 text-right">Actions</div>
            </div>

            {/* List Rows */}
            {filteredFiles.map((file) => {
              const isSelected = selectedFileIds.includes(file.id);
              return (
                <div
                  key={file.id}
                  onClick={() => setPreviewFile(file)}
                  className={`grid grid-cols-12 items-center py-3.5 border-b border-white/[0.06] hover:bg-white/[0.03] px-2 transition-colors cursor-pointer group ${
                    isSelected ? 'bg-white/[0.05]' : ''
                  }`}
                >
                  {/* Select Checkbox */}
                  <div className="col-span-1 w-6" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => toggleSelectFile(file.id)}
                      className="text-gray-500 hover:text-white"
                    >
                      {isSelected ? (
                        <CheckSquare className="w-4 h-4 text-white" />
                      ) : (
                        <Square className="w-4 h-4" />
                      )}
                    </button>
                  </div>

                  {/* Name & Star */}
                  <div className="col-span-6 sm:col-span-5 flex items-center gap-3 min-w-0 pr-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleStar(file.id);
                      }}
                      className="text-gray-600 hover:text-white transition-colors shrink-0"
                    >
                      <Star
                        className={`w-3.5 h-3.5 ${
                          file.isStarred ? 'fill-white text-white' : ''
                        }`}
                      />
                    </button>
                    <FileTypeIcon category={file.category} />
                    <span className="text-xs font-medium text-white truncate group-hover:text-gray-300 transition-colors">
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
                  <div className="col-span-2 sm:col-span-2 font-mono text-gray-400 text-xs">
                    {formatFileSize(file.size)}
                  </div>

                  {/* Modified */}
                  <div className="hidden sm:block sm:col-span-1 font-mono text-gray-500 text-xs">
                    {formatRelativeTime(file.updatedAt)}
                  </div>

                  {/* Actions */}
                  <div className="col-span-3 sm:col-span-1 text-right" onClick={(e) => e.stopPropagation()}>
                    <div className="inline-flex items-center gap-1">
                      <button
                        onClick={() => setPreviewFile(file)}
                        className="p-1.5 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
                        title="Preview File"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => setShareModalFile(file)}
                        className="p-1.5 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
                        title="Share File"
                      >
                        <Share2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => setVersionModalFile(file)}
                        className="p-1.5 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
                        title="Version History"
                      >
                        <History className="w-3.5 h-3.5" />
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
              );
            })}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 pt-2">
            {filteredFiles.map((file) => {
              const isSelected = selectedFileIds.includes(file.id);
              return (
                <div
                  key={file.id}
                  onClick={() => setPreviewFile(file)}
                  className={`p-4 rounded-xl transition-all cursor-pointer relative group bg-[#111116] hover:bg-[#181820] ${
                    isSelected ? 'ring-1 ring-white bg-[#1A1A24]' : ''
                  }`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleSelectFile(file.id);
                      }}
                      className="text-gray-500 hover:text-white"
                    >
                      {isSelected ? (
                        <CheckSquare className="w-4 h-4 text-white" />
                      ) : (
                        <Square className="w-4 h-4" />
                      )}
                    </button>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleStar(file.id);
                      }}
                      className="text-gray-600 hover:text-white transition-colors"
                    >
                      <Star
                        className={`w-4 h-4 ${
                          file.isStarred ? 'fill-white text-white' : ''
                        }`}
                      />
                    </button>
                  </div>

                  <div className="h-28 rounded-lg bg-black/50 flex items-center justify-center overflow-hidden mb-3">
                    {file.thumbnailUrl ? (
                      <img
                        src={file.thumbnailUrl}
                        alt={file.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                      />
                    ) : (
                      <FileTypeIcon category={file.category} className="w-10 h-10" />
                    )}
                  </div>

                  <h3 className="text-xs font-semibold text-white truncate group-hover:text-gray-300 transition-colors">
                    {file.name}
                  </h3>
                  <div className="flex items-center justify-between mt-1.5 text-[11px] text-gray-400 font-mono">
                    <span>{formatFileSize(file.size)}</span>
                    <span>{formatRelativeTime(file.updatedAt)}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* New Folder Modal */}
      <Modal
        isOpen={newFolderModalOpen}
        onClose={() => setNewFolderModalOpen(false)}
        title="Create New Folder"
        description="Organize your files into structured subdirectories."
        maxWidth="sm"
      >
        <div className="space-y-4 pt-1">
          <div>
            <label className="block text-xs font-mono font-bold uppercase tracking-wider text-gray-300 mb-1.5">
              Folder Name
            </label>
            <input
              type="text"
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              placeholder="e.g. Master Tapes 2026"
              className="w-full text-sm px-3.5 py-2.5 rounded-xl border border-white/10 bg-[#121217] text-white focus:outline-none focus:border-white/30"
              autoFocus
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setNewFolderModalOpen(false)}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-gray-400 hover:text-white hover:bg-white/5 border border-white/10"
            >
              Cancel
            </button>
            <button
              type="button"
              className="px-4 py-2 rounded-xl text-xs font-bold text-black bg-white hover:bg-gray-200 transition-colors"
              onClick={() => {
                if (newFolderName.trim()) {
                  alert(`Folder "${newFolderName}" created in drive view.`);
                  setNewFolderName('');
                  setNewFolderModalOpen(false);
                }
              }}
            >
              Create Folder
            </button>
          </div>
        </div>
      </Modal>

      {/* File Preview Modal */}
      <Modal
        isOpen={!!previewFile}
        onClose={() => setPreviewFile(null)}
        title={previewFile?.name}
        description={`Category: ${previewFile?.category} • Size: ${
          previewFile ? formatFileSize(previewFile.size) : ''
        }`}
        maxWidth="lg"
      >
        <div className="space-y-4 pt-2">
          {previewFile?.thumbnailUrl ? (
            <div className="rounded-xl overflow-hidden max-h-72 bg-black flex items-center justify-center border border-white/10">
              <img
                src={previewFile.thumbnailUrl}
                alt={previewFile.name}
                className="w-full h-full object-contain"
              />
            </div>
          ) : (
            <div className="rounded-xl p-8 bg-[#0C0C10] border border-white/10 text-center">
              <div className="w-14 h-14 mx-auto mb-3 flex items-center justify-center">
                <FileTypeIcon category={previewFile?.category} className="w-10 h-10" />
              </div>
              <p className="text-sm font-semibold text-white">
                {previewFile?.name}
              </p>
              <p className="text-xs text-gray-400 font-mono mt-1">
                Format: {previewFile?.extension.toUpperCase()} • Fidelity: [ 192 kHz / 24-bit ]
              </p>
            </div>
          )}

          <div className="flex justify-between items-center pt-2">
            <span className="text-xs text-gray-500 font-mono">
              [ SECURE ACCESS PROTOCOL ]
            </span>
            <div className="flex gap-2">
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
                  alert(`Downloading: ${previewFile?.name}`);
                  setPreviewFile(null);
                }}
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download File</span>
              </button>
            </div>
          </div>
        </div>
      </Modal>

      {/* Share Modal */}
      <Modal
        isOpen={!!shareModalFile}
        onClose={() => setShareModalFile(null)}
        title="Share Asset Securely"
        description={`Manage access permissions and shareable links for ${shareModalFile?.name}`}
        maxWidth="md"
      >
        <div className="space-y-4 pt-2">
          {/* Permission selector */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-gray-300">Access Level</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setShareRole('view')}
                className={`p-3 rounded-xl border text-left flex items-start gap-2.5 transition-all ${
                  shareRole === 'view'
                    ? 'border-white bg-white/10 text-white'
                    : 'border-white/10 bg-[#121217] text-gray-400'
                }`}
              >
                <Eye className="w-4 h-4 text-white shrink-0 mt-0.5" />
                <div>
                  <div className="text-xs font-bold text-white">Viewer</div>
                  <div className="text-[11px] text-gray-400">Can view & download</div>
                </div>
              </button>
              <button
                type="button"
                onClick={() => setShareRole('edit')}
                className={`p-3 rounded-xl border text-left flex items-start gap-2.5 transition-all ${
                  shareRole === 'edit'
                    ? 'border-white bg-white/10 text-white'
                    : 'border-white/10 bg-[#121217] text-gray-400'
                }`}
              >
                <Shield className="w-4 h-4 text-white shrink-0 mt-0.5" />
                <div>
                  <div className="text-xs font-bold text-white">Editor</div>
                  <div className="text-[11px] text-gray-400">Can edit & replace</div>
                </div>
              </button>
            </div>
          </div>

          {/* Shareable Link Box */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-gray-300">Shareable Vault Link</label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={`https://cloudora.io/s/${shareModalFile?.id}?token=jwt_${shareRole}`}
                className="w-full text-xs font-mono px-3.5 py-2.5 rounded-xl border border-white/10 bg-[#121217] text-gray-300 select-all"
              />
              <button
                type="button"
                onClick={handleCopyLink}
                className="px-4 py-2.5 rounded-xl bg-white text-black font-bold text-xs shrink-0 flex items-center gap-1.5 hover:bg-gray-200 transition-colors"
              >
                {linkCopied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{linkCopied ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="button"
              onClick={() => setShareModalFile(null)}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-white bg-white/10 hover:bg-white/15 transition-colors"
            >
              Done
            </button>
          </div>
        </div>
      </Modal>

      {/* Version History Modal */}
      <Modal
        isOpen={!!versionModalFile}
        onClose={() => setVersionModalFile(null)}
        title="File Version History"
        description={`Inspect and rollback revisions for ${versionModalFile?.name}`}
        maxWidth="md"
      >
        <div className="space-y-3 pt-2">
          {versionHistory.map((ver) => (
            <div
              key={ver.version}
              className={`p-3 rounded-xl border flex items-center justify-between transition-all ${
                ver.current
                  ? 'border-white/20 bg-white/5'
                  : 'border-white/5 bg-[#121217]'
              }`}
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-bold text-white">
                    {ver.version}
                  </span>
                  {ver.current && (
                    <span className="text-[10px] font-mono font-bold text-white bg-white/20 px-2 py-0.5 rounded-full uppercase">
                      Current
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2 text-[11px] text-gray-400 font-mono">
                  <span>{formatRelativeTime(ver.date)}</span>
                  <span>•</span>
                  <span>{ver.size}</span>
                </div>
              </div>

              <div>
                {!ver.current ? (
                  <button
                    type="button"
                    onClick={() => handleRollback(ver.version)}
                    className="px-3 py-1.5 rounded-xl text-xs font-semibold text-white bg-white/10 hover:bg-white/20 border border-white/20 transition-all flex items-center gap-1.5"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>Rollback</span>
                  </button>
                ) : (
                  <span className="text-xs text-gray-500 font-mono">Active</span>
                )}
              </div>
            </div>
          ))}

          <div className="flex justify-end pt-2">
            <button
              type="button"
              onClick={() => setVersionModalFile(null)}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-white bg-white/10 hover:bg-white/15 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
