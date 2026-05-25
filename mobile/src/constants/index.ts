// src/constants/index.ts
import type { RepeatDay } from '../types';

export const REPEAT_DAYS: { key: RepeatDay; label: string; short: string }[] = [
  { key: 'MON', label: 'Monday',    short: 'M' },
  { key: 'TUE', label: 'Tuesday',   short: 'T' },
  { key: 'WED', label: 'Wednesday', short: 'W' },
  { key: 'THU', label: 'Thursday',  short: 'T' },
  { key: 'FRI', label: 'Friday',    short: 'F' },
  { key: 'SAT', label: 'Saturday',  short: 'S' },
  { key: 'SUN', label: 'Sunday',    short: 'S' },
];

export const REPEAT_TYPES = [
  { key: 'DAILY',      label: 'Every Day',   icon: 'repeat' },
  { key: 'CUSTOM',     label: 'Custom Days', icon: 'calendar' },
  { key: 'TODAY_ONLY', label: 'Today Only',  icon: 'sun' },
] as const;

export const API_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://192.168.1.37:3000/api/v1';

export const NOTIFICATION_CHANNEL_ID = 'reminders';
export const ALARM_NOTIFICATION_ID_PREFIX = 'alarm_';

export const DEFAULT_SNOOZE_COUNT = 3;
export const DEFAULT_SNOOZE_INTERVAL = 5;

export const GREETING_MESSAGES = {
  morning:   'Good morning',
  afternoon: 'Good afternoon',
  evening:   'Good evening',
} as const;
