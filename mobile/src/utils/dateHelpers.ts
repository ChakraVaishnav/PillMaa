// src/utils/dateHelpers.ts
import { format, isToday, isTomorrow, parseISO, isAfter, isBefore } from 'date-fns';
import type { RepeatDay } from '../types';

export const DAY_MAP: Record<number, RepeatDay> = {
  0: 'SUN', 1: 'MON', 2: 'TUE',
  3: 'WED', 4: 'THU', 5: 'FRI', 6: 'SAT',
};

/**
 * Formats a "HH:MM" time string to "12:30 PM" display format.
 */
export function formatReminderTime(time: string): string {
  const [hours, minutes] = time.split(':').map(Number);
  const date = new Date();
  date.setHours(hours, minutes, 0, 0);
  return format(date, 'h:mm a');
}

/**
 * Returns a human-friendly greeting based on the current hour.
 */
export function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

/**
 * Returns the next occurrence of a reminder as a human-friendly string.
 */
export function getNextReminderLabel(reminderTime: string): string {
  const [hours, minutes] = reminderTime.split(':').map(Number);
  const now = new Date();
  const next = new Date();
  next.setHours(hours, minutes, 0, 0);

  if (next <= now) {
    next.setDate(next.getDate() + 1);
  }

  if (isToday(next)) return `Today at ${format(next, 'h:mm a')}`;
  if (isTomorrow(next)) return `Tomorrow at ${format(next, 'h:mm a')}`;
  return format(next, "EEE, MMM d 'at' h:mm a");
}

/**
 * Builds a Date object for today at a given "HH:MM" time.
 */
export function buildDateAtTime(time: string, baseDate: Date = new Date()): Date {
  const [hours, minutes] = time.split(':').map(Number);
  const date = new Date(baseDate);
  date.setHours(hours, minutes, 0, 0);
  return date;
}

/**
 * Checks if a reminder is scheduled for today based on repeatType and repeatDays.
 */
export function isReminderActiveToday(
  repeatType: string,
  repeatDays: string[],
  startDate: string,
  endDate: string | null
): boolean {
  const today = new Date();
  const start = parseISO(startDate);

  if (isBefore(today, start)) return false;
  if (endDate && isAfter(today, parseISO(endDate))) return false;

  if (repeatType === 'TODAY_ONLY') {
    return isToday(start);
  }

  if (repeatType === 'DAILY') return true;

  if (repeatType === 'CUSTOM') {
    const todayKey = DAY_MAP[today.getDay()];
    return repeatDays.includes(todayKey);
  }

  return false;
}

/**
 * Checks if a reminder is active on a generic date.
 */
export function isReminderActiveOnDate(
  date: Date,
  repeatType: string,
  repeatDays: string[],
  startDate: string,
  endDate: string | null
): boolean {
  const checkDate = new Date(date);
  checkDate.setHours(0, 0, 0, 0);

  const start = parseISO(startDate);
  const startZero = new Date(start);
  startZero.setHours(0, 0, 0, 0);

  if (checkDate < startZero) return false;
  if (endDate) {
    const end = parseISO(endDate);
    const endZero = new Date(end);
    endZero.setHours(0, 0, 0, 0);
    if (checkDate > endZero) return false;
  }

  if (repeatType === 'TODAY_ONLY') {
    return checkDate.getTime() === startZero.getTime();
  }

  if (repeatType === 'DAILY') return true;

  if (repeatType === 'CUSTOM') {
    const dayKey = DAY_MAP[checkDate.getDay()];
    return repeatDays.includes(dayKey);
  }

  return false;
}

/**
 * Formats repeat info for display on reminder cards.
 */
export function formatRepeatInfo(repeatType: string, repeatDays: string[]): string {
  if (repeatType === 'DAILY') return 'Every day';
  if (repeatType === 'TODAY_ONLY') return 'Today only';
  if (repeatType === 'CUSTOM') {
    if (repeatDays.length === 0) return 'No days set';
    if (repeatDays.length === 7) return 'Every day';
    return repeatDays.join(', ');
  }
  return '';
}
