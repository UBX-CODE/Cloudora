import React, { useState, useRef, useEffect } from 'react';
import {
  X,
  Upload,
  Link as LinkIcon,
  Sparkles,
  RefreshCw,
  Check,
  Camera,
  Trash2,
  AlertCircle,
  CheckCircle2,
  Image as ImageIcon,
  Loader2,
} from 'lucide-react';
import { authService, getAvatarUrl } from '../../services/auth.service';

interface ChangeAvatarModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentAvatar: string | null;
  userName?: string;
  onSuccess: () => void;
}

// Preset collection seeds with diverse artistic themes
const PRESET_COLLECTIONS = [
  { style: 'adventurer', seeds: ['Felix', 'Luna', 'Nova', 'Leo'] },
  { style: 'bottts', seeds: ['Cyber', 'Neon', 'Aero', 'Quantum'] },
  { style: 'lorelei', seeds: ['Elena', 'Chloe', 'Zoe', 'Aria'] },
  { style: 'notionists', seeds: ['Oliver', 'Maya', 'Sam', 'Kobe'] },
];

export const ChangeAvatarModal: React.FC<ChangeAvatarModalProps> = ({
  isOpen,
  onClose,
  currentAvatar,
  userName = 'User',
  onSuccess,
}) => {
  const [activeTab, setActiveTab] = useState<'upload' | 'url' | 'presets'>('upload');

  // Upload Tab State
  const [selectedFileBase64, setSelectedFileBase64] = useState<string | null>(null);
  const [fileDetails, setFileDetails] = useState<{ name: string; size: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // URL Tab State
  const [imageUrl, setImageUrl] = useState<string>('');
  const [urlStatus, setUrlStatus] = useState<'idle' | 'valid' | 'invalid'>('idle');

  // Presets Tab State
  const [randomSeedModifier, setRandomSeedModifier] = useState<number>(0);
  const [selectedPresetUrl, setSelectedPresetUrl] = useState<string | null>(null);

  // General State
  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Reset states when opened
  useEffect(() => {
    if (isOpen) {
      setSelectedFileBase64(null);
      setFileDetails(null);
      setImageUrl('');
      setUrlStatus('idle');
      setSelectedPresetUrl(null);
      setErrorMessage(null);
      setSuccessMessage(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Handle local file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setErrorMessage('Please select a valid image file (PNG, JPG, WebP, GIF).');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setErrorMessage('Image size must be less than 5 MB.');
      return;
    }

    setErrorMessage(null);
    const sizeInKb = (file.size / 1024).toFixed(1);
    setFileDetails({ name: file.name, size: `${sizeInKb} KB` });

    const reader = new FileReader();
    reader.onload = () => {
      setSelectedFileBase64(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  // Validate image URL on change
  const handleUrlChange = (value: string) => {
    setImageUrl(value);
    setErrorMessage(null);

    if (!value.trim()) {
      setUrlStatus('idle');
      return;
    }

    if (!value.startsWith('http://') && !value.startsWith('https://')) {
      setUrlStatus('invalid');
      return;
    }

    const testImg = new window.Image();
    testImg.onload = () => setUrlStatus('valid');
    testImg.onerror = () => setUrlStatus('invalid');
    testImg.src = value.trim();
  };

  // Generate presets based on seeds
  const presetList = PRESET_COLLECTIONS.flatMap((group) =>
    group.seeds.map((seed) => {
      const actualSeed = randomSeedModifier === 0 ? seed : `${seed}-${randomSeedModifier}`;
      return {
        id: `${group.style}-${actualSeed}`,
        url: `https://api.dicebear.com/7.x/${group.style}/svg?seed=${actualSeed}`,
        label: `${group.style.toUpperCase()}: ${seed}`,
      };
    })
  );

  // Determine current active preview source
  const getActivePreviewUrl = () => {
    if (activeTab === 'upload' && selectedFileBase64) return selectedFileBase64;
    if (activeTab === 'url' && imageUrl.trim()) return imageUrl.trim();
    if (activeTab === 'presets' && selectedPresetUrl) return selectedPresetUrl;
    return getAvatarUrl(currentAvatar);
  };

  const previewSource = getActivePreviewUrl();

  // Save selected avatar
  const handleSaveAvatar = async () => {
    let newAvatarPayload: string | null = null;

    if (activeTab === 'upload') {
      if (!selectedFileBase64) {
        setErrorMessage('Please choose an image file to upload.');
        return;
      }
      newAvatarPayload = selectedFileBase64;
    } else if (activeTab === 'url') {
      if (!imageUrl.trim()) {
        setErrorMessage('Please enter an image URL.');
        return;
      }
      if (urlStatus === 'invalid') {
        setErrorMessage('The provided image URL could not be loaded. Please check the URL.');
        return;
      }
      newAvatarPayload = imageUrl.trim();
    } else if (activeTab === 'presets') {
      if (!selectedPresetUrl) {
        setErrorMessage('Please select one of the avatar presets.');
        return;
      }
      newAvatarPayload = selectedPresetUrl;
    }

    try {
      setSaving(true);
      setErrorMessage(null);
      await authService.updateProfile({ avatar: newAvatarPayload });
      setSuccessMessage('Profile avatar updated successfully!');
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 700);
    } catch (err: any) {
      setErrorMessage(err.response?.data?.message || 'Failed to save avatar.');
    } finally {
      setSaving(false);
    }
  };

  // Remove existing avatar
  const handleRemoveAvatar = async () => {
    try {
      setSaving(true);
      setErrorMessage(null);
      await authService.updateProfile({ avatar: null });
      setSuccessMessage('Avatar removed.');
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 700);
    } catch (err: any) {
      setErrorMessage(err.response?.data?.message || 'Failed to remove avatar.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/80 backdrop-blur-md transition-opacity"
        onClick={() => !saving && onClose()}
      />

      {/* Modal Dialog */}
      <div
        className="relative w-full max-w-xl rounded-2xl bg-[#111116] border border-white/10 shadow-2xl p-6 sm:p-7 text-white z-10 animate-in fade-in zoom-in-95 duration-150 overflow-hidden"
        role="dialog"
      >
        {/* Header */}
        <div className="flex items-start justify-between pb-4 border-b border-white/[0.08]">
          <div className="flex items-center gap-3">
            
            <div>
              <h2 className="text-base font-bold text-white tracking-tight">
                Change & Insert Profile Picture
              </h2>
              
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={saving}
            className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-colors disabled:opacity-50 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Live Preview Bar */}
        <div className="my-5 p-3.5 flex items-center justify-center gap-2">
          <div className="flex items-center gap-3.5">
            <div className="w-14 h-14 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center text-xl font-bold text-white overflow-hidden shadow-inner shrink-0 relative">
              {previewSource ? (
                <img
                  src={previewSource}
                  alt="Preview"
                  className="w-full h-full object-cover"
                />
              ) : (
                userName.charAt(0)?.toUpperCase() || 'U'
              )}
            </div>
            <div>
              <span className="text-xs font-bold text-white block">
                {userName}
              </span>
              <span className="text-[11px] text-gray-400 font-mono block mt-0.5">
                {previewSource
                  ? activeTab === 'upload' && selectedFileBase64
                    ? 'Previewing local file'
                    : activeTab === 'url' && imageUrl
                    ? 'Previewing image URL'
                    : activeTab === 'presets' && selectedPresetUrl
                    ? 'Previewing preset avatar'
                    : 'Current profile photo'
                  : 'Monogram avatar active'}
              </span>
            </div>
          </div>

        </div>

        {/* Navigation Tabs */}
        <div className="flex rounded-xl bg-[#0a0a0e] p-1 border border-white/5 text-xs font-medium gap-1 mb-5">
          <button
            type="button"
            onClick={() => setActiveTab('upload')}
            className={`flex-1 py-2 rounded-lg flex items-center justify-center gap-2 transition-all cursor-pointer ${
              activeTab === 'upload'
                ? 'bg-white text-black font-bold shadow-xs'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Upload File</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('url')}
            className={`flex-1 py-2 rounded-lg flex items-center justify-center gap-2 transition-all cursor-pointer ${
              activeTab === 'url'
                ? 'bg-white text-black font-bold shadow-xs'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <LinkIcon className="w-3.5 h-3.5" />
            <span>Insert Image URL</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('presets')}
            className={`flex-1 py-2 rounded-lg flex items-center justify-center gap-2 transition-all cursor-pointer ${
              activeTab === 'presets'
                ? 'bg-white text-black font-bold shadow-xs'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Presets Gallery</span>
          </button>
        </div>

        {/* Tab 1: Upload File */}
        {activeTab === 'upload' && (
          <div className="space-y-4">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept="image/png,image/jpeg,image/webp,image/gif"
              className="hidden"
            />

            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-white/10 hover:border-white/30 rounded-2xl p-6 flex flex-col items-center justify-center gap-2.5 bg-white/[0.02] hover:bg-white/[0.04] transition-all cursor-pointer group"
            >
              <div className="w-12 h-12 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Upload className="w-6 h-6" />
              </div>
              <p className="text-xs font-semibold text-white">
                Click to browse photo from computer
              </p>
              <p className="text-[11px] text-gray-500 font-mono">
                PNG, JPG, WebP, GIF up to 5 MB
              </p>
            </div>

            {fileDetails && (
              <div className="p-3 rounded-xl bg-white/[0.03] border border-white/10 flex items-center justify-between text-xs font-mono">
                <div className="flex items-center gap-2 truncate">
                  <ImageIcon className="w-4 h-4 text-purple-400 shrink-0" />
                  <span className="text-white truncate">{fileDetails.name}</span>
                  <span className="text-gray-500 shrink-0">({fileDetails.size})</span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedFileBase64(null);
                    setFileDetails(null);
                    if (fileInputRef.current) fileInputRef.current.value = '';
                  }}
                  className="text-gray-400 hover:text-rose-400 transition-colors ml-2"
                  title="Clear file"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Insert Image URL */}
        {activeTab === 'url' && (
          <div className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-gray-300 block mb-1.5">
                Image Web Address (URL)
              </label>
              <div className="relative">
                <input
                  type="url"
                  value={imageUrl}
                  onChange={(e) => handleUrlChange(e.target.value)}
                  placeholder="https://images.unsplash.com/... or https://..."
                  className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-white/10 bg-[#0a0a0e] text-white focus:outline-none focus:border-white/30 font-mono pr-24"
                />
                <button
                  type="button"
                  onClick={async () => {
                    try {
                      const clipText = await navigator.clipboard.readText();
                      if (clipText) handleUrlChange(clipText);
                    } catch {
                      // Clipboard permission denied or unsupported
                    }
                  }}
                  className="absolute right-2 top-2 px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-[11px] font-mono text-gray-300 transition-colors cursor-pointer"
                >
                  Paste
                </button>
              </div>
              <div className="flex items-center justify-between mt-1.5 text-[11px] font-mono">
                <span className="text-gray-500">
                  Direct links to JPG, PNG, WebP, or SVG are supported
                </span>
                {urlStatus === 'valid' && (
                  <span className="text-emerald-400 flex items-center gap-1 font-semibold">
                    <Check className="w-3 h-3" /> Valid image URL
                  </span>
                )}
                {urlStatus === 'invalid' && (
                  <span className="text-rose-400 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" /> Could not load image
                  </span>
                )}
              </div>
            </div>

            {/* Quick sample URLs */}
            <div className="space-y-1.5 pt-1">
              <span className="text-[10px] font-mono uppercase tracking-wider text-gray-400 block">
                Quick Insert Samples:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {[
                  { label: 'Astronaut 3D', url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=256&auto=format&fit=crop&q=80' },
                  { label: 'Neon Cyber', url: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=256&auto=format&fit=crop&q=80' },
                  { label: 'Minimal Studio', url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=256&auto=format&fit=crop&q=80' },
                ].map((sample) => (
                  <button
                    key={sample.label}
                    type="button"
                    onClick={() => handleUrlChange(sample.url)}
                    className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white border border-white/5 text-[11px] font-mono transition-colors cursor-pointer"
                  >
                    + {sample.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: Presets Gallery */}
        {activeTab === 'presets' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between text-xs">
              <span className="text-gray-400 font-mono">
                Click any avatar to select and preview
              </span>
              <button
                type="button"
                onClick={() => setRandomSeedModifier((prev) => prev + 1)}
                className="flex items-center gap-1 font-mono transition-colors cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Shuffle Avatars</span>
              </button>
            </div>

            <div className="grid grid-cols-4 sm:grid-cols-4 gap-2.5 max-h-52 overflow-y-auto pr-1">
              {presetList.map((preset) => {
                const isSelected = selectedPresetUrl === preset.url;
                return (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => {
                      setSelectedPresetUrl(preset.url);
                      setErrorMessage(null);
                    }}
                    className={`relative p-2 rounded-xl transition-all flex flex-col items-center justify-center cursor-pointer border ${
                      isSelected
                        ? 'bg-white/[0.08] border-white/[0.08]  scale-105'
                        : 'bg-[#0a0a0e] border-white/5 hover:border-white/20 hover:bg-white/5'
                    }`}
                  >
                    <div className="w-12 h-12 rounded-lg overflow-hidden flex items-center justify-center bg-white/5">
                      <img
                        src={preset.url}
                        alt={preset.label}
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                    </div>
                    
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Feedback Message */}
        {errorMessage && (
          <div className="mt-4 p-3 rounded-xl bg-white/[0.08] text-xs flex items-center gap-2 font-mono">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {successMessage && (
          <div className="mt-4 p-3 rounded-xl bg-white/[0.08] text-xs flex items-center gap-2 font-mono">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{successMessage}</span>
          </div>
        )}

        {/* Modal Footer */}
        <div className="flex items-center justify-end gap-3 pt-5 mt-5 border-t border-white/[0.08]">
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-gray-400 hover:text-white hover:bg-white/5 transition-colors cursor-pointer disabled:opacity-50"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleSaveAvatar}
            disabled={
              saving ||
              (activeTab === 'upload' && !selectedFileBase64) ||
              (activeTab === 'url' && (!imageUrl.trim() || urlStatus === 'invalid')) ||
              (activeTab === 'presets' && !selectedPresetUrl)
            }
            className="px-5 py-2 rounded-xl text-xs font-bold text-black bg-white hover:bg-gray-200 transition-all shadow-sm flex items-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
          >
            {saving && <Loader2 className="w-3.5 h-3.5 animate-spin text-black" />}
            <span>{saving ? 'Saving Avatar...' : 'Apply & Save Avatar'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
