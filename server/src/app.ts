import express, { Application, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import authRoutes from './routes/auth.routes';
import { errorHandler } from './middleware/error.middleware';
import { AppError } from './utils/errors';
import { config } from './config/env';
import folderRoutes from './routes/folder.routes';
import { checkStorageConnection } from './services/storage.service';
import fileRoutes from './routes/file.routes';
import shareRoutes from './routes/share.routes';

const app: Application = express();

// Middlewares
const allowedOrigins = config.CORS_ORIGIN
  ? config.CORS_ORIGIN.split(',').map((o) => o.trim())
  : [];

app.use(
  cors({
    origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
      // Allow server-to-server, curl, or mobile app requests without origin header
      if (!origin) return callback(null, true);
      if (
        config.CORS_ORIGIN === '*' ||
        allowedOrigins.includes(origin) ||
        origin.includes('localhost') ||
        origin.includes('127.0.0.1') ||
        origin.endsWith('.vercel.app') ||
        origin.endsWith('.netlify.app') ||
        origin.endsWith('.pages.dev')
      ) {
        return callback(null, true);
      }
      return callback(null, true);
    },
    credentials: true,
  })
);
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Health Check
app.get('/api/health', (_req: Request, res: Response) => {
  res.status(200).json({
    status: 'ok',
    service: 'Cloudora Auth Backend',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
  });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/folders', folderRoutes);
app.use('/api/files', fileRoutes);
app.use('/api/shares', shareRoutes);

app.get('/api/storage/health', async (req: Request, res: Response) => {
  const isConnected = await checkStorageConnection();

  res.status(isConnected ? 200 : 500).json({
    success: isConnected,
    message: isConnected
      ? 'Storage is connected'
      : 'Storage connection failed',
  });
});

// Catch-all 404 handler
app.use((_req: Request, _res: Response, next: NextFunction) => {
  next(new AppError('Resource not found on this server.', 404));
});


// Centralized Error Handling
app.use(errorHandler);

export default app;

