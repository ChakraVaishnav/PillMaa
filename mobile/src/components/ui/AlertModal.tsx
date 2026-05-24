// src/components/ui/AlertModal.tsx
import React, { useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TouchableWithoutFeedback,
  Dimensions,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { Colors } from '../../theme/colors';
import { Typography } from '../../theme/typography';
import { Button } from './Button';
import { Feather } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

interface AlertModalProps {
  visible: boolean;
  title: string;
  message: string;
  onClose: () => void;
  onConfirm?: () => void;
  confirmLabel?: string;
  cancelLabel?: string;
  type?: 'info' | 'danger' | 'success';
}

export const AlertModal: React.FC<AlertModalProps> = ({
  visible,
  title,
  message,
  onClose,
  onConfirm,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  type = 'info',
}) => {
  const scale = useSharedValue(0.9);
  const opacity = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      scale.value = withSpring(1, { damping: 15, stiffness: 150 });
      opacity.value = withTiming(1, { duration: 250 });
    } else {
      scale.value = 0.9;
      opacity.value = 0;
    }
  }, [visible]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  const bgStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  // Determine icon and color based on type
  const getHeaderIcon = () => {
    switch (type) {
      case 'danger':
        return <Feather name="alert-triangle" size={28} color="#ef4444" />;
      case 'success':
        return <Feather name="check-circle" size={28} color="#22c55e" />;
      default:
        return <Feather name="info" size={28} color={Colors.primary[600]} />;
    }
  };

  const getHeaderBg = () => {
    switch (type) {
      case 'danger':
        return '#fee2e2';
      case 'success':
        return '#dcfce7';
      default:
        return Colors.primary[50];
    }
  };

  return (
    <Modal
      transparent
      visible={visible}
      animationType="none"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        {/* Dark blur background */}
        <Animated.View style={[StyleSheet.absoluteFill, styles.backdrop, bgStyle]}>
          <TouchableWithoutFeedback onPress={onClose}>
            <View style={StyleSheet.absoluteFill} />
          </TouchableWithoutFeedback>
        </Animated.View>

        {/* Modal content container */}
        <Animated.View style={[styles.modalContainer, animatedStyle]}>
          {/* Liquid glass card border reflex */}
          <View style={styles.glassHeaderBg}>
            <View style={[styles.iconWrapper, { backgroundColor: getHeaderBg() }]}>
              {getHeaderIcon()}
            </View>
          </View>

          <Text style={styles.title}>{title}</Text>
          <Text style={styles.message}>{message}</Text>

          <View style={styles.buttonRow}>
            <Button
              title={cancelLabel}
              variant="ghost"
              onPress={onClose}
              style={styles.btn}
              textStyle={{ color: Colors.textSecondary }}
            />
            {onConfirm && (
              <Button
                title={confirmLabel}
                variant={type === 'danger' ? 'danger' : 'primary'}
                onPress={() => {
                  onConfirm();
                  onClose();
                }}
                style={styles.btn}
              />
            )}
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  backdrop: {
    backgroundColor: 'rgba(15, 23, 42, 0.65)', // rich slate dark backdrop
  },
  modalContainer: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: '#ffffff', // fully opaque solid white background
    borderRadius: 28,
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.1,
    shadowRadius: 30,
    elevation: 8,
  },
  glassHeaderBg: {
    marginBottom: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconWrapper: {
    width: 60,
    height: 60,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontFamily: Typography.fontFamily.bold,
    fontSize: Typography.fontSize.lg,
    color: Colors.textPrimary,
    textAlign: 'center',
    marginBottom: 10,
  },
  message: {
    fontFamily: Typography.fontFamily.regular,
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  btn: {
    flex: 1,
    minHeight: 46,
    borderRadius: 14,
  },
});
