import React, { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
} from 'react-native';
import { useMistakeStore } from '../store/mistakeStore';
import { Colors } from '../constants/colors';
import { AnalyticsService } from '../services/analytics/AnalyticsService';
import { EmptyState } from '../components/EmptyState';

const analytics = new AnalyticsService();

export function ParentReportScreen() {
  const mistakes = useMistakeStore((s) => s.mistakes);
  const report = useMemo(() => analytics.getParentReport(mistakes), [mistakes]);

  if (mistakes.length === 0) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <EmptyState
          title="暂无数据"
          subtitle="录入错题后，系统会自动生成家长周报。"
        />
      </SafeAreaView>
    );
  }

  const getMasteryColor = (mastery: number) => {
    if (mastery < 40) return Colors.error;
    if (mastery < 70) return Colors.orange;
    return Colors.green;
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>家长周报</Text>
        <Text style={styles.subtitle}>
          {formatDateRange(report.weekStart, report.weekEnd)}
        </Text>

        <View style={styles.summaryRow}>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryValue}>{report.newMistakesCount}</Text>
            <Text style={styles.summaryLabel}>本周新增错题</Text>
          </View>
          <View style={styles.summaryCard}>
            <Text style={[styles.summaryValue, { color: Colors.green }]}>
              {report.masteredCount}
            </Text>
            <Text style={styles.summaryLabel}>本周已出库</Text>
          </View>
        </View>

        {report.topWeakPoints.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>薄弱知识点 Top {report.topWeakPoints.length}</Text>
            {report.topWeakPoints.map((wp) => (
              <View key={wp.knowledgePointId} style={styles.weakItem}>
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
        )}

        {report.reasonDistribution.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>错因分布</Text>
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
  safeArea: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  container: {
    flex: 1,
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 20,
  },
  summaryRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  summaryValue: {
    fontSize: 32,
    fontWeight: '700',
    color: Colors.primary,
    marginBottom: 4,
  },
  summaryLabel: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 12,
  },
  weakItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 10,
    padding: 14,
    marginBottom: 8,
  },
  weakInfo: {
    flex: 1,
  },
  weakName: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 2,
  },
  weakDetail: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  weakMastery: {
    fontSize: 16,
    fontWeight: '700',
  },
  reasonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    gap: 8,
  },
  reasonLabel: {
    width: 100,
    fontSize: 13,
    color: Colors.text,
  },
  reasonBarContainer: {
    flex: 1,
    height: 8,
    backgroundColor: Colors.grayLight,
    borderRadius: 4,
  },
  reasonBar: {
    height: 8,
    backgroundColor: Colors.primary,
    borderRadius: 4,
  },
  reasonPercent: {
    width: 36,
    fontSize: 13,
    color: Colors.textSecondary,
    textAlign: 'right',
  },
  suggestionCard: {
    backgroundColor: Colors.primary + '08',
    borderRadius: 12,
    padding: 16,
    marginBottom: 10,
    borderLeftWidth: 3,
    borderLeftColor: Colors.primary,
  },
  suggestionText: {
    fontSize: 14,
    color: Colors.text,
    lineHeight: 22,
  },
});
