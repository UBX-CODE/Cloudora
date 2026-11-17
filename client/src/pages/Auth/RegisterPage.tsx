import React, { useState, useMemo, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { CloudoraLogo } from '../../components/common/CloudoraLogo';
import { AsteriskFlower, CapsuleLozengeRow } from '../../components/common/PixGraphics';
import { Input } from '../../components/ui/Input';

export const RegisterPage: React.FC = () => {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [agreeTerms, setAgreeTerms] = useState(false);

  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const [nameError, setNameError] = useState<React.ReactNode>('');
  const [emailError, setEmailError] = useState<React.ReactNode>('');
  const [passwordError, setPasswordError] = useState<React.ReactNode>('');
  const [confirmPasswordError, setConfirmPasswordError] = useState<React.ReactNode>('');
  const [termsError, setTermsError] = useState<React.ReactNode>('');

  // Pre-fill email from URL query if user was redirected from LoginPage
  useEffect(() => {
    const queryEmail = searchParams.get('email');
    if (queryEmail) {
      setEmail(queryEmail);
    }
  }, [searchParams]);

  const passwordStrength = useMemo(() => {
    if (!password) return { score: 0, label: 'Empty', color: 'bg-gray-700' };
    let score = 0;
    if (password.length >= 8) score += 1;
    if (password.length >= 12) score += 1;
    if (/[A-Z]/.test(password)) score += 1;
    if (/[0-9]/.test(password)) score += 1;
    if (/[^A-Za-z0-9]/.test(password)) score += 1;

    if (score <= 2) return { score: 1, label: 'Basic', color: 'bg-pix-pink' };
    if (score <= 4) return { score: 2, label: 'Robust', color: 'bg-pix-yellow' };
    return { score: 3, label: 'Cryptographic', color: 'bg-pix-cyan' };
  }, [password]);

  const validateForm = (): boolean => {
    let isValid = true;
    setNameError('');
    setEmailError('');
    setPasswordError('');
    setConfirmPasswordError('');
    setTermsError('');
    setError(null);

    if (!name.trim() || name.trim().length < 2) {
      setNameError('Full name must be at least 2 characters.');
      isValid = false;
    }

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
    } else if (password.length < 8) {
      setPasswordError('Password must be at least 8 characters.');
      isValid = false;
    }

    if (password !== confirmPassword) {
      setConfirmPasswordError("Passwords don't match");
      isValid = false;
    }

    if (!agreeTerms) {
      setTermsError('You must agree to the Cloudora Terms of Service.');
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
      await register(name.trim(), email.trim(), password);
      navigate('/dashboard', { replace: true });
    } catch (err: any) {
      const status = err.response?.status;
      const message =
        err.response?.data?.message || err.message || 'Registration failed. Please try again.';
      console.warn('[Register Error]', { status, message });

      const lowerMsg = message.toLowerCase();
      if (
        status === 409 ||
        lowerMsg.includes('already exists') ||
        lowerMsg.includes('already in use') ||
        lowerMsg.includes('already register') ||
        lowerMsg.includes('duplicate')
      ) {
        setEmailError(
          <span>
            This email is already registered.{' '}
            <Link
              to={`/login?email=${encodeURIComponent(email.trim())}`}
              className="text-white underline font-semibold hover:text-pix-yellow"
            >
              Sign in instead
            </Link>
          </span>
        );
      } else if (status === 429) {
        // Handled globally by RateLimitModal
      } else {
        setError(message);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#08080C] text-white flex flex-col justify-between relative overflow-hidden">
      
      {/* Left Flank Floating Polaroid Meme Sticker Card */}
      <div className="hidden lg:flex absolute left-4 xl:left-14 top-1/2 -translate-y-1/2 flex-col items-center select-none pointer-events-none z-10 -rotate-3 hover:rotate-0 transition-transform duration-300">
        <div className="w-20 h-5 bg-[#FF5E97] border border-black shadow-sm -mb-2.5 z-20 transform -rotate-2" />
        <div className="w-56 p-3 bg-white rounded-2xl border-2 border-black shadow-[0_20px_40px_rgba(0,0,0,0.7)] text-black">
          <div className="relative rounded-xl overflow-hidden aspect-square border border-black/15 bg-black/5">
            <img
              src="/assets/card-protect-trash-cat.webp"
              alt="Trash Recovery Shield Cat"
              className="w-full h-full object-cover"
            />
            
          </div>
          <div className="mt-2.5 text-center">
            <div className="font-mono text-xs font-black uppercase tracking-wider text-black">
              TRASH RECOVERY
            </div>
            <div className="font-mono text-[10px] text-gray-600 mt-0.5">
              [DISASTER UNDO: ON]
            </div>
          </div>
        </div>
      </div>

      {/* Right Flank Floating Polaroid Meme Sticker Card */}
      <div className="hidden lg:flex absolute right-4 xl:right-14 top-1/2 -translate-y-1/2 flex-col items-center select-none pointer-events-none z-10 rotate-3 hover:rotate-0 transition-transform duration-300">
        <div className="w-20 h-5 bg-[#00D2FF] border border-black shadow-sm -mb-2.5 z-20 transform rotate-2" />
        <div className="w-56 p-3 bg-white rounded-2xl border-2 border-black shadow-[0_20px_40px_rgba(0,0,0,0.7)] text-black">
          <div className="relative rounded-xl overflow-hidden aspect-square border border-black/15 bg-black/5">
            <img
              src="/assets/card-manage-audiophile-cat.jpg"
              alt="Lossless FLAC Master Cat"
              className="w-full h-full object-cover"
            />
            
          </div>
          <div className="mt-2.5 text-center">
            <div className="font-mono text-xs font-black uppercase tracking-wider text-black">
              LOSSLESS AUDIO VAULT
            </div>
            <div className="font-mono text-[10px] text-gray-600 mt-0.5">
              [FREE 15GB TIER: READY]
            </div>
          </div>
        </div>
      </div>

      {/* Top Header */}
      <header className="relative z-10 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 flex items-center justify-between">
        <CloudoraLogo size="md" showBadge />
        <div className="flex items-center gap-3">
          <Link to="/login">
            <button className="btn-pix-outline text-xs">
              SIGN IN ↗
            </button>
          </Link>
        </div>
      </header>

      {/* Centered Registration Card */}
      <main className="relative z-10 flex-1 flex items-center justify-center p-4 my-6">
        <div className="w-full max-w-lg">
          <div className="rounded-3xl border-2 border-black bg-pix-surface/90 backdrop-blur-xl p-6 sm:p-8 shadow-[0_20px_60px_rgba(0,0,0,0.8)] relative overflow-hidden">
     
            {/* Header */}
            <div className="mb-6 flex">
              <h2 className="font-display text-4xl sm:text-5xl text-white tracking-wide uppercase leading-none flex items-center gap-2">
                JOIN THE CLOUD
              </h2>
              <div className="flex items-center justify-between mb-5">
            </div>
            </div>

            {/* Form */}
            <form noValidate onSubmit={handleSubmit} className="space-y-4">
              <Input
                label="Full Name"
                type="text"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  if (nameError) setNameError('');
                  if (error) setError(null);
                }}
                error={nameError}
                autoComplete="name"
              />

              <Input
                label="Email Address"
                type="email"
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
                  placeholder="At least 8 characters"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (passwordError) setPasswordError('');
                    if (error) setError(null);
                  }}
                  error={passwordError}
                  autoComplete="new-password"
                />

                {/* Password Strength Indicator */}
                {password && (
                  <div className="mt-2 space-y-1 font-mono">
                    <div className="flex items-center justify-between text-[10px] text-gray-400">
                      <span>Entropy Strength:</span>
                      <span className="font-bold text-white">{passwordStrength.label}</span>
                    </div>
                    <div className="grid grid-cols-3 gap-1.5 h-1.5">
                      <div className={`rounded-full ${passwordStrength.score >= 1 ? passwordStrength.color : 'bg-[#1F1D2B]'}`} />
                      <div className={`rounded-full ${passwordStrength.score >= 2 ? passwordStrength.color : 'bg-[#1F1D2B]'}`} />
                      <div className={`rounded-full ${passwordStrength.score >= 3 ? passwordStrength.color : 'bg-[#1F1D2B]'}`} />
                    </div>
                  </div>
                )}
              </div>

              <Input
                label="Confirm Password"
                isPassword
                value={confirmPassword}
                onChange={(e) => {
                  setConfirmPassword(e.target.value);
                  if (confirmPasswordError) setConfirmPasswordError('');
                  if (error) setError(null);
                }}
                error={confirmPasswordError}
                autoComplete="new-password"
              />

              {/* Terms Checkbox */}
              <div className="pt-1">
                <label className="flex items-start gap-2.5 cursor-pointer select-none text-xs text-gray-400 hover:text-white">
                  <input
                    type="checkbox"
                    checked={agreeTerms}
                    onChange={(e) => {
                      setAgreeTerms(e.target.checked);
                      if (termsError) setTermsError('');
                      if (error) setError(null);
                    }}
                    className="mt-0.5 rounded border border-[#262438] bg-[#0E0D17] text-pix-pink focus:ring-0 focus:outline-none h-4 w-4 shrink-0 accent-pix-pink"
                  />
                  <span>
                    I accept the{' '}
                    <span className="text-gray-300 underline font-medium">Cloudora Terms of Service</span>{' '}
                    and Privacy Protocol.
                  </span>
                </label>
                {termsError && (
                  <p className="text-xs text-red-500 font-sans mt-1 leading-tight">{termsError}</p>
                )}
              </div>

              {/* Clean Attention Remark right above Submit Button */}
              {error && (
                <p className="text-xs text-red-500 font-sans mt-2 text-center">{error}</p>
              )}

              {/* Submit Button */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="btn-pix-yellow w-full py-3.5 text-sm tracking-wider"
                >
                  <span>{isLoading ? 'GENERATING CREDENTIALS...' : 'CREATE SECURE VAULT'}</span>
                  <div className="arrow-disc">↘</div>
                </button>
              </div>
            </form>
          </div>

          <div className="text-center mt-6 text-xs text-gray-400 font-sans">
            Already have an active vault?{' '}
            <Link to="/login" className="text-pix-cyan font-bold hover:underline">
              Sign into Cloudora ↗
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
};
