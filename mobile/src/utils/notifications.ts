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
 * Schedules a local notification for a reminder.
 * Returns the notification identifier.
 */
export async function scheduleReminderNotification(
  reminder: Reminder
): Promise<string> {
  const [hours, minutes] = reminder.reminderTime.split(':').map(Number);

  const trigger: Notifications.NotificationTriggerInput =
    reminder.repeatType === 'TODAY_ONLY'
      ? {
          type: Notifications.SchedulableTriggerInputTypes.DATE,
          date: buildDateAtTime(reminder.reminderTime),
        }
      : {
          type: Notifications.SchedulableTriggerInputTypes.DAILY,
          hour: hours,
          minute: minutes,
        };

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
      },
      sound: 'alarm.wav',
      priority: Notifications.AndroidNotificationPriority.MAX,
      ...(Platform.OS === 'android' && {
        channelId: NOTIFICATION_CHANNEL_ID,
      }),
    },
    trigger,
  });

  return notificationId;
}

/**
 * Schedules a snooze notification — fires after snoozeInterval minutes.
 */
export async function scheduleSnoozeNotification(
  reminder: Pick<Reminder, 'id' | 'medicineName' | 'dosage' | 'snoozeCount' | 'snoozeInterval'>,
  remainingSnoozes: number
): Promise<string> {
  const snoozeMs = reminder.snoozeInterval * 60 * 1000;

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
      sound: 'alarm.wav',
      priority: Notifications.AndroidNotificationPriority.MAX,
      ...(Platform.OS === 'android' && {
        channelId: NOTIFICATION_CHANNEL_ID,
      }),
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
      seconds: reminder.snoozeInterval * 60,
    },
  });
}

/**
 * Cancels a scheduled notification by its ID.
 */
export async function cancelNotification(notificationId: string): Promise<void> {
  await Notifications.cancelScheduledNotificationAsync(notificationId);
}

/**
 * Cancels all scheduled notifications.
 */
export async function cancelAllNotifications(): Promise<void> {
  await Notifications.cancelAllScheduledNotificationsAsync();
}
