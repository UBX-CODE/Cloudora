export type UserRole = 'USER' | 'ADMIN';

export interface IUser {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  role: UserRole;
  storageUsed?: number;
  storageLimit?: number;
  createdAt: string;
}

export type SafeUser = Omit<IUser, 'passwordHash'>;

export interface AuthPayload {
  id: string;
  email: string;
  role: UserRole;
}

export interface RegisterDTO {
  name: string;
  email: string;
  password: string;
}

export interface LoginDTO {
  email: string;
  password: string;
}

export interface AuthResponse {
  user: SafeUser;
  token: string;
}

