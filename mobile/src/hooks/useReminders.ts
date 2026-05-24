// src/hooks/useReminders.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ReminderService } from '../services/reminder.service';
import { useReminderStore } from '../store/useReminderStore';
import { rescheduleAllReminders } from '../utils/notifications';
import type { Reminder, CreateReminderPayload, UpdateReminderPayload } from '../types';
import { format } from 'date-fns';

const REMINDERS_KEY = ['reminders'] as const;

// Track whether we've done the first reschedule this session
let hasRescheduledThisSession = false;

export function useReminders() {
  const setReminders = useReminderStore((s) => s.setReminders);

  return useQuery({
    queryKey: REMINDERS_KEY,
    queryFn: async () => {
      const reminders = await ReminderService.getAll();
      setReminders(reminders);

      // On the FIRST fetch each session, reschedule all local notifications.
      // This restores notifications after reinstall, OS reboot, or clearing.
      if (!hasRescheduledThisSession && reminders.length > 0) {
        hasRescheduledThisSession = true;
        rescheduleAllReminders(reminders).catch((err) =>
          console.warn('[useReminders] Reschedule failed:', err)
        );
      }

      return reminders;
    },
  });
}

export function useTodayReminders() {
  const { data: reminders = [] } = useReminders();
  const deletedTodayIds = useReminderStore((s) => s.deletedTodayIds);

  const todayDateStr = format(new Date(), 'yyyy-MM-dd');

  // Filter for reminders active today
  const today = new Date().getDay();
  const dayMap: Record<number, string> = {
    0: 'SUN', 1: 'MON', 2: 'TUE',
    3: 'WED', 4: 'THU', 5: 'FRI', 6: 'SAT',
  };
  const todayKey = dayMap[today];

  return reminders.filter((r) => {
    // If deleted for today, exclude it
    if (deletedTodayIds[r.id] === todayDateStr) {
      return false;
    }
    if (r.repeatType === 'DAILY') return true;
    if (r.repeatType === 'TODAY_ONLY') return true;
    if (r.repeatType === 'CUSTOM') return r.repeatDays.includes(todayKey as any);
    return false;
  });
}

export function useCreateReminder() {
  const qc = useQueryClient();
  const addReminder = useReminderStore((s) => s.addReminder);

  return useMutation({
    mutationFn: (payload: CreateReminderPayload) => ReminderService.create(payload),
    onSuccess: (newReminder) => {
      addReminder(newReminder);
      qc.invalidateQueries({ queryKey: REMINDERS_KEY });
    },
  });
}

export function useUpdateReminder() {
  const qc = useQueryClient();
  const updateReminder = useReminderStore((s) => s.updateReminder);

  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateReminderPayload }) =>
      ReminderService.update(id, payload),
    onSuccess: (updated) => {
      updateReminder(updated.id, updated);
      qc.invalidateQueries({ queryKey: REMINDERS_KEY });
    },
  });
}

export function useMarkComplete() {
  const qc = useQueryClient();
  const markComplete = useReminderStore((s) => s.markComplete);

  return useMutation({
    mutationFn: (payload: { id: string; takenVia: 'swipe' | 'alarm_dismiss' | 'manual' }) => 
      ReminderService.markComplete(payload.id, payload.takenVia),
    onMutate: async (payload) => {
      // Cancel outgoing refetches to prevent overwriting
      await qc.cancelQueries({ queryKey: REMINDERS_KEY });

      // Snapshot previous value
      const previousReminders = qc.getQueryData<Reminder[]>(REMINDERS_KEY);

      // Optimistically update query cache
      if (previousReminders) {
        qc.setQueryData<Reminder[]>(
          REMINDERS_KEY,
          previousReminders.map((r) => 
            r.id === payload.id ? { ...r, isCompleted: true } : r
          )
        );
      }

      // Update local store
      markComplete(payload.id);

      return { previousReminders, id: payload.id };
    },
    onError: (_, __, context) => {
      // Rollback on error
      if (context?.previousReminders) {
        qc.setQueryData(REMINDERS_KEY, context.previousReminders);
      }
      if (context?.id) {
        useReminderStore.getState().updateReminder(context.id, { isCompleted: false });
      }
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: REMINDERS_KEY });
      qc.invalidateQueries({ queryKey: ['history'] });
      qc.invalidateQueries({ queryKey: ['streak'] });
    },
  });
}

export function useDeleteReminder() {
  const qc = useQueryClient();
  const removeReminder = useReminderStore((s) => s.removeReminder);

  return useMutation({
    mutationFn: (id: string) => ReminderService.delete(id),
    onMutate: async (id) => {
      await qc.cancelQueries({ queryKey: REMINDERS_KEY });
      const previousReminders = qc.getQueryData<Reminder[]>(REMINDERS_KEY);

      // Optimistically remove from query cache
      if (previousReminders) {
        qc.setQueryData<Reminder[]>(
          REMINDERS_KEY,
          previousReminders.filter((r) => r.id !== id)
        );
      }

      removeReminder(id);

      return { previousReminders };
    },
    onError: (_, __, context) => {
      if (context?.previousReminders) {
        qc.setQueryData(REMINDERS_KEY, context.previousReminders);
      }
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: REMINDERS_KEY });
      qc.invalidateQueries({ queryKey: ['history'] });
      qc.invalidateQueries({ queryKey: ['streak'] });
    },
  });
}

export function useHistory() {
  return useQuery({
    queryKey: ['history'],
    queryFn: () => ReminderService.getHistory(),
  });
}

export function useStreak() {
  return useQuery({
    queryKey: ['streak'],
    queryFn: () => ReminderService.getStreak(),
  });
}
