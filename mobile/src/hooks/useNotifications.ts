// src/hooks/useNotifications.ts
import { useEffect, useRef } from 'react';
import * as Notifications from 'expo-notifications';
import { useRouter } from 'expo-router';
import {
  requestNotificationPermissions,
  createNotificationChannel,
} from '../utils/notifications';

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
    };

    setup();

    // Handle notification tap — navigate to alarm screen when user taps from background
    responseListenerRef.current = Notifications.addNotificationResponseReceivedListener(
      (response) => {
        if (!mounted) return;

        const data = response.notification.request.content.data;
        if (data?.type === 'REMINDER' || data?.type === 'SNOOZE') {
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
      }
    );

    // Handle foreground notification — instantly redirect to full-screen alarm screen
    const notificationListener = Notifications.addNotificationReceivedListener(
      (notification) => {
        if (!mounted) return;

        const data = notification.request.content.data;
        if (data?.type === 'REMINDER' || data?.type === 'SNOOZE') {
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
      }
    );

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
