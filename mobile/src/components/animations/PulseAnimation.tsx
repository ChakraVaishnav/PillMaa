// src/components/animations/PulseAnimation.tsx
import React, { useEffect } from 'react';
import { StyleSheet, ViewStyle } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  Easing,
  interpolate,
} from 'react-native-reanimated';

interface PulseAnimationProps {
  children: React.ReactNode;
  color?: string;
  size?: number;
  style?: ViewStyle;
  rings?: number;
}

export const PulseAnimation: React.FC<PulseAnimationProps> = ({
  children,
  color = '#16a34a',
  size = 200,
  style,
  rings = 3,
}) => {
  const pulseValues = Array.from({ length: rings }, () => useSharedValue(0));

  useEffect(() => {
    pulseValues.forEach((pulse, index) => {
      pulse.value = withRepeat(
        withSequence(
          withTiming(0, { duration: 0 }),
          withTiming(1, {
            duration: 2000,
            easing: Easing.out(Easing.ease),
          })
        ),
        -1,
        false
      );
      // Stagger each ring
      setTimeout(() => {
        pulse.value = withRepeat(
          withSequence(
            withTiming(0, { duration: 0 }),
            withTiming(1, {
              duration: 2000,
              easing: Easing.out(Easing.ease),
            })
          ),
          -1,
          false
        );
      }, index * 600);
    });
  }, []);

  return (
    <Animated.View style={[styles.container, { width: size, height: size }, style]}>
      {pulseValues.map((pulse, index) => {
        const ringStyle = useAnimatedStyle(() => ({
          opacity: interpolate(pulse.value, [0, 0.5, 1], [0.6, 0.3, 0]),
          transform: [
            {
              scale: interpolate(pulse.value, [0, 1], [1, 1 + 0.3 * (index + 1)]),
            },
          ],
        }));

        return (
          <Animated.View
            key={index}
            style={[
              styles.ring,
              {
                width:         size,
                height:        size,
                borderRadius:  size / 2,
                borderColor:   color,
                borderWidth:   2,
                position:      'absolute',
              },
              ringStyle,
            ]}
          />
        );
      })}
      {children}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems:     'center',
    justifyContent: 'center',
  },
  ring: {
    position: 'absolute',
  },
});
