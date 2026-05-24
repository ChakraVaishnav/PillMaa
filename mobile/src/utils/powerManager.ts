// src/utils/powerManager.ts
import { Linking, Platform } from 'react-native';

/**
 * Programmatically requests Android battery optimization exemption by opening 
 * the App Info settings page directly where the user can toggle battery restrictions.
 */
export async function requestIgnoreBatteryOptimizations(): Promise<boolean> {
  if (Platform.OS !== 'android') return false;

  try {
    await Linking.openSettings();
    return true;
  } catch (err) {
    console.warn('[PowerManager] Failed to open system settings:', err);
    return false;
  }
}

/**
 * Programmatically launches system settings as a fallback for manufacturers.
 */
export async function openAutostartSettings(): Promise<boolean> {
  if (Platform.OS !== 'android') return false;

  try {
    await Linking.openSettings();
    return true;
  } catch (err) {
    console.warn('[PowerManager] Failed to open system settings:', err);
    return false;
  }
}
