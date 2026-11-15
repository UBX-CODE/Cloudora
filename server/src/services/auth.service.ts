
import bcrypt from 'bcrypt';
import jwt, { SignOptions } from 'jsonwebtoken';
import sharp from 'sharp';
import { PutObjectCommand, DeleteObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { prisma } from '../lib/prisma';
import { storageClient } from '../lib/storage';
import {
  IUser,
  SafeUser,
  AuthPayload,
  RegisterDTO,
  LoginDTO,
  AuthResponse,
} from '../types/user.types';
import { config } from '../config/env';
import { AppError } from '../utils/errors';

const SALT_ROUNDS = 10;

// Convert Prisma User into our existing SafeUser format
function sanitizeUser(user: any): SafeUser {
  const { passwordHash, storageUsed, storageLimit, createdAt, updatedAt, ...safeUser } = user;

  return {
    ...safeUser,
    avatar: user.avatar || null,
    storageUsed: storageUsed !== undefined && storageUsed !== null ? Number(storageUsed) : 0,
    storageLimit: storageLimit !== undefined && storageLimit !== null ? Number(storageLimit) : 5368709120,
    createdAt: createdAt ? new Date(createdAt).toISOString() : new Date().toISOString(),
  };
}

export function generateToken(payload: AuthPayload): string {
  const options: SignOptions = {
    expiresIn: config.JWT_EXPIRES_IN as any,
  };

  return jwt.sign(payload, config.JWT_SECRET, options);
}

// Register user
export async function register(dto: RegisterDTO): Promise<AuthResponse> {
  const { name, email, password } = dto;

  if (!name || name.trim().length < 2) {
    throw new AppError('Name must be at least 2 characters long.', 400);
  }

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new AppError('Please provide a valid email address.', 400);
  }

  if (!password || password.length < 8) {
    throw new AppError('Password must be at least 8 characters long.', 400);
  }

  const normalizedEmail = email.trim().toLowerCase();

  const existingUser = await prisma.user.findUnique({
    where: { email: normalizedEmail },
  });

  if (existingUser) {
    throw new AppError('An account with this email address already exists. Please sign in.', 409);
  }

  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

  try {
    const newUser = await prisma.user.create({
      data: {
        name: name.trim(),
        email: normalizedEmail,
        passwordHash,
      },
    });

    const token = generateToken({
      id: newUser.id,
      email: newUser.email,
      role: newUser.role,
    });

    return {
      user: sanitizeUser(newUser),
      token,
    };
  } catch (error: any) {
    // Handle concurrent duplicate registration
    if (error.code === 'P2002') {
      throw new AppError(
        'An account with this email address already exists.',
        409
      );
    }

    throw error;
  }
}

// Login user
export async function login(dto: LoginDTO): Promise<AuthResponse> {
  const { email, password } = dto;

  if (!email || !password) {
    throw new AppError('Email and password are required.', 400);
  }

  const normalizedEmail = email.trim().toLowerCase();

  const user = await prisma.user.findUnique({
    where: { email: normalizedEmail },
  });

  if (!user) {
    throw new AppError('No account found with this email address. Please create an account or verify your email.', 404);
  }

  const isPasswordValid = await bcrypt.compare(
    password,
    user.passwordHash
  );

  if (!isPasswordValid) {
    throw new AppError('Incorrect password. Please double-check your password and try again.', 401);
  }

  const token = generateToken({
    id: user.id,
    email: user.email,
    role: user.role,
  });

  return {
    user: sanitizeUser(user),
    token,
  };
}

// Get user by ID
export async function getUserById(userId: string): Promise<SafeUser> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    throw new AppError('User not found.', 404);
  }

  return sanitizeUser(user);
}

export interface UpdateProfileDTO {
  name?: string;
  avatar?: string | null; // Base64 data URL, or null to remove
}

// Update user profile (name and/or avatar image)
export async function updateProfile(userId: string, data: UpdateProfileDTO): Promise<SafeUser> {
  const updateData: any = {};

  if (data.name !== undefined) {
    if (!data.name || data.name.trim().length < 2) {
      throw new AppError('Name must be at least 2 characters long.', 400);
    }
    updateData.name = data.name.trim();
  }

  if (data.avatar !== undefined) {
    if (data.avatar === null || data.avatar === '') {
      // Remove avatar from MinIO
      const avatarKey = `avatars/${userId}.webp`;
      try {
        await storageClient.send(
          new DeleteObjectCommand({
            Bucket: config.MINIO_BUCKET,
            Key: avatarKey,
          })
        );
      } catch (err: any) {
        console.warn(`[Avatar Delete Warning] Key "${avatarKey}":`, err.message);
      }
      updateData.avatar = null;
    } else if (data.avatar.startsWith('data:image/')) {
      // Extract base64 image and process via sharp
      const base64Data = data.avatar.split(';base64,').pop();
      if (!base64Data) {
        throw new AppError('Invalid image data URL format.', 400);
      }

      const rawBuffer = Buffer.from(base64Data, 'base64');
      if (rawBuffer.length > 5 * 1024 * 1024) {
        throw new AppError('Avatar image must not exceed 5 MB.', 400);
      }

      // Convert to a sharp, high-res 256x256 WebP avatar
      const processedBuffer = await sharp(rawBuffer)
        .resize(256, 256, { fit: 'cover', position: 'center' })
        .webp({ quality: 90 })
        .toBuffer();

      const avatarKey = `avatars/${userId}.webp`;
      await storageClient.send(
        new PutObjectCommand({
          Bucket: config.MINIO_BUCKET,
          Key: avatarKey,
          Body: processedBuffer,
          ContentType: 'image/webp',
        })
      );

      // Save public stream URL with cache buster
      updateData.avatar = `/api/auth/avatar/${userId}?t=${Date.now()}`;
    } else if (data.avatar.startsWith('http://') || data.avatar.startsWith('https://')) {
      try {
        const resp = await fetch(data.avatar, { signal: AbortSignal.timeout(8000) });
        if (resp.ok) {
          const arrayBuf = await resp.arrayBuffer();
          const rawBuffer = Buffer.from(arrayBuf);
          const processedBuffer = await sharp(rawBuffer)
            .resize(256, 256, { fit: 'cover', position: 'center' })
            .webp({ quality: 90 })
            .toBuffer();

          const avatarKey = `avatars/${userId}.webp`;
          await storageClient.send(
            new PutObjectCommand({
              Bucket: config.MINIO_BUCKET,
              Key: avatarKey,
              Body: processedBuffer,
              ContentType: 'image/webp',
            })
          );
          updateData.avatar = `/api/auth/avatar/${userId}?t=${Date.now()}`;
        } else {
          updateData.avatar = data.avatar;
        }
      } catch (err: any) {
        console.warn(`[Avatar URL Fetch Warning]:`, err.message);
        updateData.avatar = data.avatar;
      }
    }
  }

  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: updateData,
  });

  return sanitizeUser(updatedUser);
}

// Stream user avatar from MinIO
export async function getAvatarStream(userId: string): Promise<{ stream: any; contentType: string }> {
  const avatarKey = `avatars/${userId}.webp`;
  try {
    const command = new GetObjectCommand({
      Bucket: config.MINIO_BUCKET,
      Key: avatarKey,
    });
    const result = await storageClient.send(command);
    return {
      stream: result.Body,
      contentType: result.ContentType || 'image/webp',
    };
  } catch {
    throw new AppError('Avatar not found.', 404);
  }
}

// Change account password
export async function changePassword(
  userId: string,
  data: { currentPassword: string; newPassword: string }
): Promise<{ success: boolean; message: string }> {
  const { currentPassword, newPassword } = data;

  if (!currentPassword || !newPassword) {
    throw new AppError('Current password and new password are required.', 400);
  }

  if (newPassword.length < 8) {
    throw new AppError('New password must be at least 8 characters long.', 400);
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    throw new AppError('User not found.', 404);
  }

  const isCurrentValid = await bcrypt.compare(currentPassword, user.passwordHash);
  if (!isCurrentValid) {
    throw new AppError('Current password is incorrect.', 400);
  }

  const passwordHash = await bcrypt.hash(newPassword, SALT_ROUNDS);

  await prisma.user.update({
    where: { id: userId },
    data: { passwordHash },
  });

  return {
    success: true,
    message: 'Password changed successfully.',
  };
}
