import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, UserCheck, UserX, KeyRound, AlertCircle, ArrowRight } from 'lucide-react';

export type AuthAlertType =
  | 'email-not-found'
  | 'email-already-exists'
  | 'invalid-password'
  | 'rate-limit'
  | 'validation'
  | 'generic';

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

  let title = 'Authentication Notice';
  let description = message || 'An error occurred while verifying your credentials.';
  let icon = <AlertCircle className="w-5 h-5 text-gray-300" />;
  let primaryButtonText: string | null = null;
  let primaryButtonAction: (() => void) | null = null;

  if (type === 'email-already-exists') {
    title = 'Account Already Exists';
    description =
      message ||
      `An account with ${email ? `"${email}"` : 'this email address'} is already registered. Would you like to sign in instead?`;
    icon = <UserCheck className="w-5 h-5 text-gray-300" />;
    primaryButtonText = 'Sign In Instead';
    primaryButtonAction = () => {
      onClose();
      navigate(email ? `/login?email=${encodeURIComponent(email)}` : '/login');
    };
  } else if (type === 'email-not-found') {
    title = 'Account Not Found';
    description =
      message ||
      `No account was found with ${email ? `"${email}"` : 'this email address'}. Please check for typos or create a new account.`;
    icon = <UserX className="w-5 h-5 text-gray-300" />;
    primaryButtonText = 'Create an Account';
    primaryButtonAction = () => {
      onClose();
      navigate(email ? `/register?email=${encodeURIComponent(email)}` : '/register');
    };
  } else if (type === 'invalid-password') {
    title = 'Incorrect Password';
    description =
      message || 'The password you entered is incorrect. Please check your credentials and try again.';
    icon = <KeyRound className="w-5 h-5 text-gray-300" />;
  } else if (type === 'rate-limit') {
    title = 'Rate Limit Exceeded';
    description =
      message || 'Too many attempts. For account security, please wait a moment before trying again.';
    icon = <AlertCircle className="w-5 h-5 text-gray-300" />;
  } else if (type === 'validation') {
    title = 'Incomplete Information';
    description = message || 'Please check the required fields and try again.';
    icon = <AlertCircle className="w-5 h-5 text-gray-300" />;
  }

  return (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4">
      {/* Subtle Dark Backdrop */}
      <div
        className="fixed inset-0 bg-black/75 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Clean Minimalist Dialog Card */}
      <div
        className="relative w-full max-w-sm rounded-2xl bg-[#0D0D12] border border-white/[0.12] shadow-2xl p-6 text-white z-10 space-y-5"
        role="alertdialog"
        aria-modal="true"
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          type="button"
          className="absolute top-4 right-4 p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/[0.06] transition-colors focus:outline-none cursor-pointer"
          aria-label="Close"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Clean Header */}
        <div className="flex items-start gap-3.5 pr-6">
          <div className="w-10 h-10 rounded-xl bg-white/[0.05] border border-white/[0.08] flex items-center justify-center text-gray-300 shrink-0">
            {icon}
          </div>
          <div className="space-y-1 min-w-0">
            <h3 className="text-base font-semibold text-white tracking-tight leading-snug">
              {title}
            </h3>
            {email && (
              <p className="text-[11px] font-mono text-gray-400 truncate max-w-[210px]">
                {email}
              </p>
            )}
          </div>
        </div>

        {/* Description Box */}
        <div className="rounded-xl bg-white/[0.03] border border-white/[0.06] p-3 text-xs text-gray-300 leading-relaxed font-sans">
          {description}
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col gap-2 pt-1">
          {primaryButtonText && primaryButtonAction && (
            <button
              type="button"
              onClick={primaryButtonAction}
              className="w-full py-2.5 px-4 rounded-xl bg-white text-black text-xs font-semibold hover:bg-gray-200 transition-colors flex items-center justify-center gap-1.5 shadow-sm cursor-pointer"
            >
              <span>{primaryButtonText}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}

          <button
            type="button"
            onClick={onClose}
            className={`w-full py-2 px-4 rounded-xl text-xs font-medium transition-colors cursor-pointer ${
              primaryButtonText
                ? 'bg-transparent text-gray-400 hover:text-white hover:bg-white/[0.05]'
                : 'bg-white text-black font-semibold hover:bg-gray-200'
            }`}
          >
            {primaryButtonText ? 'Dismiss' : 'Got it'}
          </button>
        </div>
      </div>
    </div>
  );
};
