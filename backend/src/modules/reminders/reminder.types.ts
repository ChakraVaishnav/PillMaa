// src/modules/reminders/reminder.types.ts
import type { Reminder, RepeatType } from '@prisma/client';

export type { Reminder };

export interface CreateReminderDto {
  medicineName: string;
  dosage: string;
  reminderTime: string;           // "HH:MM"
  repeatType: RepeatType;
  repeatDays: string[];           // e.g. ["MON","WED","FRI"]
  startDate: string;              // ISO date string
  endDate?: string;               // ISO date string, optional
  snoozeCount?: number;
  snoozeInterval?: number;        // minutes
}

export interface UpdateReminderDto {
  medicineName?: string;
  dosage?: string;
  reminderTime?: string;
  repeatType?: RepeatType;
  repeatDays?: string[];
  startDate?: string;
  endDate?: string;
  snoozeCount?: number;
  snoozeInterval?: number;
  isCompleted?: boolean;
}

export interface ReminderFilters {
  isCompleted?: boolean;
  repeatType?: RepeatType;
  date?: string;                  // "YYYY-MM-DD" — filter by date
}
