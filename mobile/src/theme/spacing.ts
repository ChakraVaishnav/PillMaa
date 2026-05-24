// src/theme/spacing.ts

export const Spacing = {
  0:   0,
  1:   4,
  2:   8,
  3:   12,
  4:   16,
  5:   20,
  6:   24,
  7:   28,
  8:   32,
  10:  40,
  12:  48,
  16:  64,
  20:  80,
  24:  96,
} as const;

export const BorderRadius = {
  xs:   6,
  sm:   8,
  md:   12,
  lg:   16,
  xl:   20,
  '2xl': 24,
  '3xl': 32,
  full: 9999,
} as const;

export const Layout = {
  screenPadding:    20,
  cardPadding:      20,
  sectionSpacing:   32,
  headerHeight:     60,
  tabBarHeight:     80,
  fabSize:          60,
  inputHeight:      54,
  buttonHeight:     54,
  cardBorderRadius: 20,
} as const;
