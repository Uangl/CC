import React, { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  SafeAreaView,
} from 'react-native';
import { useMistakeStore } from '../store/mistakeStore';
import { Colors } from '../constants/colors';
import { AnalyticsService } from '../services/analytics/AnalyticsService';
import { EmptyState } from '../components/EmptyState';
import { GRADE_LABELS } from '../constants/mistakeReasons';

const analytics = new AnalyticsService();

export function WeakPointsScreen() {
  const mistakes = useMistakeStore((s) => s.mistakes);
  const weakPoints = useMemo(() => analytics.getWeakPoints(mistakes), [mistakes]);

  const getMasteryColor = (mastery: number) => {
    if (mastery < 40) return Colors.error;
    if (mastery < 70) return Colors.orange;
    return Colors.green;
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <Text style={styles.title}>薄弱知识点</Text>

        <FlatList
          data={weakPoints}
          keyExtractor={(item) => item.knowledgePointId}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <View>
                  <Text style={styles.kpName}>{item.knowledgePointName}</Text>
                  <Text style={styles.kpGrade}>{GRADE_LABELS[item.grade]}</Text>
                </View>
                <View style={styles.masteryCircle}>
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
          contentContainerStyle={weakPoints.length === 0 ? styles.emptyList : undefined}
        />
      </View>
    </SafeAreaView>
  );
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
    marginBottom: 16,
  },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 18,
    marginBottom: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  kpName: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 2,
  },
  kpGrade: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  masteryCircle: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: Colors.grayLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  masteryText: {
    fontSize: 14,
    fontWeight: '700',
  },
  progressBar: {
    height: 6,
    backgroundColor: Colors.grayLight,
    borderRadius: 3,
    marginBottom: 14,
  },
  progressFill: {
    height: 6,
    borderRadius: 3,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  statItem: {
    flex: 1,
    backgroundColor: Colors.grayLight,
    borderRadius: 8,
    padding: 10,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text,
  },
  statLabel: {
    fontSize: 11,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  reasonTag: {
    backgroundColor: Colors.orange + '12',
    borderRadius: 6,
    padding: 8,
    marginBottom: 10,
  },
  reasonText: {
    fontSize: 13,
    color: Colors.orange,
  },
  suggestion: {
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
  emptyList: {
    flex: 1,
  },
});
