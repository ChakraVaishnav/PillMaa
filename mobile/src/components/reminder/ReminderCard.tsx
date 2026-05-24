// src/components/reminder/ReminderCard.tsx
import React, { useRef } from 'react';
import { Feather, MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import Swipeable from 'react-native-gesture-handler/Swipeable';
import { Colors } from '../../theme/colors';
import { Typography } from '../../theme/typography';
import { Shadows } from '../../theme/shadows';
import { Badge } from '../ui/Badge';
import { formatReminderTime, formatRepeatInfo } from '../../utils/dateHelpers';
import type { Reminder } from '../../types';
import { useTheme } from '../../context/ThemeContext';

interface ReminderCardProps {
  reminder: Reminder;
  onDelete: (id: string) => void;
  onMarkTaken: (id: string) => void;
  onPress: (reminder: Reminder) => void;
}

export const ReminderCard: React.FC<ReminderCardProps> = ({
  reminder,
  onDelete,
  onMarkTaken,
  onPress,
}) => {
  const swipeableRef = useRef<Swipeable>(null);
  const isCompleted = reminder.isCompleted;
  const { theme } = useTheme();

  const renderLeftActions = () => (
    <View style={styles.leftActionContainer}>
      <Ionicons
        name={isCompleted ? "arrow-undo-outline" : "checkmark-done-outline"}
        size={24}
        color={isCompleted ? "#ea580c" : theme.primary}
      />
    </View>
  );

  const renderRightActions = () => (
    <View style={styles.rightActionContainer}>
      <Ionicons name="trash-outline" size={24} color="#dc2626" />
    </View>
  );

  return (
    <View style={styles.shadowWrapper}>
      <Swipeable
        ref={swipeableRef}
        renderLeftActions={renderLeftActions}
        renderRightActions={renderRightActions}
        onSwipeableOpen={(direction) => {
          if (direction === 'left') {
            // Swiped right -> revealed left actions (Mark Taken)
            onMarkTaken(reminder.id);
          } else if (direction === 'right') {
            // Swiped left -> revealed right actions (Delete)
            onDelete(reminder.id);
          }
          // Auto-close swipeable after firing trigger
          swipeableRef.current?.close();
          setTimeout(() => {
            swipeableRef.current?.close();
          }, 150);
        }}
        containerStyle={styles.swipeableContainer}
        childrenContainerStyle={styles.swipeableChildren}
      >
        <View style={[
          styles.card, 
          { backgroundColor: theme.card, borderColor: theme.border },
          { borderLeftColor: isCompleted ? theme.primaryLight : theme.primary }
        ]}>
          <TouchableOpacity
            style={styles.cardInner}
            onPress={() => onPress(reminder)}
            activeOpacity={0.9}
          >
            {/* Left — Medicine pill icon */}
            <View style={[
              styles.pillIcon, 
              isCompleted 
                ? { backgroundColor: theme.background, borderColor: theme.border } 
                : { backgroundColor: theme.primaryLight, borderColor: theme.primary }
            ]}>
              <MaterialCommunityIcons
                name="pill"
                size={24}
                color={isCompleted ? theme.textMuted : theme.primary}
              />
            </View>

            {/* Center — Medicine info */}
            <View style={styles.info}>
              <View style={styles.nameRow}>
                <Text
                  style={[styles.medicineName, { color: theme.text }, isCompleted && styles.completedText]}
                  numberOfLines={1}
                >
                  {reminder.medicineName}
                </Text>
                {isCompleted && <Badge label="Taken" variant="success" dot />}
              </View>

              <Text style={[styles.dosage, { color: theme.textMuted }]}>{reminder.dosage}</Text>

              <View style={styles.metaRow}>
                <Feather name="clock" size={12} color={theme.textMuted} style={{ marginRight: 2 }} />
                <Text style={[styles.meta, { color: theme.textMuted }]}>
                  {formatReminderTime(reminder.reminderTime)}
                </Text>
                <View style={[styles.dot, { backgroundColor: theme.border }]} />
                <Text style={[styles.meta, { color: theme.textMuted }]}>
                  {formatRepeatInfo(reminder.repeatType, reminder.repeatDays)}
                </Text>
              </View>
            </View>

            {/* Right — Snooze info */}
            {reminder.snoozeCount > 0 && !isCompleted && (
              <View style={styles.snoozeInfo}>
                <Text style={[styles.snoozeCount, { color: theme.primary }]}>{reminder.snoozeCount}x</Text>
                <Text style={[styles.snoozeLabel, { color: theme.textMuted }]}>snooze</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      </Swipeable>
    </View>
  );
};

const styles = StyleSheet.create({
  swipeableContainer: {
    backgroundColor: 'transparent',
    borderRadius: 16,
    overflow: 'hidden',
  },
  swipeableChildren: {
    borderRadius: 16,
  },
  shadowWrapper: {
    ...Shadows.card,
    borderRadius: 16,
    backgroundColor: 'transparent',
    marginBottom: 12,
  },
  leftActionContainer: {
    flex: 1,
    backgroundColor: 'transparent',
    justifyContent: 'center',
    alignItems: 'flex-start',
    paddingHorizontal: 24,
    borderRadius: 16,
  },
  rightActionContainer: {
    flex: 1,
    backgroundColor: 'transparent',
    justifyContent: 'center',
    alignItems: 'flex-end',
    paddingHorizontal: 24,
    borderRadius: 16,
  },
  card: {
    backgroundColor: Colors.surface,
    borderRadius:    16,
    borderWidth:     1,
    borderColor:     Colors.border,
    borderLeftWidth: 4, // Left colored border accent
    overflow: 'hidden',
  },
  cardInner: {
    flexDirection: 'row',
    alignItems:    'center',
    padding:       16,
    gap:           14,
  },
  pillIcon: {
    width:           52,
    height:          52,
    borderRadius:    14,
    backgroundColor: Colors.primary[50],
    alignItems:      'center',
    justifyContent:  'center',
    borderWidth:     1.5,
    borderColor:     Colors.primary[100],
  },
  info: {
    flex: 1,
    gap:  4,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems:    'center',
    gap:           8,
    flexWrap:      'wrap',
  },
  medicineName: {
    fontFamily: Typography.fontFamily.semibold,
    fontSize:   15,
    color:      Colors.textPrimary,
    flex:       1,
  },
  completedText: {
    textDecorationLine: 'line-through',
    color:              '#9ca3af',
  },
  dosage: {
    fontFamily: Typography.fontFamily.regular,
    fontSize:   13,
    color:      '#6b7280',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems:    'center',
    gap:           6,
    marginTop:     2,
  },
  meta: {
    fontFamily: Typography.fontFamily.regular,
    fontSize:   Typography.fontSize.xs,
    color:      Colors.textTertiary,
  },
  dot: {
    width:        3,
    height:       3,
    borderRadius: 1.5,
    backgroundColor: Colors.neutral[300],
  },
  snoozeInfo: {
    alignItems: 'center',
    gap:        2,
  },
  snoozeCount: {
    fontFamily: Typography.fontFamily.bold,
    fontSize:   Typography.fontSize.base,
    color:      Colors.primary[600],
  },
  snoozeLabel: {
    fontFamily: Typography.fontFamily.regular,
    fontSize:   Typography.fontSize.xs,
    color:      Colors.textTertiary,
  },
});
