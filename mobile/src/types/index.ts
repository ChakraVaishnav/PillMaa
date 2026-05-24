// src/types/index.ts

export type RepeatType = 'DAILY' | 'CUSTOM' | 'TODAY_ONLY';

export type RepeatDay = 'MON' | 'TUE' | 'WED' | 'THU' | 'FRI' | 'SAT' | 'SUN';

export interface Reminder {
  id: string;
  userId: string;
  medicineName: string;
  dosage: string;
  reminderTime: string;        // "HH:MM"
  repeatType: RepeatType;
  repeatDays: RepeatDay[];
  startDate: string;           // ISO string
  endDate: string | null;
  snoozeCount: number;
  snoozeInterval: number;      // minutes
  isCompleted: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface User {
  id: string;
  clerkId: string;
  name: string;
  email: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateReminderPayload {
  medicineName: string;
  dosage: string;
  reminderTime: string;
  repeatType: RepeatType;
  repeatDays: RepeatDay[];
  startDate: string;
  endDate?: string;
  snoozeCount: number;
  snoozeInterval: number;
}

export interface UpdateReminderPayload extends Partial<CreateReminderPayload> {
  isCompleted?: boolean;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data?: T;
  error?: {
    code?: string;
    details?: unknown;
  };
}

// Alarm screen navigation param
export interface AlarmParams {
  reminderId: string;
  medicineName: string;
  dosage: string;
  snoozeCount: number;
  snoozeInterval: number;
}
