import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MistakeStatus } from '../models/types';
import { StatusColors } from '../constants/colors';
import { STATUS_LABELS } from '../constants/mistakeReasons';

interface Props {
  status: MistakeStatus;
}

export function StatusBadge({ status }: Props) {
  const color = StatusColors[status] || '#9CA3AF';
  const label = STATUS_LABELS[status] || status;

  return (
    <View style={[styles.badge, { backgroundColor: color + '20' }]}>
      <View style={[styles.dot, { backgroundColor: color }]} />
      <Text style={[styles.text, { color }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 5,
  },
  text: {
    fontSize: 12,
    fontWeight: '500',
  },
});
