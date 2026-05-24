// src/hooks/useNotifications.ts
import { useEffect, useRef } from 'react';
import * as Notifications from 'expo-notifications';
import { useRouter } from 'expo-router';
import { Platform } from 'react-native';
import {
  requestNotificationPermissions,
  createNotificationChannel,
  rescheduleAllReminders,
} from '../utils/notifications';
import { registerBackgroundNotificationTask } from '../tasks/backgroundNotificationTask';
import { useReminderStore } from '../store/useReminderStore';

/**
 * Navigates to the full-screen alarm screen with the given notification data.
 */
function navigateToAlarm(
  router: ReturnType<typeof useRouter>,
  data: Record<string, unknown>
) {
  router.push({
    pathname: '/reminder/alarm',
    params: {
      reminderId:     String(data.reminderId),
      medicineName:   String(data.medicineName),
      dosage:         String(data.dosage),
      snoozeCount:    String(data.snoozeCount ?? 3),
      snoozeInterval: String(data.snoozeInterval ?? 5),
    },
  });
}

/**
 * Sets up notification permissions, channel, and response handler.
 * Should be called once from the root layout.
 */
export function useNotificationSetup() {
  const router = useRouter();
  const responseListenerRef = useRef<Notifications.EventSubscription | null>(null);

  useEffect(() => {
    let mounted = true;

    const setup = async () => {
      await createNotificationChannel();
      const granted = await requestNotificationPermissions();
      if (!granted) {
        console.warn('[Notifications] Permission not granted');
      }

      // Register background notification task so Android can wake the app
      // when a notification arrives while the app is backgrounded/killed
      if (Platform.OS === 'android') {
        await registerBackgroundNotificationTask();
      }

      // Re-schedule ALL reminders from store on every app startup.
      // This restores notifications after reinstall, reboot, or OS clearing them.
      const reminders = useReminderStore.getState().reminders;
      if (reminders.length > 0) {
        await rescheduleAllReminders(reminders);
      }
    };

    setup();

    // Handle notification tap — navigate to alarm screen when user taps notification
    // from the system notification shade (app was in background)
    responseListenerRef.current = Notifications.addNotificationResponseReceivedListener(
      (response) => {
        if (!mounted) return;

        const data = response.notification.request.content.data;
        if (data?.type === 'REMINDER' || data?.type === 'SNOOZE') {
          navigateToAlarm(router, data);
        }
      }
    );

    // Handle foreground notification — instantly redirect to full-screen alarm screen
    // (app is currently open and visible to user)
    const notificationListener = Notifications.addNotificationReceivedListener(
      (notification) => {
        if (!mounted) return;

        const data = notification.request.content.data;
        if (data?.type === 'REMINDER' || data?.type === 'SNOOZE') {
          navigateToAlarm(router, data);
        }
      }
    );

    // Also handle the case where the app was KILLED (not just backgrounded)
    // and gets launched by a notification tap — getLastNotificationResponseAsync
    // returns the notification that launched the app
    const checkLastNotification = async () => {
      const lastResponse = await Notifications.getLastNotificationResponseAsync();
      if (!lastResponse || !mounted) return;
      const data = lastResponse.notification.request.content.data;
      if (data?.type === 'REMINDER' || data?.type === 'SNOOZE') {
        // Small delay to ensure navigation stack is ready
        setTimeout(() => {
          if (mounted) navigateToAlarm(router, data);
        }, 500);
      }
    };

    checkLastNotification();

    return () => {
      mounted = false;
      responseListenerRef.current?.remove();
      notificationListener.remove();
    };
  }, [router]);
}

/**
 * Hook to use within a specific screen to listen for incoming notifications.
 */
export function useNotificationListener(
  onNotification: (notification: Notifications.Notification) => void
) {
  useEffect(() => {
    const sub = Notifications.addNotificationReceivedListener(onNotification);
    return () => sub.remove();
  }, [onNotification]);
}
