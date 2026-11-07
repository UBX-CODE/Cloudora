
import bcrypt from 'bcrypt';
import jwt, { SignOptions } from 'jsonwebtoken';
import { prisma } from '../lib/prisma';
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
  const { passwordHash, ...safeUser } = user;

  return {
    ...safeUser,
    createdAt: user.createdAt.toISOString(),
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
    throw new AppError('An account with this email address already exists.', 409);
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
    throw new AppError('Invalid email or password.', 401);
  }

  const isPasswordValid = await bcrypt.compare(
    password,
    user.passwordHash
  );

  if (!isPasswordValid) {
    throw new AppError('Invalid email or password.', 401);
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
