import React, { useState } from 'react';
import { Play, Download, Film, Disc } from 'lucide-react';
import { mockFiles } from '../../utils/mockData';
import { formatFileSize, formatRelativeTime } from '../../utils/formatters';
import { Modal } from '../../components/ui/Modal';
import { FileItem } from '../../types/storage.types';

export const MediaPage: React.FC = () => {
  const [filter, setFilter] = useState<'all' | 'audio' | 'video' | 'image'>('all');
  const [selectedMedia, setSelectedMedia] = useState<FileItem | null>(null);

  const mediaFiles = mockFiles.filter(
    (f) => f.category === 'image' || f.category === 'video' || f.category === 'audio'
  );

  const filteredMedia = mediaFiles.filter((item) => {
    if (filter === 'image') return item.category === 'image';
    if (filter === 'video') return item.category === 'video';
    if (filter === 'audio') return item.category === 'audio';
    return true;
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      {/* Header and Category Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/[0.08]">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight flex items-center gap-2.5">
            <Film className="w-5 h-5 text-gray-300" />
            Media & Studio Archive
          </h1>
          <p className="text-xs text-gray-400 mt-1 font-sans">
            Lossless studio FLAC stems at 192 kHz, 4K digital video reels, and high-fidelity artwork.
          </p>
        </div>

        {/* Category Filter Tabs */}
        <div className="inline-flex p-1 rounded-xl bg-[#111116] gap-1 text-xs font-mono">
          <button
            onClick={() => setFilter('all')}
            className={`px-3 py-1.5 rounded-lg transition-colors font-medium ${
              filter === 'all'
                ? 'bg-white text-black font-bold'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            All Media ({mediaFiles.length})
          </button>
          <button
            onClick={() => setFilter('audio')}
            className={`px-3 py-1.5 rounded-lg transition-colors font-medium ${
              filter === 'audio'
                ? 'bg-white text-black font-bold'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Audio (FLAC)
          </button>
          <button
            onClick={() => setFilter('video')}
            className={`px-3 py-1.5 rounded-lg transition-colors font-medium ${
              filter === 'video'
                ? 'bg-white text-black font-bold'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            4K Video
          </button>
          <button
            onClick={() => setFilter('image')}
            className={`px-3 py-1.5 rounded-lg transition-colors font-medium ${
              filter === 'image'
                ? 'bg-white text-black font-bold'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Artwork & Images
          </button>
        </div>
      </div>

      {/* Media Grid (Minimalist Flat Cards, No Outer Boxy Borders) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
        {filteredMedia.map((item) => (
          <div
            key={item.id}
            onClick={() => setSelectedMedia(item)}
            className="rounded-xl bg-[#111116] hover:bg-[#181820] overflow-hidden transition-all cursor-pointer group flex flex-col justify-between"
          >
            {/* Visual Canvas */}
            <div className="relative h-44 bg-black/60 flex items-center justify-center overflow-hidden">
              {item.thumbnailUrl ? (
                <img
                  src={item.thumbnailUrl}
                  alt={item.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                />
              ) : item.category === 'video' ? (
                <div className="flex flex-col items-center justify-center text-white">
                  <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                    <Play className="w-4 h-4 fill-white ml-0.5 text-white" />
                  </div>
                  <span className="text-[10px] font-mono text-gray-500 uppercase tracking-wider">
                    4K REEL
                  </span>
                </div>
              ) : item.category === 'audio' ? (
                <div className="flex flex-col items-center justify-center text-white">
                  <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform text-white">
                    <Disc className="w-6 h-6 animate-spin [animation-duration:8s]" />
                  </div>
                  <span className="text-[10px] font-mono text-gray-400 uppercase tracking-wider">
                    192 KHZ MASTER
                  </span>
                </div>
              ) : (
                <div className="text-gray-600 font-mono text-xs">PREVIEW ASSET</div>
              )}

              {/* Tag overlay */}
              <div className="absolute top-3 left-3">
                <span className="px-2 py-0.5 rounded text-[9px] font-mono font-bold uppercase tracking-wider bg-black/80 backdrop-blur-md text-white">
                  {item.category === 'audio' ? 'FLAC' : item.category === 'video' ? 'PRORES' : 'RAW'}
                </span>
              </div>
            </div>

            {/* Metadata Footer */}
            <div className="p-3.5 space-y-1.5">
              <h3 className="text-xs font-semibold text-white group-hover:text-gray-300 transition-colors truncate">
                {item.name}
              </h3>
              <div className="flex items-center justify-between text-[11px] text-gray-500 font-mono">
                <span>{formatFileSize(item.size)}</span>
                <span>{formatRelativeTime(item.updatedAt)}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Media Playback Modal */}
      <Modal
        isOpen={!!selectedMedia}
        onClose={() => setSelectedMedia(null)}
        title={selectedMedia?.name}
        description={`Format: ${selectedMedia?.extension.toUpperCase()} • Size: ${
          selectedMedia ? formatFileSize(selectedMedia.size) : ''
        }`}
        maxWidth="lg"
      >
        <div className="space-y-4 pt-1">
          <div className="rounded-xl overflow-hidden bg-black flex items-center justify-center min-h-64 border border-white/10 relative">
            {selectedMedia?.thumbnailUrl ? (
              <img
                src={selectedMedia.thumbnailUrl}
                alt={selectedMedia.name}
                className="max-h-80 w-full object-contain"
              />
            ) : selectedMedia?.category === 'audio' ? (
              <div className="p-8 text-center space-y-4 w-full">
                <div className="w-14 h-14 mx-auto rounded-full bg-white/10 flex items-center justify-center text-white">
                  <Disc className="w-7 h-7 animate-spin" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white font-mono">{selectedMedia?.name}</h4>
                  <p className="text-xs text-gray-400 font-mono mt-1">Lossless Studio Stem • 192kHz Master</p>
                </div>
                {/* Visualizer bars */}
                <div className="flex items-center justify-center gap-1 h-8 max-w-xs mx-auto">
                  {[40, 75, 20, 90, 60, 85, 30, 95, 70, 50, 80, 45, 65, 35, 90].map((h, i) => (
                    <div
                      key={i}
                      className="w-1 bg-white rounded-full animate-pulse"
                      style={{ height: `${h}%`, animationDelay: `${i * 70}ms` }}
                    />
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-center p-8 text-gray-400 font-mono text-xs">
                [ 4K PRORES PLAYER INITIALIZED ]
              </div>
            )}
          </div>

          <div className="flex justify-between items-center pt-1">
            <span className="text-xs text-gray-500 font-mono">
              [ DIRECT HIGH-FIDELITY BUFFER ]
            </span>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setSelectedMedia(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-gray-400 hover:text-white hover:bg-white/5 border border-white/10"
              >
                Close
              </button>
              <button
                type="button"
                className="px-4 py-2 rounded-xl text-xs font-bold text-black bg-white hover:bg-gray-200 transition-colors flex items-center gap-1.5"
                onClick={() => {
                  alert(`Downloaded: ${selectedMedia?.name}`);
                  setSelectedMedia(null);
                }}
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download Master</span>
              </button>
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
};
