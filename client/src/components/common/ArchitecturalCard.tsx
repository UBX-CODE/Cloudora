import React from 'react';

export interface ArchitecturalCardBadge {
  label: string;
  variant?: 'pink' | 'cyan' | 'purple' | 'yellow' | 'neutral';
}

export interface ArchitecturalCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  badges: ArchitecturalCardBadge[];
  hoverColor?: 'pink' | 'cyan' | 'purple' | 'yellow';
  className?: string;
}

/**
 * ArchitecturalCard - Wireframe geometric feature card styled after
 * the reference architecture with hairline dividing borders, left-aligned
 * SVG glyphs, massive display typography, and monospace capability tags.
 */
export const ArchitecturalCard: React.FC<ArchitecturalCardProps> = ({
  icon,
  title,
  description,
  badges,
  hoverColor = 'pink',
  className = '',
}) => {
  const hoverTextClasses = {
    pink: 'group-hover:text-pix-pink',
    cyan: 'group-hover:text-pix-cyan',
    purple: 'group-hover:text-[#818CF8]',
    yellow: 'group-hover:text-pix-yellow',
  };

  const badgeClasses = {
    pink: 'text-pix-pink border border-pix-pink/30 bg-pix-pink/10',
    cyan: 'text-pix-cyan border border-pix-cyan/30 bg-pix-cyan/10',
    purple: 'text-[#818CF8] border border-[#818CF8]/30 bg-[#818CF8]/10',
    yellow: 'text-pix-yellow border border-pix-yellow/30 bg-pix-yellow/10',
    neutral: 'text-gray-400  ',
  };

  return (
    <div
      className={`p-8 sm:p-12 hover:bg-white/[0.015] transition-colors flex items-start gap-5 sm:gap-7 group ${className}`}
    >
      <div className="shrink-0 pt-1">{icon}</div>
      <div className="space-y-3.5 flex-1">
        <h3
          className={`font-display text-3xl sm:text-4xl lg:text-5xl font-black uppercase text-white tracking-wide leading-none transition-colors ${hoverTextClasses[hoverColor]}`}
        >
          {title}
        </h3>
        <p className="text-sm sm:text-base text-gray-400 font-sans leading-relaxed">
          {description}
        </p>
        <div className="flex flex-wrap items-center gap-2 pt-2 text-[11px] font-mono">
          {badges.map((badge, idx) => (
            <span
              key={idx}
              className={`px-2.5 py-0.5  ${
                badgeClasses[badge.variant || 'neutral']
              }`}
            >
              {badge.label}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
};

