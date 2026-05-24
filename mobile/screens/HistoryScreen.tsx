// screens/HistoryScreen.tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  SectionList,
  Platform,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { format } from 'date-fns';
import { useTheme } from '../src/context/ThemeContext';
import { useTabBar } from '../src/context/TabBarContext';
import { ReminderService } from '../src/services/reminder.service';
import { Colors } from '../src/theme/colors';
import { Typography } from '../src/theme/typography';
import { Shadows } from '../src/theme/shadows';
import { useReminderStore } from '../src/store/useReminderStore';
import { isReminderActiveOnDate } from '../src/utils/dateHelpers';

export const HistoryScreen: React.FC = () => {
  const { theme } = useTheme();
  const { handleScroll, showTabBar } = useTabBar();
  const reminders = useReminderStore((s) => s.reminders);

  // Date Filter State
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);

  // Pagination & Logs State
  const [page, setPage] = useState(0);
  const [logs, setLogs] = useState<any[]>([]);
  const [hasMore, setHasMore] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);

  // Fetch function
  const fetchLogs = async (pageNum: number, dateFilter: Date | null, isRefreshing = false) => {
    try {
      const dateStr = dateFilter ? format(dateFilter, 'yyyy-MM-dd') : undefined;
      
      const data = await ReminderService.getHistory({
        date: dateStr,
        page: pageNum,
        limit: 10,
      });

      if (dateFilter) {
        // Single day view -> no pagination needed
        setLogs(data);
        setHasMore(false);
      } else {
        if (data.length < 10) setHasMore(false);
        if (pageNum === 0 || isRefreshing) {
          setLogs(data);
        } else {
          setLogs((prev) => [...prev, ...data]);
        }
      }
      setPage(pageNum);
    } catch (err) {
      console.warn('[History] Failed to fetch history logs:', err);
    }
  };

  // Initial load
  useEffect(() => {
    setIsLoading(true);
    fetchLogs(0, selectedDate).finally(() => setIsLoading(false));
  }, [selectedDate]);

  // Pull to refresh
  const handleRefresh = async () => {
    setIsLoading(true);
    setHasMore(true);
    await fetchLogs(0, selectedDate, true);
    setIsLoading(false);
  };

  // On End Reached (Pagination)
  const handleEndReached = async () => {
    if (!loadingMore && hasMore && !selectedDate) {
      setLoadingMore(true);
      await fetchLogs(page + 1, null);
      setLoadingMore(false);
    }
  };

  // Date picker confirm/change
  const onDateChange = (event: DateTimePickerEvent, date?: Date) => {
    setShowDatePicker(Platform.OS === 'ios');
    if (date) {
      setSelectedDate(date);
    }
  };

  // Clear date filter
  const clearDateFilter = () => {
    setSelectedDate(null);
    setHasMore(true);
  };

  // Grouping logs by date
  const groupLogs = () => {
    // 1. Group actual taken logs
    const grouped = logs.reduce((acc: Record<string, any[]>, log) => {
      if (!log.takenAt) return acc;
      try {
        const dateKey = format(new Date(log.takenAt), 'yyyy-MM-dd');
        if (!acc[dateKey]) acc[dateKey] = [];
        acc[dateKey].push(log);
      } catch (err) {
        console.warn('Failed to parse date key:', err);
      }
      return acc;
    }, {});

    // 2. Synthesize pending (untaken) reminders for each date group (and always include Today/Yesterday)
    const datesToCheck = new Set(Object.keys(grouped));
    const todayStr = format(new Date(), 'yyyy-MM-dd');
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = format(yesterday, 'yyyy-MM-dd');

    datesToCheck.add(todayStr);
    datesToCheck.add(yesterdayStr);

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
          // Check if there is already a taken log for this reminder on this date
          const hasLog = (grouped[dateKey] || []).some(
            (log: any) => log.reminderId === reminder.id
          );

          if (!hasLog) {
            if (!grouped[dateKey]) grouped[dateKey] = [];

            const [hours, minutes] = reminder.reminderTime.split(':').map(Number);
            const logDate = new Date(dateObj);
            logDate.setHours(hours, minutes, 0, 0);

            grouped[dateKey].push({
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

    // Sort items within each day by time descending
    Object.keys(grouped).forEach((dateKey) => {
      grouped[dateKey].sort(
        (a: any, b: any) => new Date(b.takenAt).getTime() - new Date(a.takenAt).getTime()
      );
    });

    const getGroupHeader = (dateStr: string) => {
      try {
        const dateObj = new Date(dateStr);
        const todayStr = format(new Date(), 'yyyy-MM-dd');
        if (dateStr === todayStr) return 'Today';

        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = format(yesterday, 'yyyy-MM-dd');
        if (dateStr === yesterdayStr) return 'Yesterday';

        return format(dateObj, 'eee, MMM d');
      } catch (err) {
        return dateStr;
      }
    };

    return Object.entries(grouped).map(([dateStr, items]) => ({
      title: getGroupHeader(dateStr),
      data: items,
    }));
  };

  const sectionsData = groupLogs();

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: theme.background }]} edges={['top']}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: theme.card, borderBottomColor: theme.border }]}>
        <View style={styles.headerLeft}>
          <Text style={[styles.headerTitle, { color: theme.text }]}>History</Text>
          {selectedDate && (
            <View style={[styles.dateBadge, { backgroundColor: theme.primaryLight }]}>
              <Text style={[styles.dateBadgeText, { color: theme.primary }]}>
                {format(selectedDate, 'MMM d')}
              </Text>
              <TouchableOpacity onPress={clearDateFilter} style={styles.clearBtn}>
                <Ionicons name="close-circle" size={16} color={theme.primary} />
              </TouchableOpacity>
            </View>
          )}
        </View>
        <TouchableOpacity
          style={[styles.calendarBtn, { borderColor: theme.primary, backgroundColor: theme.card }]}
          onPress={() => setShowDatePicker(true)}
        >
          <Ionicons name="calendar-outline" size={20} color={theme.primary} />
        </TouchableOpacity>
      </View>

      {/* Date Picker Modal */}
      {showDatePicker && (
        <DateTimePicker
          value={selectedDate || new Date()}
          mode="date"
          display="default"
          onChange={onDateChange}
          maximumDate={new Date()}
        />
      )}

      {/* SectionList of Logs */}
      {isLoading && logs.length === 0 ? (
        <View style={[styles.loadingContainer, { backgroundColor: theme.background }]}>
          <ActivityIndicator color={theme.primary} size="large" />
        </View>
      ) : logs.length === 0 ? (
        <View style={[styles.emptyContainer, { backgroundColor: theme.background }]}>
          <Ionicons name="document-text-outline" size={56} color={theme.textMuted} />
          <Text style={[styles.emptyTitle, { color: theme.text }]}>No history found</Text>
          <Text style={[styles.emptySubtitle, { color: theme.textMuted }]}>Medicines you take will appear here</Text>
        </View>
      ) : (
        <SectionList
          sections={sectionsData}
          keyExtractor={(item) => item.id}
          onScroll={handleScroll}
          scrollEventThrottle={16}
          onScrollEndDrag={showTabBar}
          onMomentumScrollEnd={showTabBar}
          renderItem={({ item }) => {
            const medicineInitial = item.medicineName ? item.medicineName[0].toUpperCase() : 'M';
            let timeStr = '';
            try {
              timeStr = format(new Date(item.takenAt), 'h:mm a');
            } catch (err) {
              timeStr = item.takenAt;
            }

            return (
              <View style={[styles.row, { backgroundColor: theme.card, borderBottomColor: theme.border }]}>
                <View style={styles.rowLeft}>
                  <View style={[styles.avatar, { backgroundColor: theme.primaryLight }]}>
                    <Text style={[styles.avatarText, { color: theme.primary }]}>
                      {medicineInitial}
                    </Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.medName, { color: theme.text }]}>{item.medicineName}</Text>
                    <Text style={[styles.timeText, { color: theme.textMuted }]}>
                      {timeStr} • {item.dosage || '1 tablet'}
                    </Text>
                  </View>
                </View>

                {item.takenVia === 'swipe' && (
                  <View style={[styles.badge, styles.badgeSwipe]}>
                    <Text style={styles.badgeTextSwipe}>Swiped</Text>
                  </View>
                )}
                {item.takenVia === 'alarm_dismiss' && (
                  <View style={[styles.badge, { backgroundColor: theme.primaryLight }]}>
                    <Text style={[styles.badgeTextAlarm, { color: theme.primary }]}>Alarm</Text>
                  </View>
                )}
                {item.takenVia === 'manual' && (
                  <View style={[styles.badge, styles.badgeManual]}>
                    <Text style={styles.badgeTextManual}>Manual</Text>
                  </View>
                )}
                {item.takenVia === 'pending' && (
                  <View style={[styles.badge, styles.badgePending]}>
                    <Text style={styles.badgeTextPending}>Pending</Text>
                  </View>
                )}
              </View>
            );
          }}
          renderSectionHeader={({ section: { title } }) => (
            <View style={[styles.sectionHeader, { backgroundColor: theme.background, borderBottomColor: theme.border }]}>
              <Text style={[styles.sectionTitle, { color: theme.textMuted }]}>{title}</Text>
            </View>
          )}
          refreshControl={
            <RefreshControl
              refreshing={isLoading && logs.length > 0}
              onRefresh={handleRefresh}
              tintColor={theme.primary}
              colors={[theme.primary]}
            />
          }
          onEndReached={handleEndReached}
          onEndReachedThreshold={0.3}
          ListFooterComponent={() => {
            if (loadingMore) {
              return (
                <View style={styles.footerLoader}>
                  <ActivityIndicator color={theme.primary} size="small" />
                </View>
              );
            }
            if (!hasMore && logs.length > 0) {
              return (
                <Text style={[styles.endText, { color: theme.textMuted }]}>You've reached the end</Text>
              );
            }
            return null;
          }}
          contentContainerStyle={styles.listContent}
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  headerTitle: {
    fontFamily: Typography.fontFamily.bold,
    fontSize: 22,
  },
  dateBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    gap: 4,
  },
  dateBadgeText: {
    fontFamily: Typography.fontFamily.semibold,
    fontSize: 12,
  },
  clearBtn: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  calendarBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    borderWidth: 1.5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  emptyTitle: {
    fontFamily: Typography.fontFamily.bold,
    fontSize: 16,
    marginTop: 16,
    marginBottom: 6,
  },
  emptySubtitle: {
    fontFamily: Typography.fontFamily.regular,
    fontSize: 13,
    textAlign: 'center',
  },
  listContent: {
    paddingBottom: 100,
  },
  sectionHeader: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
  },
  sectionTitle: {
    fontFamily: Typography.fontFamily.semibold,
    fontSize: 13,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  rowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontFamily: Typography.fontFamily.bold,
    fontSize: 16,
  },
  medName: {
    fontFamily: Typography.fontFamily.semibold,
    fontSize: 14,
    marginBottom: 2,
  },
  timeText: {
    fontFamily: Typography.fontFamily.regular,
    fontSize: 12,
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 999,
  },
  badgeSwipe: {
    backgroundColor: '#f1f5f9',
  },
  badgeManual: {
    backgroundColor: '#eff6ff',
  },
  badgeTextSwipe: {
    fontFamily: Typography.fontFamily.semibold,
    fontSize: 11,
    color: '#475569',
  },
  badgeTextAlarm: {
    fontFamily: Typography.fontFamily.semibold,
    fontSize: 11,
  },
  badgeTextManual: {
    fontFamily: Typography.fontFamily.semibold,
    fontSize: 11,
    color: '#1d4ed8',
  },
  badgePending: {
    backgroundColor: '#fee2e2',
  },
  badgeTextPending: {
    fontFamily: Typography.fontFamily.semibold,
    fontSize: 11,
    color: '#ef4444',
  },
  footerLoader: {
    paddingVertical: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  endText: {
    fontFamily: Typography.fontFamily.medium,
    fontSize: 13,
    textAlign: 'center',
    paddingVertical: 24,
  },
});
