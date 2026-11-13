import React, { useState, useEffect } from 'react';
import { Trash2, RotateCcw, AlertCircle, Loader2, Folder, FileText } from 'lucide-react';
import { formatFileSize, formatRelativeTime } from '../../utils/formatters';
import { FileTypeIcon } from '../../components/common/FileTypeIcon';
import { Modal } from '../../components/ui/Modal';
import { FileItem, FolderItem } from '../../types/storage.types';
import {
  fetchTrashFiles,
  restoreFile,
  permanentlyDeleteFile,
} from '../../services/file.service';
import {
  fetchTrashedFolders,
  restoreFolder,
  permanentlyDeleteFolder,
} from '../../services/folder.service';

export const TrashPage: React.FC = () => {
  const [trashFiles, setTrashFiles] = useState<FileItem[]>([]);
  const [trashFolders, setTrashFolders] = useState<FolderItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const [itemToDelete, setItemToDelete] = useState<{ id: string; name: string; type: 'file' | 'folder' } | null>(null);
  const [emptyTrashConfirmOpen, setEmptyTrashConfirmOpen] = useState(false);
  const [actionInProgress, setActionInProgress] = useState(false);

  const loadTrash = async () => {
    setLoading(true);
    try {
      const [files, folders] = await Promise.all([
        fetchTrashFiles(),
        fetchTrashedFolders().catch(() => []),
      ]);
      setTrashFiles(files);
      setTrashFolders(folders);
    } catch (err) {
      console.error('[Trash Load Error]:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTrash();
  }, []);

  const handleRestoreFile = async (id: string, name: string) => {
    try {
      await restoreFile(id);
      setTrashFiles((prev) => prev.filter((item) => item.id !== id));
    } catch (err: any) {
      alert(err.response?.data?.message || `Failed to restore "${name}".`);
    }
  };

  const handleRestoreFolder = async (id: string, name: string) => {
    try {
      await restoreFolder(id);
      setTrashFolders((prev) => prev.filter((item) => item.id !== id));
    } catch (err: any) {
      alert(err.response?.data?.message || `Failed to restore folder "${name}".`);
    }
  };

  const handlePermanentDelete = async () => {
    if (!itemToDelete) return;
    setActionInProgress(true);
    try {
      if (itemToDelete.type === 'file') {
        await permanentlyDeleteFile(itemToDelete.id);
        setTrashFiles((prev) => prev.filter((item) => item.id !== itemToDelete.id));
      } else {
        await permanentlyDeleteFolder(itemToDelete.id);
        setTrashFolders((prev) => prev.filter((item) => item.id !== itemToDelete.id));
      }
      setItemToDelete(null);
    } catch (err: any) {
      alert(err.response?.data?.message || `Failed to permanently delete.`);
    } finally {
      setActionInProgress(false);
    }
  };

  const handleEmptyTrash = async () => {
    setActionInProgress(true);
    try {
      await Promise.all([
        ...trashFiles.map((f) => permanentlyDeleteFile(f.id)),
        ...trashFolders.map((f) => permanentlyDeleteFolder(f.id)),
      ]);
      setTrashFiles([]);
      setTrashFolders([]);
      setEmptyTrashConfirmOpen(false);
    } catch (err) {
      alert('Failed to completely empty trash.');
      loadTrash();
    } finally {
      setActionInProgress(false);
    }
  };

  const totalCount = trashFiles.length + trashFolders.length;

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/[0.08]">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight flex items-center gap-2.5">
            <Trash2 className="w-5 h-5 text-gray-300" />
            Trash & Disaster Recovery
          </h1>
          <p className="text-xs text-gray-400 mt-1 font-sans">
            Deleted items can be restored back to your drive or permanently purged from storage.
          </p>
        </div>

        {totalCount > 0 && (
          <button
            onClick={() => setEmptyTrashConfirmOpen(true)}
            className="px-4 py-2 rounded-xl text-xs font-bold text-black bg-white hover:bg-gray-200 transition-colors flex items-center gap-2"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Empty Trash ({totalCount})</span>
          </button>
        )}
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 text-gray-400 gap-3">
          <Loader2 className="w-7 h-7 animate-spin text-white" />
          <span className="text-xs font-mono">Loading trash contents...</span>
        </div>
      ) : totalCount === 0 ? (
        <div className="py-20 text-center">
          <Trash2 className="w-10 h-10 mx-auto text-gray-700 mb-3" />
          <h3 className="text-sm font-semibold text-white">Trash is Empty</h3>
          <p className="text-xs text-gray-500 mt-1 max-w-sm mx-auto font-sans">
            Items moved to trash will appear here for recovery before being permanently erased.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Trashed Folders */}
          {trashFolders.length > 0 && (
            <div className="space-y-2">
              <h2 className="text-xs font-mono font-bold uppercase tracking-wider text-gray-400 px-1">
                Trashed Folders ({trashFolders.length})
              </h2>
              <div className="space-y-1">
                {trashFolders.map((folder) => (
                  <div
                    key={folder.id}
                    className="flex items-center justify-between p-3 rounded-xl bg-[#111116] border border-white/5"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <Folder className="w-5 h-5 text-amber-400/80 shrink-0" />
                      <div className="min-w-0">
                        <span className="text-xs font-medium text-white truncate block">
                          {folder.name}
                        </span>
                        <span className="text-[10px] text-gray-500 font-mono">
                          {folder.itemsCount} items
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleRestoreFolder(folder.id, folder.name)}
                        className="px-3 py-1.5 rounded-lg text-xs font-medium text-white bg-white/10 hover:bg-white/20 flex items-center gap-1.5 transition-colors"
                      >
                        <RotateCcw className="w-3 h-3" />
                        <span>Restore</span>
                      </button>
                      <button
                        onClick={() => setItemToDelete({ id: folder.id, name: folder.name, type: 'folder' })}
                        className="p-1.5 rounded-lg text-gray-400 hover:text-red-400 hover:bg-white/5 transition-colors"
                        title="Delete Permanently"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Trashed Files */}
          {trashFiles.length > 0 && (
            <div className="space-y-2">
              <h2 className="text-xs font-mono font-bold uppercase tracking-wider text-gray-400 px-1">
                Trashed Files ({trashFiles.length})
              </h2>

              <div className="space-y-0">
                <div className="grid grid-cols-12 text-[11px] font-mono uppercase tracking-wider text-gray-500 pb-3 border-b border-white/[0.08] px-2">
                  <div className="col-span-6 sm:col-span-5">Name</div>
                  <div className="hidden sm:block sm:col-span-2">Type</div>
                  <div className="col-span-3 sm:col-span-2">Size</div>
                  <div className="col-span-3 text-right">Actions</div>
                </div>

                {trashFiles.map((file) => (
                  <div
                    key={file.id}
                    className="grid grid-cols-12 items-center py-3.5 border-b border-white/[0.06] hover:bg-white/[0.03] px-2 transition-colors"
                  >
                    <div className="col-span-6 sm:col-span-5 flex items-center gap-3 min-w-0 pr-2">
                      <FileTypeIcon category={file.category} />
                      <span className="text-xs font-medium text-white truncate">
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

                    <div className="col-span-3 text-right">
                      <div className="inline-flex items-center gap-2">
                        <button
                          onClick={() => handleRestoreFile(file.id, file.name)}
                          className="px-3 py-1.5 rounded-lg text-xs font-medium text-white bg-white/10 hover:bg-white/20 flex items-center gap-1.5 transition-colors"
                        >
                          <RotateCcw className="w-3 h-3" />
                          <span>Restore</span>
                        </button>
                        <button
                          onClick={() => setItemToDelete({ id: file.id, name: file.name, type: 'file' })}
                          className="p-1.5 rounded-lg text-gray-400 hover:text-red-400 hover:bg-white/5 transition-colors"
                          title="Delete Permanently"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={!!itemToDelete}
        onClose={() => setItemToDelete(null)}
        title="Permanently Delete Item"
        description="This action is irreversible. The object will be purged from MinIO object storage and the database permanently."
        maxWidth="sm"
      >
        <div className="space-y-4 pt-2">
          <p className="text-xs text-white">
            Are you sure you want to permanently destroy <span className="font-bold underline">{itemToDelete?.name}</span>?
          </p>
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setItemToDelete(null)}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-gray-400 hover:text-white"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={actionInProgress}
              onClick={handlePermanentDelete}
              className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-red-600 hover:bg-red-500 transition-colors disabled:opacity-50"
            >
              {actionInProgress ? 'Deleting...' : 'Delete Permanently'}
            </button>
          </div>
        </div>
      </Modal>

      {/* Empty Trash Confirmation Modal */}
      <Modal
        isOpen={emptyTrashConfirmOpen}
        onClose={() => setEmptyTrashConfirmOpen(false)}
        title="Empty Entire Trash"
        description="All items currently in the trash will be erased forever."
        maxWidth="sm"
      >
        <div className="space-y-4 pt-2">
          <p className="text-xs text-white">
            Are you sure you want to permanently purge all {totalCount} items from trash?
          </p>
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setEmptyTrashConfirmOpen(false)}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-gray-400 hover:text-white"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={actionInProgress}
              onClick={handleEmptyTrash}
              className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-red-600 hover:bg-red-500 transition-colors disabled:opacity-50"
            >
              {actionInProgress ? 'Purging...' : 'Empty Trash'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
