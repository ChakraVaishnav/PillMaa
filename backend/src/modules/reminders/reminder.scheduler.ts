// src/modules/reminders/reminder.scheduler.ts
import cron from 'node-cron';
import { logger } from '../../shared/utils/logger';
import prisma from '../../config/db';

/**
 * Reminder Scheduler — runs server-side cron jobs.
 *
 * Primary purpose in MVP:
 * - Reset daily reminder completion status at midnight
 *
 * Architecture note: This is designed to be extended with:
 * - Push notification triggers (via FCM/APNs)
 * - Exact alarm tracking
 * - Missed reminder detection + re-notification
 */
export class ReminderScheduler {
  private jobs: cron.ScheduledTask[] = [];

  start(): void {
    logger.info('🕐 Starting reminder scheduler...');

    // Reset DAILY and CUSTOM reminders at midnight
    const midnightReset = cron.schedule('0 0 * * *', async () => {
      logger.info('⏰ Midnight reset — clearing daily reminder completions');
      try {
        const result = await prisma.reminder.updateMany({
          where: {
            isCompleted: true,
            repeatType: { in: ['DAILY', 'CUSTOM'] },
          },
          data: { isCompleted: false },
        });
        logger.info(`✅ Reset ${result.count} reminders for new day`);
      } catch (error) {
        logger.error('❌ Failed to reset reminders', error);
      }
    });

    this.jobs.push(midnightReset);
    logger.info('✅ Reminder scheduler started');
  }

  stop(): void {
    this.jobs.forEach((job) => job.stop());
    this.jobs = [];
    logger.info('🛑 Reminder scheduler stopped');
  }
}
