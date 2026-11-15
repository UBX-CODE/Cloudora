import React, { useState, useEffect } from 'react';
import { Play, Download, Film, Disc, Loader2, Music, Share2, Image as ImageIcon } from 'lucide-react';
import { formatFileSize, formatRelativeTime } from '../../utils/formatters';
import { FilePreviewModal } from '../../components/common/FilePreviewModal';
import { ShareModal } from '../../components/common/ShareModal';
import { FileItem } from '../../types/storage.types';
import { fetchFiles } from '../../services/file.service';
import { downloadFile } from '../../utils/download';

export const MediaPage: React.FC = () => {
  const [filter, setFilter] = useState<'all' | 'audio' | 'video' | 'image'>('all');
  const [selectedMedia, setSelectedMedia] = useState<FileItem | null>(null);
  const [shareMedia, setShareMedia] = useState<FileItem | null>(null);
  const [files, setFiles] = useState<FileItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);

    fetchFiles({ isTrashed: false, limit: 100 })
      .then((data) => {
        if (isMounted) {
          const media = data.filter(
            (f) => f.category === 'image' || f.category === 'video' || f.category === 'audio'
          );
          setFiles(media);
          setLoading(false);
        }
      })
      .catch((err) => {
        console.error('[Media Load Error]:', err);
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const filteredMedia = files.filter((item) => {
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
            <div className="w-8 h-8 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
              <Film className="w-4 h-4" />
            </div>
            Media Library
          </h1>
        </div>

        {/* Category Filter Tabs */}
        <div className="inline-flex p-1 rounded-xl bg-[#111116] border border-white/5 gap-1 text-xs font-mono">
          <button
            onClick={() => setFilter('all')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors font-medium cursor-pointer ${
              filter === 'all'
                ? 'bg-white text-black font-bold'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <Film className="w-3.5 h-3.5" />
            All ({files.length})
          </button>
          <button
            onClick={() => setFilter('audio')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors font-medium cursor-pointer ${
              filter === 'audio'
                ? 'bg-white text-black font-bold'
                : 'text-gray-400 hover:text-pink-400'
            }`}
          >
            <Music className={`w-3.5 h-3.5 ${filter === 'audio' ? 'text-black' : 'text-pink-400'}`} />
            Audio
          </button>
          <button
            onClick={() => setFilter('video')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors font-medium cursor-pointer ${
              filter === 'video'
                ? 'bg-white text-black font-bold'
                : 'text-gray-400 hover:text-purple-400'
            }`}
          >
            <Film className={`w-3.5 h-3.5 ${filter === 'video' ? 'text-black' : 'text-purple-400'}`} />
            Video
          </button>
          <button
            onClick={() => setFilter('image')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors font-medium cursor-pointer ${
              filter === 'image'
                ? 'bg-white text-black font-bold'
                : 'text-gray-400 hover:text-fuchsia-400'
            }`}
          >
            <ImageIcon className={`w-3.5 h-3.5 ${filter === 'image' ? 'text-black' : 'text-fuchsia-400'}`} />
            Images
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 text-gray-400 gap-3">
          <Loader2 className="w-7 h-7 animate-spin text-white" />
          <span className="text-xs font-mono">Loading studio assets...</span>
        </div>
      ) : filteredMedia.length === 0 ? (
        <div className="py-20 text-center text-xs text-gray-500 font-mono">
          [ NO MEDIA FILES FOUND FOR THIS CATEGORY ]
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
          {filteredMedia.map((item) => (
            <div
              key={item.id}
              onClick={() => setSelectedMedia(item)}
              className="rounded-xl bg-[#111116] hover:bg-[#181820] overflow-hidden transition-all cursor-pointer group flex flex-col justify-between border border-white/5 hover:border-white/10"
            >
              {/* Visual Canvas */}
              <div className="relative h-44 bg-black/60 flex items-center justify-center overflow-hidden">
                {item.category === 'video' ? (
                  <div className="flex flex-col items-center justify-center text-white">
                    <div className="w-14 h-14 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center mb-2 group-hover:scale-110 group-hover:shadow-[0_0_20px_rgba(168,85,247,0.3)] transition-all">
                      <Play className="w-6 h-6 fill-purple-400 text-purple-400 ml-0.5" />
                    </div>
                    <span className="text-[10px] font-mono text-purple-300 font-semibold uppercase tracking-wider">
                      PLAY VIDEO
                    </span>
                  </div>
                ) : item.category === 'audio' ? (
                  <div className="flex flex-col items-center justify-center text-white">
                    <div className="w-14 h-14 rounded-2xl bg-pink-500/10 border border-pink-500/20 flex items-center justify-center mb-2 group-hover:scale-110 group-hover:shadow-[0_0_20px_rgba(236,72,153,0.3)] transition-all text-pink-400">
                      <Music className="w-6 h-6 stroke-[2.2]" />
                    </div>
                    <span className="text-[10px] font-mono text-pink-300 font-semibold uppercase tracking-wider">
                      STREAM AUDIO
                    </span>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center text-white">
                    <div className="w-14 h-14 rounded-2xl bg-fuchsia-500/10 border border-fuchsia-500/20 flex items-center justify-center mb-2 group-hover:scale-110 group-hover:shadow-[0_0_20px_rgba(217,70,239,0.3)] transition-all text-fuchsia-400">
                      <ImageIcon className="w-6 h-6 stroke-[2.2]" />
                    </div>
                    <span className="text-[10px] font-mono text-fuchsia-300 font-semibold uppercase tracking-wider">
                      VIEW IMAGE
                    </span>
                  </div>
                )}

                {/* Tag overlay */}
                <div className="absolute top-2.5 right-2.5">
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-black/60 backdrop-blur-md text-white uppercase border border-white/10">
                    {item.extension.toUpperCase()}
                  </span>
                </div>
              </div>

              {/* Information Panel */}
              <div className="p-4 flex items-center justify-between">
                <div className="min-w-0 pr-2">
                  <h4 className="text-xs font-semibold text-white truncate group-hover:text-gray-300 transition-colors">
                    {item.name}
                  </h4>
                  <div className="flex items-center gap-2 mt-1 text-[11px] font-mono text-gray-500">
                    <span>{formatFileSize(item.size)}</span>
                    <span>•</span>
                    <span>{formatRelativeTime(item.updatedAt)}</span>
                  </div>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setShareMedia(item);
                    }}
                    className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
                    title="Share Media"
                  >
                    <Share2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      downloadFile(item.id, item.name);
                    }}
                    className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
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

      {/* Live Presigned File Preview & Stream Modal */}
      <FilePreviewModal
        file={selectedMedia}
        isOpen={!!selectedMedia}
        onClose={() => setSelectedMedia(null)}
      />

      {/* Secure Cryptographic Share Modal */}
      <ShareModal
        isOpen={Boolean(shareMedia)}
        onClose={() => setShareMedia(null)}
        target={shareMedia}
        targetType="file"
      />
    </div>
  );
};
