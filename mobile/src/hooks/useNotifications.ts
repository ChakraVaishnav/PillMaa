// src/hooks/useNotifications.ts
import { useEffect } from 'react';
import {
  requestNotificationPermissions,
  createNotificationChannel,
  rescheduleAllReminders,
} from '../utils/notifications';
import { useReminderStore } from '../store/useReminderStore';

/**
 * Sets up notification permissions, channel, and reschedules reminders.
 * Should be called once from the root layout.
 */
export function useNotificationSetup() {
  useEffect(() => {
    const setup = async () => {
      try {
        await createNotificationChannel();
        const granted = await requestNotificationPermissions();
        if (!granted) {
          console.warn('[Notifications] Permission not granted');
        }

        // Re-schedule ALL reminders from store on every app startup.
        const reminders = useReminderStore.getState().reminders;
        if (reminders.length > 0) {
          await rescheduleAllReminders(reminders);
        }
      } catch (error) {
        console.error('[Notifications] Failed to setup notifications:', error);
      }
    };

    setup();
  }, []);
}

/**
 * Hook placeholder kept for backwards compatibility.
 * Note: Expo Router's deep linking scheme automatically handles foreground deep links!
 */
export function useNotificationListener(
  onNotification: (notification: any) => void
) {
  // No-op: handled natively by Expo Router deep linking mapping pillmaa://reminder/alarm
}
