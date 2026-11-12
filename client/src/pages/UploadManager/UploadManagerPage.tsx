import React, { useState, useRef, useCallback } from 'react';
import {
  UploadCloud,
  CheckCircle2,
  Pause,
  Play,
  RotateCcw,
  X,
  HardDrive,
  FileText,
  Plus,
  AlertTriangle,
} from 'lucide-react';
import { formatFileSize } from '../../utils/formatters';
import { UploadQueueItem } from '../../types/storage.types';
import {
  startFileUpload,
  pauseUpload,
  resumeUpload,
  cancelUpload,
} from '../../services/multipart-upload.service';

export const UploadManagerPage: React.FC = () => {
  const [queue, setQueue] = useState<UploadQueueItem[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Update a specific item in the queue
  const updateQueueItem = useCallback((id: string, updates: Partial<UploadQueueItem>) => {
    setQueue((prev) =>
      prev.map((item) => (item.id === id ? { ...item, ...updates } : item))
    );
  }, []);

  // Handle actual file additions (from input or drag & drop)
  const enqueueFiles = useCallback((files: FileList | File[]) => {
    const fileArray = Array.from(files);
    if (fileArray.length === 0) return;

    fileArray.forEach((file) => {
      const queueId = `up-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
      const isLarge = file.size > 16 * 1024 * 1024;

      const newItem: UploadQueueItem = {
        id: queueId,
        name: file.name,
        size: file.size,
        progress: 0,
        loadedBytes: 0,
        status: 'uploading',
        speed: isLarge ? 'Initializing multipart...' : 'Connecting...',
        eta: '--',
        file,
      };

      setQueue((prev) => [newItem, ...prev]);

      // Launch actual upload
      startFileUpload(queueId, file, undefined, (updates) => {
        updateQueueItem(queueId, updates);
      });
    });
  }, [updateQueueItem]);

  // File picker handler
  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      enqueueFiles(e.target.files);
      e.target.value = '';
    }
  };

  // Drag and drop handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files) {
      enqueueFiles(e.dataTransfer.files);
    }
  };

  // Pause / Resume toggle
  const togglePause = (item: UploadQueueItem) => {
    if (item.status === 'uploading') {
      pauseUpload(item.id);
      updateQueueItem(item.id, { status: 'paused', speed: 'Paused', eta: '--' });
    } else if (item.status === 'paused') {
      updateQueueItem(item.id, { status: 'uploading', speed: 'Resuming...', eta: '--' });
      resumeUpload(item.id, (updates) => {
        updateQueueItem(item.id, updates);
      });
    }
  };

  // Retry an errored upload
  const handleRetry = (item: UploadQueueItem) => {
    if (!item.file) return;

    updateQueueItem(item.id, {
      status: 'uploading',
      errorMessage: undefined,
      speed: 'Retrying upload...',
      eta: '--',
    });

    resumeUpload(item.id, (updates) => {
      updateQueueItem(item.id, updates);
    }).catch(() => {
      // If resumption fails, restart from beginning
      if (item.file) {
        startFileUpload(item.id, item.file, item.folderId, (updates) => {
          updateQueueItem(item.id, updates);
        });
      }
    });
  };

  // Cancel upload and abort MinIO session
  const handleCancel = (id: string) => {
    cancelUpload(id);
    setQueue((prev) => prev.filter((item) => item.id !== id));
  };

  // Clear completed items from UI
  const handleClearCompleted = () => {
    setQueue((prev) => prev.filter((item) => item.status !== 'completed'));
  };

  // Queue a real 20 MB audio master (synthesized client-side) to test real multipart upload
  const handleQueueRealSampleMultipart = () => {
    const sampleSize = 20 * 1024 * 1024; // 20 MB (exceeds 16 MiB threshold)
    const buffer = new Uint8Array(sampleSize);
    // Fill with sample bytes
    for (let i = 0; i < 1024; i++) buffer[i] = i % 256;

    const sampleFile = new File(
      [buffer],
      `master_pressing_${Date.now().toString().slice(-4)}.flac`,
      { type: 'audio/flac' }
    );

    enqueueFiles([sampleFile]);
  };

  const completedCount = queue.filter((i) => i.status === 'completed').length;
  const activeCount = queue.filter((i) => i.status === 'uploading').length;

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      {/* Hidden File Input */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileInputChange}
        multiple
        className="hidden"
      />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/[0.08]">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight flex items-center gap-2.5">
            <UploadCloud className="w-5 h-5 text-gray-300" />
            Upload Manager & Transfer Queue
          </h1>
          <p className="text-xs text-gray-400 mt-1 font-sans">
            Real-time telemetry and management controls for outbound and concurrent multipart asset transfers.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          {completedCount > 0 && (
            <button
              onClick={handleClearCompleted}
              className="px-3.5 py-2 rounded-xl text-xs font-semibold text-gray-300 hover:text-white bg-[#121217] hover:bg-[#1A1A22] border border-white/10 transition-colors"
            >
              Clear Completed ({completedCount})
            </button>
          )}

          <button
            onClick={() => fileInputRef.current?.click()}
            className="px-4 py-2 rounded-xl text-xs font-bold text-black bg-white hover:bg-gray-200 transition-colors flex items-center gap-1.5 shadow-sm"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Select Files</span>
          </button>

          <button
            onClick={handleQueueRealSampleMultipart}
            title="Generate a 20 MB FLAC file to verify real multipart chunking to MinIO"
            className="px-3.5 py-2 rounded-xl text-xs font-semibold text-gray-300 hover:text-white bg-[#16161E] hover:bg-[#1E1E28] border border-white/15 transition-colors hidden md:flex items-center gap-1.5"
          >
            <HardDrive className="w-3.5 h-3.5 text-gray-400" />
            <span>Test 20MB Multipart</span>
          </button>
        </div>
      </div>

      {/* Telemetry Row (Clean Minimalist Separation) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pb-4 border-b border-white/[0.08]">
        <div className="p-4 rounded-xl bg-[#111116] flex items-center justify-between">
          <div>
            <p className="text-[11px] font-mono uppercase text-gray-400">Total in Queue</p>
            <p className="text-xl font-bold text-white mt-0.5">{queue.length} items</p>
          </div>
          <HardDrive className="w-4 h-4 text-gray-400" />
        </div>

        <div className="p-4 rounded-xl bg-[#111116] flex items-center justify-between">
          <div>
            <p className="text-[11px] font-mono uppercase text-gray-400">Active Streams</p>
            <p className="text-xl font-bold text-white mt-0.5">{activeCount} streaming</p>
          </div>
          <span
            className={`w-2 h-2 rounded-full ${
              activeCount > 0 ? 'bg-white animate-pulse' : 'bg-gray-600'
            }`}
          />
        </div>

        <div className="p-4 rounded-xl bg-[#111116] flex items-center justify-between">
          <div>
            <p className="text-[11px] font-mono uppercase text-gray-400">Completed</p>
            <p className="text-xl font-bold text-white mt-0.5">{completedCount} synchronized</p>
          </div>
          <CheckCircle2 className="w-4 h-4 text-gray-400" />
        </div>
      </div>

      {/* Drag & Drop Zone */}
      <div
        onClick={() => fileInputRef.current?.click()}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`p-8 rounded-xl border border-dashed text-center cursor-pointer transition-all group ${
          isDragging
            ? 'border-white bg-[#1A1A24]'
            : 'border-white/15 hover:border-white/40 bg-[#0E0E14]'
        }`}
      >
        <div className="w-10 h-10 mx-auto rounded-full bg-white/5 text-white flex items-center justify-center mb-2.5 group-hover:scale-105 transition-transform">
          <UploadCloud className="w-5 h-5" />
        </div>
        <p className="text-sm font-semibold text-white">
          {isDragging ? 'Drop files to upload immediately' : 'Drag & Drop files here, or click to browse'}
        </p>
        <p className="text-xs text-gray-500 mt-1 font-sans">
          Files ≤ 16 MiB use single PUT; files &gt; 16 MiB automatically use 8 MiB multipart streams with 4 concurrent connections.
        </p>
      </div>

      {/* Queue Items Stream */}
      <div className="space-y-0 pt-2">
        <h2 className="text-xs font-mono font-bold uppercase tracking-wider text-gray-400 pb-3 border-b border-white/[0.08] px-1">
          Active Transfers ({queue.length})
        </h2>

        {queue.length === 0 ? (
          <div className="py-12 text-center">
            <p className="text-xs text-gray-500 font-mono">[ QUEUE IDLE // NO ACTIVE TRANSFERS ]</p>
          </div>
        ) : (
          queue.map((item) => {
            const loaded = item.loadedBytes ?? Math.round((item.progress / 100) * item.size);

            return (
              <div
                key={item.id}
                className="py-3.5 px-2 border-b border-white/[0.06] hover:bg-white/[0.03] transition-colors space-y-2"
              >
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center text-white shrink-0">
                      {item.status === 'completed' ? (
                        <CheckCircle2 className="w-4 h-4 text-white" />
                      ) : item.status === 'error' ? (
                        <AlertTriangle className="w-4 h-4 text-red-400" />
                      ) : (
                        <FileText className="w-4 h-4" />
                      )}
                    </div>
                    <div className="truncate">
                      <p className="text-xs font-semibold text-white truncate">
                        {item.name}
                      </p>
                      <p className="text-[11px] text-gray-500 font-mono mt-0.5">
                        {formatFileSize(loaded)} of {formatFileSize(item.size)} •{' '}
                        {item.status === 'uploading'
                          ? `${item.speed || ''} • ${item.eta || ''}`
                          : item.status === 'completed'
                          ? 'Synchronized to vault'
                          : item.status === 'paused'
                          ? 'Upload paused by user'
                          : item.errorMessage || 'Upload failed'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-mono font-medium uppercase ${
                        item.status === 'completed'
                          ? 'bg-white/15 text-white'
                          : item.status === 'error'
                          ? 'bg-red-500/10 text-red-400 border border-red-500/20'
                          : item.status === 'paused'
                          ? 'bg-yellow-500/10 text-yellow-400'
                          : 'bg-white/5 text-gray-300'
                      }`}
                    >
                      {item.status}
                    </span>

                    {item.status === 'uploading' && (
                      <button
                        onClick={() => togglePause(item)}
                        className="p-1.5 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
                        title="Pause Upload"
                      >
                        <Pause className="w-3.5 h-3.5" />
                      </button>
                    )}

                    {item.status === 'paused' && (
                      <button
                        onClick={() => togglePause(item)}
                        className="p-1.5 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
                        title="Resume Upload"
                      >
                        <Play className="w-3.5 h-3.5" />
                      </button>
                    )}

                    {item.status === 'error' && (
                      <button
                        onClick={() => handleRetry(item)}
                        className="p-1.5 rounded-lg hover:bg-white/10 text-gray-300 hover:text-white transition-colors"
                        title="Retry Failed Upload"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                      </button>
                    )}

                    <button
                      onClick={() => handleCancel(item.id)}
                      className="p-1.5 rounded-lg hover:bg-white/10 text-gray-500 hover:text-white transition-colors"
                      title="Cancel Upload"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Real Progress Bar */}
                <div className="w-full bg-white/10 h-1 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-300 ${
                      item.status === 'error'
                        ? 'bg-red-400'
                        : item.status === 'completed'
                        ? 'bg-white'
                        : 'bg-white'
                    }`}
                    style={{ width: `${item.progress}%` }}
                  />
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
