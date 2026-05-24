// src/shared/utils/logger.ts
import { env } from '../../config/env';

type LogLevel = 'info' | 'warn' | 'error' | 'debug';

const colors = {
  info: '\x1b[36m',   // Cyan
  warn: '\x1b[33m',   // Yellow
  error: '\x1b[31m',  // Red
  debug: '\x1b[35m',  // Magenta
  reset: '\x1b[0m',
};

const log = (level: LogLevel, message: string, meta?: unknown): void => {
  if (level === 'debug' && env.NODE_ENV === 'production') return;

  const timestamp = new Date().toISOString();
  const color = colors[level];
  const prefix = `${color}[${level.toUpperCase()}]${colors.reset}`;

  if (meta) {
    console.log(`${prefix} ${timestamp} — ${message}`, meta);
  } else {
    console.log(`${prefix} ${timestamp} — ${message}`);
  }
};

export const logger = {
  info: (message: string, meta?: unknown) => log('info', message, meta),
  warn: (message: string, meta?: unknown) => log('warn', message, meta),
  error: (message: string, meta?: unknown) => log('error', message, meta),
  debug: (message: string, meta?: unknown) => log('debug', message, meta),
};
