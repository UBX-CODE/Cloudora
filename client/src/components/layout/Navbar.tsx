import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import { CloudoraLogo } from '../common/CloudoraLogo';
import { useAuth } from '../../hooks/useAuth';

export const Navbar: React.FC = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { isAuthenticated } = useAuth();

  return (
    <header className="relative z-40 bg-[#4E2EE3] text-white px-4 sm:px-8 py-5 border-b border-white/15">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Brand Logo */}
        <CloudoraLogo size="md" showBadge />

        {/* Desktop Navigation Links */}
        <nav className="hidden md:flex items-center gap-8 text-xs font-bold uppercase tracking-wider text-white">
          <a href="#features" className="hover:text-pix-cyan transition-colors">
            Features
          </a>
          <a href="#media-vault" className="hover:text-pix-cyan transition-colors">
            Media Vault
          </a>
          <a href="#process" className="hover:text-pix-cyan transition-colors">
            How It Works
          </a>
          <a href="#security" className="hover:text-pix-cyan transition-colors">
            Security
          </a>
        </nav>

        {/* Desktop Actions */}
        <div className="hidden md:flex items-center gap-4">
          {isAuthenticated ? (
            <Link
              to="/dashboard"
              className="bg-pix-yellow text-black font-extrabold text-xs uppercase px-5 py-2.5 rounded-full border-2 border-black shadow-brutal-yellow hover:translate-x-0.5 hover:translate-y-0.5 transition-all inline-flex items-center gap-2"
            >
              <span>Workspace</span>
              <span className="w-5 h-5 rounded-full bg-white border border-black flex items-center justify-center text-[10px] font-black">
                ↘
              </span>
            </Link>
          ) : (
            <>
              <Link
                to="/login"
                className="text-xs font-bold uppercase tracking-wider text-white hover:text-pix-cyan transition-colors px-2"
              >
                Sign In
              </Link>
              <Link
                to="/register"
                className="btn-pix-outline"
              >
                Get Started
              </Link>
            </>
          )}
        </div>

        {/* Mobile menu toggle */}
        <div className="flex items-center gap-2 md:hidden">
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="p-2 rounded-lg text-white hover:bg-white/10 focus:outline-none"
            aria-label="Toggle menu"
          >
            {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {isMobileMenuOpen && (
        <div className="md:hidden mt-4 pt-4 border-t border-white/20 flex flex-col gap-3 text-sm font-bold uppercase tracking-wider bg-[#4E2EE3]">
          <a href="#features" onClick={() => setIsMobileMenuOpen(false)} className="py-2 hover:text-pix-cyan">
            Features
          </a>
          <a href="#media-vault" onClick={() => setIsMobileMenuOpen(false)} className="py-2 hover:text-pix-cyan">
            Media Vault
          </a>
          <a href="#process" onClick={() => setIsMobileMenuOpen(false)} className="py-2 hover:text-pix-cyan">
            How It Works
          </a>
          <a href="#security" onClick={() => setIsMobileMenuOpen(false)} className="py-2 hover:text-pix-cyan">
            Security
          </a>

          <div className="pt-3 border-t border-white/20 flex flex-col gap-2">
            {isAuthenticated ? (
              <Link
                to="/dashboard"
                onClick={() => setIsMobileMenuOpen(false)}
                className="bg-pix-yellow text-black font-extrabold text-xs uppercase py-3 rounded-full text-center"
              >
                Enter Workspace ↘
              </Link>
            ) : (
              <>
                <Link
                  to="/login"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="py-2 text-center text-white font-bold"
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="bg-pix-yellow text-black font-extrabold text-xs uppercase py-3 rounded-full text-center"
                >
                  Get Started ↘
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
};
