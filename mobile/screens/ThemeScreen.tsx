// screens/ThemeScreen.tsx
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather, Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import Toast from 'react-native-toast-message';
import { useTheme, COLOR_THEMES, ThemeMode, ColorThemeKey } from '../src/context/ThemeContext';
import { Typography } from '../src/theme/typography';
import { Shadows } from '../src/theme/shadows';

export const ThemeScreen: React.FC = () => {
  const { mode, colorTheme, theme, setMode, setColorTheme } = useTheme();
  const router = useRouter();

  const handleSelectColorTheme = async (key: ColorThemeKey) => {
    try {
      await setColorTheme(key);
      const name = COLOR_THEMES[key].name;
      Toast.show({
        type: 'success',
        text1: 'Theme Updated',
        text2: `Switched to ${name} successfully.`,
      });
    } catch (err) {
      console.warn('Failed to switch color theme:', err);
    }
  };

  const handleToggleMode = async (newMode: ThemeMode) => {
    try {
      await setMode(newMode);
      Toast.show({
        type: 'success',
        text1: 'Appearance Updated',
        text2: `Switched to ${newMode === 'dark' ? 'Dark' : 'Light'} Mode.`,
      });
    } catch (err) {
      console.warn('Failed to toggle mode:', err);
    }
  };

  // Renders a dynamic, high-fidelity mini-mockup of the dashboard to preview colors
  const renderMockup = (key: ColorThemeKey) => {
    const colorSet = COLOR_THEMES[key];
    const preview = colorSet[mode]; // dynamically use active segmented mode
    const isSelected = colorTheme === key;

    return (
      <View style={[styles.mockupContainer, { backgroundColor: preview.background }]}>
        {/* Mock Header */}
        <View style={[styles.mockHeader, { backgroundColor: preview.primary }]}>
          <View style={styles.mockHeaderLeft} />
          <View style={styles.mockHeaderRight} />
        </View>

        {/* Mock Content */}
        <View style={styles.mockContent}>
          {/* Mock Pill Card */}
          <View style={[styles.mockCard, { backgroundColor: preview.card, borderColor: preview.primary }]}>
            <View style={[styles.mockCircle, { backgroundColor: preview.primaryLight }]} />
            <View style={styles.mockLines}>
              <View style={[styles.mockLineShort, { backgroundColor: preview.primary }]} />
              <View style={[styles.mockLineLong, { backgroundColor: preview.border }]} />
            </View>
          </View>

          {/* Another card */}
          <View style={[styles.mockCard, { backgroundColor: preview.card, borderColor: preview.border }]}>
            <View style={[styles.mockCircle, { backgroundColor: preview.primaryLight }]} />
            <View style={styles.mockLines}>
              <View style={[styles.mockLineShort, { backgroundColor: preview.border }]} />
              <View style={[styles.mockLineLong, { backgroundColor: preview.border }]} />
            </View>
          </View>
        </View>

        {/* Mock Bottom Tab */}
        <View style={[styles.mockTab, { backgroundColor: preview.card, borderTopColor: preview.border }]}>
          <Ionicons name="home" size={10} color={preview.primary} />
          <Ionicons name="time" size={10} color={preview.textMuted} />
          <Ionicons name="settings" size={10} color={preview.textMuted} />
        </View>

        {/* Selection Checkmark */}
        {isSelected && (
          <View style={[styles.checkmarkCircle, { backgroundColor: preview.primary }]}>
            <Feather name="check" size={12} color="#ffffff" />
          </View>
        )}
      </View>
    );
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
        <Text style={[styles.headerTitle, { color: theme.text }]}>Appearance</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.introSection}>
          <Text style={[styles.title, { color: theme.text }]}>Display Settings</Text>
          <Text style={[styles.subtitle, { color: theme.textMuted }]}>
            Choose between light and dark modes, and select a brand accent color. Changes will take effect globally and instantly.
          </Text>
        </View>

        {/* 1. Light / Dark Mode Toggle Section */}
        <Text style={[styles.sectionLabel, { color: theme.textMuted }]}>Appearance Mode</Text>
        <View style={[styles.modeSelector, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <TouchableOpacity
            style={[
              styles.modeOption,
              mode === 'light' && [styles.modeOptionSelected, { backgroundColor: theme.primary }],
            ]}
            onPress={() => handleToggleMode('light')}
            activeOpacity={0.8}
          >
            <Feather name="sun" size={16} color={mode === 'light' ? '#ffffff' : theme.textMuted} />
            <Text style={[styles.modeText, { color: mode === 'light' ? '#ffffff' : theme.text }]}>Light</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.modeOption,
              mode === 'dark' && [styles.modeOptionSelected, { backgroundColor: theme.primary }],
            ]}
            onPress={() => handleToggleMode('dark')}
            activeOpacity={0.8}
          >
            <Feather name="moon" size={16} color={mode === 'dark' ? '#ffffff' : theme.textMuted} />
            <Text style={[styles.modeText, { color: mode === 'dark' ? '#ffffff' : theme.text }]}>Dark</Text>
          </TouchableOpacity>
        </View>

        {/* 2. Color Themes Grid */}
        <Text style={[styles.sectionLabel, { color: theme.textMuted }]}>Color Theme</Text>
        <View style={styles.grid}>
          {(Object.keys(COLOR_THEMES) as ColorThemeKey[]).map((key) => {
            const colorSet = COLOR_THEMES[key];
            const isSelected = colorTheme === key;
            const preview = colorSet[mode];

            return (
              <TouchableOpacity
                key={key}
                style={[
                  styles.themeCard,
                  { backgroundColor: theme.card, borderColor: isSelected ? theme.primary : theme.border },
                  isSelected && { borderWidth: 2 },
                ]}
                onPress={() => handleSelectColorTheme(key)}
                activeOpacity={0.85}
              >
                {renderMockup(key)}
                <View style={[styles.themeInfo, { borderTopColor: theme.border }]}>
                  <Text style={[styles.themeLabel, { color: isSelected ? theme.primary : theme.text }]}>
                    {colorSet.name}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>
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
    paddingBottom: 60,
  },
  introSection: {
    marginVertical: 24,
  },
  title: {
    fontFamily: Typography.fontFamily.bold,
    fontSize: 22,
    marginBottom: 8,
  },
  subtitle: {
    fontFamily: Typography.fontFamily.regular,
    fontSize: 14,
    lineHeight: 20,
  },
  sectionLabel: {
    fontFamily: Typography.fontFamily.bold,
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 10,
    marginTop: 8,
  },
  // Mode Selector Segmented control
  modeSelector: {
    flexDirection: 'row',
    borderRadius: 14,
    borderWidth: 1.5,
    padding: 4,
    marginBottom: 24,
    height: 48,
  },
  modeOption: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
    gap: 8,
  },
  modeOptionSelected: {
    ...Shadows.sm,
  },
  modeText: {
    fontFamily: Typography.fontFamily.semibold,
    fontSize: 14,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    justifyContent: 'space-between',
  },
  themeCard: {
    width: '47%',
    aspectRatio: 0.72,
    borderRadius: 20,
    borderWidth: 1,
    overflow: 'hidden',
    ...Shadows.sm,
  },
  themeInfo: {
    padding: 12,
    alignItems: 'center',
    borderTopWidth: 1,
  },
  themeLabel: {
    fontFamily: Typography.fontFamily.bold,
    fontSize: 13,
  },
  // Mockup Styles
  mockupContainer: {
    flex: 1,
    position: 'relative',
    overflow: 'hidden',
  },
  mockHeader: {
    height: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
  },
  mockHeaderLeft: {
    width: 24,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
  },
  mockHeaderRight: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
  },
  mockContent: {
    flex: 1,
    padding: 8,
    gap: 6,
  },
  mockCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 6,
    borderRadius: 8,
    borderWidth: 1.2,
    gap: 6,
  },
  mockCircle: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  mockLines: {
    flex: 1,
    gap: 3,
  },
  mockLineShort: {
    width: '45%',
    height: 3,
    borderRadius: 1.5,
  },
  mockLineLong: {
    width: '80%',
    height: 2.5,
    borderRadius: 1.25,
  },
  mockTab: {
    height: 18,
    borderTopWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  checkmarkCircle: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 18,
    height: 18,
    borderRadius: 9,
    justifyContent: 'center',
    alignItems: 'center',
    ...Shadows.sm,
    elevation: 3,
  },
});
