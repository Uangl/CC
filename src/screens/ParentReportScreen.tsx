import React, { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
} from 'react-native';
import { useMistakeStore } from '../store/mistakeStore';
import { Palette, Radius, Spacing, Shadow, Typo } from '../constants/theme';
import { AnalyticsService } from '../services/analytics/AnalyticsService';
import { EmptyState } from '../components/EmptyState';

const analytics = new AnalyticsService();

export function ParentReportScreen() {
  const mistakes = useMistakeStore((s) => s.mistakes);
  const report = useMemo(() => analytics.getParentReport(mistakes), [mistakes]);

  if (mistakes.length === 0) {
    return (
      <SafeAreaView style={styles.safe}>
        <EmptyState
          title="暂无数据"
          subtitle="录入错题后，系统会自动生成家长周报。"
        />
      </SafeAreaView>
    );
  }

  const getMasteryColor = (mastery: number) => {
    if (mastery < 40) return Palette.error;
    if (mastery < 70) return Palette.warning;
    return Palette.success;
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        <Text style={Typo.h2}>家长周报</Text>
        <Text style={styles.subtitle}>
          {formatDateRange(report.weekStart, report.weekEnd)}
        </Text>

        <View style={styles.summaryRow}>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryValue}>{report.newMistakesCount}</Text>
            <Text style={styles.summaryLabel}>本周新增错题</Text>
          </View>
          <View style={styles.summaryCard}>
            <Text style={[styles.summaryValue, { color: Palette.success }]}>
              {report.masteredCount}
            </Text>
            <Text style={styles.summaryLabel}>本周已出库</Text>
          </View>
        </View>

        {report.topWeakPoints.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>薄弱知识点 Top {report.topWeakPoints.length}</Text>
            <View style={styles.card}>
              {report.topWeakPoints.map((wp, idx) => (
                <View
                  key={wp.knowledgePointId}
                  style={[
                    styles.weakItem,
                    idx === report.topWeakPoints.length - 1 && styles.weakItemLast,
                  ]}
                >
                  <View style={styles.weakInfo}>
                    <Text style={styles.weakName}>{wp.knowledgePointName}</Text>
                    <Text style={styles.weakDetail}>
                      错题 {wp.totalMistakes} 道 · {wp.mainReasonLabel}
                    </Text>
                  </View>
                  <Text
                    style={[styles.weakMastery, { color: getMasteryColor(wp.mastery) }]}
                  >
                    {wp.mastery}%
                  </Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {report.reasonDistribution.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>错因分布</Text>
            <View style={styles.card}>
              {report.reasonDistribution.map((item) => (
                <View key={item.reason} style={styles.reasonRow}>
                  <Text style={styles.reasonLabel}>{item.label}</Text>
                  <View style={styles.reasonBarContainer}>
                    <View
                      style={[
                        styles.reasonBar,
                        { width: `${item.percentage}%` },
                      ]}
                    />
                  </View>
                  <Text style={styles.reasonPercent}>{item.percentage}%</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>陪练建议</Text>
          {report.suggestions.map((s, idx) => (
            <View key={idx} style={styles.suggestionCard}>
              <Text style={styles.suggestionText}>{s}</Text>
            </View>
          ))}
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

function formatDateRange(start: string, end: string): string {
  const s = new Date(start);
  const e = new Date(end);
  return `${s.getMonth() + 1}月${s.getDate()}日 - ${e.getMonth() + 1}月${e.getDate()}日`;
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
  subtitle: {
    ...Typo.caption,
    marginTop: Spacing.xs,
    marginBottom: Spacing.xl,
  },
  summaryRow: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginBottom: Spacing.xxl,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: Palette.surface,
    borderRadius: Radius.lg,
    padding: Spacing.xl,
    alignItems: 'center',
    ...Shadow,
  },
  summaryValue: {
    ...Typo.h1,
    color: Palette.primary,
    marginBottom: Spacing.xs,
  },
  summaryLabel: {
    ...Typo.caption,
  },
  section: {
    marginBottom: Spacing.xxl,
  },
  sectionTitle: {
    ...Typo.label,
    color: Palette.textSecondary,
    marginBottom: Spacing.sm,
  },
  card: {
    backgroundColor: Palette.surface,
    borderRadius: Radius.md,
    padding: Spacing.lg,
    ...Shadow,
  },
  weakItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Palette.divider,
  },
  weakItemLast: {
    borderBottomWidth: 0,
    paddingBottom: 0,
  },
  weakInfo: {
    flex: 1,
    marginRight: Spacing.md,
  },
  weakName: {
    ...Typo.body,
    fontWeight: '600',
    marginBottom: 2,
  },
  weakDetail: {
    ...Typo.small,
  },
  weakMastery: {
    fontSize: 16,
    fontWeight: '700',
  },
  reasonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
    gap: Spacing.sm,
  },
  reasonLabel: {
    width: 100,
    ...Typo.caption,
    color: Palette.text,
  },
  reasonBarContainer: {
    flex: 1,
    height: 8,
    backgroundColor: Palette.divider,
    borderRadius: Radius.full,
    overflow: 'hidden',
  },
  reasonBar: {
    height: 8,
    backgroundColor: Palette.primary,
    borderRadius: Radius.full,
  },
  reasonPercent: {
    width: 36,
    ...Typo.caption,
    textAlign: 'right',
  },
  suggestionCard: {
    backgroundColor: Palette.primaryBg,
    borderRadius: Radius.md,
    padding: Spacing.lg,
    marginBottom: Spacing.sm,
    borderLeftWidth: 3,
    borderLeftColor: Palette.primary,
  },
  suggestionText: {
    ...Typo.body,
    color: Palette.primaryDark,
    lineHeight: 22,
  },
});
