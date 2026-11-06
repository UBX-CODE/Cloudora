import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config/env';
import { AuthPayload, UserRole } from '../types/user.types';
import { AppError } from '../utils/errors';

// Extend Express Request interface to include authenticated user
declare global {
  namespace Express {
    interface Request {
      user?: AuthPayload;
    }
  }
}

/**
 * Middleware that authenticates incoming requests via JWT bearer token.
 */
export function authenticate(req: Request, _res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next(new AppError('Authentication required. Missing or malformed authorization header.', 401));
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, config.JWT_SECRET) as AuthPayload;
    req.user = {
      id: decoded.id,
      email: decoded.email,
      role: decoded.role,
    };
    next();
  } catch (error: any) {
    if (error.name === 'TokenExpiredError') {
      return next(new AppError('Your session has expired. Please log in again.', 401));
    }
    return next(new AppError('Invalid or expired authentication token.', 401));
  }
}

/**
 * Basic authorization middleware to enforce role requirements.
 * Kept separate from authentication logic as required.
 */
export function authorizeRoles(...allowedRoles: UserRole[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      return next(new AppError('Unauthorized: User not authenticated.', 401));
    }

    if (!allowedRoles.includes(req.user.role)) {
      return next(
        new AppError('Forbidden: You do not have sufficient permissions to access this resource.', 403)
      );
    }

    next();
  };
}

/**
 * Authorization middleware ensuring users can only access their own account data.
 */
export function authorizeUserAccess(paramName: string = 'id') {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      return next(new AppError('Unauthorized: User not authenticated.', 401));
    }

    const requestedUserId = req.params[paramName];
    if (requestedUserId && requestedUserId !== req.user.id && req.user.role !== 'ADMIN') {
      return next(
        new AppError('Forbidden: You can only view or manage your own account.', 403)
      );
    }

    next();
  };
}

