// src/modules/auth/auth.controller.ts
import { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { ApiResponse } from '../../shared/responses/ApiResponse';
import { AppError } from '../../shared/errors/AppError';
import type { AuthenticatedRequest } from './auth.middleware';
import { clerkClient } from '../../config/clerk';

const authService = new AuthService();

export class AuthController {
  /**
   * POST /api/v1/auth/sync
   * Syncs the authenticated Clerk user to the local database.
   * Should be called after every successful Clerk sign-in from the mobile app.
   */
  async syncUser(req: Request, res: Response): Promise<Response> {
    const { userId } = (req as AuthenticatedRequest).auth;
    const { name, email } = req.body;

    if (!name || !email) {
      throw AppError.badRequest('name and email are required');
    }

    const user = await authService.syncUser({ clerkId: userId, name, email });
    return ApiResponse.created(res, user, 'User synced successfully');
  }

  /**
   * GET /api/v1/auth/me
   * Returns the current authenticated user's profile.
   */
  async getMe(req: Request, res: Response): Promise<Response> {
    const { userId } = (req as AuthenticatedRequest).auth;

    const user = await authService.getUserByClerkId(userId);
    if (!user) throw AppError.notFound('User');

    return ApiResponse.success(res, user, 'User fetched successfully');
  }

  /**
   * DELETE /api/v1/auth/me
   * Deletes the user account from both Clerk and the database (cascades logs & reminders).
   */
  async deleteAccount(req: Request, res: Response): Promise<Response> {
    const { userId } = (req as AuthenticatedRequest).auth;

    // 1. Delete user from Clerk directory
    await clerkClient.users.deleteUser(userId);

    // 2. Delete user from database
    await authService.deleteUser(userId);

    return ApiResponse.success(res, null, 'Account deleted successfully');
  }
}

