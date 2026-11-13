import { api } from './api';
import { FileItem, StorageBreakdown } from '../types/storage.types';

export interface FileQueryParams {
  folderId?: string | null;
  search?: string;
  category?: string;
  sortBy?: 'name' | 'date' | 'size';
  sortOrder?: 'asc' | 'desc';
  isStarred?: boolean;
  isTrashed?: boolean;
  limit?: number;
}

export interface PreviewData {
  previewUrl: string;
  mimeType: string;
  filename: string;
  category: string;
}

export interface DownloadData {
  downloadUrl: string;
  filename: string;
}

export interface StorageSummaryResponse {
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

function mapFile(raw: any): FileItem {
  return {
    id: raw.id,
    name: raw.name,
    extension: raw.extension || (raw.name.includes('.') ? raw.name.split('.').pop()?.toLowerCase() || '' : ''),
    category: raw.category || 'other',
    size: Number(raw.size || 0),
    updatedAt: raw.updatedAt || raw.createdAt || new Date().toISOString(),
    isStarred: Boolean(raw.isStarred),
    deletedAt: raw.trashedAt || undefined,
  };
}

/**
 * 1. Fetch files with filters
 */
export async function fetchFiles(params?: FileQueryParams): Promise<FileItem[]> {
  const response = await api.get('/files', { params });
  const files = response.data.data || [];
  return files.map(mapFile);
}

/**
 * 2. Fetch starred files
 */
export async function fetchStarredFiles(): Promise<FileItem[]> {
  const response = await api.get('/files/starred');
  const files = response.data.data || [];
  return files.map(mapFile);
}

/**
 * 3. Fetch trashed files
 */
export async function fetchTrashFiles(): Promise<FileItem[]> {
  const response = await api.get('/files/trash');
  const files = response.data.data || [];
  return files.map(mapFile);
}

/**
 * 4. Fetch recent files
 */
export async function fetchRecentFiles(limit: number = 30): Promise<FileItem[]> {
  const response = await api.get('/files/recent', { params: { limit } });
  const files = response.data.data || [];
  return files.map(mapFile);
}

/**
 * 5. Fetch storage usage summary and breakdown
 */
export async function fetchStorageSummary(): Promise<StorageSummaryResponse> {
  const response = await api.get('/files/storage-summary');
  return response.data.data;
}

/**
 * 6. Get Presigned Download URL (attachment disposition)
 */
export async function getFileDownloadUrl(fileId: string): Promise<DownloadData> {
  const response = await api.get(`/files/${fileId}/download-url`);
  return response.data.data;
}

/**
 * 7. Get Presigned Streaming/Preview URL (inline disposition)
 */
export async function getFilePreviewUrl(fileId: string): Promise<PreviewData> {
  const response = await api.get(`/files/${fileId}/preview-url`);
  return response.data.data;
}

/**
 * 8. Rename file
 */
export async function renameFile(fileId: string, name: string): Promise<FileItem> {
  const response = await api.patch(`/files/${fileId}/rename`, { name });
  return mapFile(response.data.data);
}

/**
 * 9. Move file
 */
export async function moveFile(fileId: string, targetFolderId: string | null): Promise<FileItem> {
  const response = await api.patch(`/files/${fileId}/move`, { targetFolderId });
  return mapFile(response.data.data);
}

/**
 * 10. Soft-delete (trash) file
 */
export async function trashFile(fileId: string): Promise<FileItem> {
  const response = await api.patch(`/files/${fileId}/trash`);
  return mapFile(response.data.data);
}

/**
 * 11. Restore file from trash
 */
export async function restoreFile(fileId: string): Promise<FileItem> {
  const response = await api.patch(`/files/${fileId}/restore`);
  return mapFile(response.data.data);
}

/**
 * 12. Permanently delete file from MinIO and DB
 */
export async function permanentlyDeleteFile(fileId: string): Promise<void> {
  await api.delete(`/files/${fileId}/permanent`);
}

/**
 * 13. Toggle star status
 */
export async function toggleStarFile(fileId: string, isStarred?: boolean): Promise<FileItem> {
  const response = await api.patch(`/files/${fileId}/star`, { isStarred });
  return mapFile(response.data.data);
}

