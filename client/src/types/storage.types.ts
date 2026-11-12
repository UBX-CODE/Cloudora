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
  file?: File;
  fileId?: string;
  folderId?: string;
  loadedBytes?: number;
  totalParts?: number;
  uploadedPartsCount?: number;
}

export interface SingleUploadInitResponse {
  fileId: string;
  uploadUrl: string;
  storageKey: string;
  expiresIn: number;
}

export interface MultipartInitResponse {
  fileId: string;
  sessionId: string;
  storageKey: string;
  partSize: number;
  totalParts: number;
  expiresAt: string;
}

export interface MultipartPartUrl {
  partNumber: number;
  uploadUrl: string;
}

export interface MultipartPartUrlsResponse {
  fileId: string;
  sessionId: string;
  partSize: number;
  totalParts: number;
  expiresIn: number;
  urls: MultipartPartUrl[];
}

export interface UploadedPart {
  PartNumber: number;
  ETag: string;
}

export interface UploadSessionStatusResponse {
  fileId: string;
  sessionId: string;
  status: 'INITIATED' | 'IN_PROGRESS' | 'COMPLETED' | 'ABORTED' | 'FAILED';
  partSize: number;
  totalParts: number;
  expiresAt: string;
  isExpired: boolean;
  uploadedParts: UploadedPart[];
  missingPartNumbers: number[];
}

export interface CompleteUploadResponse {
  fileId: string;
  status: 'UPLOADED';
  name: string;
  size: number;
  message?: string;
}
