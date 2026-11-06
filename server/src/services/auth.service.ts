import bcrypt from 'bcrypt';
import jwt, { SignOptions } from 'jsonwebtoken';
import crypto from 'crypto';
import { readUsers, writeUsers } from '../utils/fileDb';
import { IUser, SafeUser, AuthPayload, RegisterDTO, LoginDTO, AuthResponse } from '../types/user.types';
import { config } from '../config/env';
import { AppError } from '../utils/errors';

const SALT_ROUNDS = 10;

/**
 * Strips sensitive fields like passwordHash from user object.
 */
function sanitizeUser(user: IUser): SafeUser {
  const { passwordHash, ...safeUser } = user;
  return safeUser;
}

/**
 * Generates a signed JWT token for the user.
 */
export function generateToken(payload: AuthPayload): string {
  const options: SignOptions = {
    expiresIn: config.JWT_EXPIRES_IN as any,
  };
  return jwt.sign(payload, config.JWT_SECRET, options);
}

/**
 * Registers a new user.
 */
export async function register(dto: RegisterDTO): Promise<AuthResponse> {
  const { name, email, password } = dto;

  // Validation
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
  const users = await readUsers();

  // Check duplicate email
  const existingUser = users.find((u) => u.email.toLowerCase() === normalizedEmail);
  if (existingUser) {
    throw new AppError('An account with this email address already exists.', 409);
  }

  // Hash password
  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

  const newUser: IUser = {
    id: crypto.randomUUID(),
    name: name.trim(),
    email: normalizedEmail,
    passwordHash,
    role: 'USER',
    createdAt: new Date().toISOString(),
  };

  users.push(newUser);
  await writeUsers(users);

  const token = generateToken({
    id: newUser.id,
    email: newUser.email,
    role: newUser.role,
  });

  return {
    user: sanitizeUser(newUser),
    token,
  };
}

/**
 * Authenticates user credentials and generates JWT.
 */
export async function login(dto: LoginDTO): Promise<AuthResponse> {
  const { email, password } = dto;

  if (!email || !password) {
    throw new AppError('Email and password are required.', 400);
  }

  const normalizedEmail = email.trim().toLowerCase();
  const users = await readUsers();

  const user = users.find((u) => u.email.toLowerCase() === normalizedEmail);
  if (!user) {
    // Avoid user enumeration
    throw new AppError('Invalid email or password.', 401);
  }

  const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
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

/**
 * Retrieves user profile by user id.
 */
export async function getUserById(userId: string): Promise<SafeUser> {
  const users = await readUsers();
  const user = users.find((u) => u.id === userId);

  if (!user) {
    throw new AppError('User not found.', 404);
  }

  return sanitizeUser(user);
}

