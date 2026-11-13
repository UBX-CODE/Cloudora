import React, { useEffect, useState } from 'react';
import { Modal } from '../ui/Modal';
import { FileItem } from '../../types/storage.types';
import { getFilePreviewUrl, PreviewData } from '../../services/file.service';
import { downloadFile } from '../../utils/download';
import { formatFileSize, formatRelativeTime } from '../../utils/formatters';
import { Download, Loader2, PlayCircle, Music, FileText, AlertCircle } from 'lucide-react';

interface FilePreviewModalProps {
  file: FileItem | null;
  isOpen: boolean;
  onClose: () => void;
}

export const FilePreviewModal: React.FC<FilePreviewModalProps> = ({ file, isOpen, onClose }) => {
  const [loading, setLoading] = useState(false);
  const [previewData, setPreviewData] = useState<PreviewData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen || !file) {
      setPreviewData(null);
      setError(null);
      return;
    }

    let isMounted = true;
    setLoading(true);
    setError(null);

    getFilePreviewUrl(file.id)
      .then((data) => {
        if (isMounted) {
          setPreviewData(data);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (isMounted) {
          console.error('[Preview Error]:', err);
          setError(err.response?.data?.message || 'Could not generate secure preview URL.');
          setLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [isOpen, file]);

  if (!file) return null;

  const isImage = file.category === 'image';
  const isVideo = file.category === 'video';
  const isAudio = file.category === 'audio';
  const isPdf = file.extension === 'pdf' || previewData?.mimeType === 'application/pdf';

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={file.name}
      description={`Category: ${file.category.toUpperCase()} • ${formatFileSize(file.size)} • Modified ${formatRelativeTime(file.updatedAt)}`}
      maxWidth="4xl"
    >
      <div className="space-y-4 pt-2">
        {/* Preview Container */}
        <div className="w-full min-h-[260px] max-h-[70vh] flex items-center justify-center rounded-2xl bg-[#09090c] border border-white/10 overflow-hidden relative p-2">
          {loading && (
            <div className="flex flex-col items-center justify-center gap-3 py-16 text-gray-400">
              <Loader2 className="w-8 h-8 animate-spin text-white" />
              <span className="text-xs font-mono">Generating secure streaming URL...</span>
            </div>
          )}

          {error && !loading && (
            <div className="flex flex-col items-center justify-center gap-2 py-16 text-red-400 px-4 text-center">
              <AlertCircle className="w-8 h-8 text-red-400" />
              <span className="text-sm font-semibold">{error}</span>
              <span className="text-xs text-gray-500 font-mono">You can still download the file directly below.</span>
            </div>
          )}

          {!loading && !error && previewData && (
            <>
              {isImage && (
                <img
                  src={previewData.previewUrl}
                  alt={file.name}
                  className="max-h-[65vh] w-auto max-w-full mx-auto object-contain rounded-xl select-none"
                />
              )}

              {isVideo && (
                <div className="w-full flex justify-center">
                  <video
                    src={previewData.previewUrl}
                    controls
                    autoPlay
                    playsInline
                    className="max-h-[65vh] w-full rounded-xl bg-black"
                  >
                    Your browser does not support HTML5 video streaming.
                  </video>
                </div>
              )}

              {isAudio && (
                <div className="w-full max-w-lg p-6 flex flex-col items-center gap-4 text-center">
                  <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-white">
                    <Music className="w-8 h-8" />
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-white">{file.name}</h4>
                    <p className="text-xs text-gray-400 font-mono mt-0.5">High-Fidelity Audio Stream</p>
                  </div>
                  <audio
                    src={previewData.previewUrl}
                    controls
                    autoPlay
                    className="w-full mt-2"
                  >
                    Your browser does not support HTML5 audio playback.
                  </audio>
                </div>
              )}

              {isPdf && (
                <iframe
                  src={previewData.previewUrl}
                  title={file.name}
                  className="w-full h-[65vh] rounded-xl border-0 bg-white"
                />
              )}

              {!isImage && !isVideo && !isAudio && !isPdf && (
                <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
                  <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-white">
                    <FileText className="w-8 h-8" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white">{file.name}</h4>
                    <p className="text-xs text-gray-400 font-mono mt-1">
                      Inline browser preview not available for {file.extension.toUpperCase()} files.
                    </p>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer controls */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
          <span className="text-[11px] text-gray-500 font-mono">
            [ S3 PRESIGNED STREAMING • 15 MIN EXPIRY ]
          </span>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-gray-400 hover:text-white hover:bg-white/5 border border-white/10 transition-colors"
            >
              Close
            </button>
            <button
              type="button"
              onClick={() => downloadFile(file.id, file.name)}
              className="px-4 py-2 rounded-xl text-xs font-bold text-black bg-white hover:bg-gray-200 transition-colors flex items-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download</span>
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
};
