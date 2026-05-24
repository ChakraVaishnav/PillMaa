// app/(tabs)/index.tsx
import React, { useCallback } from 'react';
import { Feather, MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  LayoutAnimation,
  Platform,
  UIManager,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useUser } from '@clerk/clerk-expo';
import Animated, {
  FadeInDown,
  FadeIn,
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ReminderCard } from '../../src/components/reminder/ReminderCard';
import { useReminderStore } from '../../src/store/useReminderStore';
import { useTabBar } from '../../src/context/TabBarContext';
import { useTheme } from '../../src/context/ThemeContext';
import { AlertModal } from '../../src/components/ui/AlertModal';
import { Badge } from '../../src/components/ui/Badge';
import { FadeIn as FadeInComponent } from '../../src/components/animations/FadeIn';
import { Colors } from '../../src/theme/colors';
import { Typography } from '../../src/theme/typography';
import { Shadows } from '../../src/theme/shadows';
import { getGreeting, isReminderActiveOnDate } from '../../src/utils/dateHelpers';
import {
  useReminders,
  useTodayReminders,
  useDeleteReminder,
  useMarkComplete,
  useUpdateReminder,
  useHistory,
  useStreak,
} from '../../src/hooks/useReminders';
import type { Reminder } from '../../src/types';
import { format } from 'date-fns';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

function FloatingAddButton({ onPress }: { onPress: () => void }) {
  const scale = useSharedValue(1);
  const { theme } = useTheme();

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <AnimatedTouchable
      style={[styles.fab, { shadowColor: theme.primary }, animStyle]}
      onPress={onPress}
      onPressIn={() => { scale.value = withSpring(0.9); }}
      onPressOut={() => { scale.value = withSpring(1, { damping: 8 }); }}
      activeOpacity={1}
    >
      <LinearGradient
        colors={[theme.primary, theme.primary]}
        style={styles.fabGradient}
      >
        <Feather name="plus" size={24} color={Colors.textOnPrimary} />
      </LinearGradient>
    </AnimatedTouchable>
  );
}

export default function DashboardScreen() {
  const router = useRouter();
  const { user } = useUser();
  const { handleScroll, showTabBar } = useTabBar();
  const { theme } = useTheme();
  const { isLoading, refetch } = useReminders();
  const todayReminders = useTodayReminders();
  const { mutate: deleteReminder } = useDeleteReminder();
  const { mutate: markComplete } = useMarkComplete();
  const { mutate: updateReminder } = useUpdateReminder();
  const { data: streak = 0 } = useStreak();
  const { data: history = [] } = useHistory();
  const reminders = useReminderStore((s) => s.reminders);

  const [confirmModal, setConfirmModal] = React.useState<{
    visible: boolean;
    title: string;
    message: string;
    type: 'success' | 'info' | 'danger';
    confirmLabel?: string;
    onConfirm: () => void;
  }>({
    visible: false,
    title: '',
    message: '',
    type: 'info',
    confirmLabel: 'Confirm',
    onConfirm: () => {},
  });

  const greeting = getGreeting();
  const firstName = user?.firstName ?? 'there';
  const today = format(new Date(), 'EEEE, MMMM d');

  const completedCount = todayReminders.filter((r) => r.isCompleted).length;
  const pendingCount = todayReminders.filter((r) => !r.isCompleted).length;

  const handleReminderPress = useCallback((reminder: Reminder) => {
    router.push({ pathname: '/reminder/edit', params: { id: reminder.id } });
  }, [router]);

  const handleDelete = useCallback((id: string) => {
    const reminderName = todayReminders.find((r) => r.id === id)?.medicineName || 'this reminder';
    Alert.alert(
      'Delete Reminder',
      `Would you like to delete "${reminderName}" only for today, or forever?`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Only Today',
          style: 'destructive',
          onPress: () => {
            LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
            const todayDateStr = format(new Date(), 'yyyy-MM-dd');
            useReminderStore.getState().deleteForToday(id, todayDateStr);
          },
        },
        {
          text: 'Forever',
          style: 'destructive',
          onPress: () => {
            LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
            deleteReminder(id);
          },
        },
      ],
      { cancelable: true }
    );
  }, [deleteReminder, todayReminders]);

  const handleMarkTaken = useCallback((id: string) => {
    const reminder = todayReminders.find((r) => r.id === id);
    if (!reminder) return;

    if (reminder.isCompleted) {
      setConfirmModal({
        visible: true,
        title: 'Mark as Not Taken',
        message: `Do you want to mark "${reminder.medicineName}" as not taken?`,
        type: 'info',
        confirmLabel: 'Undo Take',
        onConfirm: () => {
          LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
          updateReminder({ id, payload: { isCompleted: false } });
        },
      });
    } else {
      setConfirmModal({
        visible: true,
        title: 'Mark as Taken',
        message: `Do you want to mark "${reminder.medicineName}" as taken?`,
        type: 'success',
        confirmLabel: 'Took It',
        onConfirm: () => {
          LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
          markComplete({ id, takenVia: 'swipe' });
        },
      });
    }
  }, [markComplete, updateReminder, todayReminders]);

  const groupLogsByDate = (logs: any[]) => {
    const groups: Record<string, any[]> = {};
    const safeLogs = Array.isArray(logs) ? logs : [];

    // Group actual taken logs
    safeLogs.forEach((log) => {
      if (!log.takenAt) return;
      try {
        const dateStr = format(new Date(log.takenAt), 'yyyy-MM-dd');
        if (!groups[dateStr]) {
          groups[dateStr] = [];
        }
        groups[dateStr].push(log);
      } catch (err) {
        console.warn('Failed to format log date:', err);
      }
    });

    // Synthesize pending reminders for Today and Yesterday
    const todayStr = format(new Date(), 'yyyy-MM-dd');
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = format(yesterday, 'yyyy-MM-dd');

    const datesToCheck = [todayStr, yesterdayStr];

    datesToCheck.forEach((dateKey) => {
      const dateObj = new Date(dateKey);
      reminders.forEach((reminder) => {
        const isActive = isReminderActiveOnDate(
          dateObj,
          reminder.repeatType,
          reminder.repeatDays,
          reminder.startDate,
          reminder.endDate
        );

        if (isActive) {
          const hasLog = (groups[dateKey] || []).some(
            (log: any) => log.reminderId === reminder.id
          );

          if (!hasLog) {
            if (!groups[dateKey]) groups[dateKey] = [];
            const [hours, minutes] = reminder.reminderTime.split(':').map(Number);
            const logDate = new Date(dateObj);
            logDate.setHours(hours, minutes, 0, 0);

            groups[dateKey].push({
              id: `pending-${reminder.id}-${dateKey}`,
              reminderId: reminder.id,
              medicineName: reminder.medicineName,
              dosage: reminder.dosage || '1 tablet',
              takenAt: logDate.toISOString(),
              takenVia: 'pending',
              scheduledTime: reminder.reminderTime,
            });
          }
        }
      });
    });

    // Sort logs within each day by time descending
    Object.keys(groups).forEach((dateKey) => {
      groups[dateKey].sort(
        (a: any, b: any) => new Date(b.takenAt).getTime() - new Date(a.takenAt).getTime()
      );
    });

    return groups;
  };

  const getGroupHeader = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      const todayStr = format(new Date(), 'yyyy-MM-dd');
      if (dateStr === todayStr) {
        return 'Today';
      }
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = format(yesterday, 'yyyy-MM-dd');
      if (dateStr === yesterdayStr) {
        return 'Yesterday';
      }
      return format(date, 'EEEE, MMM d');
    } catch (err) {
      return dateStr;
    }
  };

  const historyGrouped = groupLogsByDate(history);

  return (
    <View style={[styles.root, { backgroundColor: theme.background }]}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scroll}
          onScroll={handleScroll}
          scrollEventThrottle={16}
          onScrollEndDrag={showTabBar}
          onMomentumScrollEnd={showTabBar}
          refreshControl={
            <RefreshControl
              refreshing={isLoading}
              onRefresh={refetch}
              tintColor={theme.primary}
              colors={[theme.primary]}
            />
          }
        >
          {/* ─── Header / Greeting ─────────────────────────────── */}
          <Animated.View entering={FadeIn.duration(400)} style={styles.header}>
            <LinearGradient
              colors={[theme.primary, theme.primary]}
              style={styles.headerGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              {/* Top row */}
              <View style={styles.headerTop}>
                <View>
                  <Text style={styles.greetingText}>{greeting},</Text>
                  <Text style={styles.greetingName}>{firstName}</Text>
                  <Text style={styles.dateText}>{today}</Text>
                </View>
                <TouchableOpacity
                  style={styles.avatarBtn}
                  onPress={() => router.push('/profile')}
                >
                  {user?.firstName ? (
                    <Text style={styles.avatarLetter}>
                      {user.firstName[0].toUpperCase()}
                    </Text>
                  ) : (
                    <Feather name="user" size={20} color={Colors.textOnPrimary} />
                  )}
                </TouchableOpacity>
              </View>

              {/* Redesigned Stats Row */}
              <View style={styles.summaryRow}>
                <View style={styles.summaryItem}>
                  <Text style={styles.summaryCount}>{todayReminders.length}</Text>
                  <Text style={styles.summaryLabel}>Total Today</Text>
                </View>
                <View style={styles.summaryDivider} />
                <View style={styles.summaryItem}>
                  <Text style={styles.summaryCount}>{completedCount}</Text>
                  <Text style={styles.summaryLabel}>Taken</Text>
                </View>
                <View style={styles.summaryDivider} />
                <View style={styles.summaryItem}>
                  <Text style={[styles.summaryCount, pendingCount > 0 && styles.summaryCountPending]}>
                    {pendingCount}
                  </Text>
                  <Text style={styles.summaryLabel}>Pending</Text>
                </View>
              </View>
            </LinearGradient>
          </Animated.View>

          {/* ─── Streak Card ───────────────────────────────────── */}
          <Animated.View entering={FadeInDown.delay(100)} style={[styles.streakCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <View style={styles.streakLeft}>
              <View style={[styles.streakIconContainer, { backgroundColor: theme.primaryLight, borderColor: theme.border }]}>
                <MaterialCommunityIcons name="fire" size={24} color="#f97316" />
              </View>
              <View style={styles.streakTextContainer}>
                <Text style={styles.streakValue}>{streak} Day Streak</Text>
                <Text style={[styles.streakSubtext, { color: theme.textMuted }]}>You're doing great! Keep it up.</Text>
              </View>
            </View>
            <Feather name="calendar" size={20} color={theme.textMuted} />
          </Animated.View>

          {/* ─── Today's Medicines ────────────────────────────── */}
          <View style={styles.section}>
            <FadeInComponent delay={150} from="bottom">
              <View style={styles.sectionHeader}>
                <Text style={[styles.sectionTitle, { color: theme.text }]}>Today's Medicines</Text>
                {pendingCount > 0 && (
                  <Badge
                    label={`${pendingCount} pending`}
                    variant="warning"
                    dot
                  />
                )}
              </View>
            </FadeInComponent>

            {/* Swipe hint above the list, if there are items */}
            {todayReminders.length > 0 && (
              <FadeInComponent delay={200} from="bottom">
                <View style={styles.swipeHintRowHeader}>
                  <Feather name="info" size={13} color={theme.textMuted} />
                  <Text style={[styles.swipeHintTextHeader, { color: theme.textMuted }]}>
                    Swipe right to mark taken  ·  Swipe left to delete
                  </Text>
                </View>
              </FadeInComponent>
            )}

            {todayReminders.length === 0 ? (
              <FadeInComponent delay={250}>
                <View style={[styles.emptyStateContainer, { backgroundColor: theme.card, borderColor: theme.border }]}>
                  <View style={[styles.emptyStateIconBg, { backgroundColor: theme.primaryLight, borderColor: theme.border }]}>
                    <MaterialCommunityIcons name="pill-off" size={48} color={theme.textMuted} />
                  </View>
                  <Text style={[styles.emptyStateTitle, { color: theme.text }]}>No medicines added yet</Text>
                  <Text style={[styles.emptyStateSubtext, { color: theme.textMuted }]}>Tap + to add your first reminder</Text>
                  <TouchableOpacity
                    style={[styles.emptyStateBtn, { borderColor: theme.primary }]}
                    onPress={() => router.push('/reminder/create')}
                  >
                    <Feather name="plus" size={16} color={theme.primary} style={{ marginRight: 6 }} />
                    <Text style={[styles.emptyStateBtnText, { color: theme.primary }]}>Add Medicine</Text>
                  </TouchableOpacity>
                </View>
              </FadeInComponent>
            ) : (
              todayReminders.map((reminder, index) => (
                <FadeInComponent key={reminder.id} delay={150 + index * 50} from="bottom">
                  <ReminderCard
                    reminder={reminder}
                    onDelete={handleDelete}
                    onMarkTaken={handleMarkTaken}
                    onPress={handleReminderPress}
                  />
                </FadeInComponent>
              ))
            )}
          </View>

          {/* ─── Recent History Section ────────────────────────── */}
          <View style={styles.historySection}>
            <FadeInComponent delay={300} from="bottom">
              <View style={styles.sectionHeader}>
                <View style={styles.historyHeaderLeft}>
                  <Ionicons name="time-outline" size={22} color={theme.text} />
                  <Text style={[styles.sectionTitle, { color: theme.text }]}>Recent History</Text>
                </View>
              </View>
            </FadeInComponent>

            {Object.keys(historyGrouped).length === 0 ? (
              <FadeInComponent delay={350}>
                <View style={[styles.emptyHistory, { backgroundColor: theme.card, borderColor: theme.border }]}>
                  <Text style={[styles.emptyHistoryText, { color: theme.textMuted }]}>No history yet</Text>
                </View>
              </FadeInComponent>
            ) : (
              Object.entries(historyGrouped).map(([dateStr, dayLogs], groupIdx) => (
                <FadeInComponent key={dateStr} delay={350 + groupIdx * 60} from="bottom">
                  <View style={styles.historyGroup}>
                    <Text style={[styles.historyGroupHeader, { color: theme.textMuted }]}>{getGroupHeader(dateStr)}</Text>
                    {dayLogs.map((log: any) => {
                      let timeStr = '';
                      try {
                        timeStr = format(new Date(log.takenAt), 'h:mm a');
                      } catch (err) {
                        timeStr = log.takenAt;
                      }

                      return (
                        <View key={log.id} style={[styles.historyRow, { backgroundColor: theme.card, borderColor: theme.border }]}>
                          <View style={styles.historyRowLeft}>
                            <View style={[styles.historyPillIcon, { backgroundColor: theme.primaryLight, borderColor: theme.border }]}>
                              <MaterialCommunityIcons name="pill" size={16} color={theme.primary} />
                            </View>
                            <View style={{ flex: 1 }}>
                              <Text style={[styles.historyMedName, { color: theme.text }]} numberOfLines={1}>
                                {log.medicineName}
                              </Text>
                              <Text style={[styles.historyTime, { color: theme.textMuted }]}>
                                {timeStr} • {log.dosage || '1 tablet'}
                              </Text>
                            </View>
                          </View>
                          {log.takenVia === 'swipe' && (
                            <View style={[styles.viaBadge, styles.viaSwipe]}>
                              <Text style={styles.viaTextSwipe}>Swiped</Text>
                            </View>
                          )}
                          {log.takenVia === 'alarm_dismiss' && (
                            <View style={[styles.viaBadge, { backgroundColor: theme.primaryLight }]}>
                              <Text style={[styles.viaTextAlarm, { color: theme.primary }]}>Alarm</Text>
                            </View>
                          )}
                          {log.takenVia === 'manual' && (
                            <View style={[styles.viaBadge, styles.viaManual]}>
                              <Text style={styles.viaTextManual}>Manual</Text>
                            </View>
                          )}
                          {log.takenVia === 'pending' && (
                            <View style={[styles.viaBadge, { backgroundColor: '#fee2e2' }]}>
                              <Text style={{ fontFamily: Typography.fontFamily.semibold, fontSize: 10, color: '#ef4444' }}>Pending</Text>
                            </View>
                          )}
                        </View>
                      );
                    })}
                  </View>
                </FadeInComponent>
              ))
            )}
          </View>

          <View style={styles.bottomPadding} />
        </ScrollView>

        {/* ─── Floating Action Button ───────────────────────── */}
        <FloatingAddButton onPress={() => router.push('/reminder/create')} />
      </SafeAreaView>

      <AlertModal
        visible={confirmModal.visible}
        title={confirmModal.title}
        message={confirmModal.message}
        type={confirmModal.type}
        confirmLabel={confirmModal.confirmLabel}
        onClose={() => setConfirmModal({ ...confirmModal, visible: false })}
        onConfirm={confirmModal.onConfirm}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },
  safeArea: { flex: 1 },
  scroll: { flexGrow: 1 },

  // Header
  header: {
    marginBottom: 0,
  },
  headerGradient: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 24,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
  },
  headerTop: {
    flexDirection:  'row',
    justifyContent: 'space-between',
    alignItems:     'flex-start',
    marginBottom:   20,
  },
  greetingText: {
    fontFamily: Typography.fontFamily.medium,
    fontSize:   Typography.fontSize.base,
    color:      'rgba(255,255,255,0.75)',
    marginBottom: 2,
  },
  greetingName: {
    fontFamily: Typography.fontFamily.bold,
    fontSize:   Typography.fontSize['2xl'],
    color:      Colors.textOnPrimary,
    marginBottom: 4,
  },
  dateText: {
    fontFamily: Typography.fontFamily.regular,
    fontSize:   Typography.fontSize.sm,
    color:      'rgba(255,255,255,0.6)',
  },
  avatarBtn: {
    width:           44,
    height:          44,
    borderRadius:    22,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems:      'center',
    justifyContent:  'center',
    borderWidth:     1.5,
    borderColor:     'rgba(255,255,255,0.3)',
  },
  avatarLetter: {
    fontSize: 18,
    color:    Colors.textOnPrimary,
    fontFamily: Typography.fontFamily.bold,
  },

  // Redesigned stats summary row
  summaryRow: {
    flexDirection:   'row',
    marginTop:       8,
    paddingVertical: 12,
  },
  summaryItem: {
    flex:           1,
    alignItems:     'center',
  },
  summaryDivider: {
    width:           1,
    backgroundColor: 'rgba(255,255,255,0.3)',
    marginVertical:  4,
  },
  summaryCount: {
    fontFamily: Typography.fontFamily.bold,
    fontSize:   32,
    color:      Colors.textOnPrimary,
    lineHeight: 38,
  },
  summaryCountPending: {
    color: '#ffedd5',
  },
  summaryLabel: {
    fontFamily: Typography.fontFamily.medium,
    fontSize:   11,
    color:      'rgba(255,255,255,0.8)',
    marginTop:  2,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },

  // Streak Card
  streakCard: {
    marginHorizontal: 20,
    marginTop: 16,
    padding: 16,
    backgroundColor: Colors.surface,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1.5,
    borderColor: '#ffedd5', // Orange-tinted light border
    ...Shadows.sm,
  },
  streakLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  streakIconContainer: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#fff7ed', // Orange-tinted very light background
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#ffddc1',
  },
  streakTextContainer: {
    gap: 2,
    flex: 1,
  },
  streakValue: {
    fontFamily: Typography.fontFamily.bold,
    fontSize: 16,
    color: '#ea580c', // Orange color
  },
  streakSubtext: {
    fontFamily: Typography.fontFamily.regular,
    fontSize: 12,
    color: Colors.textSecondary,
  },

  // Section
  section: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  sectionHeader: {
    flexDirection:  'row',
    alignItems:     'center',
    justifyContent: 'space-between',
    marginBottom:   12,
  },
  sectionTitle: {
    fontFamily: Typography.fontFamily.bold,
    fontSize:   Typography.fontSize.lg,
    color:      Colors.textPrimary,
  },

  // Swipe hint row above list
  swipeHintRowHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  swipeHintTextHeader: {
    fontFamily: Typography.fontFamily.medium,
    fontSize: 12,
    color: Colors.textTertiary,
  },

  // Centered Premium Empty State
  emptyStateContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    paddingHorizontal: 24,
    backgroundColor: Colors.surface,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: Colors.border,
    marginTop: 4,
    ...Shadows.sm,
  },
  emptyStateIconBg: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#f3f4f6',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    borderWidth: 1.5,
    borderColor: '#e5e7eb',
  },
  emptyStateTitle: {
    fontFamily: Typography.fontFamily.bold,
    fontSize: 16,
    color: Colors.textPrimary,
    marginBottom: 6,
  },
  emptyStateSubtext: {
    fontFamily: Typography.fontFamily.regular,
    fontSize: 13,
    color: Colors.textTertiary,
    textAlign: 'center',
    marginBottom: 20,
  },
  emptyStateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#1a7a4a',
    backgroundColor: 'transparent',
  },
  emptyStateBtnText: {
    fontFamily: Typography.fontFamily.semibold,
    fontSize: 14,
    color: '#1a7a4a',
  },

  // History Section
  historySection: {
    paddingHorizontal: 20,
    paddingTop: 24,
  },
  historyHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  emptyHistory: {
    padding: 20,
    backgroundColor: Colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyHistoryText: {
    fontFamily: Typography.fontFamily.regular,
    fontSize: 13,
    color: Colors.textTertiary,
  },
  historyGroup: {
    marginBottom: 16,
  },
  historyGroupHeader: {
    fontFamily: Typography.fontFamily.bold,
    fontSize: 11,
    color: Colors.textTertiary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
    paddingHorizontal: 4,
  },
  historyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.surface,
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 8,
    ...Shadows.sm,
  },
  historyRowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  historyPillIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: Colors.primary[50],
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.primary[100],
  },
  historyMedName: {
    fontFamily: Typography.fontFamily.semibold,
    fontSize: 14,
    color: Colors.textPrimary,
    marginBottom: 2,
  },
  historyTime: {
    fontFamily: Typography.fontFamily.regular,
    fontSize: 11,
    color: Colors.textTertiary,
  },
  viaBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  viaSwipe: {
    backgroundColor: '#f3f4f6',
  },
  viaAlarm: {
    backgroundColor: '#dcfce7',
  },
  viaManual: {
    backgroundColor: '#dbeafe',
  },
  viaTextSwipe: {
    fontFamily: Typography.fontFamily.semibold,
    fontSize: 10,
    color: '#4b5563',
  },
  viaTextAlarm: {
    fontFamily: Typography.fontFamily.semibold,
    fontSize: 10,
    color: '#16a34a',
  },
  viaTextManual: {
    fontFamily: Typography.fontFamily.semibold,
    fontSize: 10,
    color: '#2563eb',
  },

  // FAB
  fab: {
    position: 'absolute',
    bottom:   80,
    right:    24,
    width:    60,
    height:   60,
    borderRadius: 30,
    ...Shadows.xl,
    shadowOpacity: 0.4,
  },
  fabGradient: {
    width:          60,
    height:         60,
    borderRadius:   30,
    alignItems:     'center',
    justifyContent: 'center',
  },
  bottomPadding: {
    height: 100,
  },
});

