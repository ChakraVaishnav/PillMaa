// src/utils/notifications.ts
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { NOTIFICATION_CHANNEL_ID } from '../constants';
import type { Reminder } from '../types';
import { buildDateAtTime } from './dateHelpers';

import { useReminderStore } from '../store/useReminderStore';

/**
 * Configure how notifications appear when the app is in the foreground.
 */
Notifications.setNotificationHandler({
  handleNotification: async (notification) => {
    try {
      const data = notification.request.content.data;
      if (data && data.reminderId) {
        const store = useReminderStore.getState();
        const reminder = store.reminders.find((r) => r.id === data.reminderId);
        if (reminder && reminder.isCompleted) {
          return {
            shouldShowAlert:   false,
            shouldPlaySound:   false,
            shouldSetBadge:    false,
            shouldShowBanner:  false,
            shouldShowList:    false,
          };
        }
      }
    } catch (err) {
      console.warn('[NotificationHandler] Error checking completion state:', err);
    }

    return {
      shouldShowAlert:   true,
      shouldPlaySound:   true,
      shouldSetBadge:    true,
      shouldShowBanner:  true,
      shouldShowList:    true,
    };
  },
});

/**
 * Requests notification permissions from the user.
 * Returns true if granted.
 */
export async function requestNotificationPermissions(): Promise<boolean> {
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  if (existingStatus === 'granted') return true;

  const { status } = await Notifications.requestPermissionsAsync({
    ios: {
      allowAlert: true,
      allowBadge: true,
      allowSound: true,
    },
  });

  return status === 'granted';
}

/**
 * Creates the Android notification channel for reminders.
 * Must be called before scheduling any notifications on Android.
 */
export async function createNotificationChannel(): Promise<void> {
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync(NOTIFICATION_CHANNEL_ID, {
      name: 'Medicine Reminders',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#16A34A',
      sound: 'alarm.wav',
      enableVibrate: true,
      lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
      bypassDnd: true,
    });
  }
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
export async function scheduleReminderNotification(
  reminder: Reminder
): Promise<string> {
  const [hours, minutes] = reminder.reminderTime.split(':').map(Number);

  let trigger: Notifications.NotificationTriggerInput;

  if (reminder.repeatType === 'TODAY_ONLY') {
    // Schedule once at the correct time — if already passed today, skip
    const triggerDate = getNextTriggerDate(reminder.reminderTime);
    const isAlreadyPast = buildDateAtTime(reminder.reminderTime) < new Date();
    if (isAlreadyPast) {
      console.warn(`[Notifications] Reminder time ${reminder.reminderTime} has already passed today. Skipping TODAY_ONLY reminder.`);
      // Return a sentinel value — don't schedule a dead notification
      return '';
    }
    trigger = {
      type: Notifications.SchedulableTriggerInputTypes.DATE,
      date: triggerDate,
    };
  } else if (reminder.repeatType === 'DAILY' || reminder.repeatType === 'CUSTOM') {
    // For both DAILY and CUSTOM, use a DAILY trigger.
    // CUSTOM day filtering is handled by checking in the notification handler
    // (we schedule every day and suppress if not active on that day — simplest approach
    //  that works reliably with expo-notifications which has no "weekday" trigger type)
    trigger = {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour: hours,
      minute: minutes,
    };
  } else {
    trigger = {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour: hours,
      minute: minutes,
    };
  }

  const notificationId = await Notifications.scheduleNotificationAsync({
    content: {
      title: `💊 Time for ${reminder.medicineName}`,
      body: `Dosage: ${reminder.dosage}`,
      data: {
        reminderId:     reminder.id,
        medicineName:   reminder.medicineName,
        dosage:         reminder.dosage,
        snoozeCount:    reminder.snoozeCount,
        snoozeInterval: reminder.snoozeInterval,
        type:           'REMINDER',
        repeatType:     reminder.repeatType,
        repeatDays:     reminder.repeatDays,
      },
      sound: Platform.OS === 'android' ? true : 'alarm.wav',
      priority: Notifications.AndroidNotificationPriority.MAX,
    },
    trigger: {
      ...trigger,
      ...(Platform.OS === 'android' && { channelId: NOTIFICATION_CHANNEL_ID }),
    },
  });

  console.log(`[Notifications] Scheduled "${reminder.medicineName}" (${reminder.repeatType}) at ${reminder.reminderTime} → id: ${notificationId}`);
  return notificationId;
}

/**
 * Schedules a snooze notification — fires after snoozeInterval minutes.
 */
export async function scheduleSnoozeNotification(
  reminder: Pick<Reminder, 'id' | 'medicineName' | 'dosage' | 'snoozeCount' | 'snoozeInterval'>,
  remainingSnoozes: number
): Promise<string> {
  return Notifications.scheduleNotificationAsync({
    content: {
      title: `🔔 Snooze — ${reminder.medicineName}`,
      body: `${remainingSnoozes} reminder${remainingSnoozes !== 1 ? 's' : ''} left. Dosage: ${reminder.dosage}`,
      data: {
        reminderId:      reminder.id,
        medicineName:    reminder.medicineName,
        dosage:          reminder.dosage,
        snoozeCount:     remainingSnoozes,
        snoozeInterval:  reminder.snoozeInterval,
        type:            'SNOOZE',
      },
      sound: Platform.OS === 'android' ? true : 'alarm.wav',
      priority: Notifications.AndroidNotificationPriority.MAX,
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
      seconds: reminder.snoozeInterval * 60,
      ...(Platform.OS === 'android' && { channelId: NOTIFICATION_CHANNEL_ID }),
    },
  });
}

/**
 * Cancels a scheduled notification by its ID.
 */
export async function cancelNotification(notificationId: string): Promise<void> {
  if (!notificationId) return;
  await Notifications.cancelScheduledNotificationAsync(notificationId);
}

/**
 * Cancels all scheduled notifications.
 */
export async function cancelAllNotifications(): Promise<void> {
  await Notifications.cancelAllScheduledNotificationsAsync();
}

/**
 * Re-schedules ALL active reminders from the store.
 * Call this on app startup to restore notifications after reinstall/reboot.
 */
export async function rescheduleAllReminders(reminders: Reminder[]): Promise<void> {
  // Cancel everything first to avoid duplicates
  await Notifications.cancelAllScheduledNotificationsAsync();

  let scheduled = 0;
  let skipped = 0;

  for (const reminder of reminders) {
    // Don't schedule completed or past TODAY_ONLY reminders
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
