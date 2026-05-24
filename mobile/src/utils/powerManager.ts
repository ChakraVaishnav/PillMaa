// src/utils/powerManager.ts
import { Linking, Platform } from 'react-native';

const AUTO_START_INTENTS = [
  {
    name: 'Xiaomi',
    url: 'intent://com.miui.securitycenter/com.miui.permcenter.autostart.AutoStartManagementActivity#Intent;scheme=miui;end',
  },
  {
    name: 'Oppo',
    url: 'intent://com.coloros.safecenter/com.coloros.safecenter.permission.startup.StartupAppListActivity#Intent;scheme=coloros;end',
  },
  {
    name: 'Vivo',
    url: 'intent://com.vivo.permissionmanager/com.vivo.permissionmanager.activity.BgStartUpManagerActivity#Intent;scheme=vivo;end',
  },
  {
    name: 'OnePlus',
    url: 'intent://com.oneplus.security/com.oneplus.security.chainlaunch.view.ChainLaunchAppListActivity#Intent;scheme=oneplus;end',
  },
];

/**
 * Programmatically requests Android battery optimization exemption (Ignore Battery Optimizations).
 * Pops up a system dialog: "Allow PillMaa to run in background without restrictions?"
 */
export async function requestIgnoreBatteryOptimizations(): Promise<boolean> {
  if (Platform.OS !== 'android') return false;

  try {
    // Attempt direct request dialog
    await Linking.openURL('intent:#Intent;action=android.settings.REQUEST_IGNORE_BATTERY_OPTIMIZATIONS;data=package:com.pillmaa.app;end');
    return true;
  } catch (_) {
    try {
      // Fallback to optimization list settings
      await Linking.openURL('intent:#Intent;action=android.settings.IGNORE_BATTERY_OPTIMIZATION_SETTINGS;end');
      return true;
    } catch (err) {
      console.warn('[PowerManager] Failed to trigger battery exemption intents:', err);
      // Final fallback to general settings
      await Linking.openSettings();
      return false;
    }
  }
}

/**
 * Programmatically launches the manufacturer-specific Autostart settings page
 * on Xiaomi, Oppo, OnePlus, Vivo, etc.
 */
export async function openAutostartSettings(): Promise<boolean> {
  if (Platform.OS !== 'android') return false;

  for (const intent of AUTO_START_INTENTS) {
    try {
      const supported = await Linking.canOpenURL(intent.url);
      if (supported) {
        await Linking.openURL(intent.url);
        return true;
      }
    } catch (_) {
      // Silently try next intent
    }
  }

  // Fallback to general settings if no intent matched
  try {
    await Linking.openSettings();
    return true;
  } catch (err) {
    console.warn('[PowerManager] Failed to open system settings:', err);
    return false;
  }
}
