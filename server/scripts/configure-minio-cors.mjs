import 'dotenv/config';

import {
  S3Client,
  PutBucketCorsCommand,
} from '@aws-sdk/client-s3';

const client = new S3Client({
  endpoint: process.env.MINIO_ENDPOINT || 'http://localhost:9000',
  region: process.env.MINIO_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.MINIO_ACCESS_KEY,
    secretAccessKey: process.env.MINIO_SECRET_KEY,
  },
  forcePathStyle: true,
});

const command = new PutBucketCorsCommand({
  Bucket: process.env.MINIO_BUCKET || 'cloudora-files',
  CORSConfiguration: {
    CORSRules: [
      {
        AllowedOrigins: ['*'],
        AllowedMethods: ['PUT', 'GET', 'HEAD'],
        AllowedHeaders: ['*'],
        ExposeHeaders: ['ETag'],
        MaxAgeSeconds: 3000,
      },
    ],
  },
});

try {
  await client.send(command);
  console.log('MinIO CORS configured successfully');
} catch (error) {
  console.error('Failed to configure MinIO CORS:', error);
  process.exitCode = 1;
}
