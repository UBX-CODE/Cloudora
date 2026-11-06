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
};

