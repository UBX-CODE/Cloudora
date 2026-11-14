import { Request, Response, NextFunction } from 'express';
import * as shareService from '../services/share.service';
import { AppError } from '../utils/errors';

/**
 * Create a new share link (authenticated).
 */
export async function createShare(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    if (!req.user?.id) throw new AppError('Authentication required.', 401);

    const result = await shareService.createShareLink(req.user.id, req.body);

    res.status(201).json({
      success: true,
      message: 'Share link created successfully',
      data: result,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Access a public share link (unauthenticated).
 */
export async function getPublicShare(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { token } = req.params;
    const password = req.query.password as string | undefined;

    const result = await shareService.getPublicShare(token, password);

    res.status(200).json({
      success: true,
      message: 'Share accessed successfully',
      data: result,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Verify password for a protected public share (unauthenticated POST).
 */
export async function verifyPublicPassword(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { token } = req.params;
    const { password } = req.body;

    if (!password) {
      throw new AppError('Password is required.', 400);
    }

    const result = await shareService.getPublicShare(token, password);

    res.status(200).json({
      success: true,
      message: 'Password verified successfully',
      data: result,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Get items shared directly with the current user (authenticated).
 */
export async function getSharedWithMe(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    if (!req.user?.id) throw new AppError('Authentication required.', 401);

    const result = await shareService.getSharedWithMe(req.user.id);

    res.status(200).json({
      success: true,
      message: 'Shared items fetched successfully',
      data: result,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Get active shares created by the current user (authenticated).
 */
export async function getMyCreatedShares(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    if (!req.user?.id) throw new AppError('Authentication required.', 401);

    const result = await shareService.getMyCreatedShares(req.user.id);

    res.status(200).json({
      success: true,
      message: 'Created shares fetched successfully',
      data: result,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Revoke/delete a share link (authenticated).
 */
export async function revokeShare(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    if (!req.user?.id) throw new AppError('Authentication required.', 401);

    const { id } = req.params;
    const result = await shareService.revokeShare(req.user.id, id);

    res.status(200).json({
      success: true,
      message: 'Share revoked successfully',
      data: result,
    });
  } catch (error) {
    next(error);
  }
}
