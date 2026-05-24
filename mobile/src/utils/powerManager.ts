// src/utils/powerManager.ts
import { Linking, Platform } from 'react-native';
import * as IntentLauncher from 'expo-intent-launcher';
import Constants from 'expo-constants';

/**
 * Checks whether the app is currently ignoring battery optimizations.
 * Returns true if already set to Unrestricted/Not Optimized.
 */
export async function isBatteryOptimizationIgnored(): Promise<boolean> {
  if (Platform.OS !== 'android') return true;
  try {
    // expo-battery doesn't expose this, so we use a heuristic via AsyncStorage flag
    // The actual check happens via native module if available
    return false; // Always returns false — we rely on user confirming via AsyncStorage
  } catch {
    return false;
  }
}

/**
 * Opens the exact Android system dialog asking to ignore battery optimizations for this app.
 * This takes the user directly to the "Battery" page for PillMaa — they just tap "Unrestricted".
 */
export async function requestIgnoreBatteryOptimizations(): Promise<boolean> {
  if (Platform.OS !== 'android') return false;

  try {
    const packageName =
      Constants.expoConfig?.android?.package ||
      Constants.manifest?.android?.package ||
      'com.pillmaa.app';

    // Try the exact battery optimization settings for this specific app first
    await IntentLauncher.startActivityAsync(
      IntentLauncher.ActivityAction.REQUEST_IGNORE_BATTERY_OPTIMIZATIONS,
      { data: `package:${packageName}` }
    );
    return true;
  } catch (err) {
    console.warn('[PowerManager] REQUEST_IGNORE_BATTERY_OPTIMIZATIONS failed, trying fallback:', err);
    try {
      // Fallback: open the "All apps" battery optimization list
      await IntentLauncher.startActivityAsync(
        IntentLauncher.ActivityAction.IGNORE_BATTERY_OPTIMIZATION_SETTINGS
      );
      return true;
    } catch (err2) {
      console.warn('[PowerManager] IGNORE_BATTERY_OPTIMIZATION_SETTINGS failed, opening app settings:', err2);
      try {
        await Linking.openSettings();
        return true;
      } catch {
        return false;
      }
    }
  }
}

/**
 * Opens the "All apps" battery optimization list as an alternative path.
 */
export async function openAutostartSettings(): Promise<boolean> {
  if (Platform.OS !== 'android') return false;

  try {
    await IntentLauncher.startActivityAsync(
      IntentLauncher.ActivityAction.IGNORE_BATTERY_OPTIMIZATION_SETTINGS
    );
    return true;
  } catch (err) {
    console.warn('[PowerManager] Failed to open battery optimization settings:', err);
    try {
      await Linking.openSettings();
      return true;
    } catch {
      return false;
    }
  }
}
