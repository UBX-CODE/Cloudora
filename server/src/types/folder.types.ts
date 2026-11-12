export interface CreateFolderDTO {
  name: string;
  parentId?: string | null;
}

export interface RenameFolderDTO {
  name: string;
}

export interface MoveFolderDTO {
  targetParentId: string | null;
}

export interface ToggleStarDTO {
  isStarred?: boolean;
}

export interface FolderAncestor {
  id: string;
  name: string;
  parentId: string | null;
}

export interface FolderStats {
  subfoldersCount: number;
  filesCount: number;
  totalSizeBytes: number;
}

