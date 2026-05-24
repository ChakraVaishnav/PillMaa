// src/modules/auth/auth.middleware.ts
import { Request, Response, NextFunction } from 'express';
import { createClerkClient, verifyToken } from '@clerk/express';
import { clerkClient } from '../../config/clerk';
import { AppError } from '../../shared/errors/AppError';
import { logger } from '../../shared/utils/logger';

export interface AuthenticatedRequest extends Request {
  auth: {
    userId: string;
    sessionId: string;
  };
}

/**
 * Verifies the Clerk JWT Bearer token from the Authorization header.
 * Attaches `req.auth.userId` and `req.auth.sessionId` on success.
 */
export const requireAuth = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader?.startsWith('Bearer ')) {
      throw AppError.unauthorized('Missing or invalid Authorization header');
    }

    const token = authHeader.split(' ')[1];

    if (!token) {
      throw AppError.unauthorized('Missing Bearer token');
    }

    // Verify the session token with Clerk
    const payload = await verifyToken(token, {
      secretKey: process.env.CLERK_SECRET_KEY!,
    });

    (req as AuthenticatedRequest).auth = {
      userId: payload.sub,
      sessionId: (payload as any).sid ?? '',
    };

    next();
  } catch (error) {
    logger.warn('Auth middleware — token verification failed', { error });

    if (error instanceof AppError) {
      next(error);
    } else {
      next(AppError.unauthorized('Invalid or expired token'));
    }
  }
};
