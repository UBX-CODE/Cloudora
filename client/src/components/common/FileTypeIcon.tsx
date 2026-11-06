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
} from 'lucide-react';
import { FileCategory } from '../../types/storage.types';

interface FileTypeIconProps {
  category?: FileCategory | 'folder';
  extension?: string;
  className?: string;
}

export const FileTypeIcon: React.FC<FileTypeIconProps> = ({
  category = 'document',
  className = 'w-4 h-4',
}) => {
  switch (category) {
    case 'folder':
      return <Folder className={`${className} text-pix-cyan fill-pix-cyan/10 shrink-0`} />;
    case 'image':
      return <ImageIcon className={`${className} text-gray-300 shrink-0`} />;
    case 'video':
      return <Video className={`${className} text-gray-300 shrink-0`} />;
    case 'audio':
      return <Music className={`${className} text-pix-pink shrink-0`} />;
    case 'archive':
      return <Archive className={`${className} text-gray-400 shrink-0`} />;
    case 'code':
      return <Code className={`${className} text-pix-cyan shrink-0`} />;
    case 'document':
      return <FileText className={`${className} text-gray-300 shrink-0`} />;
    default:
      return <File className={`${className} text-gray-400 shrink-0`} />;
  }
};
