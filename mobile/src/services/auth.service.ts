// src/services/auth.service.ts
import api from './api';
import type { ApiResponse, User } from '../types';

export const AuthService = {
  /**
   * Syncs the Clerk user to the local database.
   * Should be called after every successful sign-in.
   */
  async sync(name: string, email: string): Promise<User> {
    const { data } = await api.post<ApiResponse<User>>('/auth/sync', { name, email });
    return data.data!;
  },

  /**
   * Fetches the current user's profile from the backend.
   */
  async getMe(): Promise<User> {
    const { data } = await api.get<ApiResponse<User>>('/auth/me');
    return data.data!;
  },

  /**
   * Deletes the user account (both from Clerk and backend DB).
   */
  async deleteAccount(): Promise<void> {
    await api.delete('/auth/me');
  },
};
