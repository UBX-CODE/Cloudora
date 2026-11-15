import React from 'react';
import {
  FileText,
  Image as ImageIcon,
  Video,
  Music,
  Archive,
  Code,
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
  className = 'w-4 h-4',
}) => {
  const normCat = category?.toLowerCase();
  switch (normCat) {
    case 'folder':
      return <Folder className={`${className} text-gray-300 fill-white/10 shrink-0`} />;
    case 'image':
      return <ImageIcon className={`${className} text-gray-300 shrink-0`} />;
    case 'video':
      return <Video className={`${className} text-gray-300 shrink-0`} />;
    case 'audio':
      return <Music className={`${className} text-gray-300 shrink-0`} />;
    case 'archive':
      return <Archive className={`${className} text-gray-400 shrink-0`} />;
    case 'code':
      return <Code className={`${className} text-gray-300 shrink-0`} />;
    case 'trash':
      return <Trash2 className={`${className} text-gray-400 shrink-0`} />;
    case 'document':
      return <FileText className={`${className} text-gray-300 shrink-0`} />;
    default:
      return <File className={`${className} text-gray-400 shrink-0`} />;
  }
};
