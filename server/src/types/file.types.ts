export type FileCategory =
  | 'document'
  | 'image'
  | 'video'
  | 'audio'
  | 'archive'
  | 'code'
  | 'other';

export interface RenameFileDTO {
  name: string;
}

export interface MoveFileDTO {
  targetFolderId: string | null;
}

export interface ToggleStarFileDTO {
  isStarred?: boolean;
}

export interface FileListQueryDTO {
  folderId?: string | null;
  search?: string;
  category?: FileCategory | 'all';
  sortBy?: 'name' | 'date' | 'size';
  sortOrder?: 'asc' | 'desc';
  isStarred?: boolean;
  isTrashed?: boolean;
  limit?: number;
  offset?: number;
}

export interface FileResponseDTO {
  id: string;
  name: string;
  extension: string;
  mimeType: string;
  category: FileCategory;
  size: number;
  status: string;
  folderId: string | null;
  isStarred: boolean;
  isTrashed: boolean;
  trashedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface StorageSummaryDTO {
  totalUsedBytes: number;
  storageLimitBytes: number;
  percentageUsed: number;
  breakdown: {
    documents: number;
    images: number;
    videos: number;
    audio: number;
    archives: number;
    other: number;
  };
  fileCount: number;
}

