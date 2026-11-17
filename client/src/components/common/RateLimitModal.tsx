import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Clock, X } from 'lucide-react';

interface RateLimitEventDetail {
  message?: string;
  retryAfter: number;
}

export const RateLimitModal: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [retryAfter, setRetryAfter] = useState<number>(60);
  const [initialRetryAfter, setInitialRetryAfter] = useState<number>(60);

  useEffect(() => {
    const handleRateLimit = (e: Event) => {
      const customEvent = e as CustomEvent<RateLimitEventDetail>;
      const seconds = Math.max(1, customEvent.detail?.retryAfter || 60);
      setRetryAfter(seconds);
      setInitialRetryAfter(seconds);
      setIsOpen(true);
    };

    window.addEventListener('cloudora:rate-limited', handleRateLimit);
    return () => {
      window.removeEventListener('cloudora:rate-limited', handleRateLimit);
    };
  }, []);

  // Live countdown timer
  useEffect(() => {
    if (!isOpen || retryAfter <= 0) return;

    const timer = setInterval(() => {
      setRetryAfter((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isOpen, retryAfter]);

  // Escape key handler
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false);
    };
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.body.style.overflow = 'unset';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const progressPercent = Math.min(
    100,
    Math.max(0, ((initialRetryAfter - retryAfter) / initialRetryAfter) * 100)
  );

  const modalElement = (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4">
      {/* Subtle Backdrop */}
      <div
        className="fixed inset-0 bg-black/75 backdrop-blur-sm transition-opacity"
        onClick={() => setIsOpen(false)}
      />

      {/* Clean Minimalist Dialog Card */}
      <div
        className="relative w-full max-w-sm rounded-2xl bg-[#0D0D12] border border-white/[0.12] shadow-2xl p-6 text-white z-10 space-y-5"
        role="alertdialog"
        aria-modal="true"
      >
        {/* Close Button */}
        <button
          onClick={() => setIsOpen(false)}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/[0.06] transition-colors focus:outline-none cursor-pointer"
          aria-label="Close"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Clean Header */}
        <div className="flex items-start gap-3.5 pr-6">
          <div className="w-10 h-10 rounded-xl bg-white/[0.05] border border-white/[0.08] flex items-center justify-center text-gray-300 shrink-0">
            <Clock className="w-5 h-5 text-gray-300" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-semibold text-white tracking-tight leading-snug">
              Rate Limit Exceeded
            </h3>
            <p className="text-xs text-gray-400 font-sans leading-relaxed">
              Too many requests. Please wait for the cooldown period to finish before trying again.
            </p>
          </div>
        </div>

        {/* Minimal Cooldown Bar */}
        <div className="rounded-xl bg-white/[0.03] border border-white/[0.06] p-3.5 space-y-2">
          <div className="flex items-center justify-between text-xs font-mono">
            <span className="text-gray-400">Cooldown</span>
            <span className="text-white font-semibold">
              {retryAfter > 0 ? `${retryAfter}s remaining` : 'Ready to retry'}
            </span>
          </div>

          <div className="w-full bg-white/10 h-1 rounded-full overflow-hidden">
            <div
              className="h-full bg-white rounded-full transition-all duration-1000 ease-linear"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {/* Action Button */}
        <button
          type="button"
          onClick={() => setIsOpen(false)}
          className="w-full py-2.5 px-4 rounded-xl bg-white text-black text-xs font-semibold hover:bg-gray-200 transition-colors cursor-pointer shadow-sm"
        >
          {retryAfter > 0 ? 'Dismiss' : 'Continue'}
        </button>
      </div>
    </div>
  );

  return typeof document !== 'undefined' ? createPortal(modalElement, document.body) : null;
};
