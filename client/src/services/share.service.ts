import { api } from './api';

export interface CreateSharePayload {
  fileId?: string;
  folderId?: string;
  sharedWithEmail?: string;
  role?: 'VIEW' | 'EDIT';
  password?: string;
  expiresInDays?: number;
}

export interface ShareItem {
  id: string;
  token: string;
  shareUrl: string;
  targetType: 'file' | 'folder';
  targetId: string;
  targetName: string;
  role: 'VIEW' | 'EDIT';
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
  file?: {
    id: string;
    name: string;
    size: number;
    mimeType: string;
  };
  folder?: {
    id: string;
    name: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface PublicShareData {
  requiresPassword: boolean;
  isExpired: boolean;
  targetType: 'file' | 'folder';
  targetName: string;
  role?: 'VIEW' | 'EDIT';
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

/**
 * Create a new share link.
 */
export async function createShare(payload: CreateSharePayload): Promise<ShareItem> {
  const response = await api.post('/shares', payload);
  return response.data.data;
}

/**
 * Access a public share by token.
 */
export async function getPublicShare(token: string, password?: string): Promise<PublicShareData> {
  const response = await api.get(`/shares/public/${token}`, {
    params: password ? { password } : undefined,
  });
  return response.data.data;
}

/**
 * Verify password for a protected public share.
 */
export async function verifyPublicPassword(token: string, password: string): Promise<PublicShareData> {
  const response = await api.post(`/shares/public/${token}/verify`, { password });
  return response.data.data;
}

/**
 * Fetch files and folders shared directly with the current user.
 */
export async function getSharedWithMe(): Promise<ShareItem[]> {
  const response = await api.get('/shares/shared-with-me');
  return response.data.data;
}

/**
 * Fetch all active shares created by the current user.
 */
export async function getMyCreatedShares(): Promise<ShareItem[]> {
  const response = await api.get('/shares/my-shares');
  return response.data.data;
}

/**
 * Revoke/delete a share link.
 */
export async function revokeShare(id: string): Promise<void> {
  await api.delete(`/shares/${id}`);
}
