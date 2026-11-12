import { api } from './api';
import {
  SingleUploadInitResponse,
  MultipartInitResponse,
  MultipartPartUrlsResponse,
  UploadedPart,
  UploadSessionStatusResponse,
  CompleteUploadResponse,
  UploadQueueItem,
} from '../types/storage.types';
import { formatFileSize } from '../utils/formatters';

interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

export const MULTIPART_THRESHOLD = 16 * 1024 * 1024; // 16 MiB
export const MAX_CONCURRENT_PARTS = 4;
export const MAX_PART_RETRIES = 3;

interface ActiveUploadTask {
  queueId: string;
  fileId: string;
  file: File;
  folderId?: string;
  isMultipart: boolean;
  abortController: AbortController;
  uploadedParts: Map<number, string>; // PartNumber -> ETag
  partSize: number;
  totalParts: number;
  isPaused: boolean;
  isAborted: boolean;
  startTime: number;
  loadedBytes: number;
}

// In-memory map of active uploads
const activeUploads = new Map<string, ActiveUploadTask>();

/**
 * Format ETA into a human-readable string.
 */
function formatEta(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds <= 0) return '0s remaining';
  if (seconds < 60) return `${Math.ceil(seconds)}s remaining`;
  const minutes = Math.floor(seconds / 60);
  const remainingSecs = Math.ceil(seconds % 60);
  return `${minutes}m ${remainingSecs}s remaining`;
}

/**
 * 1. Single-file presigned URL generation (<= 16 MiB)
 */
export async function initiateSingleUpload(
  file: File,
  folderId?: string
): Promise<SingleUploadInitResponse> {
  const response = await api.post<ApiResponse<SingleUploadInitResponse>>('/files/upload-url', {
    name: file.name,
    mimeType: file.type || 'application/octet-stream',
    size: file.size,
    folderId,
  });
  return response.data.data;
}

/**
 * 2. Multipart upload initialization (> 16 MiB)
 */
export async function initiateMultipartUpload(
  file: File,
  folderId?: string
): Promise<MultipartInitResponse> {
  const response = await api.post<ApiResponse<MultipartInitResponse>>('/files/multipart/initiate', {
    name: file.name,
    mimeType: file.type || 'application/octet-stream',
    size: file.size,
    folderId,
  });
  return response.data.data;
}

/**
 * 3. Request presigned part URLs
 */
export async function getMultipartPartUrls(
  fileId: string,
  partNumbers?: number[]
): Promise<MultipartPartUrlsResponse> {
  const response = await api.post<ApiResponse<MultipartPartUrlsResponse>>(
    `/files/${fileId}/part-urls`,
    { partNumbers }
  );
  return response.data.data;
}

/**
 * 4. Fetch upload session status from backend (which queries MinIO ListParts)
 */
export async function getUploadSessionStatus(
  fileId: string
): Promise<UploadSessionStatusResponse> {
  const response = await api.get<ApiResponse<UploadSessionStatusResponse>>(
    `/files/${fileId}/session`
  );
  return response.data.data;
}

/**
 * 5. Complete upload
 */
export async function completeUpload(
  fileId: string,
  parts?: UploadedPart[]
): Promise<CompleteUploadResponse> {
  const response = await api.post<ApiResponse<CompleteUploadResponse>>(
    `/files/${fileId}/complete`,
    parts ? { parts } : {}
  );
  return response.data.data;
}

/**
 * 6. Abort multipart upload
 */
export async function abortUpload(fileId: string): Promise<void> {
  await api.post(`/files/${fileId}/abort`);
}

/**
 * Upload an individual part directly to MinIO using fetch with retries.
 */
async function uploadPartWithRetry(
  file: File,
  partNumber: number,
  uploadUrl: string,
  partSize: number,
  signal: AbortSignal
): Promise<string> {
  const start = (partNumber - 1) * partSize;
  const end = Math.min(start + partSize, file.size);
  const chunk = file.slice(start, end);

  let attempt = 0;
  let lastError: any = null;

  while (attempt <= MAX_PART_RETRIES) {
    if (signal.aborted) {
      throw new Error('Upload aborted by user.');
    }

    try {
      const response = await fetch(uploadUrl, {
        method: 'PUT',
        body: chunk,
        signal,
      });

      if (!response.ok) {
        throw new Error(`MinIO PUT rejected with status ${response.status}`);
      }

      const rawEtag = response.headers.get('ETag') || response.headers.get('etag');
      if (!rawEtag) {
        throw new Error(`ETag header missing in MinIO response for part ${partNumber}`);
      }

      // Preserve clean ETag string
      return rawEtag.replace(/^"|"$/g, '');
    } catch (err: any) {
      if (signal.aborted) {
        throw new Error('Upload aborted by user.');
      }

      lastError = err;
      attempt++;

      if (attempt <= MAX_PART_RETRIES) {
        // Exponential backoff delay (300ms, 600ms, 1200ms)
        await new Promise((resolve) => setTimeout(resolve, 300 * Math.pow(2, attempt - 1)));
      }
    }
  }

  throw lastError || new Error(`Failed to upload part ${partNumber} after ${MAX_PART_RETRIES} attempts.`);
}

/**
 * Process a queue of parts with a concurrency limit of 4.
 */
async function processPartsWithConcurrency(
  task: ActiveUploadTask,
  partUrls: { partNumber: number; uploadUrl: string }[],
  onProgress: (update: Partial<UploadQueueItem>) => void
): Promise<void> {
  const { file, partSize, abortController, uploadedParts } = task;
  const partsQueue = [...partUrls];
  let inFlight = 0;

  // Track byte counts of completed parts
  const completedPartBytes = new Map<number, number>();
  for (const partNum of uploadedParts.keys()) {
    const start = (partNum - 1) * partSize;
    const end = Math.min(start + partSize, file.size);
    completedPartBytes.set(partNum, end - start);
  }

  const updateTelemetry = () => {
    let totalBytesLoaded = 0;
    for (const b of completedPartBytes.values()) {
      totalBytesLoaded += b;
    }

    const elapsedSeconds = Math.max((Date.now() - task.startTime) / 1000, 0.1);
    const speedBytesPerSec = totalBytesLoaded / elapsedSeconds;
    const remainingBytes = Math.max(file.size - totalBytesLoaded, 0);
    const etaSeconds = speedBytesPerSec > 0 ? remainingBytes / speedBytesPerSec : 0;
    const progressPercent = Math.min(Math.round((totalBytesLoaded / file.size) * 100), 99);

    onProgress({
      progress: progressPercent,
      loadedBytes: totalBytesLoaded,
      uploadedPartsCount: uploadedParts.size,
      speed: `${formatFileSize(speedBytesPerSec)}/s`,
      eta: formatEta(etaSeconds),
    });
  };

  return new Promise((resolve, reject) => {
    let hasError = false;

    const launchNext = () => {
      if (hasError || task.isPaused || task.isAborted) return;

      if (partsQueue.length === 0 && inFlight === 0) {
        resolve();
        return;
      }

      while (inFlight < MAX_CONCURRENT_PARTS && partsQueue.length > 0) {
        const nextPart = partsQueue.shift()!;
        inFlight++;

        uploadPartWithRetry(file, nextPart.partNumber, nextPart.uploadUrl, partSize, abortController.signal)
          .then((etag) => {
            inFlight--;
            uploadedParts.set(nextPart.partNumber, etag);

            const start = (nextPart.partNumber - 1) * partSize;
            const end = Math.min(start + partSize, file.size);
            completedPartBytes.set(nextPart.partNumber, end - start);

            updateTelemetry();
            launchNext();
          })
          .catch((err) => {
            inFlight--;
            if (task.isPaused || task.isAborted) {
              return;
            }
            hasError = true;
            reject(err);
          });
      }
    };

    launchNext();
  });
}

/**
 * Main Upload Function: handles single-file and multipart uploads end-to-end.
 */
export async function startFileUpload(
  queueId: string,
  file: File,
  folderId: string | undefined,
  onProgress: (update: Partial<UploadQueueItem>) => void
): Promise<void> {
  const abortController = new AbortController();
  const isMultipart = file.size > MULTIPART_THRESHOLD;

  const task: ActiveUploadTask = {
    queueId,
    fileId: '',
    file,
    folderId,
    isMultipart,
    abortController,
    uploadedParts: new Map<number, string>(),
    partSize: 8 * 1024 * 1024,
    totalParts: 1,
    isPaused: false,
    isAborted: false,
    startTime: Date.now(),
    loadedBytes: 0,
  };

  activeUploads.set(queueId, task);

  try {
    if (!isMultipart) {
      // ---------------- SINGLE PUT FLOW ----------------
      onProgress({ status: 'uploading', progress: 5, speed: 'Negotiating upload URL...', eta: '--' });

      const initData = await initiateSingleUpload(file, folderId);
      task.fileId = initData.fileId;

      if (task.isPaused || task.isAborted) return;

      // Upload directly to MinIO via fetch
      const startTime = Date.now();
      const putResponse = await fetch(initData.uploadUrl, {
        method: 'PUT',
        body: file,
        signal: abortController.signal,
      });

      if (!putResponse.ok) {
        throw new Error(`Single upload to storage engine failed: HTTP ${putResponse.status}`);
      }

      const elapsed = Math.max((Date.now() - startTime) / 1000, 0.1);
      const speed = `${formatFileSize(file.size / elapsed)}/s`;

      onProgress({ status: 'uploading', progress: 99, speed, eta: 'Finalizing...' });

      // Confirm upload with backend
      await completeUpload(initData.fileId);

      onProgress({
        status: 'completed',
        progress: 100,
        fileId: initData.fileId,
        speed: 'Finished',
        eta: 'Done',
      });
      activeUploads.delete(queueId);
      return;
    }

    // ---------------- MULTIPART UPLOAD FLOW ----------------
    onProgress({ status: 'uploading', progress: 2, speed: 'Initializing session...', eta: '--' });

    const initData = await initiateMultipartUpload(file, folderId);
    task.fileId = initData.fileId;
    task.partSize = initData.partSize;
    task.totalParts = initData.totalParts;

    onProgress({
      fileId: initData.fileId,
      totalParts: initData.totalParts,
      uploadedPartsCount: 0,
      progress: 5,
      speed: `Session created (${initData.totalParts} parts)`,
      eta: '--',
    });

    if (task.isPaused || task.isAborted) return;

    // Request part URLs
    const urlsData = await getMultipartPartUrls(task.fileId);

    // Process parts concurrently (max 4 streams)
    await processPartsWithConcurrency(task, urlsData.urls, onProgress);

    if (task.isPaused || task.isAborted) return;

    // All parts uploaded! Format payload for completion
    onProgress({
      status: 'uploading',
      progress: 99,
      speed: 'Verifying with storage engine...',
      eta: 'Validating checksums...',
    });

    const partsList: UploadedPart[] = Array.from(task.uploadedParts.entries())
      .map(([partNumber, etag]) => ({
        PartNumber: partNumber,
        ETag: etag,
      }))
      .sort((a, b) => a.PartNumber - b.PartNumber);

    await completeUpload(task.fileId, partsList);

    onProgress({
      status: 'completed',
      progress: 100,
      fileId: task.fileId,
      speed: 'Synchronized',
      eta: 'Complete',
    });

    activeUploads.delete(queueId);
  } catch (err: any) {
    if (task.isPaused) {
      onProgress({ status: 'paused', speed: 'Paused', eta: '--' });
      return;
    }

    if (task.isAborted) {
      activeUploads.delete(queueId);
      return;
    }

    const message = err.message || 'Upload encountered a network or storage error.';
    onProgress({ status: 'error', errorMessage: message, speed: 'Error', eta: '--' });
  }
}

/**
 * Pause an in-flight upload. Aborts active fetch requests without aborting backend session.
 */
export function pauseUpload(queueId: string): void {
  const task = activeUploads.get(queueId);
  if (!task) return;

  task.isPaused = true;
  task.abortController.abort();
}

/**
 * Resume an interrupted or paused upload.
 * Discovers verified parts from MinIO via backend GET /files/:id/session and uploads only missing parts.
 */
export async function resumeUpload(
  queueId: string,
  onProgress: (update: Partial<UploadQueueItem>) => void
): Promise<void> {
  const task = activeUploads.get(queueId);
  if (!task || !task.fileId) {
    throw new Error('Upload session not found for resumption.');
  }

  // Create a new AbortController for the resumed session
  task.abortController = new AbortController();
  task.isPaused = false;
  task.isAborted = false;
  task.startTime = Date.now();

  onProgress({ status: 'uploading', speed: 'Querying storage status...', eta: '--' });

  try {
    // 1. Verify parts with backend/MinIO ListParts
    const sessionStatus = await getUploadSessionStatus(task.fileId);

    if (sessionStatus.status === 'COMPLETED') {
      onProgress({ status: 'completed', progress: 100, speed: 'Synchronized', eta: 'Complete' });
      activeUploads.delete(queueId);
      return;
    }

    if (sessionStatus.isExpired || sessionStatus.status === 'FAILED' || sessionStatus.status === 'ABORTED') {
      throw new Error(`Upload session cannot be resumed (status: ${sessionStatus.status}).`);
    }

    // Populate already verified parts
    for (const p of sessionStatus.uploadedParts) {
      task.uploadedParts.set(p.PartNumber, p.ETag);
    }

    // 2. If no missing parts, complete directly
    if (sessionStatus.missingPartNumbers.length === 0) {
      onProgress({ status: 'uploading', progress: 99, speed: 'Finalizing upload...' });
      const partsList: UploadedPart[] = Array.from(task.uploadedParts.entries())
        .map(([partNumber, etag]) => ({ PartNumber: partNumber, ETag: etag }))
        .sort((a, b) => a.PartNumber - b.PartNumber);

      await completeUpload(task.fileId, partsList);
      onProgress({ status: 'completed', progress: 100, speed: 'Synchronized', eta: 'Complete' });
      activeUploads.delete(queueId);
      return;
    }

    // 3. Request fresh presigned URLs for missing parts
    const missingUrlsData = await getMultipartPartUrls(task.fileId, sessionStatus.missingPartNumbers);

    // 4. Concurrently upload remaining parts
    await processPartsWithConcurrency(task, missingUrlsData.urls, onProgress);

    if (task.isPaused || task.isAborted) return;

    // 5. Complete multipart upload
    const partsList: UploadedPart[] = Array.from(task.uploadedParts.entries())
      .map(([partNumber, etag]) => ({ PartNumber: partNumber, ETag: etag }))
      .sort((a, b) => a.PartNumber - b.PartNumber);

    await completeUpload(task.fileId, partsList);

    onProgress({ status: 'completed', progress: 100, speed: 'Synchronized', eta: 'Complete' });
    activeUploads.delete(queueId);
  } catch (err: any) {
    if (task.isPaused) {
      onProgress({ status: 'paused', speed: 'Paused', eta: '--' });
      return;
    }
    const message = err.message || 'Resumption failed.';
    onProgress({ status: 'error', errorMessage: message, speed: 'Error', eta: '--' });
  }
}

/**
 * Cancel and Abort upload: terminates network requests and calls backend abort.
 */
export async function cancelUpload(queueId: string): Promise<void> {
  const task = activeUploads.get(queueId);
  if (!task) return;

  task.isAborted = true;
  task.abortController.abort();

  if (task.isMultipart && task.fileId) {
    try {
      await abortUpload(task.fileId);
    } catch (err) {
      console.warn(`Backend abort call returned notice for ${task.fileId}:`, err);
    }
  }

  activeUploads.delete(queueId);
}
