import React from 'react';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'terracotta' | 'ochre' | 'sand' | 'bracket' | 'espresso' | 'subtle' | 'cyan' | 'pink' | 'yellow' | 'purple';
  size?: 'sm' | 'md';
  dot?: boolean;
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'cyan',
  size = 'md',
  dot = false,
  className = '',
}) => {
  if (variant === 'bracket') {
    return (
      <span
        className={`bracket-tag inline-flex items-center text-[11px] font-mono font-medium text-pix-cyan px-2.5 py-0.5 rounded-full border border-pix-cyan/30 bg-pix-cyan/10 ${className}`}
      >
        <span className="text-gray-500 mr-1">[</span>
        {children}
        <span className="text-gray-500 ml-1">]</span>
      </span>
    );
  }

  const variantStyles = {
    cyan: 'bg-pix-cyan/15 text-pix-cyan border-pix-cyan/30',
    pink: 'bg-pix-pink/15 text-pix-pink border-pix-pink/30',
    yellow: 'bg-pix-yellow/15 text-pix-yellow border-pix-yellow/40',
    purple: 'bg-pix-purple/20 text-[#A898FF] border-pix-purple/40',
    terracotta: 'bg-pix-pink/15 text-pix-pink border-pix-pink/30',
    ochre: 'bg-pix-yellow/15 text-pix-yellow border-pix-yellow/40',
    sand: 'bg-white/10 text-gray-200 border-white/20',
    espresso: 'bg-[#181724] text-white border-pix-border',
    subtle: 'bg-white/5 text-gray-400 border-white/10',
  };

  const dotColors = {
    cyan: 'bg-pix-cyan',
    pink: 'bg-pix-pink',
    yellow: 'bg-pix-yellow',
    purple: 'bg-pix-purple',
    terracotta: 'bg-pix-pink',
    ochre: 'bg-pix-yellow',
    sand: 'bg-white',
    espresso: 'bg-pix-cyan',
    subtle: 'bg-gray-400',
  };

  const sizeStyles = {
    sm: 'text-[10px] px-2.5 py-0.5 gap-1.5 font-mono uppercase tracking-wider',
    md: 'text-xs px-3 py-1 gap-1.5 font-medium tracking-tight',
  };

  return (
    <span
      className={`inline-flex items-center border rounded-full ${sizeStyles[size]} ${variantStyles[variant] || variantStyles.cyan} ${className}`}
    >
      {dot && <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${dotColors[variant] || 'bg-pix-cyan'}`} />}
      {children}
    </span>
  );
};
