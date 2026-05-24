// src/modules/reminders/reminder.controller.ts
import { Request, Response } from 'express';
import { ReminderService } from './reminder.service';
import { createReminderSchema, updateReminderSchema, reminderIdSchema } from './reminder.validator';
import { ApiResponse } from '../../shared/responses/ApiResponse';
import { AppError } from '../../shared/errors/AppError';
import { AuthService } from '../auth/auth.service';
import type { AuthenticatedRequest } from '../auth/auth.middleware';

const reminderService = new ReminderService();
const authService = new AuthService();

/**
 * Resolves the internal user ID from the Clerk user ID.
 * Throws 404 if user not synced yet.
 */
async function resolveUserId(clerkId: string): Promise<string> {
  const user = await authService.getUserByClerkId(clerkId);
  if (!user) throw AppError.notFound('User — please sync first via POST /auth/sync');
  return user.id;
}

export class ReminderController {
  /**
   * GET /api/v1/reminders
   */
  async getAll(req: Request, res: Response): Promise<Response> {
    const { userId: clerkId } = (req as AuthenticatedRequest).auth;
    const userId = await resolveUserId(clerkId);

    const isCompleted =
      req.query.isCompleted !== undefined
        ? req.query.isCompleted === 'true'
        : undefined;

    const reminders = await reminderService.getAllReminders(userId, { isCompleted });
    return ApiResponse.success(res, reminders, 'Reminders fetched successfully');
  }

  /**
   * GET /api/v1/reminders/:id
   */
  async getById(req: Request, res: Response): Promise<Response> {
    const { userId: clerkId } = (req as AuthenticatedRequest).auth;
    const { id } = reminderIdSchema.parse(req.params);
    const userId = await resolveUserId(clerkId);

    const reminder = await reminderService.getReminderById(id, userId);
    return ApiResponse.success(res, reminder);
  }

  /**
   * POST /api/v1/reminders
   */
  async create(req: Request, res: Response): Promise<Response> {
    const { userId: clerkId } = (req as AuthenticatedRequest).auth;
    const data = createReminderSchema.parse(req.body);
    const userId = await resolveUserId(clerkId);

    const reminder = await reminderService.createReminder(userId, data);
    return ApiResponse.created(res, reminder, 'Reminder created successfully');
  }

  /**
   * PUT /api/v1/reminders/:id
   */
  async update(req: Request, res: Response): Promise<Response> {
    const { userId: clerkId } = (req as AuthenticatedRequest).auth;
    const { id } = reminderIdSchema.parse(req.params);
    const data = updateReminderSchema.parse(req.body);
    const userId = await resolveUserId(clerkId);

    const reminder = await reminderService.updateReminder(id, userId, data);
    return ApiResponse.success(res, reminder, 'Reminder updated successfully');
  }

  /**
   * PATCH /api/v1/reminders/:id/complete
   */
  async markComplete(req: Request, res: Response): Promise<Response> {
    const { userId: clerkId } = (req as AuthenticatedRequest).auth;
    const { id } = reminderIdSchema.parse(req.params);
    const { takenVia } = req.body || {};
    const userId = await resolveUserId(clerkId);

    const reminder = await reminderService.markReminderComplete(
      id,
      userId,
      takenVia || 'manual'
    );
    return ApiResponse.success(res, reminder, 'Reminder marked as completed');
  }

  /**
   * GET /api/v1/reminders/history
   */
  async getHistory(req: Request, res: Response): Promise<Response> {
    const { userId: clerkId } = (req as AuthenticatedRequest).auth;
    const userId = await resolveUserId(clerkId);

    const { date, page, limit } = req.query;

    const history = await reminderService.getHistory(userId, {
      date: date ? String(date) : undefined,
      page: page !== undefined ? Number(page) : undefined,
      limit: limit !== undefined ? Number(limit) : undefined,
    });
    return ApiResponse.success(res, history, 'History logs fetched successfully');
  }

  /**
   * GET /api/v1/reminders/streak
   */
  async getStreak(req: Request, res: Response): Promise<Response> {
    const { userId: clerkId } = (req as AuthenticatedRequest).auth;
    const userId = await resolveUserId(clerkId);

    const streak = await reminderService.getStreak(userId);
    return ApiResponse.success(res, { streak }, 'Streak count fetched successfully');
  }

  /**
   * DELETE /api/v1/reminders/:id
   */
  async delete(req: Request, res: Response): Promise<Response> {
    const { userId: clerkId } = (req as AuthenticatedRequest).auth;
    const { id } = reminderIdSchema.parse(req.params);
    const userId = await resolveUserId(clerkId);

    await reminderService.deleteReminder(id, userId);
    return ApiResponse.noContent(res);
  }
}
