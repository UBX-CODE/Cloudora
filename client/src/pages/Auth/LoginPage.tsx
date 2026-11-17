import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { Lock, Mail, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { CloudoraLogo } from '../../components/common/CloudoraLogo';
import { WireframeGlobe, CapsuleLozengeRow } from '../../components/common/PixGraphics';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';

export const LoginPage: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isForgotModalOpen, setIsForgotModalOpen] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotSent, setForgotSent] = useState(false);

  const [emailError, setEmailError] = useState<React.ReactNode>('');
  const [passwordError, setPasswordError] = useState<React.ReactNode>('');

  // Pre-fill email from URL query if user was redirected from RegisterPage
  useEffect(() => {
    const queryEmail = searchParams.get('email');
    if (queryEmail) {
      setEmail(queryEmail);
    }
  }, [searchParams]);

  const validateForm = (): boolean => {
    let isValid = true;
    setEmailError('');
    setPasswordError('');
    setError(null);

    if (!email.trim()) {
      setEmailError('Email address is required.');
      isValid = false;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setEmailError('Please enter a valid email address.');
      isValid = false;
    }

    if (!password) {
      setPasswordError('Password is required.');
      isValid = false;
    }

    return isValid;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsLoading(true);
    setError(null);

    try {
      await login(email, password);
      const from = (location.state as any)?.from?.pathname || '/dashboard';
      navigate(from, { replace: true });
    } catch (err: any) {
      const status = err.response?.status;
      const message =
        err.response?.data?.message || err.message || 'Login failed. Please check your credentials.';
      console.warn('[Login Error]', { status, message });

      const lowerMsg = message.toLowerCase();
      if (
        status === 404 ||
        lowerMsg.includes('no account') ||
        lowerMsg.includes('not found') ||
        lowerMsg.includes('not register') ||
        lowerMsg.includes('user not found')
      ) {
        setEmailError(
          <span>
            No account found with this email.{' '}
            <Link
              to={`/register?email=${encodeURIComponent(email.trim())}`}
              className="text-white underline font-semibold hover:text-pix-yellow"
            >
              Create an account
            </Link>
          </span>
        );
      } else if (
        status === 401 ||
        lowerMsg.includes('password') ||
        lowerMsg.includes('invalid credentials')
      ) {
        setPasswordError('Incorrect password. Please try again.');
      } else if (status === 429) {
        // Handled globally by RateLimitModal
      } else {
        setError(message);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const fillTestCredentials = () => {
    setEmail('elena@cloudora.io');
    setPassword('Password@123');
    setEmailError('');
    setPasswordError('');
  };

  const handleForgotPassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (forgotEmail && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(forgotEmail)) {
      setForgotSent(true);
    }
  };

  return (
    <div className="min-h-screen bg-[#08080C] text-white flex flex-col justify-between relative overflow-hidden">
      
      {/* Left Flank Floating Polaroid Meme Sticker Card */}
      <div className="hidden lg:flex absolute left-4 xl:left-14 top-1/2 -translate-y-1/2 flex-col items-center select-none pointer-events-none z-10 -rotate-3 hover:rotate-0 transition-transform duration-300">
        <div className="w-20 h-5 bg-[#FFD13B] border border-black shadow-sm -mb-2.5 z-20 transform -rotate-2" />
        <div className="w-56 p-3 bg-white rounded-2xl border-2 border-black shadow-[0_20px_40px_rgba(0,0,0,0.7)] text-black">
          <div className="relative rounded-xl overflow-hidden aspect-square border border-black/15 bg-black/5">
            <img
              src="/assets/card-monitor-badge-cat.jpg"
              alt="Security Officer Cat"
              className="w-full h-full object-cover"
            />
            
          </div>
          <div className="mt-2.5 text-center">
            <div className="font-mono text-xs font-black uppercase tracking-wider text-black">
              AUTHORIZED TENANT
            </div>
            
          </div>
        </div>
      </div>

      {/* Right Flank Floating Polaroid Meme Sticker Card */}
      <div className="hidden lg:flex absolute right-4 xl:right-14 top-1/2 -translate-y-1/2 flex-col items-center select-none pointer-events-none z-10 rotate-3 hover:rotate-0 transition-transform duration-300">
        <div className="w-20 h-5 bg-[#FF5E97] border border-black shadow-sm -mb-2.5 z-20 transform rotate-2" />
        <div className="w-56 p-3 bg-white rounded-2xl border-2 border-black shadow-[0_20px_40px_rgba(0,0,0,0.7)] text-black">
          <div className="relative rounded-xl overflow-hidden aspect-square border border-black/15 bg-black/5">
            <img
              src="/assets/card-store-typing-cat.jpg"
              alt="Vault Sync Cat"
              className="w-full h-full object-cover"
            />
            
          </div>
          <div className="mt-2.5 text-center">
            <div className="font-mono text-xs font-black uppercase tracking-wider text-black">
              HIGH-SPEED BUFFER
            </div>
            
          </div>
        </div>
      </div>

      {/* Top Header */}
      <header className="relative z-10 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 flex items-center justify-between">
        <CloudoraLogo size="md" showBadge />
        <div className="flex items-center gap-3">
          <Link to="/register">
            <button className="btn-pix-outline text-xs">
              CREATE ACCOUNT ↗
            </button>
          </Link>
        </div>
      </header>

      {/* Centered Login Card */}
      <main className="relative z-10 flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          {/* Card Container */}
          <div className="rounded-3xl border-2 border-black bg-pix-surface/90 backdrop-blur-xl p-6 sm:p-8 shadow-[0_20px_60px_rgba(0,0,0,0.8)] relative overflow-hidden">
            {/* Top decorative badge */}
            

            {/* Header */}
            <div className="mb-6 flex">
              <h2 className="font-display text-4xl sm:text-5xl text-white tracking-wide uppercase leading-none flex items-center gap-2">
                WELCOME BACK
              </h2>
               
            </div>

            {/* Form */}
            <form noValidate onSubmit={handleSubmit} className="space-y-4">
              <Input
                label="Email Address"
                type="email"
                placeholder="elena@cloudora.io"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (emailError) setEmailError('');
                  if (error) setError(null);
                }}
                error={emailError}
                autoComplete="email"
              />

              <div>
                <Input
                  label="Password"
                  isPassword
                  placeholder="••••••••••••"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (passwordError) setPasswordError('');
                    if (error) setError(null);
                  }}
                  error={passwordError}
                  autoComplete="current-password"
                />

                
              </div>

              {/* Clean Attention Remark right above Submit Button */}
              {error && (
                <p className="text-xs text-red-500 font-sans mt-2 text-center">{error}</p>
              )}

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="btn-pix-yellow w-full py-3.5 text-sm tracking-wider"
                >
                  <span>{isLoading ? 'AUTHENTICATING...' : 'ENTER WORKSPACE'}</span>
                  <div className="arrow-disc">↘</div>
                </button>
              </div>
            </form>
          </div>

          <div className="text-center mt-6 text-xs text-gray-400 font-sans">
            Don't have an archive account?{' '}
            <Link to="/register" className="text-pix-yellow font-bold hover:underline">
              Create an account ↗
            </Link>
          </div>
        </div>
      </main>

      {/* Forgot Password Modal */}
      <Modal
        isOpen={isForgotModalOpen}
        onClose={() => setIsForgotModalOpen(false)}
        title="Reset Account Password"
        description="Enter your registered email to receive password recovery instructions."
        maxWidth="sm"
      >
        {forgotSent ? (
          <div className="text-center py-4 space-y-3">
            <div className="w-12 h-12 mx-auto rounded-full bg-pix-cyan/20 text-pix-cyan flex items-center justify-center">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <p className="text-base font-bold text-white font-mono">Instructions Dispatched</p>
            <p className="text-xs text-gray-400">
              If an account with <span className="font-mono text-pix-cyan">{forgotEmail}</span> exists, recovery parameters have been sent.
            </p>
            <Button
              variant="outline"
              size="sm"
              className="mt-3 w-full"
              onClick={() => setIsForgotModalOpen(false)}
            >
              Back to Login
            </Button>
          </div>
        ) : (
          <form onSubmit={handleForgotPassword} className="space-y-4 pt-1">
            <Input
              label="Email Address"
              type="email"
              value={forgotEmail}
              onChange={(e) => setForgotEmail(e.target.value)}
              placeholder="elena@cloudora.io"
              leftIcon={<Mail className="w-4 h-4" />}
              variant="cyan"
              required
            />
            <div className="flex gap-2 justify-end pt-2">
              <Button variant="ghost" size="sm" type="button" onClick={() => setIsForgotModalOpen(false)}>
                Cancel
              </Button>
              <button type="submit" className="btn-pix-yellow px-4 py-2 text-xs">
                <span>Send Instructions</span>
                <div className="arrow-disc !w-5 !h-5 !text-[10px]">↘</div>
              </button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
};
