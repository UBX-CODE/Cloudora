import React from 'react';
import { Link } from 'react-router-dom';

interface CloudoraLogoProps {
  size?: 'sm' | 'md' | 'lg';
  showBadge?: boolean;
  clickable?: boolean;
}

export const CloudoraLogo: React.FC<CloudoraLogoProps> = ({
  size = 'md',
  showBadge = false,
  clickable = true,
}) => {
  const textSizes = {
    sm: 'text-xl tracking-wider',
    md: 'text-2xl tracking-widest',
    lg: 'text-3xl tracking-widest',
  };

  const content = (
    <div className="flex items-center gap-2 select-none group">
      <span className={`font-display font-black text-white ${textSizes[size]} leading-none`}>
        CLOUDORA<span className="text-pix-pink">.</span>
      </span>

      
    </div>
  );

  if (clickable) {
    return (
      <Link to="/" className="inline-flex items-center focus:outline-none">
        {content}
      </Link>
    );
  }

  return content;
};
