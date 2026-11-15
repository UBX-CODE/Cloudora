import axios, { AxiosError } from 'axios';

let rawBaseUrl = (import.meta.env.VITE_API_URL || 'http://localhost:5000/api').trim();
// Strip trailing slash
rawBaseUrl = rawBaseUrl.replace(/\/+$/, '');
// Ensure URL ends with /api
export const API_BASE_URL = rawBaseUrl.endsWith('/api') ? rawBaseUrl : `${rawBaseUrl}/api`;

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 60000, // 60s timeout to smoothly support Render cold-starts
});

// Request Interceptor: Attach JWT Token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('cloudora_token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor: Handle Authentication Expiry & Rate Limiting
api.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    // 1. Rate Limiting Trigger (HTTP 429 Too Many Requests)
    if (error.response?.status === 429) {
      const responseData = error.response.data as any;
      const message =
        responseData?.message ||
        'Too many requests sent to the server. Please slow down and try again shortly.';
      const retryAfter = Number(responseData?.retryAfter) || 60;

      if (typeof window !== 'undefined') {
        window.dispatchEvent(
          new CustomEvent('cloudora:rate-limited', {
            detail: { message, retryAfter },
          })
        );
      }
    }

    // 2. Authentication Expiry (HTTP 401 Unauthorized)
    if (error.response?.status === 401) {
      // Clear local storage if token rejected (except on auth pages or public share pages)
      const currentPath = window.location.pathname;
      const isAuthOrPublicPage =
        currentPath === '/login' ||
        currentPath === '/register' ||
        currentPath === '/' ||
        currentPath.startsWith('/s/');

      if (!isAuthOrPublicPage) {
        localStorage.removeItem('cloudora_token');
        localStorage.removeItem('cloudora_user');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

