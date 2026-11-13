import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
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
  Loader2,
  Home,
  AlertCircle,
  X,
  CheckCircle2,
} from 'lucide-react';
import { formatFileSize, formatRelativeTime } from '../../utils/formatters';
import { FileTypeIcon } from '../../components/common/FileTypeIcon';
import { Modal } from '../../components/ui/Modal';
import { FilePreviewModal } from '../../components/common/FilePreviewModal';
import { FileItem, FolderItem } from '../../types/storage.types';
import {
  fetchFiles,
  toggleStarFile,
  trashFile,
} from '../../services/file.service';
import {
  fetchRootFolders,
  fetchSubfolders,
  fetchFolderDetails,
  createFolder,
  trashFolder,
  FolderAncestor,
} from '../../services/folder.service';
import { startFileUpload } from '../../services/multipart-upload.service';
import { downloadFile } from '../../utils/download';

interface ActiveUploadProgress {
  id: string;
  name: string;
  progress: number;
  status: 'uploading' | 'completed' | 'error';
  speed?: string;
  eta?: string;
  error?: string;
}

export const FilesPage: React.FC = () => {
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'date' | 'size'>('date');
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  const [selectedFileIds, setSelectedFileIds] = useState<string[]>([]);

  // Live Data States
  const [files, setFiles] = useState<FileItem[]>([]);
  const [folders, setFolders] = useState<FolderItem[]>([]);
  const [ancestors, setAncestors] = useState<FolderAncestor[]>([]);
  const [currentFolder, setCurrentFolder] = useState<FolderItem | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Modals & Actions
  const [previewFile, setPreviewFile] = useState<FileItem | null>(null);
  const [newFolderModalOpen, setNewFolderModalOpen] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [creatingFolder, setCreatingFolder] = useState(false);

  // Active Uploads Tracker (Floating progress pill)
  const [activeUploads, setActiveUploads] = useState<ActiveUploadProgress[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load files and folders from the backend
  const loadDirectoryData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      if (!selectedFolderId) {
        // Root view
        const [rootFoldersData, rootFilesData] = await Promise.all([
          fetchRootFolders(),
          fetchFiles({ folderId: 'root' }),
        ]);
        setFolders(rootFoldersData);
        setFiles(rootFilesData);
        setAncestors([]);
        setCurrentFolder(null);
      } else {
        // Nested folder view
        const [detailsData, subfoldersData, folderFilesData] = await Promise.all([
          fetchFolderDetails(selectedFolderId),
          fetchSubfolders(selectedFolderId),
          fetchFiles({ folderId: selectedFolderId }),
        ]);
        setCurrentFolder(detailsData.folder);
        setAncestors(detailsData.ancestors);
        setFolders(subfoldersData);
        setFiles(folderFilesData);
      }
    } catch (err: any) {
      console.error('[Load Directory Error]:', err);
      setError(err.response?.data?.message || 'Failed to load files and folders.');
    } finally {
      setLoading(false);
    }
  }, [selectedFolderId]);

  useEffect(() => {
    loadDirectoryData();
    setSelectedFileIds([]);
  }, [loadDirectoryData]);

  // File Upload Handler
  const handleUploadFiles = (selectedFiles: FileList | null) => {
    if (!selectedFiles || selectedFiles.length === 0) return;

    Array.from(selectedFiles).forEach((file) => {
      const uploadId = `up-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;

      const newUpload: ActiveUploadProgress = {
        id: uploadId,
        name: file.name,
        progress: 0,
        status: 'uploading',
        speed: 'Connecting...',
      };

      setActiveUploads((prev) => [newUpload, ...prev]);

      startFileUpload(
        uploadId,
        file,
        selectedFolderId || undefined,
        (updates) => {
          setActiveUploads((prev) =>
            prev.map((item) => {
              if (item.id === uploadId) {
                const nextStatus =
                  updates.status === 'completed'
                    ? 'completed'
                    : updates.status === 'error'
                    ? 'error'
                    : 'uploading';
                return {
                  ...item,
                  progress: updates.progress ?? item.progress,
                  speed: updates.speed ?? item.speed,
                  eta: updates.eta ?? item.eta,
                  status: nextStatus,
                  error: updates.errorMessage,
                };
              }
              return item;
            })
          );

          if (updates.status === 'completed') {
            // Automatically refresh folder files when finished!
            loadDirectoryData();
            setTimeout(() => {
              setActiveUploads((prev) => prev.filter((item) => item.id !== uploadId));
            }, 4000);
          }
        }
      );
    });
  };

  // Create Folder Handler
  const handleCreateFolder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFolderName.trim()) return;

    setCreatingFolder(true);
    try {
      await createFolder(newFolderName.trim(), selectedFolderId);
      setNewFolderName('');
      setNewFolderModalOpen(false);
      await loadDirectoryData();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to create folder.');
    } finally {
      setCreatingFolder(false);
    }
  };

  // Star Toggle
  const handleToggleStar = async (file: FileItem) => {
    try {
      const updated = await toggleStarFile(file.id);
      setFiles((prev) =>
        prev.map((f) => (f.id === file.id ? { ...f, isStarred: updated.isStarred } : f))
      );
    } catch (err: any) {
      console.error('Failed to toggle star:', err);
    }
  };

  // Trash Single File
  const handleTrashFile = async (file: FileItem) => {
    if (!window.confirm(`Move "${file.name}" to trash?`)) return;
    try {
      await trashFile(file.id);
      setFiles((prev) => prev.filter((f) => f.id !== file.id));
      setSelectedFileIds((prev) => prev.filter((id) => id !== file.id));
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to move file to trash.');
    }
  };

  // Trash Single Folder
  const handleTrashFolder = async (folder: FolderItem, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm(`Move folder "${folder.name}" and all its contents to trash?`)) return;
    try {
      await trashFolder(folder.id);
      setFolders((prev) => prev.filter((f) => f.id !== folder.id));
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to move folder to trash.');
    }
  };

  // Batch Trash
  const handleBatchTrash = async () => {
    if (!window.confirm(`Move ${selectedFileIds.length} files to trash?`)) return;
    try {
      await Promise.all(selectedFileIds.map((id) => trashFile(id)));
      setFiles((prev) => prev.filter((f) => !selectedFileIds.includes(f.id)));
      setSelectedFileIds([]);
    } catch (err: any) {
      alert('Failed to trash selected files.');
      loadDirectoryData();
    }
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
      {/* Hidden File Input for Direct Uploading */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        className="hidden"
        onChange={(e) => {
          handleUploadFiles(e.target.files);
          e.target.value = '';
        }}
      />

      {/* Top Header & Breadcrumbs Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/[0.08]">
        {/* Breadcrumb Path */}
        <div className="flex items-center flex-wrap gap-1.5 text-xs font-mono">
          <button
            onClick={() => setSelectedFolderId(null)}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg transition-colors ${
              selectedFolderId === null
                ? 'bg-white/10 text-white font-bold'
                : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Home className="w-3.5 h-3.5" />
            <span>Root</span>
          </button>

          {ancestors.map((anc) => (
            <React.Fragment key={anc.id}>
              <ChevronRight className="w-3.5 h-3.5 text-gray-600" />
              <button
                onClick={() => setSelectedFolderId(anc.id)}
                className="px-2.5 py-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition-colors max-w-[120px] truncate"
              >
                {anc.name}
              </button>
            </React.Fragment>
          ))}

          {currentFolder && (
            <React.Fragment key={currentFolder.id}>
              <ChevronRight className="w-3.5 h-3.5 text-gray-600" />
              <span className="px-2.5 py-1.5 rounded-lg bg-white/10 text-white font-bold max-w-[150px] truncate">
                {currentFolder.name}
              </span>
            </React.Fragment>
          )}
        </div>

        {/* Action Buttons: New Folder & Upload */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setNewFolderModalOpen(true)}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-medium text-gray-300 hover:text-white bg-[#111116] border border-white/10 hover:border-white/20 transition-all shadow-sm"
          >
            <FolderPlus className="w-4 h-4 text-gray-400" />
            <span>New Folder</span>
          </button>

          <button
            onClick={() => fileInputRef.current?.click()}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-black bg-white hover:bg-gray-200 transition-all shadow-md active:scale-95"
          >
            <Upload className="w-4 h-4" />
            <span>Upload Files</span>
          </button>
        </div>
      </div>

      {/* Filter / Search & View Controls Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-white/[0.08]">
        {/* Search */}
        <div className="relative flex-1 min-w-[220px] max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search across files in this folder..."
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
              onClick={handleBatchTrash}
              className="px-3 py-1.5 rounded-xl text-xs font-medium text-white hover:bg-white/15 bg-white/10 border border-white/20 flex items-center gap-1.5"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Delete Selected</span>
            </button>
          </div>
        </div>
      )}

      {/* Loading & Error States */}
      {loading && (
        <div className="flex flex-col items-center justify-center py-20 text-gray-400 gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-white" />
          <span className="text-xs font-mono">Synchronizing directory contents...</span>
        </div>
      )}

      {error && !loading && (
        <div className="p-4 rounded-xl bg-red-900/20 border border-red-500/30 text-red-300 text-xs flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {!loading && !error && (
        <>
          {/* Folders Section */}
          {folders.length > 0 && (
            <div className="space-y-2 pb-4 border-b border-white/[0.08]">
              <h2 className="text-xs font-mono font-bold uppercase tracking-wider text-gray-400 px-1">
                Folders ({folders.length})
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {folders.map((folder) => (
                  <div
                    key={folder.id}
                    onClick={() => setSelectedFolderId(folder.id)}
                    className="p-3 rounded-xl bg-[#111116] hover:bg-[#181820] transition-colors cursor-pointer group flex items-center justify-between gap-3 border border-transparent hover:border-white/10"
                  >
                    <div className="flex items-center gap-3 min-w-0">
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
                    <button
                      onClick={(e) => handleTrashFolder(folder, e)}
                      className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-white/10 text-gray-400 hover:text-red-400 transition-all"
                      title="Delete Folder"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Files Section */}
          {filteredFiles.length === 0 && folders.length === 0 ? (
            <div className="py-20 text-center flex flex-col items-center justify-center">
              <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mb-4 text-gray-500">
                <Folder className="w-8 h-8" />
              </div>
              <h3 className="text-sm font-semibold text-white">This folder is empty</h3>
              <p className="text-xs text-gray-400 mt-1 max-w-sm font-sans">
                Upload files using the button above or drag and drop items here to store them securely.
              </p>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="mt-4 px-4 py-2 rounded-xl text-xs font-bold text-black bg-white hover:bg-gray-200 transition-all"
              >
                Upload to {currentFolder ? currentFolder.name : 'Root'}
              </button>
            </div>
          ) : (
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
                        {/* Checkbox */}
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
                              handleToggleStar(file);
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
                            <button
                              onClick={() => handleTrashFile(file)}
                              className="p-1.5 rounded-lg hover:bg-white/10 text-gray-400 hover:text-red-400 transition-colors"
                              title="Trash"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
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
                        className={`p-4 rounded-xl transition-all cursor-pointer relative group bg-[#111116] hover:bg-[#181820] border border-white/5 hover:border-white/10 ${
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
                              handleToggleStar(file);
                            }}
                            className="text-gray-600 hover:text-white transition-colors"
                          >
                            <Star
                              className={`w-3.5 h-3.5 ${
                                file.isStarred ? 'fill-white text-white' : ''
                              }`}
                            />
                          </button>
                        </div>

                        <div className="flex items-center gap-3 mb-3">
                          <FileTypeIcon category={file.category} />
                          <div className="min-w-0 flex-1">
                            <h4 className="text-xs font-semibold text-white truncate group-hover:text-gray-300 transition-colors">
                              {file.name}
                            </h4>
                            <p className="text-[10px] text-gray-500 font-mono mt-0.5">
                              {formatFileSize(file.size)} • {formatRelativeTime(file.updatedAt)}
                            </p>
                          </div>
                        </div>

                        <div
                          className="flex items-center justify-end gap-1 pt-2 border-t border-white/5"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <button
                            onClick={() => setPreviewFile(file)}
                            className="p-1.5 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white"
                            title="Preview"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => downloadFile(file.id, file.name)}
                            className="p-1.5 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white"
                            title="Download"
                          >
                            <Download className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleTrashFile(file)}
                            className="p-1.5 rounded-lg hover:bg-white/10 text-gray-400 hover:text-red-400"
                            title="Trash"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* Floating Upload Progress Toast */}
      {activeUploads.length > 0 && (
        <div className="fixed bottom-6 right-6 z-50 w-80 max-w-[90vw] p-4 rounded-2xl bg-[#111116] border border-white/20 shadow-2xl space-y-3 animate-in slide-in-from-bottom-5">
          <div className="flex items-center justify-between text-xs font-bold text-white pb-2 border-b border-white/10">
            <span>Active Uploads ({activeUploads.length})</span>
            <button
              onClick={() => setActiveUploads([])}
              className="text-gray-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="space-y-2.5 max-h-56 overflow-y-auto pr-1">
            {activeUploads.map((up) => (
              <div key={up.id} className="space-y-1 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-white truncate max-w-[180px]">
                    {up.name}
                  </span>
                  <span className="font-mono text-[11px] text-gray-400">
                    {up.status === 'completed' ? (
                      <span className="text-emerald-400 flex items-center gap-1 font-bold">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Done
                      </span>
                    ) : up.status === 'error' ? (
                      <span className="text-red-400 font-bold">Failed</span>
                    ) : (
                      `${up.progress}%`
                    )}
                  </span>
                </div>

                <div className="w-full h-1.5 rounded-full bg-white/10 overflow-hidden">
                  <div
                    className={`h-full transition-all duration-200 ${
                      up.status === 'completed'
                        ? 'bg-emerald-400'
                        : up.status === 'error'
                        ? 'bg-red-400'
                        : 'bg-white'
                    }`}
                    style={{ width: `${up.progress}%` }}
                  />
                </div>

                {up.speed && up.status === 'uploading' && (
                  <div className="flex justify-between text-[10px] text-gray-500 font-mono">
                    <span>{up.speed}</span>
                    {up.eta && <span>{up.eta}</span>}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* New Folder Modal */}
      <Modal
        isOpen={newFolderModalOpen}
        onClose={() => setNewFolderModalOpen(false)}
        title="Create New Folder"
        description={
          currentFolder
            ? `Creating a nested folder inside "${currentFolder.name}"`
            : 'Creating a top-level root directory'
        }
        maxWidth="sm"
      >
        <form onSubmit={handleCreateFolder} className="space-y-4 pt-2">
          <div>
            <label className="text-xs font-semibold text-gray-300 block mb-1.5">
              Folder Name
            </label>
            <input
              type="text"
              required
              autoFocus
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              placeholder="e.g. Design Assets, Invoices"
              className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-white/10 bg-[#121217] text-white focus:outline-none focus:border-white/30"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setNewFolderModalOpen(false)}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-gray-400 hover:text-white"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={creatingFolder || !newFolderName.trim()}
              className="px-4 py-2 rounded-xl text-xs font-bold text-black bg-white hover:bg-gray-200 transition-colors disabled:opacity-50"
            >
              {creatingFolder ? 'Creating...' : 'Create Folder'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Live Presigned File Preview & Stream Modal */}
      <FilePreviewModal
        file={previewFile}
        isOpen={!!previewFile}
        onClose={() => setPreviewFile(null)}
      />
    </div>
  );
};
