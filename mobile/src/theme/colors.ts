// src/theme/colors.ts

export const Colors = {
  // ─── Brand ────────────────────────────────────────────────
  primary: {
    50:  '#f0fdf4',
    100: '#dcfce7',
    200: '#bbf7d0',
    300: '#86efac',
    400: '#4ade80',
    500: '#22c55e',
    600: '#16a34a',  // Main brand color
    700: '#15803d',
    800: '#166534',
    900: '#14532d',
  },

  // ─── Neutrals ─────────────────────────────────────────────
  neutral: {
    0:   '#ffffff',
    50:  '#fafafa',
    100: '#f5f5f5',
    150: '#efefef',
    200: '#e5e5e5',
    300: '#d4d4d4',
    400: '#a3a3a3',
    500: '#737373',
    600: '#525252',
    700: '#404040',
    800: '#262626',
    900: '#171717',
  },

  // ─── Semantic ─────────────────────────────────────────────
  success:   '#16a34a',
  warning:   '#f59e0b',
  error:     '#ef4444',
  info:      '#3b82f6',

  // ─── UI Tokens ────────────────────────────────────────────
  background:     '#F5FDF8',
  surface:        '#ffffff',
  surfaceAlt:     '#f0fdf4',
  border:         '#e2f5ea',
  borderStrong:   '#bbf7d0',

  textPrimary:    '#171717',
  textSecondary:  '#525252',
  textTertiary:   '#a3a3a3',
  textOnPrimary:  '#ffffff',

  // ─── Alarm Screen ─────────────────────────────────────────
  alarmGlow:      'rgba(22, 163, 74, 0.3)',
  alarmGlowStrong:'rgba(22, 163, 74, 0.6)',

  // ─── Glassmorphism ────────────────────────────────────────
  glassBg:        'rgba(255, 255, 255, 0.45)',
  glassBorder:    'rgba(255, 255, 255, 0.75)',
  glassGreen:     'rgba(240, 253, 244, 0.55)',
} as const;

export type ColorToken = keyof typeof Colors;
