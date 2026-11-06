import React, { useState } from 'react';
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
} from 'lucide-react';
import { mockUploadQueue } from '../../utils/mockData';
import { formatFileSize } from '../../utils/formatters';
import { UploadQueueItem } from '../../types/storage.types';

export const UploadManagerPage: React.FC = () => {
  const [queue, setQueue] = useState<UploadQueueItem[]>(mockUploadQueue);

  const togglePause = (id: string) => {
    setQueue((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          if (item.status === 'uploading') {
            return { ...item, status: 'paused', speed: 'Paused', eta: '--' };
          }
          if (item.status === 'paused') {
            return { ...item, status: 'uploading', speed: '38.4 MB/s', eta: '3s remaining' };
          }
        }
        return item;
      })
    );
  };

  const handleRetry = (id: string) => {
    setQueue((prev) =>
      prev.map((item) =>
        item.id === id
          ? {
              ...item,
              status: 'uploading',
              progress: 25,
              errorMessage: undefined,
              speed: '29.1 MB/s',
              eta: '6s remaining',
            }
          : item
      )
    );
  };

  const handleCancel = (id: string) => {
    setQueue((prev) => prev.filter((item) => item.id !== id));
  };

  const handleAddSample = () => {
    const newItem: UploadQueueItem = {
      id: `up-${Date.now()}`,
      name: `master_pressing_${Date.now().toString().slice(-4)}.flac`,
      size: 85 * 1024 * 1024,
      progress: 0,
      status: 'uploading',
      speed: '48.2 MB/s',
      eta: '2s remaining',
    };
    setQueue((prev) => [newItem, ...prev]);

    setTimeout(() => {
      setQueue((prev) =>
        prev.map((item) =>
          item.id === newItem.id ? { ...item, progress: 100, status: 'completed' } : item
        )
      );
    }, 1500);
  };

  const completedCount = queue.filter((i) => i.status === 'completed').length;
  const activeCount = queue.filter((i) => i.status === 'uploading').length;

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/[0.08]">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight flex items-center gap-2.5">
            <UploadCloud className="w-5 h-5 text-gray-300" />
            Upload Manager & Transfer Queue
          </h1>
          <p className="text-xs text-gray-400 mt-1 font-sans">
            Real-time telemetry and management controls for outbound and concurrent asset transfers.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setQueue([])}
            className="px-3.5 py-2 rounded-xl text-xs font-semibold text-gray-300 hover:text-white bg-[#121217] hover:bg-[#1A1A22] border border-white/10 transition-colors"
          >
            Clear Completed
          </button>
          <button
            onClick={handleAddSample}
            className="px-4 py-2 rounded-xl text-xs font-bold text-black bg-white hover:bg-gray-200 transition-colors flex items-center gap-1.5 shadow-sm"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Queue Sample File</span>
          </button>
        </div>
      </div>

      {/* Telemetry Row (Clean Separator, No Heavy Outer Boxes) */}
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
          <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
        </div>

        <div className="p-4 rounded-xl bg-[#111116] flex items-center justify-between">
          <div>
            <p className="text-[11px] font-mono uppercase text-gray-400">Completed</p>
            <p className="text-xl font-bold text-white mt-0.5">{completedCount} synchronized</p>
          </div>
          <CheckCircle2 className="w-4 h-4 text-gray-400" />
        </div>
      </div>

      {/* Minimal Drop Zone */}
      <div
        onClick={handleAddSample}
        className="p-8 rounded-xl border border-dashed border-white/15 hover:border-white/40 bg-[#0E0E14] text-center cursor-pointer transition-colors group"
      >
        <div className="w-10 h-10 mx-auto rounded-full bg-white/5 text-white flex items-center justify-center mb-2.5 group-hover:scale-105 transition-transform">
          <UploadCloud className="w-5 h-5" />
        </div>
        <p className="text-sm font-semibold text-white">
          Drag & Drop assets here to initiate upload
        </p>
        <p className="text-xs text-gray-500 mt-1 font-sans">
          Click anywhere in this container to simulate queuing a high-resolution FLAC audio master.
        </p>
      </div>

      {/* Queue Items Stream (Only Bottom Divider Lines) */}
      <div className="space-y-0 pt-2">
        <h2 className="text-xs font-mono font-bold uppercase tracking-wider text-gray-400 pb-3 border-b border-white/[0.08] px-1">
          Active Transfers ({queue.length})
        </h2>

        {queue.length === 0 ? (
          <div className="py-12 text-center">
            <p className="text-xs text-gray-500 font-mono">[ QUEUE IDLE // NO ACTIVE TRANSFERS ]</p>
          </div>
        ) : (
          queue.map((item) => (
            <div
              key={item.id}
              className="py-3.5 px-2 border-b border-white/[0.06] hover:bg-white/[0.03] transition-colors space-y-2"
            >
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center text-white shrink-0">
                    <FileText className="w-4 h-4" />
                  </div>
                  <div className="truncate">
                    <p className="text-xs font-semibold text-white truncate">
                      {item.name}
                    </p>
                    <p className="text-[11px] text-gray-500 font-mono mt-0.5">
                      {formatFileSize(item.size)} •{' '}
                      {item.status === 'uploading'
                        ? `${item.speed} • ${item.eta}`
                        : item.status === 'completed'
                        ? 'Synchronized to vault'
                        : item.status === 'paused'
                        ? 'Upload paused by user'
                        : item.errorMessage}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-medium uppercase bg-white/5 text-gray-300">
                    {item.status}
                  </span>

                  {item.status === 'uploading' && (
                    <button
                      onClick={() => togglePause(item.id)}
                      className="p-1.5 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
                      title="Pause"
                    >
                      <Pause className="w-3.5 h-3.5" />
                    </button>
                  )}

                  {item.status === 'paused' && (
                    <button
                      onClick={() => togglePause(item.id)}
                      className="p-1.5 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
                      title="Resume"
                    >
                      <Play className="w-3.5 h-3.5" />
                    </button>
                  )}

                  {item.status === 'error' && (
                    <button
                      onClick={() => handleRetry(item.id)}
                      className="p-1.5 rounded-lg hover:bg-white/10 text-gray-300 hover:text-white transition-colors"
                      title="Retry"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                    </button>
                  )}

                  <button
                    onClick={() => handleCancel(item.id)}
                    className="p-1.5 rounded-lg hover:bg-white/10 text-gray-500 hover:text-white transition-colors"
                    title="Cancel"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <div className="w-full bg-white/10 h-1 rounded-full overflow-hidden">
                <div
                  className="bg-white h-full rounded-full transition-all duration-300"
                  style={{ width: `${item.progress}%` }}
                />
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
