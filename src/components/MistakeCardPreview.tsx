import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Mistake } from '../models/types';
import { Colors } from '../constants/colors';
import { StatusBadge } from './StatusBadge';
import { GRADE_LABELS } from '../constants/mistakeReasons';

interface Props {
  mistake: Mistake;
  onPress: () => void;
}

export function MistakeCardPreview({ mistake, onPress }: Props) {
  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.header}>
        <Text style={styles.grade}>{GRADE_LABELS[mistake.grade]}</Text>
        <StatusBadge status={mistake.status} />
      </View>
      <Text style={styles.question} numberOfLines={2}>
        {mistake.questionText}
      </Text>
      <View style={styles.footer}>
        <Text style={styles.knowledgePoint}>{mistake.knowledgePointName}</Text>
        {mistake.nextReviewAt && mistake.status !== 'mastered' && (
          <Text style={styles.reviewTime}>
            {formatReviewTime(mistake.nextReviewAt)}
          </Text>
        )}
      </View>
    </TouchableOpacity>
  );
}

function formatReviewTime(isoDate: string): string {
  const date = new Date(isoDate);
  const now = new Date();
  const diffMs = date.getTime() - now.getTime();
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays <= 0) return '今日复习';
  if (diffDays === 1) return '明天复习';
  return `${diffDays}天后复习`;
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  grade: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  question: {
    fontSize: 15,
    color: Colors.text,
    lineHeight: 22,
    marginBottom: 10,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  knowledgePoint: {
    fontSize: 12,
    color: Colors.primary,
    backgroundColor: Colors.primary + '10',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  reviewTime: {
    fontSize: 12,
    color: Colors.orange,
  },
});
