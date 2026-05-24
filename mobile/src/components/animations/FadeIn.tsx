// src/components/animations/FadeIn.tsx
import React from 'react';
import { ViewStyle } from 'react-native';
import Animated, { FadeIn as ReanimatedFadeIn, FadeInDown } from 'react-native-reanimated';

interface FadeInProps {
  children: React.ReactNode;
  delay?: number;
  duration?: number;
  from?: 'bottom' | 'fade';
  style?: ViewStyle;
}

export const FadeIn: React.FC<FadeInProps> = ({
  children,
  delay = 0,
  duration = 350,
  from = 'fade',
  style,
}) => {
  const entering =
    from === 'bottom'
      ? FadeInDown.delay(delay).duration(duration).springify()
      : ReanimatedFadeIn.delay(delay).duration(duration);

  return (
    <Animated.View entering={entering} style={style}>
      {children}
    </Animated.View>
  );
};
