// screens/ProfileScreen.tsx
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useUser } from '@clerk/clerk-expo';
import { useRouter } from 'expo-router';
import Toast from 'react-native-toast-message';
import { useTheme } from '../src/context/ThemeContext';
import { Input } from '../src/components/ui/Input';
import { Button } from '../src/components/ui/Button';
import { AuthService } from '../src/services/auth.service';
import { Typography } from '../src/theme/typography';
import { Shadows } from '../src/theme/shadows';

export const ProfileScreen: React.FC = () => {
  const { theme } = useTheme();
  const { user } = useUser();
  const router = useRouter();

  const firstName = user?.firstName || '';
  const lastName = user?.lastName || '';
  const initialName = `${firstName} ${lastName}`.trim() || 'PillMaa User';
  const email = user?.emailAddresses[0]?.emailAddress || '';
  const initials = (firstName[0] || '') + (lastName[0] || '') || 'PM';

  const [displayName, setDisplayName] = useState(initialName);
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    if (!displayName.trim()) {
      Toast.show({
        type: 'error',
        text1: 'Validation Error',
        text2: 'Display name cannot be empty.',
      });
      return;
    }

    setIsSaving(true);
    try {
      const parts = displayName.trim().split(/\s+/);
      const newFirstName = parts[0] || '';
      const newLastName = parts.slice(1).join(' ') || '';

      // 1. Update Clerk user profile
      await user?.update({
        firstName: newFirstName,
        lastName: newLastName,
      });

      // 2. Sync with local database
      await AuthService.sync(displayName.trim(), email);

      Toast.show({
        type: 'success',
        text1: 'Success',
        text2: 'Profile updated successfully.',
      });

      router.back();
    } catch (err: any) {
      console.warn('[ProfileUpdate] Failed:', err);
      Toast.show({
        type: 'error',
        text1: 'Update Failed',
        text2: err.message || 'Could not update profile.',
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: theme.background }]} edges={['top']}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: theme.card, borderBottomColor: theme.border }]}>
        <TouchableOpacity
          style={[styles.backBtn, { borderColor: theme.primary, backgroundColor: theme.card }]}
          onPress={() => router.back()}
          activeOpacity={0.8}
        >
          <Feather name="arrow-left" size={20} color={theme.primary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.text }]}>Edit Profile</Text>
        <View style={{ width: 40 }} /> {/* Spacer to align title */}
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* Avatar Section */}
          <View style={styles.avatarSection}>
            <View style={[styles.avatarRing, { borderColor: theme.primary }]}>
              <View style={[styles.avatar, { backgroundColor: theme.primaryLight }]}>
                <Text style={[styles.avatarText, { color: theme.primary }]}>
                  {initials.toUpperCase()}
                </Text>
              </View>
            </View>
            <Text style={[styles.avatarLabel, { color: theme.textMuted }]}>Account Identity</Text>
          </View>

          {/* Form */}
          <View style={styles.form}>
            <Input
              label="Display Name"
              value={displayName}
              onChangeText={setDisplayName}
              leftIcon={<Feather name="user" size={18} color={theme.textMuted} />}
              autoCapitalize="words"
              autoCorrect={false}
              style={{ color: theme.text }}
            />

            <View style={styles.emailContainer}>
              <Input
                label="Email Address"
                value={email}
                leftIcon={<Feather name="mail" size={18} color={theme.textMuted} />}
                editable={false}
                selectTextOnFocus={false}
                hint="Your email address is managed by Clerk and cannot be edited here."
              />
            </View>

            <Button
              title="Save Changes"
              onPress={handleSave}
              isLoading={isSaving}
              fullWidth
              style={{ backgroundColor: theme.primary, marginTop: 24 }}
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    borderWidth: 1.5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontFamily: Typography.fontFamily.bold,
    fontSize: 20,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  avatarSection: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  avatarRing: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 2,
    padding: 3,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatar: {
    width: 88,
    height: 88,
    borderRadius: 44,
    justifyContent: 'center',
    alignItems: 'center',
    ...Shadows.sm,
  },
  avatarText: {
    fontFamily: Typography.fontFamily.bold,
    fontSize: 32,
  },
  avatarLabel: {
    fontFamily: Typography.fontFamily.semibold,
    fontSize: 14,
  },
  form: {
    gap: 16,
  },
  emailContainer: {
    opacity: 0.85,
  },
});
