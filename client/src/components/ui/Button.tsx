import React from 'react';
import { Loader2 } from 'lucide-react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'yellow' | 'purple' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'terracotta';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  curvy?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  showArrowDisc?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  leftIcon,
  rightIcon,
  showArrowDisc = false,
  className = '',
  disabled,
  ...props
}) => {
  const baseStyles =
    'relative inline-flex items-center justify-center font-bold transition-all duration-200 select-none focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none active:scale-[0.98]';

  const sizeStyles = {
    sm: 'text-xs px-3.5 py-1.5 gap-1.5 tracking-wide rounded-full',
    md: 'text-sm px-5 py-2.5 gap-2 tracking-wide rounded-full',
    lg: 'text-base px-7 py-3.5 gap-2.5 tracking-wide rounded-full',
  };

  const variantStyles = {
    // Pixetivity Yellow Brutalist Pill with Black Border & Shadow
    primary:
      'bg-pix-yellow text-black font-extrabold uppercase border-2 border-black shadow-brutal-yellow hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_#000000] active:translate-x-[4px] active:translate-y-[4px] active:shadow-none',
    yellow:
      'bg-pix-yellow text-black font-extrabold uppercase border-2 border-black shadow-brutal-yellow hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_#000000] active:translate-x-[4px] active:translate-y-[4px] active:shadow-none',
    purple:
      'bg-pix-purple text-white hover:bg-pix-purple-dark border border-pix-purple/50 shadow-[0_4px_16px_rgba(80,51,225,0.4)]',
    terracotta:
      'bg-pix-purple text-white hover:bg-pix-purple-dark border border-pix-purple/50 shadow-[0_4px_16px_rgba(80,51,225,0.4)]',
    secondary:
      'bg-pix-surface text-white hover:bg-pix-card border border-pix-border hover:border-gray-600',
    outline:
      'bg-transparent hover:bg-white/5 text-white border border-white/25 hover:border-pix-cyan hover:text-pix-cyan',
    ghost:
      'bg-transparent hover:bg-white/10 text-gray-300 hover:text-white',
    danger:
      'bg-transparent hover:bg-pix-pink/10 text-pix-pink border border-pix-pink/40 hover:border-pix-pink',
  };

  return (
    <button
      className={`${baseStyles} ${sizeStyles[size]} ${variantStyles[variant]} ${className}`}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <>
          <Loader2 className="w-4 h-4 animate-spin shrink-0" />
          <span>{children}</span>
        </>
      ) : (
        <>
          {leftIcon && <span className="inline-flex shrink-0">{leftIcon}</span>}
          <span>{children}</span>
          {showArrowDisc && (
            <span className="w-6 h-6 rounded-full bg-white border border-black flex items-center justify-center text-black text-xs font-black shrink-0 ml-1">
              ↘
            </span>
          )}
          {!showArrowDisc && rightIcon && <span className="inline-flex shrink-0">{rightIcon}</span>}
        </>
      )}
    </button>
  );
};
