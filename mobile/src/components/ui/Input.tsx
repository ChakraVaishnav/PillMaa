// src/components/ui/Input.tsx
import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  TextInput,
  Text,
  TouchableOpacity,
  StyleSheet,
  TextInputProps,
  Animated,
} from 'react-native';
import { Colors } from '../../theme/colors';
import { Typography } from '../../theme/typography';
import { useTheme } from '../../context/ThemeContext';

interface InputProps extends TextInputProps {
  label: string;
  error?: string;
  hint?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  onRightIconPress?: () => void;
}

export const Input: React.FC<InputProps> = ({
  label,
  error,
  hint,
  leftIcon,
  rightIcon,
  onRightIconPress,
  onFocus,
  onBlur,
  value,
  ...props
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const { theme } = useTheme();
  const labelAnim = useRef(new Animated.Value(value ? 1 : 0)).current;

  useEffect(() => {
    Animated.spring(labelAnim, {
      toValue: (isFocused || value) ? 1 : 0,
      damping: 18,
      stiffness: 200,
      useNativeDriver: false,
    }).start();
  }, [isFocused, value]);

  const handleFocus = (e: any) => {
    setIsFocused(true);
    onFocus?.(e);
  };

  const handleBlur = (e: any) => {
    setIsFocused(false);
    onBlur?.(e);
  };

  // Animate label from center (top: 15) to top-margin (top: -8)
  const labelTop = labelAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [15, -8],
  });

  const labelFontSize = labelAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [15, 12],
  });

  // When active (focused or has text), the label gets a solid background matching the card background to cover the border cleanly
  const labelBg = (isFocused || value) ? theme.card : 'transparent';

  return (
    <View style={styles.container}>
      <View style={styles.inputOuter}>
        <Animated.Text
          style={[
            styles.label,
            {
              top: labelTop,
              fontSize: labelFontSize,
              color: error ? Colors.error : (isFocused ? theme.primary : theme.textMuted),
              backgroundColor: labelBg,
            },
            leftIcon ? styles.labelWithIcon : null,
          ]}
        >
          {label}
        </Animated.Text>

        <View
          style={[
            styles.inputWrapper,
            { backgroundColor: theme.card, borderColor: theme.border },
            isFocused && { borderColor: theme.primary },
            !!error && styles.inputWrapperError,
          ]}
        >
          {leftIcon && <View style={styles.leftIcon}>{leftIcon}</View>}

          <TextInput
            {...props}
            style={[
              styles.input,
              { color: theme.text },
              leftIcon ? styles.inputWithIcon : null,
            ]}
            onFocus={handleFocus}
            onBlur={handleBlur}
            value={value}
            placeholder={isFocused ? props.placeholder : undefined}
            placeholderTextColor={theme.textMuted}
            underlineColorAndroid="transparent"
          />

          {rightIcon && (
            <TouchableOpacity
              style={styles.rightIcon}
              onPress={onRightIconPress}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              {rightIcon}
            </TouchableOpacity>
          )}
        </View>
      </View>

      {error && <Text style={styles.error}>{error}</Text>}
      {hint && !error && <Text style={styles.hint}>{hint}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 12,
  },
  inputOuter: {
    position: 'relative',
    zIndex: 1,
  },
  inputWrapper: {
    flexDirection:   'row',
    alignItems:      'center',
    backgroundColor: '#ffffff',
    borderRadius:    14,
    borderWidth:     1.5,
    borderColor:     '#E5E7EB',
    height:          52,
  },
  inputWrapperFocused: {
    borderColor: '#1a7a4a',
  },
  inputWrapperError: {
    borderColor: Colors.error,
    backgroundColor: '#fef2f2',
  },
  label: {
    position:   'absolute',
    left:       16,
    fontFamily: Typography.fontFamily.medium,
    zIndex:     10,
    paddingHorizontal: 6,
    borderRadius: 4,
  },
  labelWithIcon: {
    left: 40,
  },
  input: {
    fontFamily: Typography.fontFamily.regular,
    fontSize:   Typography.fontSize.base,
    color:      Colors.textPrimary,
    paddingHorizontal: 16,
    paddingVertical: 0,
    height: 52,
    textAlignVertical: 'center',
    flex: 1,
  },
  inputWithIcon: {
    paddingLeft: 8, // since leftIcon takes row space, we only need normal padding inside input
  },
  leftIcon: {
    marginLeft: 16,
    marginRight: -8,
  },
  rightIcon: {
    marginRight: 16,
  },
  error: {
    fontFamily: Typography.fontFamily.regular,
    fontSize:   Typography.fontSize.xs,
    color:      Colors.error,
    marginTop:  4,
    marginLeft: 4,
  },
  hint: {
    fontFamily: Typography.fontFamily.regular,
    fontSize:   Typography.fontSize.xs,
    color:      Colors.textTertiary,
    marginTop:  4,
    marginLeft: 4,
  },
});
