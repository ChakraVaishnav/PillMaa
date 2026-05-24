// src/services/reminder.service.ts
import api from './api';
import type { ApiResponse, Reminder, CreateReminderPayload, UpdateReminderPayload } from '../types';

export const ReminderService = {
  /**
   * Fetches all reminders for the authenticated user.
   */
  async getAll(filters?: { isCompleted?: boolean }): Promise<Reminder[]> {
    const params = filters?.isCompleted !== undefined
      ? { isCompleted: String(filters.isCompleted) }
      : {};
    const { data } = await api.get<ApiResponse<Reminder[]>>('/reminders', { params });
    return data.data ?? [];
  },

  /**
   * Fetches a single reminder by ID.
   */
  async getById(id: string): Promise<Reminder> {
    const { data } = await api.get<ApiResponse<Reminder>>(`/reminders/${id}`);
    return data.data!;
  },

  /**
   * Creates a new reminder.
   */
  async create(payload: CreateReminderPayload): Promise<Reminder> {
    const { data } = await api.post<ApiResponse<Reminder>>('/reminders', payload);
    return data.data!;
  },

  /**
   * Updates an existing reminder.
   */
  async update(id: string, payload: UpdateReminderPayload): Promise<Reminder> {
    const { data } = await api.put<ApiResponse<Reminder>>(`/reminders/${id}`, payload);
    return data.data!;
  },

  /**
   * Marks a reminder as taken/completed.
   */
  async markComplete(
    id: string,
    takenVia: 'swipe' | 'alarm_dismiss' | 'manual' = 'manual'
  ): Promise<Reminder> {
    const { data } = await api.patch<ApiResponse<Reminder>>(
      `/reminders/${id}/complete`,
      { takenVia }
    );
    return data.data!;
  },

  /**
   * Fetches recent medicine logs.
   */
  async getHistory(filters?: { date?: string; page?: number; limit?: number }): Promise<any[]> {
    const { data } = await api.get<ApiResponse<any[]>>('/reminders/history', { params: filters });
    return data.data ?? [];
  },

  /**
   * Fetches consecutive days streak count.
   */
  async getStreak(): Promise<number> {
    const { data } = await api.get<ApiResponse<{ streak: number }>>('/reminders/streak');
    return data.data?.streak ?? 0;
  },

  /**
   * Deletes a reminder.
   */
  async delete(id: string): Promise<void> {
    await api.delete(`/reminders/${id}`);
  },
};
