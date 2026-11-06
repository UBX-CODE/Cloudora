import React, { forwardRef, useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: React.ReactNode;
  isPassword?: boolean;
  variant?: 'cyan' | 'pink' | 'purple';
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      error,
      helperText,
      leftIcon,
      isPassword = false,
      variant = 'cyan',
      type = 'text',
      className = '',
      ...props
    },
    ref
  ) => {
    const [showPassword, setShowPassword] = useState(false);

    const inputType = isPassword ? (showPassword ? 'text' : 'password') : type;

    // Focused variant color styling without harsh white borders
    const variantFocusClass = error
      ? 'border-pix-pink focus:border-pix-pink focus:ring-2 focus:ring-pix-pink/25 focus:bg-[#160E18]'
      : variant === 'pink'
      ? 'border-[#262438] hover:border-[#3D3A58] focus:border-pix-pink focus:ring-2 focus:ring-pix-pink/25 focus:bg-[#140E1B]'
      : variant === 'purple'
      ? 'border-[#262438] hover:border-[#3D3A58] focus:border-pix-purple focus:ring-2 focus:ring-pix-purple/25 focus:bg-[#120F24]'
      : 'border-[#262438] hover:border-[#3D3A58] focus:border-pix-cyan focus:ring-2 focus:ring-pix-cyan/25 focus:bg-[#0B1422]';

    const iconColor = error
      ? 'text-pix-pink'
      : variant === 'pink'
      ? 'text-pix-pink'
      : variant === 'purple'
      ? 'text-pix-purple'
      : 'text-pix-cyan';

    return (
      <div className="w-full space-y-1.5 text-left">
        {label && (
          <label className="block text-xs font-mono font-bold uppercase tracking-wider text-gray-300">
            {label}
            {props.required && (
              <span className={variant === 'pink' ? 'text-pix-pink ml-1' : 'text-pix-cyan ml-1'}>*</span>
            )}
          </label>
        )}

        <div className="relative">
          {leftIcon && (
            <div className={`absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none transition-colors ${iconColor}`}>
              {leftIcon}
            </div>
          )}

          <input
            ref={ref}
            type={inputType}
            className={`w-full rounded-xl text-sm transition-all duration-200 bg-[#0E0D17] text-white placeholder-gray-500 border outline-none focus:outline-none ${variantFocusClass} ${
              leftIcon ? 'pl-10' : 'pl-3.5'
            } ${
              isPassword ? 'pr-10' : 'pr-3.5'
            } py-2.5 disabled:bg-[#08070C] disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
            {...props}
          />

          {isPassword && (
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-gray-400 hover:text-white transition-colors focus:outline-none"
              tabIndex={-1}
            >
              {showPassword ? (
                <EyeOff className={`w-4 h-4 ${variant === 'pink' ? 'text-pix-pink' : 'text-pix-cyan'}`} />
              ) : (
                <Eye className="w-4 h-4" />
              )}
            </button>
          )}
        </div>

        {error && <p className="text-xs text-pix-pink font-medium flex items-center gap-1 font-mono">⚠ {error}</p>}
        {!error && helperText && <p className="text-xs text-gray-400 font-mono">{helperText}</p>}
      </div>
    );
  }
);

Input.displayName = 'Input';
