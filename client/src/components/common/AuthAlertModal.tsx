import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, UserX, UserCheck, AlertCircle, ArrowRight, ShieldAlert, KeyRound } from 'lucide-react';

export type AuthAlertType = 'email-not-found' | 'email-already-exists' | 'invalid-password' | 'rate-limit' | 'generic';

interface AuthAlertModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: AuthAlertType;
  message?: string;
  email?: string;
}

export const AuthAlertModal: React.FC<AuthAlertModalProps> = ({
  isOpen,
  onClose,
  type,
  message,
  email,
}) => {
  const navigate = useNavigate();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.body.style.overflow = 'unset';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  // Configuration according to alert type
  let title = 'Authentication Notice';
  let description = message || 'An error occurred while verifying your credentials.';
  let icon = <AlertCircle className="w-5 h-5 text-rose-400" />;
  let iconBg = 'bg-rose-500/10 border-rose-500/20 text-rose-400';
  let primaryButtonText: string | null = null;
  let primaryButtonAction: (() => void) | null = null;

  if (type === 'email-not-found') {
    title = 'Email Not Registered';
    description = message || `No account is registered with ${email ? `"${email}"` : 'this email address'}. Please check for typos or create a new account.`;
    icon = <UserX className="w-5 h-5 text-amber-400" />;
    iconBg = 'bg-amber-400/10 border-amber-400/25 text-amber-400 shadow-[0_0_15px_rgba(251,191,36,0.15)]';
    primaryButtonText = 'Create an Account';
    primaryButtonAction = () => {
      onClose();
      navigate(email ? `/register?email=${encodeURIComponent(email)}` : '/register');
    };
  } else if (type === 'email-already-exists') {
    title = 'Account Already Exists';
    description = message || `An account with ${email ? `"${email}"` : 'this email address'} is already registered. Please sign in instead.`;
    icon = <UserCheck className="w-5 h-5 text-pix-pink" />;
    iconBg = 'bg-pix-pink/10 border-pix-pink/25 text-pix-pink shadow-[0_0_15px_rgba(244,63,94,0.15)]';
    primaryButtonText = 'Sign In to Account';
    primaryButtonAction = () => {
      onClose();
      navigate(email ? `/login?email=${encodeURIComponent(email)}` : '/login');
    };
  } else if (type === 'invalid-password') {
    title = 'Incorrect Password';
    description = message || 'The password you entered does not match our records. Please verify your credentials and try again.';
    icon = <KeyRound className="w-5 h-5 text-rose-400" />;
    iconBg = 'bg-rose-500/10 border-rose-500/25 text-rose-400 shadow-[0_0_15px_rgba(244,63,94,0.15)]';
  } else if (type === 'rate-limit') {
    title = 'Security Cooldown';
    description = message || 'Too many attempts. For your account security, please wait a moment before trying again.';
    icon = <ShieldAlert className="w-5 h-5 text-amber-400" />;
    iconBg = 'bg-amber-400/10 border-amber-400/25 text-amber-400';
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Sleek Backdrop */}
      <div
        className="fixed inset-0 bg-black/80 backdrop-blur-md transition-opacity animate-in fade-in duration-150"
        onClick={onClose}
      />

      {/* Classy Minimal Dialog Card */}
      <div
        className="relative w-full max-w-sm rounded-2xl bg-[#0C0B12] border border-white/[0.12] shadow-[0_25px_60px_rgba(0,0,0,0.85)] p-6 text-white z-10 animate-in fade-in zoom-in-95 duration-150 space-y-4"
        role="alertdialog"
        aria-modal="true"
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          type="button"
          className="absolute top-4 right-4 p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/[0.08] transition-colors focus:outline-none"
          aria-label="Close"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header with Icon and Title */}
        <div className="flex items-start gap-3.5 pr-6">
          <div className={`w-10 h-10 rounded-xl border flex items-center justify-center shrink-0 ${iconBg}`}>
            {icon}
          </div>
          <div className="space-y-1 min-w-0">
            <h3 className="text-base font-semibold tracking-tight text-white leading-snug">
              {title}
            </h3>
            {email && (
              <p className="text-[11px] font-mono text-gray-400 truncate max-w-[210px]">
                {email}
              </p>
            )}
          </div>
        </div>

        {/* Description */}
        <div className="rounded-xl bg-white/[0.03] border border-white/[0.06] p-3 text-xs text-gray-300 leading-relaxed font-sans">
          {description}
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col gap-2 pt-1">
          {primaryButtonText && primaryButtonAction && (
            <button
              type="button"
              onClick={primaryButtonAction}
              className="w-full py-2.5 px-4 rounded-xl bg-white text-black text-xs font-semibold hover:bg-gray-200 transition-colors flex items-center justify-center gap-1.5 shadow-sm"
            >
              <span>{primaryButtonText}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}

          <button
            type="button"
            onClick={onClose}
            className={`w-full py-2 px-4 rounded-xl text-xs font-medium transition-colors ${
              primaryButtonText
                ? 'bg-transparent text-gray-400 hover:text-white hover:bg-white/[0.05]'
                : 'bg-white text-black font-semibold hover:bg-gray-200'
            }`}
          >
            {primaryButtonText ? 'Dismiss' : 'Got it, try again'}
          </button>
        </div>
      </div>
    </div>
  );
};
