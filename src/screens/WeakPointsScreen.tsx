import React, { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  SafeAreaView,
} from 'react-native';
import { useMistakeStore } from '../store/mistakeStore';
import { Palette, Radius, Spacing, Shadow, Typo } from '../constants/theme';
import { AnalyticsService } from '../services/analytics/AnalyticsService';
import { EmptyState } from '../components/EmptyState';
import { GRADE_LABELS } from '../constants/mistakeReasons';

const analytics = new AnalyticsService();

export function WeakPointsScreen() {
  const mistakes = useMistakeStore((s) => s.mistakes);
  const weakPoints = useMemo(() => analytics.getWeakPoints(mistakes), [mistakes]);

  const getMasteryColor = (mastery: number) => {
    if (mastery < 40) return Palette.error;
    if (mastery < 70) return Palette.warning;
    return Palette.success;
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <Text style={Typo.h2}>薄弱知识点</Text>

        <FlatList
          data={weakPoints}
          keyExtractor={(item) => item.knowledgePointId}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <View style={styles.cardHeaderInfo}>
                  <Text style={styles.kpName}>{item.knowledgePointName}</Text>
                  <Text style={styles.kpGrade}>{GRADE_LABELS[item.grade]}</Text>
                </View>
                <View
                  style={[
                    styles.masteryCircle,
                    { backgroundColor: getMasteryColor(item.mastery) + '18' },
                  ]}
                >
                  <Text
                    style={[styles.masteryText, { color: getMasteryColor(item.mastery) }]}
                  >
                    {item.mastery}%
                  </Text>
                </View>
              </View>

              <View style={styles.progressBar}>
                <View
                  style={[
                    styles.progressFill,
                    {
                      width: `${item.mastery}%`,
                      backgroundColor: getMasteryColor(item.mastery),
                    },
                  ]}
                />
              </View>

              <View style={styles.statsRow}>
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>{item.totalMistakes}</Text>
                  <Text style={styles.statLabel}>错题数</Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>{item.recentMistakes}</Text>
                  <Text style={styles.statLabel}>近7天</Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>{item.masteredCount}</Text>
                  <Text style={styles.statLabel}>已掌握</Text>
                </View>
              </View>

              <View style={styles.reasonTag}>
                <Text style={styles.reasonText}>
                  主要错因：{item.mainReasonLabel}
                </Text>
              </View>

              <Text style={styles.suggestion}>{item.suggestion}</Text>
            </View>
          )}
          ListEmptyComponent={
            <EmptyState
              title="暂无薄弱知识点"
              subtitle="录入错题后，系统会自动分析你的薄弱环节。"
            />
          }
          showsVerticalScrollIndicator={false}
          contentContainerStyle={
            weakPoints.length === 0 ? styles.emptyList : styles.listContent
          }
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Palette.bg,
  },
  container: {
    flex: 1,
    padding: Spacing.xl,
  },
  listContent: {
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.xl,
  },
  card: {
    backgroundColor: Palette.surface,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    ...Shadow,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  cardHeaderInfo: {
    flex: 1,
    marginRight: Spacing.md,
  },
  kpName: {
    ...Typo.h3,
    marginBottom: 2,
  },
  kpGrade: {
    ...Typo.small,
  },
  masteryCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    justifyContent: 'center',
    alignItems: 'center',
  },
  masteryText: {
    fontSize: 15,
    fontWeight: '700',
  },
  progressBar: {
    height: 8,
    backgroundColor: Palette.divider,
    borderRadius: Radius.full,
    marginBottom: Spacing.lg,
    overflow: 'hidden',
  },
  progressFill: {
    height: 8,
    borderRadius: Radius.full,
  },
  statsRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  statItem: {
    flex: 1,
    backgroundColor: Palette.bg,
    borderRadius: Radius.sm,
    paddingVertical: Spacing.md,
    alignItems: 'center',
  },
  statValue: {
    ...Typo.h3,
    fontWeight: '700',
  },
  statLabel: {
    ...Typo.small,
    marginTop: 2,
  },
  reasonTag: {
    backgroundColor: Palette.warningBg,
    borderRadius: Radius.sm,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    marginBottom: Spacing.sm,
  },
  reasonText: {
    fontSize: 13,
    color: Palette.warning,
    fontWeight: '600',
  },
  suggestion: {
    ...Typo.caption,
    lineHeight: 20,
  },
  emptyList: {
    flex: 1,
  },
});
