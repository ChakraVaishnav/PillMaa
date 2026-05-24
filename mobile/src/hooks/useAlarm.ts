// src/hooks/useAlarm.ts
import { useEffect, useRef, useCallback } from 'react';
import { Audio } from 'expo-av';
import * as Haptics from 'expo-haptics';
import { AppState, AppStateStatus } from 'react-native';

/**
 * Controls the alarm sound + haptics for the full-screen alarm UI.
 * Automatically stops when component unmounts.
 */
export function useAlarm() {
  const soundRef = useRef<Audio.Sound | null>(null);
  const hapticIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const isPlayingRef = useRef(false);

  const startAlarm = useCallback(async () => {
    if (isPlayingRef.current) return;

    try {
      // Configure audio mode for alarm
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        staysActiveInBackground: true,
        playsInSilentModeIOS: true,
        shouldDuckAndroid: false,
        playThroughEarpieceAndroid: false,
      });

      // Load and play alarm sound on loop
      const { sound } = await Audio.Sound.createAsync(
        require('../../assets/sounds/alarm.wav'),
        { isLooping: true, volume: 1.0 }
      );
      soundRef.current = sound;
      await sound.playAsync();
      isPlayingRef.current = true;

      // Start haptic feedback loop
      hapticIntervalRef.current = setInterval(async () => {
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      }, 1500);
    } catch (error) {
      console.warn('[Alarm] Failed to start alarm sound:', error);
    }
  }, []);

  const stopAlarm = useCallback(async () => {
    if (!isPlayingRef.current) return;
    isPlayingRef.current = false;

    // Stop sound
    if (soundRef.current) {
      try {
        await soundRef.current.stopAsync();
        await soundRef.current.unloadAsync();
        soundRef.current = null;
      } catch (error) {
        console.warn('[Alarm] Error stopping sound:', error);
      }
    }

    // Stop haptics
    if (hapticIntervalRef.current) {
      clearInterval(hapticIntervalRef.current);
      hapticIntervalRef.current = null;
    }

    // Reset audio mode
    try {
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        staysActiveInBackground: false,
        playsInSilentModeIOS: false,
        shouldDuckAndroid: true,
      });
    } catch (_) {}
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopAlarm();
    };
  }, [stopAlarm]);

  return { startAlarm, stopAlarm };
}
