import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  Lock,
  Download,
  Eye,
  Clock,
  ShieldCheck,
  AlertCircle,
  FileText,
  Folder,
  ArrowRight,
  ExternalLink,
  Loader2,
  CheckCircle,
} from 'lucide-react';
import {
  getPublicShare,
  verifyPublicPassword,
  PublicShareData,
} from '../../services/share.service';
import { formatFileSize, formatRelativeTime } from '../../utils/formatters';
import { FileTypeIcon } from '../../components/common/FileTypeIcon';
import { FileCategory } from '../../types/storage.types';

export const PublicSharePage: React.FC = () => {
  const { token } = useParams<{ token: string }>();

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [shareData, setShareData] = useState<PublicShareData | null>(null);

  // Password Unlock state
  const [password, setPassword] = useState('');
  const [isUnlocking, setIsUnlocking] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;

    const loadPublicShare = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const data = await getPublicShare(token);
        setShareData(data);
      } catch (err: any) {
        if (err.response?.status === 410) {
          setError('This share link has expired and is no longer available.');
        } else if (err.response?.status === 404) {
          setError('This share link does not exist or has been revoked by the owner.');
        } else {
          setError(err.response?.data?.message || 'Failed to load shared asset.');
        }
      } finally {
        setIsLoading(false);
      }
    };

    loadPublicShare();
  }, [token]);

  const handleUnlock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !password.trim()) return;

    try {
      setIsUnlocking(true);
      setPasswordError(null);
      const data = await verifyPublicPassword(token, password.trim());
      setShareData(data);
    } catch (err: any) {
      setPasswordError(err.response?.data?.message || 'Incorrect password. Please try again.');
    } finally {
      setIsUnlocking(false);
    }
  };

  // Loading Screen
  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#070709] flex flex-col items-center justify-center text-white px-4">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-white/[0.04] border border-white/10 flex items-center justify-center">
            <Loader2 className="w-6 h-6 animate-spin text-white" />
          </div>
          <p className="text-sm font-mono text-gray-400">Verifying secure share link...</p>
        </div>
      </div>
    );
  }

  // Error Screen
  if (error || !shareData) {
    return (
      <div className="min-h-screen bg-[#070709] flex flex-col items-center justify-center text-white px-4">
        <div className="w-full max-w-md p-8 rounded-2xl bg-[#0f0f13] border border-white/[0.08] shadow-2xl text-center space-y-5">
          <div className="w-14 h-14 rounded-full bg-red-500/10 border border-red-500/20 text-red-400 flex items-center justify-center mx-auto">
            <AlertCircle className="w-7 h-7" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">Share Link Unavailable</h2>
            <p className="text-xs text-gray-400 mt-2 leading-relaxed">{error}</p>
          </div>
          <Link
            to="/"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white text-black font-semibold text-xs hover:bg-gray-200 transition-colors"
          >
            Go to Cloudora Home <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    );
  }

  // Password Lock Screen
  if (shareData.requiresPassword) {
    return (
      <div className="min-h-screen bg-[#070709] flex flex-col items-center justify-center text-white px-4">
        <div className="w-full max-w-md p-8 rounded-2xl bg-[#0f0f13] border border-white/[0.08] shadow-2xl space-y-6">
          <div className="text-center space-y-2">
            <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center mx-auto">
              <Lock className="w-7 h-7" />
            </div>
            <h2 className="text-lg font-bold text-white">Password Protected Link</h2>
            <p className="text-xs text-gray-400">
              <span className="font-semibold text-gray-200">{shareData.owner?.name || 'User'}</span> has
              protected <span className="text-white font-mono">"{shareData.targetName}"</span> with a
              password.
            </p>
          </div>

          <form onSubmit={handleUnlock} className="space-y-4">
            {passwordError && (
              <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-xs text-red-400 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{passwordError}</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1.5">Enter Password</label>
              <input
                type="password"
                placeholder="Access password..."
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoFocus
                className="w-full bg-[#16161c] border border-white/[0.1] rounded-xl px-4 py-2.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-white/40"
              />
            </div>

            <button
              type="submit"
              disabled={isUnlocking || !password.trim()}
              className="w-full py-2.5 rounded-xl bg-white text-black font-semibold text-xs hover:bg-gray-200 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isUnlocking ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  Decrypting & Unlocking...
                </>
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4" />
                  Unlock Asset
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    );
  }

  // Active Share View
  const isFile = shareData.targetType === 'file' && Boolean(shareData.file);
  const file = shareData.file;
  const folder = shareData.folder;

  return (
    <div className="min-h-screen bg-[#070709] text-white flex flex-col">
      {/* Top Navigation Bar */}
      <header className="h-16 border-b border-white/[0.08] bg-[#070709]/80 backdrop-blur-md px-6 flex items-center justify-between sticky top-0 z-50">
        <Link to="/" className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-white text-black flex items-center justify-center font-black text-sm">
            C
          </div>
          <span className="font-bold text-base tracking-tight text-white font-mono">CLOUDORA</span>
        </Link>

        <div className="flex items-center gap-3">
          <span className="text-[11px] font-mono text-gray-400 hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/[0.04] border border-white/[0.08]">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            Verified Transfer
          </span>
          <Link
            to="/register"
            className="px-3.5 py-1.5 rounded-lg bg-white/[0.06] hover:bg-white/[0.12] border border-white/[0.1] text-xs font-medium text-white transition-colors"
          >
            Create Free Account
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-5xl w-full mx-auto p-4 sm:p-8 space-y-6">
        {/* Banner Card */}
        <div className="p-6 rounded-2xl bg-[#0f0f13] border border-white/[0.08] shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-start gap-4 min-w-0">
            {isFile && file ? (
              <div className="w-14 h-14 rounded-2xl bg-white/[0.04] border border-white/[0.08] flex items-center justify-center shrink-0">
                <FileTypeIcon category={file.category as FileCategory} />
              </div>
            ) : (
              <div className="w-14 h-14 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center shrink-0 text-blue-400">
                <Folder className="w-7 h-7" />
              </div>
            )}

            <div className="min-w-0 space-y-1">
              <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight truncate">
                {shareData.targetName}
              </h1>
              <div className="flex flex-wrap items-center gap-3 text-xs text-gray-400 font-mono">
                <span>Shared by {shareData.owner?.name || 'Cloudora User'}</span>
                <span>•</span>
                {isFile && file && <span>{formatFileSize(file.size)}</span>}
                {folder && <span>{folder.files.length} items</span>}
                <span>•</span>
                <span>{shareData.viewsCount} {shareData.viewsCount === 1 ? 'view' : 'views'}</span>
                {shareData.expiresAt && (
                  <>
                    <span>•</span>
                    <span className="text-amber-400 flex items-center gap-1">
                      <Clock className="w-3 h-3" /> Expires{' '}
                      {new Date(shareData.expiresAt).toLocaleDateString()}
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Download Action for File */}
          {isFile && file && (
            <div className="flex items-center gap-3 shrink-0">
              <a
                href={file.downloadUrl}
                download={file.name}
                className="px-5 py-2.5 rounded-xl bg-white text-black font-semibold text-xs hover:bg-gray-200 transition-colors flex items-center gap-2 shadow-lg"
              >
                <Download className="w-4 h-4" />
                Download ({formatFileSize(file.size)})
              </a>
            </div>
          )}
        </div>

        {/* File Preview Player */}
        {isFile && file && (
          <div className="rounded-2xl bg-[#0f0f13] border border-white/[0.08] overflow-hidden">
            <div className="px-5 py-3 border-b border-white/[0.06] flex items-center justify-between text-xs font-mono text-gray-400">
              <span className="flex items-center gap-2">
                <Eye className="w-3.5 h-3.5" /> File Preview
              </span>
              <span>{file.mimeType}</span>
            </div>

            <div className="p-4 sm:p-8 flex items-center justify-center min-h-[360px] bg-black/40">
              {file.category === 'image' ? (
                <img
                  src={file.previewUrl}
                  alt={file.name}
                  className="max-h-[600px] max-w-full rounded-xl object-contain shadow-2xl"
                />
              ) : file.category === 'video' ? (
                <video
                  controls
                  src={file.previewUrl}
                  className="max-h-[600px] w-full rounded-xl shadow-2xl"
                />
              ) : file.category === 'audio' ? (
                <div className="w-full max-w-lg p-6 rounded-2xl bg-white/[0.02] border border-white/[0.08] text-center space-y-4">
                  <div className="w-16 h-16 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center mx-auto">
                    <Eye className="w-8 h-8" />
                  </div>
                  <h3 className="text-sm font-semibold text-white">{file.name}</h3>
                  <audio controls src={file.previewUrl} className="w-full" />
                </div>
              ) : file.mimeType === 'application/pdf' ? (
                <iframe
                  src={file.previewUrl}
                  title={file.name}
                  className="w-full h-[650px] rounded-xl border border-white/[0.08]"
                />
              ) : (
                <div className="text-center space-y-3 py-12">
                  <FileText className="w-12 h-12 text-gray-500 mx-auto" />
                  <p className="text-sm text-gray-400">Direct preview not available for this format.</p>
                  <a
                    href={file.downloadUrl}
                    download={file.name}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white text-black font-semibold text-xs hover:bg-gray-200 transition-colors"
                  >
                    <Download className="w-3.5 h-3.5" /> Download to view
                  </a>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Folder Content Listing */}
        {folder && (
          <div className="rounded-2xl bg-[#0f0f13] border border-white/[0.08] overflow-hidden">
            <div className="px-5 py-3 border-b border-white/[0.06] text-xs font-mono text-gray-400 flex items-center justify-between">
              <span>Directory Contents</span>
              <span>{folder.files.length} items</span>
            </div>

            <div className="divide-y divide-white/[0.04]">
              {folder.files.length === 0 && folder.subfolders.length === 0 ? (
                <div className="p-8 text-center text-xs text-gray-500 font-mono">
                  This shared folder is empty.
                </div>
              ) : (
                <>
                  {folder.subfolders.map((sub) => (
                    <div
                      key={sub.id}
                      className="p-4 flex items-center justify-between hover:bg-white/[0.02] transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <Folder className="w-5 h-5 text-blue-400" />
                        <span className="text-xs font-medium text-white">{sub.name}</span>
                      </div>
                      <span className="text-[11px] font-mono text-gray-500">Folder</span>
                    </div>
                  ))}

                  {folder.files.map((f) => (
                    <div
                      key={f.id}
                      className="p-4 flex items-center justify-between hover:bg-white/[0.02] transition-colors"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <FileTypeIcon category={f.category as FileCategory} />
                        <span className="text-xs font-medium text-white truncate">{f.name}</span>
                      </div>
                      <div className="flex items-center gap-4 shrink-0 font-mono text-xs">
                        <span className="text-gray-400">{formatFileSize(f.size)}</span>
                      </div>
                    </div>
                  ))}
                </>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
};
