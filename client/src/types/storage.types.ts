export type FileCategory = 'document' | 'image' | 'video' | 'audio' | 'archive' | 'code';

export interface FileItem {
  id: string;
  name: string;
  extension: string;
  category: FileCategory;
  size: number; // in bytes
  updatedAt: string;
  isStarred?: boolean;
  isShared?: boolean;
  sharedBy?: {
    name: string;
    email: string;
    avatar?: string;
  };
  permission?: 'view' | 'edit';
  thumbnailUrl?: string;
  deletedAt?: string;
}

export interface FolderItem {
  id: string;
  name: string;
  itemsCount: number;
  size: number;
  updatedAt: string;
  color?: string;
}

export interface ActivityItem {
  id: string;
  action: 'uploaded' | 'shared' | 'edited' | 'deleted' | 'starred';
  targetName: string;
  targetType: 'file' | 'folder';
  timestamp: string;
  user: string;
}

export interface StorageBreakdown {
  documents: number;
  images: number;
  videos: number;
  audio: number;
  archives: number;
  other: number;
  totalUsed: number;
  totalQuota: number;
}

export interface UploadQueueItem {
  id: string;
  name: string;
  size: number;
  progress: number;
  status: 'uploading' | 'completed' | 'paused' | 'error';
  speed?: string;
  eta?: string;
  errorMessage?: string;
}

