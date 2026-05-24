// src/modules/auth/auth.service.ts
import prisma from '../../config/db';
import { clerkClient } from '../../config/clerk';
import { logger } from '../../shared/utils/logger';
import type { User } from '@prisma/client';

export interface SyncUserPayload {
  clerkId: string;
  name: string;
  email: string;
}

export class AuthService {
  /**
   * Upserts a user record — called after first Clerk sign-in.
   */
  async syncUser(payload: SyncUserPayload): Promise<User> {
    const { clerkId, name, email } = payload;
    logger.info(`Syncing user: ${clerkId} (${email})`);

    // Check if the email already exists in the database
    const existingByEmail = await prisma.user.findUnique({ where: { email } });

    if (existingByEmail) {
      if (existingByEmail.clerkId !== clerkId) {
        logger.info(`Updating clerkId for existing email ${email} from ${existingByEmail.clerkId} to ${clerkId}`);
        return prisma.user.update({
          where: { id: existingByEmail.id },
          data: { clerkId, name },
        });
      }
    }

    return prisma.user.upsert({
      where: { clerkId },
      create: { clerkId, name, email },
      update: { name, email },
    });
  }

  async getUserByClerkId(clerkId: string): Promise<User | null> {
    return prisma.user.findUnique({ where: { clerkId } });
  }

  async getClerkUser(clerkId: string) {
    return clerkClient.users.getUser(clerkId);
  }

  async deleteUser(clerkId: string): Promise<void> {
    logger.info(`Deleting user: ${clerkId}`);
    await prisma.user.delete({ where: { clerkId } });
  }
}
