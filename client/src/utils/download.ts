import { getFileDownloadUrl } from '../services/file.service';

/**
 * Downloads a file using a presigned S3/MinIO attachment URL.
 */
export async function downloadFile(fileId: string, fallbackName?: string): Promise<void> {
  try {
    const { downloadUrl, filename } = await getFileDownloadUrl(fileId);
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.setAttribute('download', filename || fallbackName || 'download');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  } catch (err: any) {
    console.error('[Download Error]:', err);
    alert(err.response?.data?.message || 'Failed to download file. Please check permissions.');
  }
}
