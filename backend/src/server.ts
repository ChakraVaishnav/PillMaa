// src/server.ts
import app from './app';
import { env } from './config/env';
import { logger } from './shared/utils/logger';
import { ReminderScheduler } from './modules/reminders/reminder.scheduler';
import prisma from './config/db';

const scheduler = new ReminderScheduler();

const gracefulShutdown = async (signal: string): Promise<void> => {
  logger.info(`${signal} received — shutting down gracefully...`);
  scheduler.stop();
  await prisma.$disconnect();
  process.exit(0);
};

const bootstrap = async (): Promise<void> => {
  try {
    // Verify database connection
    await prisma.$connect();
    logger.info('✅ Database connected');

    // Start cron scheduler
    scheduler.start();

    // Start HTTP server
    const server = app.listen(env.PORT, () => {
      logger.info(`🚀 PillMaa API running on port ${env.PORT} (${env.NODE_ENV})`);
      logger.info(`   Health: http://localhost:${env.PORT}/health`);
      logger.info(`   API:    http://localhost:${env.PORT}/api/v1`);
    });

    // Graceful shutdown handlers
    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));

    server.on('error', (error: Error) => {
      logger.error('Server error', error);
      process.exit(1);
    });
  } catch (error) {
    logger.error('❌ Failed to start server', error);
    await prisma.$disconnect();
    process.exit(1);
  }
};

bootstrap();
