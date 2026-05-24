// src/modules/reminders/reminder.service.ts
import type { Reminder } from '@prisma/client';
import { ReminderRepository } from './reminder.repository';
import { AppError } from '../../shared/errors/AppError';
import { logger } from '../../shared/utils/logger';
import type { CreateReminderInput, UpdateReminderInput } from './reminder.validator';

const reminderRepository = new ReminderRepository();

export class ReminderService {
  /**
   * Returns all reminders for the given user, ordered by time.
   */
  async getAllReminders(
    userId: string,
    filters?: { isCompleted?: boolean }
  ): Promise<Reminder[]> {
    return reminderRepository.findAllByUserId(userId, filters);
  }

  /**
   * Returns a single reminder — throws 404 if not found or not owned by user.
   */
  async getReminderById(id: string, userId: string): Promise<Reminder> {
    const reminder = await reminderRepository.findById(id, userId);
    if (!reminder) throw AppError.notFound('Reminder');
    return reminder;
  }

  /**
   * Creates a new reminder. Validates end date is after start date.
   */
  async createReminder(userId: string, data: CreateReminderInput): Promise<Reminder> {
    if (data.endDate) {
      const start = new Date(data.startDate);
      const end = new Date(data.endDate);
      if (end < start) {
        throw AppError.badRequest('endDate must be after startDate', 'INVALID_DATE_RANGE');
      }
    }

    logger.info(`Creating reminder for user ${userId}: ${data.medicineName}`);
    return reminderRepository.create(userId, data);
  }

  /**
   * Updates a reminder — verifies ownership first.
   */
  async updateReminder(
    id: string,
    userId: string,
    data: UpdateReminderInput
  ): Promise<Reminder> {
    await this.getReminderById(id, userId); // Ownership check

    if (data.startDate && data.endDate) {
      const start = new Date(data.startDate);
      const end = new Date(data.endDate);
      if (end < start) {
        throw AppError.badRequest('endDate must be after startDate', 'INVALID_DATE_RANGE');
      }
    }

    logger.info(`Updating reminder ${id} for user ${userId}`);
    return reminderRepository.update(id, userId, data);
  }

  /**
   * Marks a reminder as taken/completed for today.
   */
  async markReminderComplete(
    id: string,
    userId: string,
    takenVia: 'swipe' | 'alarm_dismiss' | 'manual'
  ): Promise<Reminder> {
    await this.getReminderById(id, userId); // Ownership check

    logger.info(`Marking reminder ${id} as complete for user ${userId} via ${takenVia}`);
    return reminderRepository.markComplete(id, userId, takenVia);
  }

  /**
   * Fetches recent medicine logs.
   */
  async getHistory(
    userId: string,
    options?: { date?: string; page?: number; limit?: number }
  ) {
    return reminderRepository.findLogsByUserId(userId, options);
  }

  /**
   * Computes consecutive days streak count.
   */
  async getStreak(userId: string): Promise<number> {
    return reminderRepository.findStreakByUserId(userId);
  }

  /**
   * Deletes a reminder — verifies ownership first.
   */
  async deleteReminder(id: string, userId: string): Promise<void> {
    await this.getReminderById(id, userId); // Ownership check

    logger.info(`Deleting reminder ${id} for user ${userId}`);
    return reminderRepository.delete(id, userId);
  }
}
