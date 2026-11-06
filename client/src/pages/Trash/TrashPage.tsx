import React, { useState } from 'react';
import { Trash2, RotateCcw, AlertCircle } from 'lucide-react';
import { mockTrashFiles } from '../../utils/mockData';
import { formatFileSize, formatRelativeTime } from '../../utils/formatters';
import { FileTypeIcon } from '../../components/common/FileTypeIcon';
import { Modal } from '../../components/ui/Modal';
import { FileItem } from '../../types/storage.types';

export const TrashPage: React.FC = () => {
  const [trashItems, setTrashItems] = useState<FileItem[]>(mockTrashFiles);
  const [itemToDelete, setItemToDelete] = useState<FileItem | null>(null);
  const [emptyTrashConfirmOpen, setEmptyTrashConfirmOpen] = useState(false);

  const handleRestore = (id: string, name: string) => {
    setTrashItems((prev) => prev.filter((item) => item.id !== id));
    alert(`Restored "${name}" back to vault.`);
  };

  const handlePermanentDelete = () => {
    if (!itemToDelete) return;
    setTrashItems((prev) => prev.filter((item) => item.id !== itemToDelete.id));
    setItemToDelete(null);
  };

  const handleEmptyTrash = () => {
    setTrashItems([]);
    setEmptyTrashConfirmOpen(false);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/[0.08]">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight flex items-center gap-2.5">
            <Trash2 className="w-5 h-5 text-gray-300" />
            Trash & Disaster Recovery
          </h1>
          <p className="text-xs text-gray-400 mt-1 font-sans">
            Deleted items are shielded for 30 days before permanent purging. You can restore or destroy them immediately.
          </p>
        </div>

        {trashItems.length > 0 && (
          <button
            onClick={() => setEmptyTrashConfirmOpen(true)}
            className="px-4 py-2 rounded-xl text-xs font-bold text-black bg-white hover:bg-gray-200 transition-colors flex items-center gap-2"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Empty Trash ({trashItems.length})</span>
          </button>
        )}
      </div>

      {trashItems.length === 0 ? (
        <div className="py-16 text-center">
          <Trash2 className="w-10 h-10 mx-auto text-gray-700 mb-3" />
          <h3 className="text-sm font-semibold text-white">
            Trash is Empty
          </h3>
          <p className="text-xs text-gray-500 mt-1 max-w-sm mx-auto font-sans">
            No deleted files found. Any assets you remove from your workspace will appear here before permanent purging.
          </p>
        </div>
      ) : (
        <div className="space-y-0">
          {/* Header Row */}
          <div className="grid grid-cols-12 text-[11px] font-mono uppercase tracking-wider text-gray-500 pb-3 border-b border-white/[0.08] px-2">
            <div className="col-span-5 sm:col-span-4">Item Name</div>
            <div className="hidden sm:block sm:col-span-2">Category</div>
            <div className="col-span-3 sm:col-span-2">Size</div>
            <div className="hidden sm:block sm:col-span-2">Deleted Date</div>
            <div className="col-span-4 sm:col-span-2 text-right">Actions</div>
          </div>

          {/* Rows */}
          {trashItems.map((item) => (
            <div
              key={item.id}
              className="grid grid-cols-12 items-center py-3.5 border-b border-white/[0.06] hover:bg-white/[0.03] px-2 transition-colors group"
            >
              <div className="col-span-5 sm:col-span-4 font-medium flex items-center gap-3 min-w-0 pr-2">
                <FileTypeIcon category={item.category} />
                <span className="text-xs font-medium text-white truncate">
                  {item.name}
                </span>
              </div>

              <div className="hidden sm:block sm:col-span-2">
                <span className="capitalize text-gray-400 font-mono text-[11px] px-2 py-0.5 rounded bg-white/[0.04]">
                  {item.category}
                </span>
              </div>

              <div className="col-span-3 sm:col-span-2 font-mono text-gray-400 text-xs">
                {formatFileSize(item.size)}
              </div>

              <div className="hidden sm:block sm:col-span-2 font-mono text-gray-500 text-xs">
                {item.deletedAt ? formatRelativeTime(item.deletedAt) : 'Recently'}
              </div>

              <div className="col-span-4 sm:col-span-2 text-right">
                <div className="inline-flex items-center gap-2">
                  <button
                    onClick={() => handleRestore(item.id, item.name)}
                    className="px-2.5 py-1 rounded-lg text-xs font-medium text-gray-300 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 flex items-center gap-1"
                  >
                    <RotateCcw className="w-3 h-3 text-white" />
                    <span>Restore</span>
                  </button>
                  <button
                    onClick={() => setItemToDelete(item)}
                    className="px-2.5 py-1 rounded-lg text-xs font-medium text-gray-400 hover:text-white hover:bg-white/10 flex items-center gap-1"
                  >
                    <Trash2 className="w-3 h-3" />
                    <span>Purge</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Empty Trash Confirmation Modal */}
      <Modal
        isOpen={emptyTrashConfirmOpen}
        onClose={() => setEmptyTrashConfirmOpen(false)}
        title="Permanently Empty Trash?"
        description="This will destroy all items currently staged in trash. This action cannot be undone."
        maxWidth="sm"
      >
        <div className="space-y-4 pt-2">
          <div className="p-4 rounded-xl bg-white/[0.04] border border-white/10 text-xs text-gray-300 flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-white" />
            <span className="font-mono">
              All cryptographic references to these files will be wiped permanently from your vault.
            </span>
          </div>

          <div className="flex justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={() => setEmptyTrashConfirmOpen(false)}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-gray-400 hover:text-white hover:bg-white/5 border border-white/10"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleEmptyTrash}
              className="px-4 py-2 rounded-xl text-xs font-bold text-black bg-white hover:bg-gray-200 transition-colors"
            >
              Confirm Empty Trash
            </button>
          </div>
        </div>
      </Modal>

      {/* Single Item Purge Confirmation Modal */}
      <Modal
        isOpen={!!itemToDelete}
        onClose={() => setItemToDelete(null)}
        title="Permanently Delete Item?"
        description={`"${itemToDelete?.name}" will be wiped from disk storage immediately.`}
        maxWidth="sm"
      >
        <div className="space-y-4 pt-2">
          <div className="flex justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={() => setItemToDelete(null)}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-gray-400 hover:text-white hover:bg-white/5 border border-white/10"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handlePermanentDelete}
              className="px-4 py-2 rounded-xl text-xs font-bold text-black bg-white hover:bg-gray-200 transition-colors"
            >
              Purge File
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
