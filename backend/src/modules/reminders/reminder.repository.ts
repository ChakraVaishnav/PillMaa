// src/modules/reminders/reminder.repository.ts
import prisma from '../../config/db';
import type { Reminder, Prisma } from '@prisma/client';
import type { CreateReminderInput, UpdateReminderInput } from './reminder.validator';

export class ReminderRepository {
  async findAllByUserId(
    userId: string,
    filters?: { isCompleted?: boolean }
  ): Promise<Reminder[]> {
    const where: Prisma.ReminderWhereInput = { userId };

    if (filters?.isCompleted !== undefined) {
      where.isCompleted = filters.isCompleted;
    }

    return prisma.reminder.findMany({
      where,
      orderBy: { reminderTime: 'asc' },
    });
  }

  async findById(id: string, userId: string): Promise<Reminder | null> {
    return prisma.reminder.findFirst({
      where: { id, userId },
    });
  }

  async create(userId: string, data: CreateReminderInput): Promise<Reminder> {
    return prisma.reminder.create({
      data: {
        userId,
        medicineName: data.medicineName,
        dosage: data.dosage,
        reminderTime: data.reminderTime,
        repeatType: data.repeatType,
        repeatDays: data.repeatDays,
        startDate: new Date(data.startDate),
        endDate: data.endDate ? new Date(data.endDate) : null,
        snoozeCount: data.snoozeCount ?? 3,
        snoozeInterval: data.snoozeInterval ?? 5,
      },
    });
  }

  async update(
    id: string,
    userId: string,
    data: UpdateReminderInput
  ): Promise<Reminder> {
    return prisma.reminder.update({
      where: { id },
      data: {
        ...(data.medicineName && { medicineName: data.medicineName }),
        ...(data.dosage && { dosage: data.dosage }),
        ...(data.reminderTime && { reminderTime: data.reminderTime }),
        ...(data.repeatType && { repeatType: data.repeatType }),
        ...(data.repeatDays && { repeatDays: data.repeatDays }),
        ...(data.startDate && { startDate: new Date(data.startDate) }),
        ...(data.endDate !== undefined && {
          endDate: data.endDate ? new Date(data.endDate) : null,
        }),
        ...(data.snoozeCount !== undefined && { snoozeCount: data.snoozeCount }),
        ...(data.snoozeInterval !== undefined && { snoozeInterval: data.snoozeInterval }),
        ...(data.isCompleted !== undefined && { isCompleted: data.isCompleted }),
      },
    });
  }

  async markComplete(
    id: string,
    userId: string,
    takenVia: 'swipe' | 'alarm_dismiss' | 'manual'
  ): Promise<Reminder> {
    const reminder = await prisma.reminder.findUnique({
      where: { id },
    });

    if (!reminder) {
      throw new Error('Reminder not found');
    }

    const [updatedReminder] = await prisma.$transaction([
      prisma.reminder.update({
        where: { id },
        data: { isCompleted: true },
      }),
      prisma.medicineLog.create({
        data: {
          userId,
          reminderId: id,
          medicineName: reminder.medicineName,
          dosage: reminder.dosage,
          takenVia,
          scheduledTime: reminder.reminderTime,
        },
      }),
    ]);

    return updatedReminder;
  }

  async findLogsByUserId(
    userId: string,
    options?: { date?: string; page?: number; limit?: number }
  ) {
    const limit = options?.limit ?? 10;
    const page = options?.page ?? 0;
    const date = options?.date;

    const where: any = { userId };

    if (date) {
      const startDate = new Date(`${date}T00:00:00.000Z`);
      const endDate = new Date(`${date}T23:59:59.999Z`);
      where.takenAt = {
        gte: startDate,
        lte: endDate,
      };

      return prisma.medicineLog.findMany({
        where,
        orderBy: { takenAt: 'desc' },
      });
    }

    return prisma.medicineLog.findMany({
      where,
      orderBy: { takenAt: 'desc' },
      skip: page * limit,
      take: limit,
    });
  }

  async findStreakByUserId(userId: string): Promise<number> {
    const logs = await prisma.medicineLog.findMany({
      where: { userId },
      select: { takenAt: true },
      orderBy: { takenAt: 'desc' },
    });

    if (logs.length === 0) return 0;

    const uniqueDates = new Set<string>();
    logs.forEach((log) => {
      const dateStr = log.takenAt.toISOString().split('T')[0];
      uniqueDates.add(dateStr);
    });

    let streak = 0;
    const checkDate = new Date();
    
    const getFormatDate = (date: Date) => {
      return date.toISOString().split('T')[0];
    };

    const todayStr = getFormatDate(checkDate);
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = getFormatDate(yesterday);

    if (!uniqueDates.has(todayStr) && !uniqueDates.has(yesterdayStr)) {
      return 0;
    }

    const startDate = uniqueDates.has(todayStr) ? checkDate : yesterday;

    while (true) {
      const dateStr = getFormatDate(startDate);
      if (uniqueDates.has(dateStr)) {
        streak++;
        startDate.setDate(startDate.getDate() - 1);
      } else {
        break;
      }
    }

    return streak;
  }

  async delete(id: string, userId: string): Promise<void> {
    await prisma.reminder.delete({ where: { id } });
  }

  async countByUserId(userId: string): Promise<number> {
    return prisma.reminder.count({ where: { userId } });
  }
}
