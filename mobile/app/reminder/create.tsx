// app/reminder/create.tsx
import React, { useState } from 'react';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Input } from '../../src/components/ui/Input';
import { Button } from '../../src/components/ui/Button';
import { Card } from '../../src/components/ui/Card';
import { DaySelector } from '../../src/components/reminder/DaySelector';
import { TimePickerModal } from '../../src/components/reminder/TimePickerModal';
import { Colors } from '../../src/theme/colors';
import { Typography } from '../../src/theme/typography';
import { REPEAT_TYPES, DEFAULT_SNOOZE_COUNT, DEFAULT_SNOOZE_INTERVAL } from '../../src/constants';
import { useCreateReminder } from '../../src/hooks/useReminders';
import { scheduleReminderNotification } from '../../src/utils/notifications';
import { formatReminderTime } from '../../src/utils/dateHelpers';
import type { RepeatDay, RepeatType } from '../../src/types';
import { useTheme } from '../../src/context/ThemeContext';


const schema = z.object({
  medicineName:   z.string().min(1, 'Medicine name is required'),
  dosage:         z.string().optional().or(z.literal('')),
  reminderTime:   z.string().min(1, 'Time is required'),
  repeatType:     z.enum(['DAILY', 'CUSTOM', 'TODAY_ONLY']),
  repeatDays:     z.array(z.string()).default([]),
  snoozeCount:    z.number().min(0).max(10),
  snoozeInterval: z.number().min(1).max(60),
});

type FormData = z.infer<typeof schema>;

function RepeatTypePicker({ value, onChange }: { value: RepeatType; onChange: (v: RepeatType) => void }) {
  const { theme } = useTheme();
  return (
    <View style={styles.repeatRow}>
      {REPEAT_TYPES.map((type) => (
        <TouchableOpacity
          key={type.key}
          style={[styles.repeatChip, value === type.key && { backgroundColor: theme.primaryLight, borderColor: theme.primary }]}
          onPress={() => onChange(type.key as RepeatType)}
        >
          <Feather
            name={type.icon as any}
            size={18}
            color={value === type.key ? theme.primary : Colors.textSecondary}
          />
          <Text style={[styles.repeatChipLabel, value === type.key && { color: theme.primary, fontFamily: Typography.fontFamily.semibold }]}>
            {type.label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

export default function CreateReminderScreen() {
  const { theme } = useTheme();
  const router = useRouter();
  const { mutateAsync: createReminder, isPending } = useCreateReminder();
  const [showTimePicker, setShowTimePicker] = useState(false);

  const { control, handleSubmit, watch, setValue, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      medicineName:   '',
      dosage:         '',
      reminderTime:   '08:00',
      repeatType:     'DAILY',
      repeatDays:     [],
      snoozeCount:    DEFAULT_SNOOZE_COUNT,
      snoozeInterval: DEFAULT_SNOOZE_INTERVAL,
    },
  });

  const repeatType = watch('repeatType');
  const reminderTime = watch('reminderTime');
  const snoozeCount = watch('snoozeCount');
  const snoozeInterval = watch('snoozeInterval');

  const onSubmit = async (data: FormData) => {
    try {
      const reminder = await createReminder({
        ...data,
        dosage: data.dosage && data.dosage.trim() !== '' ? data.dosage : '1 tablet',
        repeatType: data.repeatType as RepeatType,
        repeatDays: data.repeatDays as RepeatDay[],
        startDate: new Date().toISOString(),
        snoozeCount: data.snoozeCount,
        snoozeInterval: data.snoozeInterval,
      });

      // Schedule local notification
      try {
        await scheduleReminderNotification(reminder as any);
      } catch (err) {
        console.warn('[Notification] Could not schedule:', err);
      }

      router.back();
    } catch (error: any) {
      Alert.alert('Error', error?.message ?? 'Failed to create reminder');
    }
  };

  return (
    <View style={styles.root}>
      <SafeAreaView style={styles.safeArea}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{ flex: 1 }}
        >
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
              <Text style={styles.backIcon}>✕</Text>
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Add Reminder</Text>
            <View style={{ width: 40 }} />
          </View>

          <ScrollView
            contentContainerStyle={styles.scroll}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {/* Medicine Details */}
            <Animated.View entering={FadeInDown.delay(50)}>
              <Card style={styles.formSection}>
                <View style={styles.sectionHeader}>
                  <MaterialCommunityIcons name="pill" size={20} color={Colors.primary[600]} />
                  <Text style={styles.sectionTitle}>Medicine Details</Text>
                </View>

                <Controller
                  control={control}
                  name="medicineName"
                  render={({ field: { value, onChange, onBlur } }) => (
                    <Input
                      label="Medicine Name"
                      value={value}
                      onChangeText={onChange}
                      onBlur={onBlur}
                      error={errors.medicineName?.message}
                      autoCapitalize="words"
                    />
                  )}
                />
                <Controller
                  control={control}
                  name="dosage"
                  render={({ field: { value, onChange, onBlur } }) => (
                    <Input
                      label="Dosage"
                      placeholder="e.g. 1 tablet, 500mg"
                      value={value}
                      onChangeText={onChange}
                      onBlur={onBlur}
                      error={errors.dosage?.message}
                    />
                  )}
                />
              </Card>
            </Animated.View>

            {/* Time */}
            <Animated.View entering={FadeInDown.delay(100)}>
              <Card style={styles.formSection}>
                <View style={styles.sectionHeader}>
                  <Feather name="clock" size={20} color={Colors.primary[600]} />
                  <Text style={styles.sectionTitle}>Reminder Time</Text>
                </View>

                <TouchableOpacity
                  style={styles.timePicker}
                  onPress={() => setShowTimePicker(true)}
                >
                  <Text style={styles.timePickerLabel}>Time</Text>
                  <Text style={[styles.timePickerValue, { color: theme.primary }]}>
                    {formatReminderTime(reminderTime)}
                  </Text>
                  <Text style={styles.timePickerChevron}>›</Text>
                </TouchableOpacity>
              </Card>
            </Animated.View>

            {/* Repeat */}
            <Animated.View entering={FadeInDown.delay(150)}>
              <Card style={styles.formSection}>
                <View style={styles.sectionHeader}>
                  <Feather name="repeat" size={20} color={Colors.primary[600]} />
                  <Text style={styles.sectionTitle}>Repeat</Text>
                </View>

                <Controller
                  control={control}
                  name="repeatType"
                  render={({ field: { value, onChange } }) => (
                    <RepeatTypePicker value={value as RepeatType} onChange={onChange} />
                  )}
                />

                {repeatType === 'CUSTOM' && (
                  <View style={styles.daysSection}>
                    <Text style={styles.fieldLabel}>Select Days</Text>
                    <Controller
                      control={control}
                      name="repeatDays"
                      render={({ field: { value, onChange } }) => (
                        <DaySelector
                          selected={value as RepeatDay[]}
                          onChange={onChange as any}
                        />
                      )}
                    />
                  </View>
                )}
              </Card>
            </Animated.View>

            {/* Snooze Settings */}
            <Animated.View entering={FadeInDown.delay(200)}>
              <Card style={styles.formSection}>
                <View style={styles.sectionHeader}>
                  <Feather name="bell" size={20} color={Colors.primary[600]} />
                  <Text style={styles.sectionTitle}>Snooze Settings</Text>
                </View>

                <View style={styles.snoozeRow}>
                  <View style={styles.snoozeItem}>
                    <Text style={styles.fieldLabel}>Snooze Count</Text>
                    <View style={styles.stepper}>
                      <TouchableOpacity
                        style={[styles.stepperBtn, { backgroundColor: theme.primaryLight }]}
                        onPress={() => setValue('snoozeCount', Math.max(0, snoozeCount - 1))}
                      >
                        <Text style={[styles.stepperBtnText, { color: theme.primary }]}>−</Text>
                      </TouchableOpacity>
                      <Text style={styles.stepperValue}>{snoozeCount}x</Text>
                      <TouchableOpacity
                        style={[styles.stepperBtn, { backgroundColor: theme.primaryLight }]}
                        onPress={() => setValue('snoozeCount', Math.min(10, snoozeCount + 1))}
                      >
                        <Text style={[styles.stepperBtnText, { color: theme.primary }]}>+</Text>
                      </TouchableOpacity>
                    </View>
                  </View>

                  <View style={styles.snoozeItem}>
                    <Text style={styles.fieldLabel}>Interval (mins)</Text>
                    <View style={styles.stepper}>
                      <TouchableOpacity
                        style={[styles.stepperBtn, { backgroundColor: theme.primaryLight }]}
                        onPress={() => setValue('snoozeInterval', Math.max(1, snoozeInterval - 1))}
                      >
                        <Text style={[styles.stepperBtnText, { color: theme.primary }]}>−</Text>
                      </TouchableOpacity>
                      <Text style={styles.stepperValue}>{snoozeInterval}m</Text>
                      <TouchableOpacity
                        style={[styles.stepperBtn, { backgroundColor: theme.primaryLight }]}
                        onPress={() => setValue('snoozeInterval', Math.min(60, snoozeInterval + 1))}
                      >
                        <Text style={[styles.stepperBtnText, { color: theme.primary }]}>+</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>

                <View style={styles.snoozeHintRow}>
                  <Feather name="info" size={14} color={Colors.textTertiary} style={{ marginTop: 2 }} />
                  <Text style={styles.snoozeHint}>
                    Alarm will repeat up to {snoozeCount} time{snoozeCount !== 1 ? 's' : ''}, every {snoozeInterval} minute{snoozeInterval !== 1 ? 's' : ''}
                  </Text>
                </View>
              </Card>
            </Animated.View>

            <Animated.View entering={FadeInDown.delay(250)} style={styles.submitSection}>
              <Button
                title="Save Reminder"
                onPress={handleSubmit(onSubmit)}
                isLoading={isPending}
                fullWidth
                size="lg"
                style={{ backgroundColor: theme.primary }}
              />
            </Animated.View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>

      <TimePickerModal
        visible={showTimePicker}
        value={reminderTime}
        onConfirm={(time) => setValue('reminderTime', time)}
        onClose={() => setShowTimePicker(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },
  safeArea: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    backgroundColor: Colors.surface,
  },
  backBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: Colors.neutral[100],
    alignItems: 'center', justifyContent: 'center',
  },
  backIcon: {
    fontFamily: Typography.fontFamily.medium,
    fontSize: Typography.fontSize.base,
    color: Colors.textSecondary,
  },
  headerTitle: {
    fontFamily: Typography.fontFamily.bold,
    fontSize: Typography.fontSize.lg,
    color: Colors.textPrimary,
  },
  scroll: { padding: 20, gap: 12, paddingBottom: 40 },
  formSection: { gap: 14 },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  sectionTitle: {
    fontFamily: Typography.fontFamily.semibold,
    fontSize: Typography.fontSize.base,
    color: Colors.textPrimary,
  },
  fieldLabel: {
    fontFamily: Typography.fontFamily.medium,
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
    marginBottom: 8,
    letterSpacing: 0.2,
  },
  timePicker: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.neutral[50],
    borderRadius: 14,
    padding: 16,
    borderWidth: 1.5,
    borderColor: Colors.border,
  },
  timePickerLabel: {
    fontFamily: Typography.fontFamily.medium,
    fontSize: Typography.fontSize.base,
    color: Colors.textSecondary,
    flex: 1,
  },
  timePickerValue: {
    fontFamily: Typography.fontFamily.bold,
    fontSize: Typography.fontSize.xl,
    color: Colors.primary[600],
    marginRight: 8,
  },
  timePickerChevron: {
    fontFamily: Typography.fontFamily.bold,
    fontSize: Typography.fontSize.xl,
    color: Colors.textTertiary,
  },
  repeatRow: {
    gap: 8,
  },
  repeatChip: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 14,
    backgroundColor: Colors.neutral[50],
    borderWidth: 1.5,
    borderColor: Colors.neutral[200],
    gap: 10,
  },
  repeatChipSelected: {
    backgroundColor: '#EAF5EF',
    borderColor:     '#1a7a4a',
  },
  repeatChipEmoji: { fontSize: 18 },
  repeatChipLabel: {
    fontFamily: Typography.fontFamily.medium,
    fontSize: Typography.fontSize.base,
    color: Colors.textSecondary,
  },
  repeatChipLabelSelected: {
    color: '#1a7a4a',
    fontFamily: Typography.fontFamily.semibold,
  },
  daysSection: { paddingTop: 4 },
  snoozeRow: {
    flexDirection: 'row',
    gap: 16,
  },
  snoozeItem: { flex: 1 },
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.neutral[50],
    borderRadius: 12,
    padding: 8,
    borderWidth: 1.5,
    borderColor: Colors.border,
  },
  stepperBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: '#EAF5EF',
    alignItems: 'center', justifyContent: 'center',
  },
  stepperBtnText: {
    fontFamily: Typography.fontFamily.bold,
    fontSize: Typography.fontSize.lg,
    color: '#1a7a4a',
  },
  stepperValue: {
    fontFamily: Typography.fontFamily.bold,
    fontSize: Typography.fontSize.base,
    color: Colors.textPrimary,
    minWidth: 36,
    textAlign: 'center',
  },
  snoozeHintRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
    marginTop: 4,
  },
  snoozeHint: {
    fontFamily: Typography.fontFamily.regular,
    fontSize:   Typography.fontSize.xs,
    color:      Colors.textTertiary,
    lineHeight: 18,
    flex: 1,
  },
  submitSection: { marginTop: 8 },
});
