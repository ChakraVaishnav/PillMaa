// src/components/ui/Badge.tsx
import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { Colors } from '../../theme/colors';
import { Typography } from '../../theme/typography';

type BadgeVariant = 'success' | 'warning' | 'error' | 'info' | 'neutral' | 'primary';

interface BadgeProps {
  label: string;
  variant?: BadgeVariant;
  style?: ViewStyle;
  dot?: boolean;
}

const VARIANT_STYLES: Record<BadgeVariant, { bg: string; text: string; dot: string }> = {
  success: { bg: '#dcfce7', text: '#15803d', dot: '#16a34a' },
  warning: { bg: '#fef3c7', text: '#92400e', dot: '#f59e0b' },
  error:   { bg: '#fee2e2', text: '#991b1b', dot: '#ef4444' },
  info:    { bg: '#dbeafe', text: '#1e40af', dot: '#3b82f6' },
  neutral: { bg: Colors.neutral[100], text: Colors.neutral[600], dot: Colors.neutral[400] },
  primary: { bg: Colors.primary[100], text: Colors.primary[700], dot: Colors.primary[500] },
};

export const Badge: React.FC<BadgeProps> = ({
  label,
  variant = 'neutral',
  style,
  dot = false,
}) => {
  const { bg, text, dot: dotColor } = VARIANT_STYLES[variant];

  return (
    <View style={[styles.badge, { backgroundColor: bg }, style]}>
      {dot && (
        <View style={[styles.dot, { backgroundColor: dotColor }]} />
      )}
      <Text style={[styles.label, { color: text }]}>{label}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    flexDirection:    'row',
    alignItems:       'center',
    paddingHorizontal: 10,
    paddingVertical:   4,
    borderRadius:     999,
    gap:              5,
    alignSelf: 'flex-start',
  },
  dot: {
    width:        6,
    height:       6,
    borderRadius: 3,
  },
  label: {
    fontFamily: Typography.fontFamily.medium,
    fontSize:   Typography.fontSize.xs,
    letterSpacing: 0.3,
  },
});
