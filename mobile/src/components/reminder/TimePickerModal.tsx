// src/components/reminder/TimePickerModal.tsx
import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  FlatList,
} from 'react-native';
import { Colors } from '../../theme/colors';
import { Typography } from '../../theme/typography';
import { Button } from '../ui/Button';
import { useTheme } from '../../context/ThemeContext';

interface TimePickerModalProps {
  visible: boolean;
  value: string; // "HH:MM"
  onConfirm: (time: string) => void;
  onClose: () => void;
}

const HOURS = Array.from({ length: 24 }, (_, i) => i);
const MINUTES = Array.from({ length: 12 }, (_, i) => i * 5); // [0, 5, 10, ... 55]

export const TimePickerModal: React.FC<TimePickerModalProps> = ({
  visible,
  value,
  onConfirm,
  onClose,
}) => {
  const [selectedHour, setSelectedHour] = useState(8);
  const [selectedMinute, setSelectedMinute] = useState(0);
  const { theme } = useTheme();

  const hourListRef = useRef<FlatList>(null);
  const minuteListRef = useRef<FlatList>(null);

  useEffect(() => {
    if (visible) {
      const parts = value?.split(':') ?? ['08', '00'];
      const h = parseInt(parts[0] ?? '8', 10);
      const rawMin = parseInt(parts[1] ?? '0', 10);
      const m = Math.round(rawMin / 5) * 5;
      
      setSelectedHour(h);
      setSelectedMinute(m >= 60 ? 55 : m);

      const hourIndex = HOURS.indexOf(h);
      const minuteIndex = MINUTES.indexOf(m >= 60 ? 55 : m);

      setTimeout(() => {
        try {
          if (hourIndex !== -1) {
            hourListRef.current?.scrollToIndex({ index: hourIndex, animated: true, viewPosition: 0.5 });
          }
        } catch (e) {}
        try {
          if (minuteIndex !== -1) {
            minuteListRef.current?.scrollToIndex({ index: minuteIndex, animated: true, viewPosition: 0.5 });
          }
        } catch (e) {}
      }, 150);
    }
  }, [visible, value]);

  const formatHour = (h: number) => {
    const period = h < 12 ? 'AM' : 'PM';
    const displayH = h === 0 ? 12 : h > 12 ? h - 12 : h;
    return { display: displayH.toString().padStart(2, '0'), period };
  };

  const handleConfirm = () => {
    const timeStr = `${selectedHour.toString().padStart(2, '0')}:${selectedMinute.toString().padStart(2, '0')}`;
    onConfirm(timeStr);
    onClose();
  };

  const { display: hourDisplay, period } = formatHour(selectedHour);
  const minuteDisplay = selectedMinute.toString().padStart(2, '0');

  const getItemLayout = (_data: any, index: number) => ({
    length: 64, // item width 56 + gap 8
    offset: 64 * index,
    index,
  });

  const renderHourItem = ({ item: h }: { item: number }) => {
    const { display, period: p } = formatHour(h);
    const isSelected = h === selectedHour;
    return (
      <TouchableOpacity
        style={[styles.pickerItem, isSelected && { backgroundColor: theme.primary, borderColor: theme.primary }]}
        onPress={() => setSelectedHour(h)}
        activeOpacity={0.8}
      >
        <Text style={[styles.pickerItemText, isSelected && styles.pickerItemTextSelected]}>
          {display}
        </Text>
        <Text style={[styles.pickerItemSub, isSelected && styles.pickerItemSubSelected]}>
          {p}
        </Text>
      </TouchableOpacity>
    );
  };

  const renderMinuteItem = ({ item: m }: { item: number }) => {
    const isSelected = m === selectedMinute;
    return (
      <TouchableOpacity
        style={[styles.pickerItem, isSelected && { backgroundColor: theme.primary, borderColor: theme.primary }]}
        onPress={() => setSelectedMinute(m)}
        activeOpacity={0.8}
      >
        <Text style={[styles.pickerItemText, isSelected && styles.pickerItemTextSelected]}>
          :{m.toString().padStart(2, '0')}
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Select Time</Text>
          </View>

          {/* Time Display */}
          <View style={styles.timeDisplay}>
            <Text style={[styles.timeText, { color: theme.primary }]}>
              {hourDisplay}:{minuteDisplay}
            </Text>
            <Text style={styles.periodText}>{period}</Text>
          </View>

          {/* Hour Picker */}
          <Text style={styles.pickerLabel}>Hour</Text>
          <FlatList
            ref={hourListRef}
            data={HOURS}
            renderItem={renderHourItem}
            keyExtractor={(item) => item.toString()}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.pickerRow}
            getItemLayout={getItemLayout}
            onScrollToIndexFailed={(info) => {
              setTimeout(() => {
                try {
                  hourListRef.current?.scrollToIndex({ index: info.index, animated: false, viewPosition: 0.5 });
                } catch (e) {}
              }, 50);
            }}
          />

          {/* Minute Picker */}
          <Text style={styles.pickerLabel}>Minute</Text>
          <FlatList
            ref={minuteListRef}
            data={MINUTES}
            renderItem={renderMinuteItem}
            keyExtractor={(item) => item.toString()}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.pickerRow}
            getItemLayout={getItemLayout}
            onScrollToIndexFailed={(info) => {
              setTimeout(() => {
                try {
                  minuteListRef.current?.scrollToIndex({ index: info.index, animated: false, viewPosition: 0.5 });
                } catch (e) {}
              }, 50);
            }}
          />

          <View style={styles.actions}>
            <Button title="Cancel" variant="ghost" onPress={onClose} style={styles.actionBtn} />
            <Button title="Confirm" variant="primary" onPress={handleConfirm} style={styles.actionBtn} />
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex:            1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent:  'flex-end',
  },
  sheet: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingTop:    8,
    paddingBottom: 40,
    paddingHorizontal: 20,
  },
  header: {
    alignItems:    'center',
    paddingBottom: 20,
    paddingTop:    16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    marginBottom: 20,
  },
  headerTitle: {
    fontFamily: Typography.fontFamily.semibold,
    fontSize:   Typography.fontSize.base,
    color:      Colors.textPrimary,
  },
  timeDisplay: {
    flexDirection: 'row',
    alignItems:    'baseline',
    justifyContent: 'center',
    marginBottom:  24,
    gap:           8,
  },
  timeText: {
    fontFamily: Typography.fontFamily.bold,
    fontSize:   40,
    color:      Colors.primary[600],
  },
  periodText: {
    fontFamily: Typography.fontFamily.semibold,
    fontSize:   Typography.fontSize.xl,
    color:      Colors.textSecondary,
  },
  pickerLabel: {
    fontFamily: Typography.fontFamily.medium,
    fontSize:   Typography.fontSize.xs,
    color:      Colors.textTertiary,
    marginBottom: 8,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  pickerRow: {
    gap:           8,
    paddingBottom: 16,
    paddingHorizontal: 4,
  },
  pickerItem: {
    width:           56,
    height:          64,
    borderRadius:    12,
    alignItems:      'center',
    justifyContent:  'center',
    backgroundColor: '#f3f4f6', // gray bg for unselected
    borderWidth:     1.5,
    borderColor:     '#e5e7eb', // unselected border
  },
  pickerItemSelected: {
    backgroundColor: '#1a7a4a', // green bg for selected
    borderColor:     '#1a7a4a',
  },
  pickerItemText: {
    fontFamily: Typography.fontFamily.semibold,
    fontSize:   Typography.fontSize.base,
    color:      '#374151', // dark text for unselected
  },
  pickerItemTextSelected: {
    color: '#ffffff', // white text for selected
  },
  pickerItemSub: {
    fontFamily: Typography.fontFamily.regular,
    fontSize:   10,
    color:      Colors.textTertiary,
    marginTop:  2,
  },
  pickerItemSubSelected: {
    color: 'rgba(255, 255, 255, 0.8)',
  },
  actions: {
    flexDirection: 'row',
    gap:           12,
    marginTop:     20,
  },
  actionBtn: {
    flex: 1,
  },
});
