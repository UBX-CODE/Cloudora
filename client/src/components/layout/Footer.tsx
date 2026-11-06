import React from 'react';
import { Link } from 'react-router-dom';
import {
  WireframeGlobe,
  AsteriskFlower,
  PixYellowButton,
} from '../common/PixGraphics';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-[#0A0910] text-white pt-24 pb-12 border-t border-[#1F1E2C] relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
        {/* Massive Bold Headline from Reference Image 3 */}
        <h2 className="font-display text-4xl sm:text-6xl md:text-7xl lg:text-8xl font-black uppercase tracking-tight text-white max-w-5xl mx-auto leading-[0.95]">
          BRINGING <WireframeGlobe className="w-9 h-9 sm:w-16 sm:h-16 inline-block mx-1 text-pix-cyan -mt-2" /> CLOUD STORAGE <br />
          TO LIFE <AsteriskFlower className="w-8 h-8 sm:w-14 sm:h-14 inline-block mx-1 text-pix-pink -mt-2" /> WITH HIGH-FIDELITY <br />
          AND SECURITY <AsteriskFlower className="w-8 h-8 sm:w-14 sm:h-14 inline-block mx-1 text-[#A855F7] -mt-2" />
        </h2>

        {/* Yellow Pill CTA */}
        <div className="mt-8 mb-16 flex justify-center">
          <Link to="/register">
            <PixYellowButton size="lg">
              GET STARTED NOW
            </PixYellowButton>
          </Link>
        </div>

        {/* Bottom Social Pills from Reference */}
        <div className="pt-10 border-t border-white/10 flex flex-wrap items-center justify-between gap-6">
          <div className="flex flex-wrap items-center gap-3">
            <a
              href="https://github.com"
              target="_blank"
              rel="noreferrer"
              className="px-5 py-2 rounded-full border border-white/20 text-xs font-mono font-bold uppercase tracking-wider hover:border-pix-cyan hover:text-pix-cyan transition-all"
            >
              GITHUB
            </a>
            <a
              href="#"
              className="px-5 py-2 rounded-full border border-white/20 text-xs font-mono font-bold uppercase tracking-wider hover:border-pix-cyan hover:text-pix-cyan transition-all"
            >
              DOCS
            </a>
          </div>

          {/* Centered Brand Mark */}
          <div className="font-display font-black text-2xl tracking-widest text-white">
            CLOUDORA<span className="text-pix-pink">.</span>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <a
              href="#"
              className="px-5 py-2 rounded-full border border-white/20 text-xs font-mono font-bold uppercase tracking-wider hover:border-pix-pink hover:text-pix-pink transition-all"
            >
              SECURITY
            </a>
            <a
              href="#"
              className="px-5 py-2 rounded-full border border-white/20 text-xs font-mono font-bold uppercase tracking-wider hover:border-pix-pink hover:text-pix-pink transition-all"
            >
              API SPECS
            </a>
          </div>
        </div>

        <p className="text-xs text-gray-500 font-mono mt-8">
          © {new Date().getFullYear()} Cloudora Platform Inc. All rights reserved. RFC-7519 & Bcrypt compliant.
        </p>
      </div>
    </footer>
  );
};
