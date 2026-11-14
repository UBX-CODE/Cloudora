import app from './app';
import { config } from './config/env';
import { cleanupExpiredUploadSessions } from './services/file-upload.service';
import './workers/file-processing.worker';

const server = app.listen(config.PORT, () => {
  console.log(`=========================================`);
  console.log(` Cloudora Backend Service Running       `);
  console.log(` Port: ${config.PORT}                      `);
  console.log(` Mode: ${config.NODE_ENV}               `);
  console.log(` URL:  http://localhost:${config.PORT}     `);
  console.log(`=========================================`);
});

// Periodic background cleanup for expired upload sessions (every 30 minutes)
const CLEANUP_INTERVAL_MS = 30 * 60 * 1000;
const cleanupTimer = setInterval(async () => {
  try {
    const cleaned = await cleanupExpiredUploadSessions();
    if (cleaned > 0) {
      console.log(`[Upload Cleanup] Cleaned up ${cleaned} expired upload session(s).`);
    }
  } catch (err) {
    console.error('[Upload Cleanup Error]:', err);
  }
}, CLEANUP_INTERVAL_MS);

cleanupTimer.unref();

process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
  clearInterval(cleanupTimer);
  server.close(() => {
    console.log('HTTP server closed');
  });
});
