// src/modules/reminders/reminder.validator.ts
import { z } from 'zod';
import { RepeatType } from '@prisma/client';

const VALID_DAYS = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];
const TIME_REGEX = /^([01]\d|2[0-3]):([0-5]\d)$/; // HH:MM

const baseReminderSchema = z.object({
  medicineName: z
    .string()
    .min(1, 'Medicine name is required')
    .max(100, 'Medicine name too long'),
  dosage: z
    .string()
    .min(1, 'Dosage is required')
    .max(50, 'Dosage too long'),
  reminderTime: z
    .string()
    .regex(TIME_REGEX, 'Invalid time format — use HH:MM (24-hour)'),
  repeatType: z.nativeEnum(RepeatType),
  repeatDays: z
    .array(z.string().refine((d) => VALID_DAYS.includes(d), 'Invalid day'))
    .default([]),
  startDate: z.string().datetime({ offset: true }).or(z.string().date()),
  endDate: z
    .string()
    .datetime({ offset: true })
    .or(z.string().date())
    .optional(),
  snoozeCount: z.number().int().min(0).max(10).default(3),
  snoozeInterval: z.number().int().min(1).max(60).default(5),
});

export const createReminderSchema = baseReminderSchema.superRefine((data, ctx) => {
  if (data.repeatType === 'CUSTOM' && data.repeatDays.length === 0) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'repeatDays is required when repeatType is CUSTOM',
      path: ['repeatDays'],
    });
  }
});

export const updateReminderSchema = baseReminderSchema.partial().extend({
  isCompleted: z.boolean().optional(),
});

export const reminderIdSchema = z.object({
  id: z.string().cuid('Invalid reminder ID'),
});

export type CreateReminderInput = z.infer<typeof createReminderSchema>;
export type UpdateReminderInput = z.infer<typeof updateReminderSchema>;
