import React, { useState, useEffect } from 'react';
import { ShieldAlert, Clock, X, AlertTriangle } from 'lucide-react';

interface RateLimitEventDetail {
  message: string;
  retryAfter: number;
}

export const RateLimitModal: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [retryAfter, setRetryAfter] = useState<number>(60);
  const [initialRetryAfter, setInitialRetryAfter] = useState<number>(60);

  useEffect(() => {
    const handleRateLimit = (e: Event) => {
      const customEvent = e as CustomEvent<RateLimitEventDetail>;
      const seconds = Math.max(1, customEvent.detail?.retryAfter || 60);
      setMessage(
        customEvent.detail?.message ||
          'Too many requests sent to the server. Please slow down and wait a moment.'
      );
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

  if (!isOpen) return null;

  const progressPercent = Math.min(
    100,
    Math.max(0, ((initialRetryAfter - retryAfter) / initialRetryAfter) * 100)
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop with blur */}
      <div
        className="fixed inset-0 bg-black/85 backdrop-blur-md transition-opacity animate-in fade-in duration-200"
        onClick={() => setIsOpen(false)}
      />

      {/* Modal Dialog */}
      <div className="relative w-full max-w-md rounded-3xl bg-[#0f0f14] border-2 border-red-500/30 shadow-[0_20px_70px_rgba(239,68,68,0.25)] p-6 sm:p-7 text-white z-10 animate-in fade-in zoom-in-95 duration-200 space-y-5">
        {/* Close Button */}
        <button
          onClick={() => setIsOpen(false)}
          className="absolute top-5 right-5 p-1.5 rounded-full text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
          title="Dismiss"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header with Pulsing Security Shield */}
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-2xl bg-red-500/10 border border-red-500/30 flex items-center justify-center text-red-400 shrink-0 shadow-[0_0_20px_rgba(239,68,68,0.3)]">
            <ShieldAlert className="w-6 h-6 animate-pulse" />
          </div>

          <div className="space-y-1 min-w-0 pr-4">
            <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-red-500/10 border border-red-500/20 text-[10px] font-mono font-bold text-red-400 uppercase tracking-wider">
              <AlertTriangle className="w-3 h-3" />
              Rate Limit Exceeded (HTTP 429)
            </div>
            <h3 className="text-base font-bold text-white tracking-tight">
              Too Many Requests
            </h3>
          </div>
        </div>

        {/* Server Message Card */}
        <div className="p-4 rounded-2xl bg-black/50 border border-white/[0.08] space-y-2">
          <p className="text-xs text-gray-300 leading-relaxed font-sans">
            {message}
          </p>
        </div>

        {/* Cooldown Timer & Progress Bar */}
        <div className="space-y-2 p-3.5 rounded-2xl bg-white/[0.02] border border-white/[0.06]">
          <div className="flex items-center justify-between text-xs font-mono">
            <span className="text-gray-400 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-amber-400" />
              Cooldown Window
            </span>
            <span className="text-amber-400 font-bold">
              {retryAfter > 0 ? `${retryAfter}s remaining` : 'Ready to retry'}
            </span>
          </div>

          {/* Progress Bar (Fills up as cooldown elapses) */}
          <div className="w-full bg-white/10 h-1.5 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-red-500 via-amber-500 to-emerald-400 rounded-full transition-all duration-1000 ease-linear"
              style={{ width: `${progressPercent}%` }}
            />
          </div>

          <p className="text-[10px] text-gray-500 font-mono pt-1">
            Protected by Cloudora Redis Sliding Window Log against brute-force intrusion.
          </p>
        </div>

        {/* Action Button */}
        <button
          type="button"
          onClick={() => setIsOpen(false)}
          className="w-full py-2.5 rounded-xl bg-white text-black font-semibold text-xs hover:bg-gray-200 transition-colors shadow-md"
        >
          {retryAfter > 0 ? 'Dismiss Warning' : 'Retry Request'}
        </button>
      </div>
    </div>
  );
};
