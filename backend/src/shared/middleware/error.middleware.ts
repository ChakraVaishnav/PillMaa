// src/shared/middleware/error.middleware.ts
import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { Prisma } from '@prisma/client';
import { AppError } from '../errors/AppError';
import { ApiResponse } from '../responses/ApiResponse';
import { logger } from '../utils/logger';
import { env } from '../../config/env';

export const errorMiddleware = (
  error: Error,
  req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _next: NextFunction
): Response => {
  logger.error(`${req.method} ${req.path} — ${error.message}`, {
    stack: error.stack,
  });

  // Zod validation errors
  if (error instanceof ZodError) {
    return ApiResponse.error(
      res,
      'Validation failed',
      400,
      'VALIDATION_ERROR',
      error.flatten().fieldErrors
    );
  }

  // Operational app errors
  if (error instanceof AppError) {
    return ApiResponse.error(
      res,
      error.message,
      error.statusCode,
      error.code
    );
  }

  // Prisma unique constraint violation
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === 'P2002') {
      return ApiResponse.error(res, 'Resource already exists', 409, 'CONFLICT');
    }
    if (error.code === 'P2025') {
      return ApiResponse.error(res, 'Resource not found', 404, 'NOT_FOUND');
    }
    return ApiResponse.error(res, 'Database error', 500, 'DATABASE_ERROR');
  }

  // Unknown errors
  const isProduction = env.NODE_ENV === 'production';
  return ApiResponse.error(
    res,
    isProduction ? 'Internal server error' : error.message,
    500,
    'INTERNAL_ERROR',
    isProduction ? undefined : error.stack
  );
};
