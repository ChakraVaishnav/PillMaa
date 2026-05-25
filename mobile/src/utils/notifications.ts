// src/utils/notifications.ts
import { NativeModules, Platform, PermissionsAndroid } from 'react-native';
import { NOTIFICATION_CHANNEL_ID } from '../constants';
import type { Reminder } from '../types';
import { buildDateAtTime } from './dateHelpers';

const { MedicineAlarm } = NativeModules;

/**
 * Requests notification permissions from the user.
 * Returns true if granted.
 */
export async function requestNotificationPermissions(): Promise<boolean> {
  if (Platform.OS !== 'android') return true;

  // On Android 13+ (API level 33+), we must ask for POST_NOTIFICATIONS runtime permission
  if (Platform.OS === 'android' && typeof Platform.Version === 'number' && Platform.Version >= 33) {
    try {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS,
        {
          title: '💊 Medication Reminders',
          message: 'PillMaa needs notification access to alert you when it is time for your medicine.',
          buttonNeutral: 'Ask Me Later',
          buttonNegative: 'Cancel',
          buttonPositive: 'Allow',
        }
      );
      return granted === PermissionsAndroid.RESULTS.GRANTED;
    } catch (err) {
      console.warn('[Notifications] Failed to request permission:', err);
      return false;
    }
  }

  return true;
}

/**
 * Creates the Android notification channel for reminders.
 * In our custom module, the channel is initialized dynamically in Kotlin when the alarm triggers.
 */
export async function createNotificationChannel(): Promise<void> {
  // Handled natively in Kotlin to support custom vibration and raw sounds.
  return Promise.resolve();
}

/**
 * Returns the next valid trigger Date for a given "HH:MM" time.
 * If the time has already passed today, schedules for tomorrow.
 */
function getNextTriggerDate(time: string): Date {
  const [hours, minutes] = time.split(':').map(Number);
  const now = new Date();
  const trigger = new Date();
  trigger.setHours(hours, minutes, 0, 0);

  // If the time has already passed today, push to tomorrow
  if (trigger <= now) {
    trigger.setDate(trigger.getDate() + 1);
  }
  return trigger;
}

/**
 * Schedules a local notification for a reminder.
 * Returns the notification identifier.
 */
export async function scheduleReminderNotification(reminder: Reminder): Promise<string> {
  let triggerDate = getNextTriggerDate(reminder.reminderTime);

  if (reminder.repeatType === 'TODAY_ONLY') {
    const isAlreadyPast = buildDateAtTime(reminder.reminderTime) < new Date();
    if (isAlreadyPast) {
      console.warn(`[Notifications] Reminder time ${reminder.reminderTime} has already passed today. Skipping TODAY_ONLY reminder.`);
      return '';
    }
  }

  let timeMs = triggerDate.getTime();
  if (timeMs <= Date.now()) {
    timeMs = Date.now() + 2000;
  }

  const notificationId = reminder.id; // Use reminder ID directly for easier cancellation

  const payload = {
    reminderId: reminder.id,
    medicineName: reminder.medicineName,
    dosage: reminder.dosage,
    snoozeCount: String(reminder.snoozeCount),
    snoozeInterval: String(reminder.snoozeInterval),
    type: 'REMINDER',
  };

  if (Platform.OS === 'android' && MedicineAlarm) {
    try {
      MedicineAlarm.scheduleAlarm(
        notificationId,
        `💊 Time for ${reminder.medicineName}`,
        `Dosage: ${reminder.dosage}`,
        timeMs,
        payload
      );
      console.log(`[Notifications] Custom Alarm scheduled: "${reminder.medicineName}" at ${reminder.reminderTime} -> ID: ${notificationId}`);
    } catch (err) {
      console.error('[Notifications] Failed to schedule native alarm:', err);
    }
  }

  return notificationId;
}

/**
 * Schedules a snooze notification.
 */
export async function scheduleSnoozeNotification(
  reminder: Pick<Reminder, 'id' | 'medicineName' | 'dosage' | 'snoozeCount' | 'snoozeInterval'>,
  remainingSnoozes: number
): Promise<string> {
  const snoozeId = `${reminder.id}-snooze`;
  const triggerTime = Date.now() + reminder.snoozeInterval * 60000;

  const payload = {
    reminderId: reminder.id,
    medicineName: reminder.medicineName,
    dosage: reminder.dosage,
    snoozeCount: String(remainingSnoozes),
    snoozeInterval: String(reminder.snoozeInterval),
    type: 'SNOOZE',
  };

  if (Platform.OS === 'android' && MedicineAlarm) {
    try {
      MedicineAlarm.scheduleAlarm(
        snoozeId,
        `🔔 Snooze — ${reminder.medicineName}`,
        `${remainingSnoozes} reminder${remainingSnoozes !== 1 ? 's' : ''} left. Dosage: ${reminder.dosage}`,
        triggerTime,
        payload
      );
      console.log(`[Notifications] Snooze scheduled: "${reminder.medicineName}" in ${reminder.snoozeInterval} mins`);
    } catch (err) {
      console.error('[Notifications] Failed to schedule native snooze alarm:', err);
    }
  }

  return snoozeId;
}

/**
 * Cancels a scheduled notification by its ID.
 */
export async function cancelNotification(notificationId: string): Promise<void> {
  if (!notificationId) return;
  if (Platform.OS === 'android' && MedicineAlarm) {
    try {
      MedicineAlarm.cancelAlarm(notificationId);
    } catch (err) {
      console.error('[Notifications] Failed to cancel native alarm:', err);
    }
  }
}

/**
 * Cancels all scheduled notifications.
 */
export async function cancelAllNotifications(): Promise<void> {
  if (Platform.OS === 'android' && MedicineAlarm) {
    try {
      MedicineAlarm.cancelAllNotifications();
    } catch (err) {
      console.error('[Notifications] Failed to cancel all native notifications:', err);
    }
  }
}

/**
 * Re-schedules ALL active reminders from the store.
 */
export async function rescheduleAllReminders(reminders: Reminder[]): Promise<void> {
  // First cancel all possible scheduled alarms to avoid duplicates
  for (const reminder of reminders) {
    if (Platform.OS === 'android' && MedicineAlarm) {
      try {
        MedicineAlarm.cancelAlarm(reminder.id);
        MedicineAlarm.cancelAlarm(`${reminder.id}-snooze`);
      } catch {}
    }
  }

  let scheduled = 0;
  let skipped = 0;

  for (const reminder of reminders) {
    if (reminder.isCompleted) { skipped++; continue; }
    if (reminder.repeatType === 'TODAY_ONLY') {
      const isAlreadyPast = buildDateAtTime(reminder.reminderTime) < new Date();
      if (isAlreadyPast) { skipped++; continue; }
    }

    try {
      await scheduleReminderNotification(reminder);
      scheduled++;
    } catch (err) {
      console.warn(`[Notifications] Failed to reschedule "${reminder.medicineName}":`, err);
    }
  }

  console.log(`[Notifications] Rescheduled ${scheduled} reminders, skipped ${skipped}`);
}
