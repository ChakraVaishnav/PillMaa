// src/store/useReminderStore.ts
import { create } from 'zustand';
import type { Reminder } from '../types';

interface ReminderStore {
  reminders: Reminder[];
  selectedReminder: Reminder | null;
  deletedTodayIds: Record<string, string>; // Maps reminderId -> dateStr

  // Actions
  setReminders: (reminders: Reminder[]) => void;
  addReminder: (reminder: Reminder) => void;
  updateReminder: (id: string, data: Partial<Reminder>) => void;
  removeReminder: (id: string) => void;
  setSelectedReminder: (reminder: Reminder | null) => void;
  markComplete: (id: string) => void;
  deleteForToday: (id: string, dateStr: string) => void;
  reset: () => void;
}

const initialState = {
  reminders: [],
  selectedReminder: null,
  deletedTodayIds: {},
};

export const useReminderStore = create<ReminderStore>((set) => ({
  ...initialState,

  setReminders: (reminders) => set({ reminders }),

  addReminder: (reminder) =>
    set((state) => ({
      reminders: [reminder, ...state.reminders],
    })),

  updateReminder: (id, data) =>
    set((state) => ({
      reminders: state.reminders.map((r) =>
        r.id === id ? { ...r, ...data } : r
      ),
    })),

  removeReminder: (id) =>
    set((state) => ({
      reminders: state.reminders.filter((r) => r.id !== id),
    })),

  setSelectedReminder: (reminder) => set({ selectedReminder: reminder }),

  markComplete: (id) =>
    set((state) => ({
      reminders: state.reminders.map((r) =>
        r.id === id ? { ...r, isCompleted: true } : r
      ),
    })),

  deleteForToday: (id, dateStr) =>
    set((state) => ({
      deletedTodayIds: { ...state.deletedTodayIds, [id]: dateStr },
    })),

  reset: () => set(initialState),
}));
