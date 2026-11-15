import { api } from './api';
import { ApiResponse, AuthResponseData, User } from '../types/auth.types';

export const authService = {
  async register(name: string, email: string, password: string): Promise<AuthResponseData> {
    const response = await api.post<ApiResponse<AuthResponseData>>('/auth/register', {
      name,
      email,
      password,
    });
    return response.data.data;
  },

  async login(email: string, password: string): Promise<AuthResponseData> {
    const response = await api.post<ApiResponse<AuthResponseData>>('/auth/login', {
      email,
      password,
    });
    return response.data.data;
  },

  async getMe(): Promise<User> {
    const response = await api.get<ApiResponse<{ user: User }>>('/auth/me');
    return response.data.data.user;
  },

  async logout(): Promise<void> {
    try {
      await api.post('/auth/logout');
    } catch {
      // Ignore network errors on logout since token is discarded client-side
    }
  },

  async updateProfile(data: { name?: string; avatar?: string | null } | string): Promise<User> {
    const payload = typeof data === 'string' ? { name: data } : data;
    const response = await api.patch<ApiResponse<{ user: User }>>('/auth/profile', payload);
    return response.data.data.user;
  },

  async changePassword(currentPassword: string, newPassword: string): Promise<string> {
    const response = await api.patch<ApiResponse<void>>('/auth/password', {
      currentPassword,
      newPassword,
    });
    return response.data.message || 'Password changed successfully.';
  },
};

export const getAvatarUrl = (avatar?: string | null): string | null => {
  if (!avatar) return null;
  if (avatar.startsWith('http://') || avatar.startsWith('https://') || avatar.startsWith('blob:')) {
    return avatar;
  }
  const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
  const origin = apiBase.replace(/\/api\/?$/, '');
  return `${origin}${avatar}`;
};

