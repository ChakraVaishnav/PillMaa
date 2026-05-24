// src/services/api.ts
import axios, { AxiosInstance, AxiosRequestConfig, InternalAxiosRequestConfig } from 'axios';
import { API_URL } from '../constants';

let tokenProvider: (() => Promise<string | null>) | null = null;

/**
 * Sets the Clerk token provider function.
 * Called once from the auth setup in _layout.tsx.
 */
export function setTokenProvider(provider: () => Promise<string | null>): void {
  tokenProvider = provider;
}

const api: AxiosInstance = axios.create({
  baseURL: API_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
    Accept:         'application/json',
  },
});

// ─── Request Interceptor — inject Clerk JWT ────────────────────────────────
api.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    if (tokenProvider) {
      try {
        const token = await tokenProvider();
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
      } catch (error) {
        console.warn('[API] Failed to get auth token:', error);
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ─── Response Interceptor — normalize errors ──────────────────────────────
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      const message =
        error.response.data?.message ?? 'An error occurred';
      const code = error.response.data?.error?.code;
      const enhancedError = new Error(message) as Error & {
        statusCode: number;
        code?: string;
      };
      enhancedError.statusCode = error.response.status;
      enhancedError.code = code;
      return Promise.reject(enhancedError);
    }
    if (error.request) {
      return Promise.reject(new Error('Network error — please check your connection'));
    }
    return Promise.reject(error);
  }
);

export default api;
