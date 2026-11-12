import { HeadBucketCommand } from '@aws-sdk/client-s3';
import { storageClient } from '../lib/storage';
import { config } from '../config/env';

export const checkStorageConnection = async (): Promise<boolean> => {
  try {
    await storageClient.send(
      new HeadBucketCommand({
        Bucket: config.MINIO_BUCKET,
      })
    );

    console.log('MinIO connection successful');
    return true;
  } catch (error) {
    console.error('MinIO connection failed:', error);
    return false;
  }
};