// src/components/ui/EmptyState.tsx
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { Colors } from '../../theme/colors';
import { Typography } from '../../theme/typography';
import { Button } from './Button';

interface EmptyStateProps {
  icon?: React.ReactNode;
  emoji?: string;
  title: string;
  subtitle?: string;
  actionLabel?: string;
  onAction?: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  emoji = '💊',
  title,
  subtitle,
  actionLabel,
  onAction,
}) => {
  return (
    <Animated.View entering={FadeIn.duration(400)} style={styles.container}>
      {/* Decorative circle background */}
      <View style={styles.circle}>
        {icon ? icon : <Text style={styles.emoji}>{emoji}</Text>}
      </View>

      <Text style={styles.title}>{title}</Text>
      {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}

      {actionLabel && onAction && (
        <Button
          title={actionLabel}
          onPress={onAction}
          variant="primary"
          size="md"
          style={styles.action}
        />
      )}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
    paddingVertical: 60,
  },
  circle: {
    width:           120,
    height:          120,
    borderRadius:    60,
    backgroundColor: Colors.primary[50],
    alignItems:      'center',
    justifyContent:  'center',
    marginBottom:    24,
    borderWidth:     2,
    borderColor:     Colors.primary[100],
  },
  emoji: {
    fontSize: 48,
  },
  title: {
    fontFamily: Typography.fontFamily.bold,
    fontSize:   Typography.fontSize.xl,
    color:      Colors.textPrimary,
    textAlign:  'center',
    marginBottom: 10,
  },
  subtitle: {
    fontFamily: Typography.fontFamily.regular,
    fontSize:   Typography.fontSize.base,
    color:      Colors.textSecondary,
    textAlign:  'center',
    lineHeight: Typography.fontSize.base * 1.6,
    marginBottom: 28,
  },
  action: {
    marginTop: 8,
    minWidth: 180,
  },
});
