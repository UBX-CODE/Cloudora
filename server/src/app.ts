import express, { Application, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import authRoutes from './routes/auth.routes';
import { errorHandler } from './middleware/error.middleware';
import { AppError } from './utils/errors';
import { config } from './config/env';

const app: Application = express();

// Middlewares
app.use(
  cors({
    origin: config.CORS_ORIGIN === '*' ? true : [config.CORS_ORIGIN, 'http://localhost:5173', 'http://127.0.0.1:5173'],
    credentials: true,
  })
);
app.use(express.json());

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

// Catch-all 404 handler
app.use((_req: Request, _res: Response, next: NextFunction) => {
  next(new AppError('Resource not found on this server.', 404));
});

// Centralized Error Handling
app.use(errorHandler);

export default app;

