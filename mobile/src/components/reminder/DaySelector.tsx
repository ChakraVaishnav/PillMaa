// src/components/reminder/DaySelector.tsx
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import { Colors } from '../../theme/colors';
import { Typography } from '../../theme/typography';
import { REPEAT_DAYS } from '../../constants';
import type { RepeatDay } from '../../types';

interface DaySelectorProps {
  selected: RepeatDay[];
  onChange: (days: RepeatDay[]) => void;
}

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

const DayButton: React.FC<{
  day: typeof REPEAT_DAYS[number];
  isSelected: boolean;
  onPress: () => void;
}> = ({ day, isSelected, onPress }) => {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePress = () => {
    scale.value = withSpring(0.85, { damping: 10 }, () => {
      scale.value = withSpring(1, { damping: 10 });
    });
    onPress();
  };

  return (
    <AnimatedTouchable
      onPress={handlePress}
      style={[styles.dayButton, isSelected && styles.dayButtonSelected, animatedStyle]}
      activeOpacity={1}
    >
      <Text style={[styles.dayText, isSelected && styles.dayTextSelected]}>
        {day.short}
      </Text>
    </AnimatedTouchable>
  );
};

export const DaySelector: React.FC<DaySelectorProps> = ({ selected, onChange }) => {
  const toggleDay = (key: RepeatDay) => {
    if (selected.includes(key)) {
      onChange(selected.filter((d) => d !== key));
    } else {
      onChange([...selected, key]);
    }
  };

  return (
    <View style={styles.container}>
      {REPEAT_DAYS.map((day) => (
        <DayButton
          key={day.key}
          day={day}
          isSelected={selected.includes(day.key)}
          onPress={() => toggleDay(day.key)}
        />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'space-between',
  },
  dayButton: {
    width:           40,
    height:          40,
    borderRadius:    20,
    alignItems:      'center',
    justifyContent:  'center',
    backgroundColor: Colors.neutral[100],
    borderWidth:     1.5,
    borderColor:     Colors.neutral[200],
  },
  dayButtonSelected: {
    backgroundColor: Colors.primary[600],
    borderColor:     Colors.primary[600],
  },
  dayText: {
    fontFamily: Typography.fontFamily.semibold,
    fontSize:   Typography.fontSize.sm,
    color:      Colors.textSecondary,
  },
  dayTextSelected: {
    color: Colors.textOnPrimary,
  },
});
