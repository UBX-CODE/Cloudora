import { api } from './api';
import { FolderItem } from '../types/storage.types';

export interface FolderAncestor {
  id: string;
  name: string;
  parentId: string | null;
}

export interface FolderDetailsResponse {
  folder: FolderItem;
  ancestors: FolderAncestor[];
}

function mapFolder(raw: any): FolderItem {
  const itemsCount =
    (raw._count?.children || 0) + (raw._count?.files || 0);

  return {
    id: raw.id,
    name: raw.name,
    itemsCount,
    size: 0,
    updatedAt: raw.updatedAt || new Date().toISOString(),
    color: '#6366f1',
  };
}

/**
 * 1. Fetch user's root folders (parentId = null)
 */
export async function fetchRootFolders(): Promise<FolderItem[]> {
  const response = await api.get('/folders/root');
  const folders = response.data.data.folders || [];
  return folders.map(mapFolder);
}

/**
 * 2. Fetch subfolders inside a specific parent folder
 */
export async function fetchSubfolders(parentId: string): Promise<FolderItem[]> {
  const response = await api.get(`/folders/${parentId}/subfolders`);
  const subfolders = response.data.data.subfolders || [];
  return subfolders.map(mapFolder);
}

/**
 * 3. Fetch folder details with breadcrumbs
 */
export async function fetchFolderDetails(folderId: string): Promise<FolderDetailsResponse> {
  const response = await api.get(`/folders/${folderId}`);
  const { folder, ancestors } = response.data.data;
  return {
    folder: mapFolder(folder),
    ancestors: ancestors || [],
  };
}

/**
 * 4. Fetch trashed folders
 */
export async function fetchTrashedFolders(): Promise<FolderItem[]> {
  const response = await api.get('/folders/trash');
  const folders = response.data.data.trashedFolders || [];
  return folders.map(mapFolder);
}

/**
 * 5. Create a new folder
 */
export async function createFolder(name: string, parentId?: string | null): Promise<FolderItem> {
  const response = await api.post('/folders', {
    name,
    parentId: parentId || null,
  });
  return mapFolder(response.data.data.folder);
}

/**
 * 6. Rename folder
 */
export async function renameFolder(id: string, name: string): Promise<FolderItem> {
  const response = await api.patch(`/folders/${id}/rename`, { name });
  return mapFolder(response.data.data.folder);
}

/**
 * 7. Move folder
 */
export async function moveFolder(id: string, targetParentId: string | null): Promise<FolderItem> {
  const response = await api.patch(`/folders/${id}/move`, { targetParentId });
  return mapFolder(response.data.data.folder);
}

/**
 * 8. Soft delete (trash) folder
 */
export async function trashFolder(id: string): Promise<void> {
  await api.patch(`/folders/${id}/trash`);
}

/**
 * 9. Restore folder from trash
 */
export async function restoreFolder(id: string): Promise<void> {
  await api.patch(`/folders/${id}/restore`);
}

/**
 * 10. Permanently delete folder
 */
export async function permanentlyDeleteFolder(id: string): Promise<void> {
  await api.delete(`/folders/${id}/permanent`);
}

/**
 * 11. Toggle star folder
 */
export async function toggleStarFolder(id: string, isStarred?: boolean): Promise<FolderItem> {
  const response = await api.patch(`/folders/${id}/star`, { isStarred });
  return mapFolder(response.data.data.folder);
}

