// app/reminder/alarm.tsx
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Feather, MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  StatusBar,
  BackHandler,
  Animated as RNAnimated,
  Easing as RNEasing,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import Animated, {
  FadeIn,
  FadeInDown,
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  interpolate,
  Easing,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { format } from 'date-fns';

import { useAlarm } from '../../src/hooks/useAlarm';
import { useMarkComplete } from '../../src/hooks/useReminders';
import { scheduleSnoozeNotification } from '../../src/utils/notifications';
import { Colors } from '../../src/theme/colors';
import { Typography } from '../../src/theme/typography';
import { useTheme } from '../../src/context/ThemeContext';

const ALARM_GRADIENT_START: Record<string, string> = {
  'Default Green': '#0d4f2e',
  'Ocean Blue': '#0f2b6b',
  'Sunset Orange': '#7c2d12',
  'Midnight Purple': '#4c1d95',
};

const ALARM_HIGHLIGHTS: Record<string, string> = {
  'Default Green': '#86efac',
  'Ocean Blue': '#93c5fd',
  'Sunset Orange': '#fdba74',
  'Midnight Purple': '#c084fc',
};

const { width, height } = Dimensions.get('window');
const RING_SIZE = 160;

// ─── Pulsing ring component ────────────────────────────────────────────────────
function PulsingRing({ delay, scale: maxScale, theme }: { delay: number; scale: number; theme: any }) {
  const progress = useSharedValue(0);

  useEffect(() => {
    const timer = setTimeout(() => {
      progress.value = withRepeat(
        withSequence(
          withTiming(0, { duration: 0 }),
          withTiming(1, { duration: 2200, easing: Easing.out(Easing.ease) })
        ),
        -1,
        false
      );
    }, delay);
    return () => clearTimeout(timer);
  }, []);

  const animStyle = useAnimatedStyle(() => ({
    opacity: interpolate(progress.value, [0, 0.4, 1], [0.7, 0.4, 0]),
    transform: [
      { scale: interpolate(progress.value, [0, 1], [1, maxScale]) },
    ],
  }));

  return (
    <Animated.View style={[styles.ring, animStyle, { borderColor: theme.primary }]} />
  );
}

// ─── Pill icon with standard Animated API loop ─────────────────────────────────
function GlowingPill({ theme }: { theme: any }) {
  const pulseAnim = useRef(new RNAnimated.Value(1)).current;

  useEffect(() => {
    RNAnimated.loop(
      RNAnimated.sequence([
        RNAnimated.timing(pulseAnim, {
          toValue: 1.08,
          duration: 1200,
          easing: RNEasing.inOut(RNEasing.ease),
          useNativeDriver: true,
        }),
        RNAnimated.timing(pulseAnim, {
          toValue: 1,
          duration: 1200,
          easing: RNEasing.inOut(RNEasing.ease),
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  return (
    <RNAnimated.View style={[styles.pillContainer, { transform: [{ scale: pulseAnim }], shadowColor: theme.primary }]}>
      <LinearGradient
        colors={[theme.primaryLight, theme.primary, theme.primary]}
        style={styles.pillCircle}
      >
        <MaterialCommunityIcons name="pill" size={72} color={Colors.textOnPrimary} />
      </LinearGradient>
    </RNAnimated.View>
  );
}

// ─── Main Alarm Screen ────────────────────────────────────────────────────────
export default function AlarmScreen() {
  const { theme } = useTheme();
  const params = useLocalSearchParams<{
    reminderId: string;
    medicineName: string;
    dosage: string;
    snoozeCount: string;
    snoozeInterval: string;
  }>();
  const router = useRouter();

  const medicineName   = params.medicineName ?? 'Medicine';
  const rawDosage      = params.dosage ?? '';
  // Default fallback if dosage is empty or "0"
  const dosage         = (rawDosage === '' || rawDosage === '0') ? '1 tablet' : rawDosage;
  
  const reminderId     = params.reminderId ?? '';
  const snoozeInterval = parseInt(params.snoozeInterval ?? '5');
  const [remainingSnoozes, setRemainingSnoozes] = useState(parseInt(params.snoozeCount ?? '3'));

  const { startAlarm, stopAlarm } = useAlarm();
  const { mutate: markComplete } = useMarkComplete();
  const [currentTime, setCurrentTime] = useState(format(new Date(), 'h:mm'));
  const [currentPeriod, setCurrentPeriod] = useState(format(new Date(), 'a'));
  const [isSnoozed, setIsSnoozed] = useState(false);

  // Block back button on Android
  useEffect(() => {
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => true);
    return () => backHandler.remove();
  }, []);

  // Start alarm on mount
  useEffect(() => {
    startAlarm();

    // Update clock every second
    const tick = setInterval(() => {
      const now = new Date();
      setCurrentTime(format(now, 'h:mm'));
      setCurrentPeriod(format(now, 'a'));
    }, 1000);

    return () => clearInterval(tick);
  }, []);

  const handleSnooze = useCallback(async () => {
    if (remainingSnoozes <= 0) return;

    await stopAlarm();
    setIsSnoozed(true);

    const newRemaining = remainingSnoozes - 1;
    setRemainingSnoozes(newRemaining);

    // Schedule snooze notification
    try {
      await scheduleSnoozeNotification(
        {
          id:             reminderId,
          medicineName,
          dosage,
          snoozeCount:    newRemaining,
          snoozeInterval,
        },
        newRemaining
      );
    } catch (err) {
      console.warn('[Alarm] Snooze schedule failed:', err);
    }

    router.back();
  }, [remainingSnoozes, reminderId, medicineName, dosage, snoozeInterval]);

  const handleTaken = useCallback(async () => {
    await stopAlarm();

    if (reminderId) {
      markComplete({ id: reminderId, takenVia: 'alarm_dismiss' });
    }

    router.back();
  }, [reminderId, stopAlarm, markComplete]);

  if (isSnoozed) {
    return (
      <View style={[styles.root, { justifyContent: 'center', alignItems: 'center', gap: 16, backgroundColor: Colors.background }]}>
        <Ionicons name="notifications-off-outline" size={64} color={Colors.primary[600]} />
        <Text style={[styles.medicineName, { textAlign: 'center', color: Colors.textPrimary }]}>
          Snoozed for {snoozeInterval} minutes
        </Text>
      </View>
    );
  }

  const gradStart = ALARM_GRADIENT_START[theme.name] || '#0d4f2e';
  const highlightColor = ALARM_HIGHLIGHTS[theme.name] || '#86efac';

  return (
    <View style={[styles.root, { backgroundColor: gradStart }]}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

      {/* Full-screen gradient background */}
      <LinearGradient
        colors={[gradStart, theme.primary]}
        style={StyleSheet.absoluteFill}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />

      <SafeAreaView style={styles.safeArea}>
        {/* Top 60% of Screen: Header, Clock, and Pulsing Pill Centered Column */}
        <View style={styles.topSection}>
          {/* Header */}
          <Animated.View entering={FadeIn.delay(100)} style={styles.headerSection}>
            <Ionicons name="medical" size={18} color={highlightColor} style={{ marginRight: 6 }} />
            <Text style={[styles.alarmLabel, { color: highlightColor }]}>MEDICINE TIME</Text>
          </Animated.View>

          {/* Clock */}
          <Animated.View entering={FadeIn.delay(200)} style={styles.clockSection}>
            <View style={styles.clockRow}>
              <Text style={styles.clockTime}>{currentTime}</Text>
              <Text style={[styles.clockPeriod, { color: highlightColor }]}>{currentPeriod}</Text>
            </View>
          </Animated.View>

          {/* Centered Pulsing Pill & Rings Column */}
          <Animated.View entering={FadeIn.delay(300)} style={styles.pillCenterSection}>
            <View style={styles.ringsContainer} pointerEvents="none">
              <PulsingRing delay={0}   scale={2.0} theme={theme} />
              <PulsingRing delay={600} scale={2.6} theme={theme} />
              <PulsingRing delay={1200} scale={3.2} theme={theme} />
            </View>
            <GlowingPill theme={theme} />
          </Animated.View>
        </View>

        {/* Lower 40% of Screen: Info and Action Buttons */}
        <View style={styles.bottomSection}>
          {/* Medicine Info */}
          <Animated.View entering={FadeInDown.delay(400)} style={styles.medicineSection}>
            <Text style={styles.medicineName} numberOfLines={2} adjustsFontSizeToFit>
              {medicineName}
            </Text>
            <View style={styles.dosageBadge}>
              <Text style={styles.dosageText}>Dosage: {dosage}</Text>
            </View>
          </Animated.View>

          {/* Snooze Count Muted Subtext */}
          {remainingSnoozes > 0 && (
            <Animated.View entering={FadeIn.delay(500)} style={styles.snoozeInfo}>
              <Text style={[styles.snoozeInfoText, { color: highlightColor }]}>
                {remainingSnoozes} snooze{remainingSnoozes !== 1 ? 's' : ''} remaining
              </Text>
            </Animated.View>
          )}

          {/* Vertically Stacked Full-Width Buttons */}
          <Animated.View entering={FadeInDown.delay(550)} style={styles.buttonsSection}>
            {/* TOOK IT BUTTON (PRIMARY) */}
            <TouchableOpacity
              style={styles.takenBtn}
              onPress={handleTaken}
              activeOpacity={0.9}
            >
              <Ionicons name="checkmark" size={22} color={theme.primary} style={{ marginRight: 6 }} />
              <Text style={[styles.takenBtnText, { color: theme.primary }]}>Took It</Text>
            </TouchableOpacity>

            {/* SNOOZE BUTTON */}
            {remainingSnoozes > 0 ? (
              <TouchableOpacity
                style={styles.snoozeBtn}
                onPress={handleSnooze}
                activeOpacity={0.9}
              >
                <Ionicons name="notifications-outline" size={20} color="#ffffff" style={{ marginRight: 6 }} />
                <Text style={styles.snoozeBtnText}>Snooze ({snoozeInterval} min)</Text>
              </TouchableOpacity>
            ) : (
              <View style={[styles.snoozeBtn, styles.snoozeBtnDisabled]}>
                <Ionicons name="notifications-off-outline" size={20} color="rgba(255,255,255,0.4)" style={{ marginRight: 6 }} />
                <Text style={[styles.snoozeBtnText, { color: 'rgba(255,255,255,0.4)' }]}>No Snooze</Text>
              </View>
            )}
          </Animated.View>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#0d4f2e',
  },
  safeArea: {
    flex: 1,
  },
  topSection: {
    flex: 6.5,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 10,
  },
  bottomSection: {
    flex: 3.5,
    justifyContent: 'flex-end',
  },

  // Rings
  pillCenterSection: {
    width: RING_SIZE,
    height: RING_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    marginVertical: 16,
  },
  ringsContainer: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  ring: {
    position: 'absolute',
    width: RING_SIZE,
    height: RING_SIZE,
    borderRadius: RING_SIZE / 2,
    borderWidth: 2,
    borderColor: Colors.primary[400],
  },

  // Sections
  headerSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: 8,
  },
  alarmLabel: {
    fontFamily: Typography.fontFamily.semibold,
    fontSize: Typography.fontSize.sm,
    color: '#86efac',
    letterSpacing: 3,
  },
  clockSection: {
    paddingBottom: 8,
  },
  clockRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 10,
  },
  clockTime: {
    fontFamily: Typography.fontFamily.bold,
    fontSize: Typography.fontSize['5xl'],
    color: Colors.textOnPrimary,
    letterSpacing: -2,
  },
  clockPeriod: {
    fontFamily: Typography.fontFamily.semibold,
    fontSize: Typography.fontSize['2xl'],
    color: '#86efac',
    paddingBottom: 10,
  },

  // Pill
  pillContainer: {
    shadowColor: Colors.primary[400],
    shadowOffset: { width: 0, height: 0 },
    shadowRadius: 24,
    elevation: 20,
  },
  pillCircle: {
    width: RING_SIZE,
    height: RING_SIZE,
    borderRadius: RING_SIZE / 2,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Medicine
  medicineSection: {
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingBottom: 8,
    gap: 8,
  },
  medicineName: {
    fontFamily: Typography.fontFamily.bold,
    fontSize: Typography.fontSize['2xl'],
    color: Colors.textOnPrimary,
    textAlign: 'center',
    letterSpacing: -1,
    lineHeight: Typography.fontSize['2xl'] * 1.2,
  },
  dosageBadge: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 999,
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  dosageText: {
    fontFamily: Typography.fontFamily.medium,
    fontSize: Typography.fontSize.base,
    color: 'rgba(255,255,255,0.9)',
  },

  // Snooze info
  snoozeInfo: {
    alignItems: 'center',
    paddingBottom: 12,
  },
  snoozeInfoText: {
    fontFamily: Typography.fontFamily.regular,
    fontSize: Typography.fontSize.sm,
    color: '#86efac',
  },

  // Buttons Layout
  buttonsSection: {
    flexDirection: 'column',
    gap: 12,
    paddingHorizontal: 24,
    paddingBottom: 40,
    width: '100%',
  },
  takenBtn: {
    width: '100%',
    height: 56,
    backgroundColor: '#ffffff',
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  takenBtnText: {
    fontFamily: Typography.fontFamily.semibold,
    fontSize: Typography.fontSize.base,
    color: '#1a7a4a',
  },
  snoozeBtn: {
    width: '100%',
    height: 56,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.4)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  snoozeBtnDisabled: {
    opacity: 0.5,
  },
  snoozeBtnText: {
    fontFamily: Typography.fontFamily.semibold,
    fontSize: Typography.fontSize.base,
    color: '#ffffff',
  },
});
