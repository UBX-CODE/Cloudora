import { FileItem, FolderItem, ActivityItem, StorageBreakdown, UploadQueueItem } from '../types/storage.types';

export const mockStorageBreakdown: StorageBreakdown = {
  documents: 4.3 * 1024 * 1024 * 1024, // 4.3 GB
  images: 2.8 * 1024 * 1024 * 1024,    // 2.8 GB
  videos: 1.6 * 1024 * 1024 * 1024,    // 1.6 GB
  audio: 0.5 * 1024 * 1024 * 1024,     // 500 MB
  archives: 0.4 * 1024 * 1024 * 1024,  // 400 MB
  other: 0.0 * 1024 * 1024 * 1024,
  totalUsed: 9.6 * 1024 * 1024 * 1024, // 9.6 GB
  totalQuota: 15 * 1024 * 1024 * 1024, // 15 GB
};

export const mockFolders: FolderItem[] = [
  {
    id: 'f-1',
    name: 'Work Projects 2026',
    itemsCount: 42,
    size: 3.2 * 1024 * 1024 * 1024,
    updatedAt: '2026-11-05T14:20:00Z',
    color: '#00D2FF',
  },
  {
    id: 'f-2',
    name: 'Design Systems & UI',
    itemsCount: 128,
    size: 2.1 * 1024 * 1024 * 1024,
    updatedAt: '2026-11-04T11:15:00Z',
    color: '#00D2FF',
  },
  {
    id: 'f-3',
    name: 'Media & 4K Footage',
    itemsCount: 19,
    size: 3.4 * 1024 * 1024 * 1024,
    updatedAt: '2026-11-03T18:45:00Z',
    color: '#00D2FF',
  },
  {
    id: 'f-4',
    name: 'Financial Reports & Invoices',
    itemsCount: 65,
    size: 450 * 1024 * 1024,
    updatedAt: '2026-10-28T09:00:00Z',
    color: '#00D2FF',
  },
];

export const mockFiles: FileItem[] = [
  {
    id: 'file-1',
    name: 'Quarterly_Financial_Review_Q3.pdf',
    extension: 'pdf',
    category: 'document',
    size: 4.8 * 1024 * 1024,
    updatedAt: '2026-11-06T09:12:00Z',
    isStarred: true,
    isShared: true,
    sharedBy: { name: 'Elena Rostova', email: 'elena@cloudora.io' },
    permission: 'edit',
  },
  {
    id: 'file-2',
    name: 'Cloudora_Brand_Identity_Kit_4K.png',
    extension: 'png',
    category: 'image',
    size: 14.2 * 1024 * 1024,
    updatedAt: '2026-11-05T17:30:00Z',
    isStarred: true,
    isShared: false,
    thumbnailUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=400&auto=format&fit=crop&q=80',
  },
  {
    id: 'file-3',
    name: 'Platform_Architecture_Showcase.mp4',
    extension: 'mp4',
    category: 'video',
    size: 148.5 * 1024 * 1024,
    updatedAt: '2026-11-05T12:00:00Z',
    isStarred: false,
    isShared: true,
    sharedBy: { name: 'Devin Vance', email: 'devin@partner.org' },
    permission: 'view',
  },
  {
    id: 'file-4',
    name: 'Design_Tokens_Tailwind_Config.json',
    extension: 'json',
    category: 'code',
    size: 42 * 1024,
    updatedAt: '2026-11-04T15:40:00Z',
    isStarred: false,
    isShared: false,
  },
  {
    id: 'file-5',
    name: 'Storage_Sync_Daemon_v1.tar.gz',
    extension: 'gz',
    category: 'archive',
    size: 78.4 * 1024 * 1024,
    updatedAt: '2026-11-03T10:20:00Z',
    isStarred: true,
    isShared: false,
  },
  {
    id: 'file-6',
    name: 'Customer_Success_Walkthrough.wav',
    extension: 'wav',
    category: 'audio',
    size: 24.1 * 1024 * 1024,
    updatedAt: '2026-11-02T16:15:00Z',
    isStarred: false,
    isShared: true,
    sharedBy: { name: 'Sarah Miller', email: 'sarah@cloudora.io' },
    permission: 'view',
  },
  {
    id: 'file-7',
    name: 'High_Res_Render_Landscape.jpg',
    extension: 'jpg',
    category: 'image',
    size: 8.6 * 1024 * 1024,
    updatedAt: '2026-11-01T14:10:00Z',
    isStarred: true,
    isShared: false,
    thumbnailUrl: 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?w=400&auto=format&fit=crop&q=80',
  },
  {
    id: 'file-8',
    name: 'API_Contract_Specifications_2026.docx',
    extension: 'docx',
    category: 'document',
    size: 2.1 * 1024 * 1024,
    updatedAt: '2026-10-30T11:45:00Z',
    isStarred: false,
    isShared: false,
  },
];

export const mockTrashFiles: FileItem[] = [
  {
    id: 'trash-1',
    name: 'Old_Sprint_Notes_Q2.docx',
    extension: 'docx',
    category: 'document',
    size: 840 * 1024,
    updatedAt: '2026-10-15T10:00:00Z',
    deletedAt: '2026-11-04T12:00:00Z',
  },
  {
    id: 'trash-2',
    name: 'Deprecated_Banner_Draft.png',
    extension: 'png',
    category: 'image',
    size: 5.2 * 1024 * 1024,
    updatedAt: '2026-10-20T14:30:00Z',
    deletedAt: '2026-11-05T08:15:00Z',
  },
  {
    id: 'trash-3',
    name: 'Unused_Audio_Cut_03.mp3',
    extension: 'mp3',
    category: 'audio',
    size: 11.4 * 1024 * 1024,
    updatedAt: '2026-10-18T18:00:00Z',
    deletedAt: '2026-11-03T16:40:00Z',
  },
];

export const mockRecentActivities: ActivityItem[] = [
  {
    id: 'act-1',
    action: 'uploaded',
    targetName: 'Quarterly_Financial_Review_Q3.pdf',
    targetType: 'file',
    timestamp: '2026-11-06T09:12:00Z',
    user: 'You',
  },
  {
    id: 'act-2',
    action: 'shared',
    targetName: 'Cloudora_Brand_Identity_Kit_4K.png',
    targetType: 'file',
    timestamp: '2026-11-05T17:30:00Z',
    user: 'You',
  },
  {
    id: 'act-3',
    action: 'starred',
    targetName: 'Storage_Sync_Daemon_v1.tar.gz',
    targetType: 'file',
    timestamp: '2026-11-04T15:00:00Z',
    user: 'You',
  },
  {
    id: 'act-4',
    action: 'edited',
    targetName: 'Design Systems & UI',
    targetType: 'folder',
    timestamp: '2026-11-04T11:15:00Z',
    user: 'Elena Rostova',
  },
];

export const mockUploadQueue: UploadQueueItem[] = [
  {
    id: 'up-1',
    name: '4K_Product_Showreel_Master.mov',
    size: 345 * 1024 * 1024,
    progress: 74,
    status: 'uploading',
    speed: '42.8 MB/s',
    eta: '2s remaining',
  },
  {
    id: 'up-2',
    name: 'Design_System_Figma_Export.zip',
    size: 68 * 1024 * 1024,
    progress: 100,
    status: 'completed',
  },
  {
    id: 'up-3',
    name: 'Dataset_Vector_Embeddings.parquet',
    size: 180 * 1024 * 1024,
    progress: 35,
    status: 'paused',
    speed: 'Paused',
    eta: '--',
  },
  {
    id: 'up-4',
    name: 'Customer_Interview_Uncut.mp4',
    size: 512 * 1024 * 1024,
    progress: 12,
    status: 'error',
    errorMessage: 'Connection timed out. Ready to retry.',
  },
];

