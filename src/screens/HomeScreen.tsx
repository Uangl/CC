import React, { useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';
import { useMistakeStore } from '../store/mistakeStore';
import { Colors } from '../constants/colors';
import { AnalyticsService } from '../services/analytics/AnalyticsService';

const analytics = new AnalyticsService();

export function HomeScreen({ navigation }: { navigation: any }) {
  const { mistakes, initialized, initialize } = useMistakeStore();

  useEffect(() => {
    if (!initialized) initialize();
  }, [initialized, initialize]);

  const dueReviews = useMemo(
    () =>
      mistakes.filter((m) => {
        if (m.status === 'mastered') return false;
        if (!m.nextReviewAt) return false;
        return new Date(m.nextReviewAt) <= new Date();
      }),
    [mistakes]
  );

  const weakPoints = useMemo(
    () => analytics.getWeakPoints(mistakes).slice(0, 3),
    [mistakes]
  );

  const newMistakes = useMemo(
    () => mistakes.filter((m) => m.status === 'captured' || m.status === 'diagnosed'),
    [mistakes]
  );

  const greeting =
    dueReviews.length > 0
      ? `今天要清理 ${dueReviews.length} 个小坑`
      : newMistakes.length > 0
        ? `有 ${newMistakes.length} 道新错题等你处理`
        : '太棒了，暂时没有要复习的内容！';

  const tip =
    dueReviews.length > 0
      ? '先讲会 1 道错题，再练 3 道变式题'
      : '每天少量高质量复习，效果最好';

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.appName}>错题小老师</Text>
          <Text style={styles.greeting}>{greeting}</Text>
          <Text style={styles.tip}>{tip}</Text>
        </View>

        <View style={styles.actionGrid}>
          <TouchableOpacity
            style={[styles.actionBtn, styles.actionPrimary]}
            onPress={() => navigation.navigate('Capture')}
          >
            <Text style={styles.actionIcon}>📷</Text>
            <Text style={styles.actionLabel}>拍错题</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionBtn, styles.actionReview]}
            onPress={() => navigation.navigate('Review')}
          >
            <Text style={styles.actionIcon}>📖</Text>
            <Text style={styles.actionLabel}>今日复习</Text>
            {dueReviews.length > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{dueReviews.length}</Text>
              </View>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionBtn, styles.actionWeak]}
            onPress={() => navigation.getParent()?.navigate('薄弱点')}
          >
            <Text style={styles.actionIcon}>📊</Text>
            <Text style={styles.actionLabel}>薄弱点</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionBtn, styles.actionList]}
            onPress={() => navigation.getParent()?.navigate('错题')}
          >
            <Text style={styles.actionIcon}>📚</Text>
            <Text style={styles.actionLabel}>错题本</Text>
          </TouchableOpacity>
        </View>

        {weakPoints.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>本周薄弱知识点</Text>
            {weakPoints.map((wp) => (
              <View key={wp.knowledgePointId} style={styles.weakCard}>
                <View style={styles.weakHeader}>
                  <Text style={styles.weakName}>{wp.knowledgePointName}</Text>
                  <Text
                    style={[
                      styles.weakMastery,
                      {
                        color:
                          wp.mastery < 40
                            ? Colors.error
                            : wp.mastery < 70
                              ? Colors.orange
                              : Colors.green,
                      },
                    ]}
                  >
                    {wp.mastery}%
                  </Text>
                </View>
                <View style={styles.progressBar}>
                  <View
                    style={[
                      styles.progressFill,
                      {
                        width: `${wp.mastery}%`,
                        backgroundColor:
                          wp.mastery < 40
                            ? Colors.error
                            : wp.mastery < 70
                              ? Colors.orange
                              : Colors.green,
                      },
                    ]}
                  />
                </View>
                <Text style={styles.weakReason}>主要错因：{wp.mainReasonLabel}</Text>
              </View>
            ))}
          </View>
        )}

        {dueReviews.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>待复习错题</Text>
            {dueReviews.slice(0, 3).map((m) => (
              <TouchableOpacity
                key={m.id}
                style={styles.reviewItem}
                onPress={() => navigation.navigate('MistakeDetail', { mistakeId: m.id })}
              >
                <Text style={styles.reviewQuestion} numberOfLines={1}>
                  {m.questionText}
                </Text>
                <Text style={styles.reviewKp}>{m.knowledgePointName}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        <View style={{ height: 20 }} />
      </ScrollView>
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
  header: {
    marginBottom: 24,
  },
  appName: {
    fontSize: 28,
    fontWeight: '700',
    color: Colors.primary,
    marginBottom: 8,
  },
  greeting: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 4,
  },
  tip: {
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
  actionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 24,
  },
  actionBtn: {
    width: '47%',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    position: 'relative',
  },
  actionPrimary: {
    backgroundColor: Colors.primary + '15',
  },
  actionReview: {
    backgroundColor: Colors.orange + '15',
  },
  actionWeak: {
    backgroundColor: Colors.secondary + '15',
  },
  actionList: {
    backgroundColor: '#8B5CF6' + '15',
  },
  actionIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  actionLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.text,
  },
  badge: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: Colors.error,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  badgeText: {
    color: Colors.white,
    fontSize: 11,
    fontWeight: '700',
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 12,
  },
  weakCard: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
  },
  weakHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  weakName: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
  },
  weakMastery: {
    fontSize: 14,
    fontWeight: '700',
  },
  progressBar: {
    height: 6,
    backgroundColor: Colors.grayLight,
    borderRadius: 3,
    marginBottom: 6,
  },
  progressFill: {
    height: 6,
    borderRadius: 3,
  },
  weakReason: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  reviewItem: {
    backgroundColor: Colors.surface,
    borderRadius: 10,
    padding: 14,
    marginBottom: 8,
  },
  reviewQuestion: {
    fontSize: 14,
    color: Colors.text,
    marginBottom: 4,
  },
  reviewKp: {
    fontSize: 12,
    color: Colors.primary,
  },
});
