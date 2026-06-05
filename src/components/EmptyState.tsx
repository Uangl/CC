import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Palette, Spacing, Typo } from '../constants/theme';

interface Props {
  title: string;
  subtitle?: string;
  icon?: string;
}

export function EmptyState({ title, subtitle, icon = '📝' }: Props) {
  return (
    <View style={styles.container}>
      <Text style={styles.icon}>{icon}</Text>
      <Text style={styles.title}>{title}</Text>
      {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  icon: {
    fontSize: 48,
    marginBottom: Spacing.lg,
  },
  title: {
    ...Typo.body,
    color: Palette.text,
    textAlign: 'center',
    fontWeight: '600',
  },
  subtitle: {
    ...Typo.caption,
    textAlign: 'center',
    marginTop: Spacing.sm,
    lineHeight: 20,
  },
});
