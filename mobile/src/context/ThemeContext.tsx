// src/context/ThemeContext.tsx
import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface Theme {
  name: string;
  primary: string;
  primaryLight: string;
  background: string;
  card: string;
  text: string;
  textMuted: string;
  border: string;
}

export type ThemeMode = 'light' | 'dark';
export type ColorThemeKey = 'green' | 'blue' | 'orange' | 'purple';

export const COLOR_THEMES = {
  green: {
    name: 'Default Green',
    light: {
      primary: '#1a7a4a',
      primaryLight: '#eaf5ef',
      background: '#f8fafc',
      card: '#ffffff',
      text: '#0f172a',
      textMuted: '#6b7280',
      border: '#e2e8f0',
    },
    dark: {
      primary: '#22c55e',
      primaryLight: '#14532d',
      background: '#0b0f19',
      card: '#1e293b',
      text: '#f8fafc',
      textMuted: '#94a3b8',
      border: '#334155',
    },
  },
  blue: {
    name: 'Ocean Blue',
    light: {
      primary: '#1d4ed8',
      primaryLight: '#eff6ff',
      background: '#f8fafc',
      card: '#ffffff',
      text: '#0f172a',
      textMuted: '#6b7280',
      border: '#e2e8f0',
    },
    dark: {
      primary: '#3b82f6',
      primaryLight: '#172554',
      background: '#0b0f19',
      card: '#1e293b',
      text: '#f8fafc',
      textMuted: '#94a3b8',
      border: '#334155',
    },
  },
  orange: {
    name: 'Sunset Orange',
    light: {
      primary: '#ea580c',
      primaryLight: '#fff7ed',
      background: '#f8fafc',
      card: '#ffffff',
      text: '#0f172a',
      textMuted: '#6b7280',
      border: '#e2e8f0',
    },
    dark: {
      primary: '#f97316',
      primaryLight: '#7c2d12',
      background: '#0b0f19',
      card: '#1e293b',
      text: '#f8fafc',
      textMuted: '#94a3b8',
      border: '#334155',
    },
  },
  purple: {
    name: 'Midnight Purple',
    light: {
      primary: '#7c3aed',
      primaryLight: '#f5f3ff',
      background: '#f8fafc',
      card: '#ffffff',
      text: '#0f172a',
      textMuted: '#6b7280',
      border: '#e2e8f0',
    },
    dark: {
      primary: '#a855f7',
      primaryLight: '#4c1d95',
      background: '#0b0f19',
      card: '#1e293b',
      text: '#f8fafc',
      textMuted: '#94a3b8',
      border: '#334155',
    },
  },
};

interface ThemeContextType {
  mode: ThemeMode;
  colorTheme: ColorThemeKey;
  theme: Theme;
  setMode: (mode: ThemeMode) => Promise<void>;
  setColorTheme: (colorTheme: ColorThemeKey) => Promise<void>;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [mode, setModeState] = useState<ThemeMode>('light');
  const [colorTheme, setColorThemeState] = useState<ColorThemeKey>('green');

  useEffect(() => {
    const loadThemeSettings = async () => {
      try {
        const savedMode = await AsyncStorage.getItem('themeMode');
        const savedColor = await AsyncStorage.getItem('themeColor');

        if (savedMode === 'light' || savedMode === 'dark') {
          setModeState(savedMode);
        }
        if (savedColor && ['green', 'blue', 'orange', 'purple'].includes(savedColor)) {
          setColorThemeState(savedColor as ColorThemeKey);
        }
      } catch (error) {
        console.warn('Failed to load theme settings:', error);
      }
    };
    loadThemeSettings();
  }, []);

  const setMode = async (newMode: ThemeMode) => {
    setModeState(newMode);
    try {
      await AsyncStorage.setItem('themeMode', newMode);
    } catch (error) {
      console.warn('Failed to save theme mode:', error);
    }
  };

  const setColorTheme = async (newColor: ColorThemeKey) => {
    setColorThemeState(newColor);
    try {
      await AsyncStorage.setItem('themeColor', newColor);
    } catch (error) {
      console.warn('Failed to save theme color:', error);
    }
  };

  // Build current dynamic theme object
  const activeColorSet = COLOR_THEMES[colorTheme];
  const themeValues = activeColorSet[mode];

  const theme: Theme = {
    name: activeColorSet.name,
    primary: themeValues.primary,
    primaryLight: themeValues.primaryLight,
    background: themeValues.background,
    card: themeValues.card,
    text: themeValues.text,
    textMuted: themeValues.textMuted,
    border: themeValues.border,
  };

  return (
    <ThemeContext.Provider value={{ mode, colorTheme, theme, setMode, setColorTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
