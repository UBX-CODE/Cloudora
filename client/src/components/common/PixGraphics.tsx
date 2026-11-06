import React from 'react';

// The 2 rows of 6 angled pill capsules from the Pixetivity hero (Image 1 & 2)
export const CapsuleLozengeRow: React.FC<{ className?: string }> = ({ className = '' }) => {
  const colors = [
    'border-white',
    'border-pix-cyan',
    'border-pix-pink',
    'border-white',
    'border-pix-cyan',
    'border-pix-pink',
  ];

  return (
    <div className={`flex flex-col gap-1.5 select-none ${className}`}>
      {/* Row 1 */}
      <div className="flex gap-1.5">
        {colors.map((c, i) => (
          <div
            key={`r1-${i}`}
            className={`w-4 sm:w-5 h-8 sm:h-9 rounded-full border-2 ${c} -rotate-12 transition-transform hover:scale-110`}
          />
        ))}
      </div>
      {/* Row 2 */}
      <div className="flex gap-1.5">
        {colors.slice().reverse().map((c, i) => (
          <div
            key={`r2-${i}`}
            className={`w-4 sm:w-5 h-8 sm:h-9 rounded-full border-2 ${c} -rotate-12 transition-transform hover:scale-110`}
          />
        ))}
      </div>
    </div>
  );
};

// Retro Wireframe Globe 🌐 in Electric Cyan
export const WireframeGlobe: React.FC<{ className?: string; size?: number }> = ({
  className = '',
  size = 48,
}) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`inline-block align-middle text-pix-cyan ${className}`}
    >
      <circle cx="24" cy="24" r="22" stroke="currentColor" strokeWidth="2.5" />
      <ellipse cx="24" cy="24" rx="11" ry="22" stroke="currentColor" strokeWidth="2" />
      <line x1="2" y1="24" x2="46" y2="24" stroke="currentColor" strokeWidth="2" />
      <line x1="6" y1="14" x2="42" y2="14" stroke="currentColor" strokeWidth="1.5" />
      <line x1="6" y1="34" x2="42" y2="34" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
};

// Chunky Diagonal Block Arrow in Sunburst Yellow (as seen in Banner 1 & Hero)
export const ChunkyArrow: React.FC<{ className?: string; size?: number }> = ({
  className = '',
  size = 48,
}) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`inline-block align-middle text-pix-yellow ${className}`}
    >
      <path
        d="M10 12L10 24L26 24L10 40L16 46L32 30L32 46L44 46L44 12L10 12Z"
        fill="currentColor"
      />
    </svg>
  );
};

// Three Angled Pink Tick Marks (\ \ \) as seen above "WE" and "US" in Reference Images
export const ThreePinkTicks: React.FC<{ className?: string; size?: number }> = ({
  className = '',
  size = 28,
}) => {
  return (
    <svg
      width={size}
      height={size * 0.6}
      viewBox="0 0 32 18"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`inline-block align-bottom text-pix-pink ${className}`}
    >
      <line x1="4" y1="16" x2="8" y2="3" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
      <line x1="14" y1="17" x2="18" y2="2" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
      <line x1="24" y1="16" x2="28" y2="3" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
};

// 16-Ray Sunburst Asterisk (☀️) from Reference Banner 2 (media_1793956256634_1121b205.png)
export const YellowSunburst: React.FC<{
  className?: string;
  size?: number;
  style?: React.CSSProperties;
}> = ({
  className = '',
  size = 32,
  style,
}) => {
  const rays = Array.from({ length: 16 }, (_, i) => (i * 360) / 16);
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={style}
      className={`inline-block align-middle text-pix-yellow shrink-0 ${className}`}
    >
      <circle cx="20" cy="20" r="5" fill="currentColor" />
      {rays.map((deg, i) => (
        <line
          key={i}
          x1="20"
          y1="20"
          x2="20"
          y2="3"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          transform={`rotate(${deg} 20 20)`}
        />
      ))}
    </svg>
  );
};

// Interlocked Wireframe Rings / Double Sphere Icon from "WE CREATE & INNOVATE" (media_1793956256673_4f46482f.jpg)
export const WireframeRings: React.FC<{
  className?: string;
  size?: number;
  style?: React.CSSProperties;
}> = ({
  className = '',
  size = 48,
  style,
}) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={style}
      className={`inline-block align-middle text-[#FFA726] ${className}`}
    >
      <circle cx="24" cy="24" r="18" stroke="currentColor" strokeWidth="2.5" />
      <ellipse cx="24" cy="24" rx="8" ry="18" stroke="currentColor" strokeWidth="2" />
      <ellipse cx="24" cy="24" rx="18" ry="8" stroke="currentColor" strokeWidth="2" />
    </svg>
  );
};

// Retro Asterisk / Molecular Flower ❋
export const AsteriskFlower: React.FC<{
  className?: string;
  size?: number;
  color?: string;
}> = ({ className = '', size = 48, color = 'text-pix-pink' }) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`inline-block align-middle ${color} ${className}`}
    >
      <circle cx="24" cy="24" r="6" fill="currentColor" />
      <circle cx="24" cy="8" r="4.5" fill="currentColor" />
      <circle cx="24" cy="40" r="4.5" fill="currentColor" />
      <circle cx="8" cy="24" r="4.5" fill="currentColor" />
      <circle cx="40" cy="24" r="4.5" fill="currentColor" />
      <circle cx="12.7" cy="12.7" r="4" fill="currentColor" />
      <circle cx="35.3" cy="35.3" r="4" fill="currentColor" />
      <circle cx="12.7" cy="35.3" r="4" fill="currentColor" />
      <circle cx="35.3" cy="12.7" r="4" fill="currentColor" />
    </svg>
  );
};

// Icons from "WE CREATE & INNOVATE" 4-button pill grid (media_1793956256673_4f46482f.jpg)
export const PillIconUiUx: React.FC<{ className?: string; size?: number }> = ({ className = '', size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={`inline-block ${className}`}>
    <circle cx="9" cy="12" r="6" />
    <circle cx="15" cy="12" r="6" />
  </svg>
);

export const PillIconIllustration: React.FC<{ className?: string; size?: number }> = ({ className = '', size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={`inline-block ${className}`}>
    <path d="M4 18 L12 10 L20 18" />
    <path d="M6 14 L12 8 L18 14" />
    <path d="M8 10 L12 6 L16 10" />
  </svg>
);

export const PillIconAnimation: React.FC<{ className?: string; size?: number }> = ({ className = '', size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={`inline-block ${className}`}>
    <circle cx="12" cy="12" r="8" strokeDasharray="3 3" />
    <circle cx="12" cy="12" r="5" />
    <circle cx="12" cy="12" r="2" fill="currentColor" />
  </svg>
);

export const PillIconDevelopment: React.FC<{ className?: string; size?: number }> = ({ className = '', size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" className={`inline-block ${className}`}>
    <rect x="3" y="3" width="18" height="18" rx="4" />
    <line x1="17" y1="7" x2="7" y2="17" />
  </svg>
);

// Exact Wireframe Icons from User Reference (media_1793958569927_52e0eb3a.png)
// 1. Wireframe Double Circles (UI/UX) - Candy Pink #FF5E97
export const WireframeCirclesPink: React.FC<{ className?: string; size?: number }> = ({
  className = '',
  size = 48,
}) => (
  <svg width={size} height={size} viewBox="0 0 52 52" fill="none" className={`shrink-0 ${className}`}>
    <circle cx="21" cy="26" r="15" stroke="#FF5E97" strokeWidth="1.8" />
    <circle cx="31" cy="26" r="15" stroke="#FF5E97" strokeWidth="1.8" />
  </svg>
);

// 2. Wireframe Stacked Chevrons (Illustration) - Electric Cyan #00D2FF
export const WireframeChevronsCyan: React.FC<{ className?: string; size?: number }> = ({
  className = '',
  size = 48,
}) => (
  <svg width={size} height={size} viewBox="0 0 52 52" fill="none" className={`shrink-0 ${className}`}>
    <path d="M14 30 L26 18 L38 30" stroke="#00D2FF" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M17 34 L26 25 L35 34" stroke="#00D2FF" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M20 38 L26 32 L32 38" stroke="#00D2FF" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    <line x1="26" y1="12" x2="26" y2="40" stroke="#00D2FF" strokeWidth="1.3" strokeDasharray="2 3" opacity="0.6" />
  </svg>
);

// 3. Wireframe Concentric Vortex (Animation) - Electric Purple #818CF8
export const WireframeVortexPurple: React.FC<{ className?: string; size?: number }> = ({
  className = '',
  size = 48,
}) => (
  <svg width={size} height={size} viewBox="0 0 52 52" fill="none" className={`shrink-0 ${className}`}>
    <circle cx="26" cy="26" r="17" stroke="#818CF8" strokeWidth="1.5" strokeDasharray="3 2" />
    <circle cx="26" cy="26" r="12" stroke="#818CF8" strokeWidth="1.7" />
    <circle cx="26" cy="26" r="7" stroke="#818CF8" strokeWidth="1.8" />
    <circle cx="26" cy="26" r="2.5" fill="#818CF8" />
  </svg>
);

// 4. Wireframe Slashed Box (Development) - Pixetivity Yellow #FFD13B
export const WireframeBoxYellow: React.FC<{ className?: string; size?: number }> = ({
  className = '',
  size = 48,
}) => (
  <svg width={size} height={size} viewBox="0 0 52 52" fill="none" className={`shrink-0 ${className}`}>
    <rect x="12" y="12" width="28" height="28" rx="2" stroke="#FFD13B" strokeWidth="1.8" />
    <line x1="14" y1="38" x2="38" y2="14" stroke="#FFD13B" strokeWidth="1.8" strokeLinecap="round" />
    <line x1="20" y1="40" x2="40" y2="20" stroke="#FFD13B" strokeWidth="1.8" strokeLinecap="round" />
  </svg>
);

// Architectural Security Wireframe Icons (Matching reference wireframe aesthetic)
// 5. Wireframe Lock / Bcrypt Key Stretching - Candy Pink #FF5E97
export const WireframeLockPink: React.FC<{ className?: string; size?: number }> = ({
  className = '',
  size = 48,
}) => (
  <svg width={size} height={size} viewBox="0 0 52 52" fill="none" className={`shrink-0 ${className}`}>
    <rect x="13" y="21" width="26" height="20" rx="3" stroke="#FF5E97" strokeWidth="1.8" />
    <path d="M19 21V16C19 12.134 22.134 9 26 9C29.866 9 33 12.134 33 16V21" stroke="#FF5E97" strokeWidth="1.8" strokeLinecap="round" />
    <circle cx="26" cy="29" r="3" stroke="#FF5E97" strokeWidth="1.6" />
    <line x1="26" y1="32" x2="26" y2="36" stroke="#FF5E97" strokeWidth="1.8" strokeLinecap="round" />
    <circle cx="26" cy="31" r="14" stroke="#FF5E97" strokeWidth="1.2" strokeDasharray="3 3" opacity="0.6" />
  </svg>
);

// 6. Wireframe Cipher / JWT Token Protocol - Electric Cyan #00D2FF
export const WireframeCipherCyan: React.FC<{ className?: string; size?: number }> = ({
  className = '',
  size = 48,
}) => (
  <svg width={size} height={size} viewBox="0 0 52 52" fill="none" className={`shrink-0 ${className}`}>
    <polygon points="26,8 44,18 44,34 26,44 8,34 8,18" stroke="#00D2FF" strokeWidth="1.8" />
    <polygon points="26,15 37,22 37,30 26,37 15,30 15,22" stroke="#00D2FF" strokeWidth="1.3" strokeDasharray="3 2" />
    <circle cx="26" cy="26" r="4" stroke="#00D2FF" strokeWidth="1.8" />
    <line x1="26" y1="8" x2="26" y2="44" stroke="#00D2FF" strokeWidth="1" strokeDasharray="2 3" opacity="0.5" />
    <line x1="8" y1="26" x2="44" y2="26" stroke="#00D2FF" strokeWidth="1" strokeDasharray="2 3" opacity="0.5" />
  </svg>
);

// 7. Wireframe Tenant Lattice / Vault Boundary - Electric Purple #818CF8
export const WireframeLatticePurple: React.FC<{ className?: string; size?: number }> = ({
  className = '',
  size = 48,
}) => (
  <svg width={size} height={size} viewBox="0 0 52 52" fill="none" className={`shrink-0 ${className}`}>
    {/* Concentric Nested Diamond Grid */}
    <rect x="14" y="14" width="24" height="24" transform="rotate(45 26 26)" stroke="#818CF8" strokeWidth="1.8" />
    <rect x="18" y="18" width="16" height="16" transform="rotate(45 26 26)" stroke="#818CF8" strokeWidth="1.3" strokeDasharray="3 2" />
    <line x1="10" y1="26" x2="42" y2="26" stroke="#818CF8" strokeWidth="1.6" strokeLinecap="round" />
    <line x1="26" y1="10" x2="26" y2="42" stroke="#818CF8" strokeWidth="1.6" strokeLinecap="round" />
    <circle cx="26" cy="26" r="2.5" fill="#818CF8" />
  </svg>
);

// 8. Wireframe Trash & Recovery Loop - Pixetivity Yellow #FFD13B
export const WireframeRecoveryYellow: React.FC<{ className?: string; size?: number }> = ({
  className = '',
  size = 48,
}) => (
  <svg width={size} height={size} viewBox="0 0 52 52" fill="none" className={`shrink-0 ${className}`}>
    <circle cx="26" cy="26" r="16" stroke="#FFD13B" strokeWidth="1.8" strokeDasharray="18 6" />
    <path d="M38 18L42 22L36 24" stroke="#FFD13B" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M14 34L10 30L16 28" stroke="#FFD13B" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    <circle cx="26" cy="26" r="8" stroke="#FFD13B" strokeWidth="1.5" />
    <circle cx="26" cy="26" r="2" fill="#FFD13B" />
  </svg>
);

// Cyan Pixel Corner Icon ◱ from Accordion in Reference
export const PixelCornerIcon: React.FC<{ className?: string; size?: number }> = ({
  className = '',
  size = 20,
}) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 20 20"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`inline-block text-pix-cyan ${className}`}
    >
      <rect x="2" y="2" width="6" height="6" fill="currentColor" />
      <rect x="2" y="10" width="6" height="6" fill="currentColor" />
      <rect x="10" y="2" width="6" height="6" fill="currentColor" />
    </svg>
  );
};

// Signature Pixetivity Yellow Button with Black Border & White Arrow Disc
export const PixYellowButton: React.FC<{
  children: React.ReactNode;
  onClick?: () => void;
  type?: 'button' | 'submit' | 'reset';
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
}> = ({
  children,
  onClick,
  type = 'button',
  className = '',
  size = 'md',
  disabled = false,
}) => {
  const sizeStyles = {
    sm: 'text-xs px-4 py-2 gap-2',
    md: 'text-sm px-5 py-2.5 gap-2.5',
    lg: 'text-base px-6 py-3.5 gap-3',
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`btn-pix-yellow ${sizeStyles[size]} ${className}`}
    >
      <span>{children}</span>
      <span className="arrow-disc">↘</span>
    </button>
  );
};

// Top Candy Pink Ticker Marquee Ribbon from Reference (media_1793956261979_55437cd2.jpg)
// Hardware-accelerated, seamless infinite loop with Cloudora-relatable features
export const PixTickerMarquee: React.FC<{
  className?: string;
}> = ({ className = '' }) => {
  const tickerItems = [
    'HI@CLOUDORA.IO',
    'STORE: CLOUD STORAGE & FOLDER HIERARCHY',
    'MANAGE: 192KHZ LOSSLESS FLAC & 4K REELS',
    'SHARE: GRANULAR ACCESS & SIGNED BEARER TOKENS',
    'MONITOR: REAL-TIME STORAGE QUOTA & ACTIVITY METRICS',
    'PROTECT: 10-ROUND BCRYPT & 30-DAY TRASH RECOVERY',
    '15 GB FREE VAULT STORAGE',
    'ZERO PLAIN-TEXT PRIVACY TOLERANCE',
    'CROSS-DEVICE REAL-TIME SYNCHRONIZATION',
    'DRAG-AND-DROP CONCURRENT INGESTION',
  ];

  const segment = (
    <div className="flex items-center gap-10 whitespace-nowrap text-white font-display text-2xl sm:text-3xl tracking-widest uppercase font-black py-3 px-5 select-none shrink-0">
      {tickerItems.map((item, idx) => (
        <span key={idx} className="flex items-center gap-3">
          <span>{item}</span>
          <span className="text-pix-yellow font-black text-xl sm:text-2xl">↘</span>
        </span>
      ))}
    </div>
  );

  return (
    <div
      className={`marquee-container w-full bg-[#FF5E97] overflow-hidden whitespace-nowrap border-y-2 border-black flex items-center relative z-20 shadow-md ${className}`}
    >
      <div className="flex animate-marquee-forward shrink-0 items-center">
        {segment}
      </div>
      <div className="flex animate-marquee-forward shrink-0 items-center" aria-hidden="true">
        {segment}
      </div>
    </div>
  );
};

// Bottom Marquee Ribbon (media_1793956256634_1121b205.png)
// Features Cloudora platform engineering highlights & capabilities with Yellow Sunburst icons
export const SponsorMarqueeRibbon: React.FC<{ className?: string }> = ({ className = '' }) => {
  const cloudoraHighlights = [
    'CLOUDORA HIGH-SPEED VAULT',
    '192 KHZ / 24-BIT FLAC MASTER AUDIO',
    '10-ROUND BCRYPT KEY STRETCHING',
    'STATELESS HMAC-SHA256 JWT PROTOCOL',
    '4K LOSSLESS VIDEO STREAMING',
    'RESTFUL MULTI-FIELD SEARCH API',
    '30-DAY QUARANTINE RETENTION BUFFER',
    'STRUCTURED FOLDER TAXONOMY',
    'ZERO-KNOWLEDGE TENANT BOUNDARIES',
    'DRAG-AND-DROP CONCURRENT INGESTION',
    '15 GB COMPLIMENTARY CLOUD QUOTA',
    'SINGLE-CLICK RESTORE FROM TRASH',
  ];

  const brandRow = (
    <div className="flex items-center gap-8 whitespace-nowrap py-3.5 px-4 select-none shrink-0 text-white">
      {cloudoraHighlights.map((highlight, idx) => (
        <React.Fragment key={idx}>
          <span className="font-display font-black text-2xl sm:text-3xl tracking-wider text-white">
            {highlight}
          </span>
          <YellowSunburst size={24} className="text-pix-yellow shrink-0 animate-spin" style={{ animationDuration: '18s' }} />
        </React.Fragment>
      ))}
    </div>
  );

  return (
    <div
      className={`marquee-container relative w-full overflow-hidden bg-[#FF5E97] border-y-2 border-black flex items-center z-20 shadow-lg ${className}`}
    >
      <div className="flex animate-marquee-backward shrink-0 items-center">
        {brandRow}
      </div>
      <div className="flex animate-marquee-backward shrink-0 items-center" aria-hidden="true">
        {brandRow}
      </div>
    </div>
  );
};
