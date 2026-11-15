import React from 'react';
import {
  FileText,
  Image as ImageIcon,
  Film,
  Music,
  Archive,
  Code2,
  Folder,
  File,
  Trash2,
} from 'lucide-react';
import { FileCategory } from '../../types/storage.types';

interface FileTypeIconProps {
  category?: FileCategory | 'folder' | 'trash' | string;
  extension?: string;
  className?: string;
  badgeSize?: 'sm' | 'md' | 'lg' | 'none';
}

export const FileTypeIcon: React.FC<FileTypeIconProps> = ({
  category = 'document',
  extension,
  className,
  badgeSize = 'md',
}) => {
  const normCat = category?.toLowerCase();

  const getTheme = () => {
    switch (normCat) {
      case 'folder':
        return {
          icon: Folder,
          color: 'text-cyan-400',
          fill: 'fill-cyan-400/20',
          badgeBg: 'bg-cyan-500/10',
          border: 'border-cyan-500/20',
          glow: 'group-hover:border-cyan-400/40 group-hover:shadow-[0_0_12px_rgba(6,182,212,0.25)]',
        };
      case 'image':
        return {
          icon: ImageIcon,
          color: 'text-fuchsia-400',
          fill: 'fill-fuchsia-400/20',
          badgeBg: 'bg-fuchsia-500/10',
          border: 'border-fuchsia-500/20',
          glow: 'group-hover:border-fuchsia-400/40 group-hover:shadow-[0_0_12px_rgba(217,70,239,0.25)]',
        };
      case 'video':
        return {
          icon: Film,
          color: 'text-purple-400',
          fill: 'fill-purple-400/20',
          badgeBg: 'bg-purple-500/10',
          border: 'border-purple-500/20',
          glow: 'group-hover:border-purple-400/40 group-hover:shadow-[0_0_12px_rgba(168,85,247,0.25)]',
        };
      case 'audio':
        return {
          icon: Music,
          color: 'text-pink-400',
          fill: 'fill-pink-400/20',
          badgeBg: 'bg-pink-500/10',
          border: 'border-pink-500/20',
          glow: 'group-hover:border-pink-400/40 group-hover:shadow-[0_0_12px_rgba(236,72,153,0.25)]',
        };
      case 'archive':
        return {
          icon: Archive,
          color: 'text-amber-400',
          fill: 'fill-amber-400/20',
          badgeBg: 'bg-amber-500/10',
          border: 'border-amber-500/20',
          glow: 'group-hover:border-amber-400/40 group-hover:shadow-[0_0_12px_rgba(245,158,11,0.25)]',
        };
      case 'code':
        return {
          icon: Code2,
          color: 'text-emerald-400',
          fill: 'fill-emerald-400/20',
          badgeBg: 'bg-emerald-500/10',
          border: 'border-emerald-500/20',
          glow: 'group-hover:border-emerald-400/40 group-hover:shadow-[0_0_12px_rgba(16,185,129,0.25)]',
        };
      case 'trash':
        return {
          icon: Trash2,
          color: 'text-red-400',
          fill: 'fill-red-400/20',
          badgeBg: 'bg-red-500/10',
          border: 'border-red-500/20',
          glow: 'group-hover:border-red-400/40 group-hover:shadow-[0_0_12px_rgba(239,68,68,0.25)]',
        };
      case 'document':
      default:
        return {
          icon: FileText,
          color: 'text-blue-400',
          fill: 'fill-blue-400/20',
          badgeBg: 'bg-blue-500/10',
          border: 'border-blue-500/20',
          glow: 'group-hover:border-blue-400/40 group-hover:shadow-[0_0_12px_rgba(59,130,246,0.25)]',
        };
    }
  };

  const theme = getTheme();
  const IconComponent = theme.icon;

  if (badgeSize === 'none') {
    return <IconComponent className={`${className || 'w-4 h-4'} ${theme.color} shrink-0`} />;
  }

  const badgeDimensions = {
    sm: 'w-6 h-6 rounded-md p-1',
    md: 'w-7 h-7 rounded-lg p-1.5',
    lg: 'w-9 h-9 rounded-xl p-2',
  }[badgeSize];

  return (
    <div
      className={`${badgeDimensions} ${theme.badgeBg} border ${theme.border} ${theme.glow} flex items-center justify-center shrink-0 transition-all duration-200 select-none`}
    >
      <IconComponent
        className={`${className || 'w-full h-full'} ${theme.color} ${theme.fill} stroke-[2.2]`}
      />
    </div>
  );
};
