// src/shared/constants/index.ts

export const REPEAT_DAYS = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'] as const;
export type RepeatDay = (typeof REPEAT_DAYS)[number];

export const DEFAULT_SNOOZE_COUNT = 3;
export const DEFAULT_SNOOZE_INTERVAL = 5; // minutes

export const API_VERSION = 'v1';
export const API_PREFIX = `/api/${API_VERSION}`;

export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNPROCESSABLE: 422,
  INTERNAL: 500,
} as const;
