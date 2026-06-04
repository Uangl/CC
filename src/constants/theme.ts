import { StyleSheet, TextStyle, ViewStyle } from 'react-native';

export const Palette = {
  // Primary
  primary: '#5B6EF5',
  primaryLight: '#8B96FF',
  primaryDark: '#3D4ED9',
  primaryBg: '#EEF0FF',

  // Accent
  accent: '#FF6B6B',
  accentLight: '#FFE0E0',

  // Success / Warning / Error
  success: '#22C55E',
  successBg: '#ECFDF5',
  warning: '#F59E0B',
  warningBg: '#FFFBEB',
  error: '#EF4444',
  errorBg: '#FEF2F2',

  // Neutral
  bg: '#F5F6FA',
  surface: '#FFFFFF',
  surfaceHover: '#FAFAFA',
  border: '#E8EAF0',
  divider: '#F1F2F6',

  // Text
  text: '#1E2033',
  textSecondary: '#6B7294',
  textMuted: '#A0A5C0',
  textInverse: '#FFFFFF',

  // Status colors for mistake status
  captured: '#A0A5C0',
  diagnosed: '#A0A5C0',
  corrected: '#5B6EF5',
  explained: '#5B6EF5',
  variant_passed: '#22C55E',
  review_due: '#F59E0B',
  mastered: '#22C55E',
};

export const Radius = {
  xs: 6,
  sm: 10,
  md: 14,
  lg: 20,
  xl: 28,
  full: 999,
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 28,
  xxxl: 36,
};

export const Shadow: ViewStyle = {
  shadowColor: '#1E2033',
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.06,
  shadowRadius: 8,
  elevation: 3,
};

export const ShadowLight: ViewStyle = {
  shadowColor: '#1E2033',
  shadowOffset: { width: 0, height: 1 },
  shadowOpacity: 0.04,
  shadowRadius: 4,
  elevation: 1,
};

export const Typo = StyleSheet.create({
  h1: { fontSize: 28, fontWeight: '700', color: Palette.text, letterSpacing: -0.5 } as TextStyle,
  h2: { fontSize: 22, fontWeight: '700', color: Palette.text, letterSpacing: -0.3 } as TextStyle,
  h3: { fontSize: 18, fontWeight: '600', color: Palette.text } as TextStyle,
  body: { fontSize: 15, color: Palette.text, lineHeight: 22 } as TextStyle,
  bodySecondary: { fontSize: 15, color: Palette.textSecondary, lineHeight: 22 } as TextStyle,
  caption: { fontSize: 13, color: Palette.textSecondary } as TextStyle,
  small: { fontSize: 12, color: Palette.textMuted } as TextStyle,
  label: { fontSize: 14, fontWeight: '600', color: Palette.text } as TextStyle,
  button: { fontSize: 16, fontWeight: '600', color: Palette.textInverse } as TextStyle,
});

export const StatusColorMap: Record<string, string> = {
  captured: Palette.captured,
  diagnosed: Palette.diagnosed,
  corrected: Palette.corrected,
  explained: Palette.corrected,
  variant_passed: Palette.variant_passed,
  review_due: Palette.review_due,
  mastered: Palette.mastered,
};
