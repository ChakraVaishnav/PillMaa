// screens/SettingsScreen.tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  Alert,
  Dimensions,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useUser, useAuth } from '@clerk/clerk-expo';
import { useRouter } from 'expo-router';
import Toast from 'react-native-toast-message';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '../src/context/ThemeContext';
import { useTabBar } from '../src/context/TabBarContext';
import { Card } from '../src/components/ui/Card';
import { Button } from '../src/components/ui/Button';
import { AuthService } from '../src/services/auth.service';
import { cancelAllNotifications } from '../src/utils/notifications';
import { requestIgnoreBatteryOptimizations } from '../src/utils/powerManager';
import { useReminderStore } from '../src/store/useReminderStore';
import { Typography } from '../src/theme/typography';
import { Shadows } from '../src/theme/shadows';

const { width } = Dimensions.get('window');

export const SettingsScreen: React.FC = () => {
  const { theme } = useTheme();
  const { handleScroll } = useTabBar();
  const { user } = useUser();
  const { signOut } = useAuth();
  const router = useRouter();

  // Dialog & Modal State
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [deleteInputText, setDeleteInputText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  // Battery optimization warning state
  const [batteryDenied, setBatteryDenied] = useState(false);

  useEffect(() => {
    const checkBattery = async () => {
      const denied = await AsyncStorage.getItem('batteryOptimizationDenied');
      setBatteryDenied(denied === 'true');
    };
    checkBattery();
  }, []);

  // User values
  const firstName = user?.firstName || '';
  const lastName = user?.lastName || '';
  const fullName = `${firstName} ${lastName}`.trim() || 'PillMaa User';
  const email = user?.emailAddresses[0]?.emailAddress || '';
  const initials = (firstName[0] || '') + (lastName[0] || '') || 'PM';

  // Step 1: Standard Alert asking user if they are absolutely sure
  const handleDeleteAccountPress = () => {
    Alert.alert(
      'Delete Account',
      'This will permanently delete your PillMaa account, all reminders, and history logs. This action is irreversible.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Continue',
          style: 'destructive',
          onPress: () => {
            setDeleteInputText('');
            setDeleteModalVisible(true);
          },
        },
      ]
    );
  };

  // Step 2: Custom modal confirming delete via typing "DELETE"
  const handleConfirmDelete = async () => {
    if (deleteInputText !== 'DELETE') return;

    try {
      setIsDeleting(true);
      // 1. Cancel local notifications
      await cancelAllNotifications();
      // 2. Clear store local state
      useReminderStore.getState().reset();
      // 3. Backend cascade delete API call
      await AuthService.deleteAccount();
      // 4. Local Clerk sign out
      await signOut();
      // 5. Hide modal
      setDeleteModalVisible(false);
      // 6. Router replace
      router.replace('/(auth)/login');
      // 7. Show success Toast
      Toast.show({
        type: 'success',
        text1: 'Account Deleted',
        text2: 'Your account has been permanently removed.',
      });
    } catch (err) {
      console.warn('[DeleteAccount] Failed:', err);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to delete account. Please try again.',
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const handleSignOutPress = () => {
    Alert.alert('Log Out', 'Are you sure you want to log out of your account?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Log Out',
        style: 'destructive',
        onPress: async () => {
          try {
            await cancelAllNotifications();
            useReminderStore.getState().reset();
            await signOut();
            router.replace('/(auth)/login');
            Toast.show({
              type: 'success',
              text1: 'Logged Out',
              text2: 'Successfully signed out.',
            });
          } catch (err) {
            console.warn('[LogOut] Failed:', err);
          }
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: theme.background }]} edges={['top']}>
      {/* Settings Header */}
      <View style={[styles.header, { backgroundColor: theme.card, borderBottomColor: theme.border }]}>
        <Text style={[styles.headerTitle, { color: theme.text }]}>Settings</Text>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        contentContainerStyle={styles.scrollContent}
      >
        {/* User Card */}
        <View style={styles.profileSection}>
          <View style={[styles.avatar, { backgroundColor: theme.primaryLight }]}>
            <Text style={[styles.avatarText, { color: theme.primary }]}>
              {initials.toUpperCase()}
            </Text>
          </View>
          <Text style={[styles.profileName, { color: theme.text }]}>{fullName}</Text>
          <Text style={[styles.profileEmail, { color: theme.textMuted }]}>{email}</Text>
        </View>

        {/* Settings Group: Account */}
        <Text style={[styles.groupLabel, { color: theme.textMuted }]}>Account Settings</Text>
        <Card style={{ ...styles.groupCard, backgroundColor: theme.card, borderColor: theme.border }} padding={0}>
          <TouchableOpacity
            style={[styles.settingRow, { borderBottomColor: theme.border }]}
            onPress={() => router.push('/profile')}
            activeOpacity={0.7}
          >
            <View style={styles.rowLeft}>
              <View style={[styles.iconBox, { backgroundColor: theme.primaryLight }]}>
                <Feather name="user" size={18} color={theme.primary} />
              </View>
              <Text style={[styles.rowLabel, { color: theme.text }]}>Edit Profile</Text>
            </View>
            <Feather name="chevron-right" size={18} color={theme.textMuted} />
          </TouchableOpacity>
        </Card>

        {/* Settings Group: Notifications */}
        {Platform.OS === 'android' && (
          <>
            <Text style={[styles.groupLabel, { color: theme.textMuted }]}>Notifications</Text>
            <Card style={{ ...styles.groupCard, backgroundColor: theme.card, borderColor: batteryDenied ? '#fcd34d' : theme.border }} padding={0}>
              <TouchableOpacity
                style={styles.settingRow}
                onPress={async () => {
                  await requestIgnoreBatteryOptimizations();
                  await AsyncStorage.setItem('batteryOptimizationDenied', 'false');
                  setBatteryDenied(false);
                  Toast.show({
                    type: 'success',
                    text1: 'Battery Settings Opened',
                    text2: "Set PillMaa to 'Unrestricted' for reliable reminders.",
                  });
                }}
                activeOpacity={0.7}
              >
                <View style={styles.rowLeft}>
                  <View style={[styles.iconBox, { backgroundColor: batteryDenied ? '#fef3c7' : theme.primaryLight }]}>
                    <Ionicons
                      name="battery-half-outline"
                      size={18}
                      color={batteryDenied ? '#b45309' : theme.primary}
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.rowLabel, { color: theme.text }]}>Battery Optimization</Text>
                    <Text style={[styles.rowSubLabel, { color: batteryDenied ? '#b45309' : theme.textMuted }]}>
                      {batteryDenied ? '⚠️ Not set — tap to fix' : 'Set to Unrestricted for reliable alerts'}
                    </Text>
                  </View>
                </View>
                <Feather name="chevron-right" size={18} color={batteryDenied ? '#f59e0b' : theme.textMuted} />
              </TouchableOpacity>
            </Card>
          </>
        )}

        {/* Settings Group: Customization */}
        <Text style={[styles.groupLabel, { color: theme.textMuted }]}>Appearance</Text>
        <Card style={{ ...styles.groupCard, backgroundColor: theme.card, borderColor: theme.border }} padding={0}>
          <TouchableOpacity
            style={styles.settingRow}
            onPress={() => router.push('/theme')}
            activeOpacity={0.7}
          >
            <View style={styles.rowLeft}>
              <View style={[styles.iconBox, { backgroundColor: theme.primaryLight }]}>
                <Ionicons name="color-palette-outline" size={18} color={theme.primary} />
              </View>
              <Text style={[styles.rowLabel, { color: theme.text }]}>Theme Customization</Text>
            </View>
            <Feather name="chevron-right" size={18} color={theme.textMuted} />
          </TouchableOpacity>
        </Card>

        {/* Settings Group: Danger Zone */}
        <Text style={[styles.groupLabel, { color: '#ef4444' }]}>Danger Zone</Text>
        <Card style={{ ...styles.groupCard, backgroundColor: theme.card, borderColor: '#fee2e2' }} padding={0}>
          <TouchableOpacity
            style={styles.settingRow}
            onPress={handleDeleteAccountPress}
            activeOpacity={0.7}
          >
            <View style={styles.rowLeft}>
              <View style={[styles.iconBox, { backgroundColor: '#fee2e2' }]}>
                <Feather name="trash-2" size={18} color="#ef4444" />
              </View>
              <Text style={[styles.rowLabel, { color: '#ef4444', fontFamily: Typography.fontFamily.semibold }]}>
                Delete Account
              </Text>
            </View>
            <Feather name="chevron-right" size={18} color="#ef4444" />
          </TouchableOpacity>
        </Card>

        {/* Log Out Button */}
        <Button
          title="Log Out"
          variant="ghost"
          leftIcon={<Feather name="log-out" size={18} color="#ef4444" />}
          onPress={handleSignOutPress}
          style={styles.logoutButton}
          textStyle={{ color: '#ef4444' }}
          fullWidth
        />
      </ScrollView>

      {/* Delete Account Modal (Step 2) */}
      <Modal
        visible={deleteModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setDeleteModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContainer, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <View style={styles.modalIconBg}>
              <Feather name="alert-triangle" size={28} color="#ef4444" />
            </View>

            <Text style={[styles.modalTitle, { color: theme.text }]}>Confirm Deletion</Text>
            <Text style={[styles.modalSubtitle, { color: theme.textMuted }]}>
              To verify deletion, type <Text style={{ fontFamily: Typography.fontFamily.bold, color: '#ef4444' }}>DELETE</Text> in all caps below:
            </Text>

            <TextInput
              style={[styles.textInput, { backgroundColor: theme.background, borderColor: theme.border, color: '#ef4444' }]}
              value={deleteInputText}
              onChangeText={setDeleteInputText}
              placeholder="Type DELETE"
              placeholderTextColor={theme.textMuted}
              autoCapitalize="characters"
              autoCorrect={false}
            />

            <View style={styles.modalActions}>
              <Button
                title="Cancel"
                variant="ghost"
                onPress={() => setDeleteModalVisible(false)}
                disabled={isDeleting}
                style={styles.modalBtn}
                textStyle={{ color: theme.textMuted }}
              />
              <Button
                title="Delete Account"
                variant="danger"
                onPress={handleConfirmDelete}
                disabled={deleteInputText !== 'DELETE' || isDeleting}
                isLoading={isDeleting}
                style={{
                  ...styles.modalBtn,
                  opacity: deleteInputText !== 'DELETE' ? 0.4 : 1,
                }}
              />
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontFamily: Typography.fontFamily.bold,
    fontSize: 22,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 120,
  },
  profileSection: {
    alignItems: 'center',
    paddingVertical: 28,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.sm,
    marginBottom: 12,
  },
  avatarText: {
    fontFamily: Typography.fontFamily.bold,
    fontSize: 28,
  },
  profileName: {
    fontFamily: Typography.fontFamily.bold,
    fontSize: 18,
    marginBottom: 4,
  },
  profileEmail: {
    fontFamily: Typography.fontFamily.regular,
    fontSize: 13,
  },
  groupLabel: {
    fontFamily: Typography.fontFamily.bold,
    fontSize: 14,
    marginTop: 20,
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  groupCard: {
    borderWidth: 1,
    borderRadius: 14,
    overflow: 'hidden',
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 16,
    minHeight: 54,
  },
  rowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowLabel: {
    fontFamily: Typography.fontFamily.medium,
    fontSize: 15,
  },
  rowSubLabel: {
    fontFamily: Typography.fontFamily.regular,
    fontSize: 11,
    marginTop: 1,
  },
  logoutButton: {
    borderWidth: 1.5,
    borderColor: '#ef4444',
    marginTop: 32,
    backgroundColor: 'transparent',
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  modalContainer: {
    width: '100%',
    maxWidth: 340,
    borderRadius: 24,
    borderWidth: 1.5,
    padding: 24,
    alignItems: 'center',
    ...Shadows.lg,
  },
  modalIconBg: {
    width: 56,
    height: 56,
    borderRadius: 18,
    backgroundColor: '#fee2e2',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontFamily: Typography.fontFamily.bold,
    fontSize: 18,
    marginBottom: 8,
    textAlign: 'center',
  },
  modalSubtitle: {
    fontFamily: Typography.fontFamily.regular,
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 16,
  },
  textInput: {
    width: '100%',
    height: 48,
    borderWidth: 1.5,
    borderRadius: 12,
    paddingHorizontal: 16,
    fontFamily: Typography.fontFamily.bold,
    fontSize: 15,
    textAlign: 'center',
    marginBottom: 20,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  modalBtn: {
    flex: 1,
    minHeight: 44,
  },
});
