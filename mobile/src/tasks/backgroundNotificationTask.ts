// src/tasks/backgroundNotificationTask.ts
// This file MUST be imported at the root level (app/_layout.tsx) BEFORE any other imports.
// TaskManager requires tasks to be defined at module-level, outside of components.

import * as TaskManager from 'expo-task-manager';

export const BACKGROUND_NOTIFICATION_TASK = 'BACKGROUND_NOTIFICATION_TASK';

/**
 * Defines the background notification task.
 *
 * This task is called by Android when a notification arrives while the app
 * is backgrounded. expo-notifications routes background notifications here
 * via Notifications.registerTaskAsync().
 *
 * Navigation to the alarm screen cannot happen inside this headless task
 * (no React context). Instead, we log the event and rely on:
 *   1. The notification response listener (user taps the notification banner)
 *   2. getLastNotificationResponseAsync() checked on app resume/launch
 */
TaskManager.defineTask(BACKGROUND_NOTIFICATION_TASK, async ({ data, error }) => {
  if (error) {
    console.warn('[BackgroundNotificationTask] Error:', error);
    return;
  }

  // data contains { notification: Notifications.Notification }
  const notifData = (data as any)?.notification?.request?.content?.data;
  if (!notifData) return;

  if (notifData.type === 'REMINDER' || notifData.type === 'SNOOZE') {
    console.log(
      '[BackgroundNotificationTask] Background reminder received:',
      notifData.medicineName
    );
    // The notification banner + sound will play automatically.
    // Navigation happens when the user taps the banner (responseListener)
    // or when the app resumes via getLastNotificationResponseAsync().
  }
});

/**
 * Registers the background notification task with expo-notifications.
 * Must be called once at app startup (before navigation is ready).
 */
export async function registerBackgroundNotificationTask(): Promise<void> {
  try {
    // Dynamically import to avoid issues if not supported on this platform
    const Notifications = await import('expo-notifications');
    if (typeof Notifications.registerTaskAsync === 'function') {
      await Notifications.registerTaskAsync(BACKGROUND_NOTIFICATION_TASK);
      console.log('[BackgroundNotificationTask] Registered successfully');
    }
  } catch (err) {
    // Safe to ignore — may already be registered, or not supported in this build
    console.warn('[BackgroundNotificationTask] Registration skipped:', err);
  }
}
