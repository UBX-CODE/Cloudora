export type ShareRole = 'VIEW' | 'EDIT';

export interface CreateShareDTO {
  fileId?: string;
  folderId?: string;
  sharedWithEmail?: string; // Optional direct sharing with user email
  role?: ShareRole;        // Default 'VIEW'
  password?: string;        // Optional plaintext password
  expiresInDays?: number;   // e.g. 1, 7, 30
  expiresAt?: string;       // ISO Date string
}

export interface ShareResponseDTO {
  id: string;
  token: string;
  shareUrl: string;
  targetType: 'file' | 'folder';
  targetId: string;
  targetName: string;
  role: ShareRole;
  isPasswordProtected: boolean;
  expiresAt: string | null;
  isExpired: boolean;
  viewsCount: number;
  sharedWith?: {
    id: string;
    name: string;
    email: string;
  } | null;
  owner: {
    id: string;
    name: string;
    email: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface PublicShareResultDTO {
  requiresPassword: boolean;
  isExpired: boolean;
  targetType: 'file' | 'folder';
  targetName: string;
  role?: ShareRole;
  viewsCount?: number;
  createdAt?: string;
  expiresAt?: string | null;
  owner?: {
    name: string;
  };
  file?: {
    id: string;
    name: string;
    size: number;
    mimeType: string;
    category: string;
    downloadUrl: string;
    previewUrl: string;
    thumbnailUrl?: string | null;
    updatedAt: string;
  };
  folder?: {
    id: string;
    name: string;
    files: Array<{
      id: string;
      name: string;
      size: number;
      mimeType: string;
      category: string;
      updatedAt: string;
    }>;
    subfolders: Array<{
      id: string;
      name: string;
      updatedAt: string;
    }>;
  };
}
