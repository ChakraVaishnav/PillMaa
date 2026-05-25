// src/utils/powerManager.ts
import { Linking, Platform, NativeModules } from 'react-native';
import * as IntentLauncher from 'expo-intent-launcher';
import Constants from 'expo-constants';

const { MedicineAlarm } = NativeModules;

const APP_PACKAGE =
  Constants.expoConfig?.android?.package ||
  (Constants.manifest as any)?.android?.package ||
  'com.pillmaa.app';

/**
 * Checks whether the app is currently ignoring battery optimizations.
 * Returns true if already set to Unrestricted/Not Optimized.
 */
export async function isBatteryOptimizationIgnored(): Promise<boolean> {
  if (Platform.OS !== 'android') return true;
  try {
    if (MedicineAlarm) {
      return await MedicineAlarm.isBatteryOptimizationIgnored();
    }
    return false;
  } catch {
    return false;
  }
}

/**
 * Programmatically requests Android battery optimization exemption.
 * Opens the exact battery settings screen for PillMaa directly.
 */
export async function requestIgnoreBatteryOptimizations(): Promise<boolean> {
  if (Platform.OS !== 'android') return false;

  try {
    await IntentLauncher.startActivityAsync(
      IntentLauncher.ActivityAction.REQUEST_IGNORE_BATTERY_OPTIMIZATIONS,
      { data: `package:${APP_PACKAGE}` }
    );
    return true;
  } catch (err) {
    console.warn('[PowerManager] REQUEST_IGNORE_BATTERY_OPTIMIZATIONS failed, trying fallback:', err);
    try {
      await IntentLauncher.startActivityAsync(
        IntentLauncher.ActivityAction.IGNORE_BATTERY_OPTIMIZATION_SETTINGS
      );
      return true;
    } catch (err2) {
      console.warn('[PowerManager] Fallback failed, opening app settings:', err2);
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
 * Checks whether the app has the "Draw over other apps" permission.
 * NOTE: This is a placeholder as Expo doesn't provide a direct check.
 */
export async function canDrawOverApps(): Promise<boolean> {
  if (Platform.OS !== 'android') return true;
  try {
    if (MedicineAlarm) {
      return await MedicineAlarm.canDrawOverApps();
    }
    return false;
  } catch {
    return false;
  }
}

/**
 * Opens the "Draw over other apps" (SYSTEM_ALERT_WINDOW) settings screen for PillMaa.
 * 
 * This permission is required on Android for the full-screen alarm to appear
 * on top of other apps (including lock screen). On MIUI/Realme/OnePlus this is
 * called "Display pop-up windows while running in background".
 */
export async function requestDrawOverAppsPermission(): Promise<boolean> {
  if (Platform.OS !== 'android') return false;

  try {
    await IntentLauncher.startActivityAsync(
      'android.settings.action.MANAGE_OVERLAY_PERMISSION',
      { data: `package:${APP_PACKAGE}` }
    );
    return true;
  } catch (err) {
    console.warn('[PowerManager] MANAGE_OVERLAY_PERMISSION failed, opening app settings:', err);
    try {
      await Linking.openSettings();
      return true;
    } catch {
      return false;
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
