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
import { Palette, Radius, Spacing, Shadow, Typo } from '../constants/theme';
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

  const masteryColor = (mastery: number) =>
    mastery < 40 ? Palette.error : mastery < 70 ? Palette.warning : Palette.success;

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
            <View style={[styles.actionIconWrap, { backgroundColor: Palette.surface }]}>
              <Text style={styles.actionIcon}>📷</Text>
            </View>
            <Text style={styles.actionLabel}>拍错题</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionBtn, styles.actionReview]}
            onPress={() => navigation.navigate('Review')}
          >
            <View style={[styles.actionIconWrap, { backgroundColor: Palette.surface }]}>
              <Text style={styles.actionIcon}>📖</Text>
            </View>
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
            <View style={[styles.actionIconWrap, { backgroundColor: Palette.surface }]}>
              <Text style={styles.actionIcon}>📊</Text>
            </View>
            <Text style={styles.actionLabel}>薄弱点</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionBtn, styles.actionList]}
            onPress={() => navigation.getParent()?.navigate('错题')}
          >
            <View style={[styles.actionIconWrap, { backgroundColor: Palette.surface }]}>
              <Text style={styles.actionIcon}>📚</Text>
            </View>
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
                  <Text style={[styles.weakMastery, { color: masteryColor(wp.mastery) }]}>
                    {wp.mastery}%
                  </Text>
                </View>
                <View style={styles.progressBar}>
                  <View
                    style={[
                      styles.progressFill,
                      {
                        width: `${wp.mastery}%`,
                        backgroundColor: masteryColor(wp.mastery),
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
    backgroundColor: Palette.bg,
  },
  container: {
    flex: 1,
    padding: Spacing.xl,
  },
  header: {
    marginBottom: Spacing.xxl,
  },
  appName: {
    ...Typo.h1,
    color: Palette.primary,
    marginBottom: Spacing.sm,
  },
  greeting: {
    ...Typo.h3,
    marginBottom: Spacing.xs,
  },
  tip: {
    ...Typo.caption,
    lineHeight: 20,
  },
  actionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
    marginBottom: Spacing.xxl,
  },
  actionBtn: {
    width: '47%',
    borderRadius: Radius.lg,
    padding: Spacing.xl,
    alignItems: 'center',
    position: 'relative',
    ...Shadow,
  },
  actionPrimary: {
    backgroundColor: Palette.primaryBg,
  },
  actionReview: {
    backgroundColor: Palette.warningBg,
  },
  actionWeak: {
    backgroundColor: Palette.successBg,
  },
  actionList: {
    backgroundColor: Palette.accentLight,
  },
  actionIconWrap: {
    width: 52,
    height: 52,
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
    ...Shadow,
  },
  actionIcon: {
    fontSize: 28,
  },
  actionLabel: {
    ...Typo.label,
  },
  badge: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: Palette.error,
    borderRadius: Radius.full,
    minWidth: 22,
    height: 22,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  badgeText: {
    color: Palette.textInverse,
    fontSize: 11,
    fontWeight: '700',
  },
  section: {
    marginBottom: Spacing.xl,
  },
  sectionTitle: {
    ...Typo.label,
    color: Palette.textSecondary,
    marginBottom: Spacing.md,
  },
  weakCard: {
    backgroundColor: Palette.surface,
    borderRadius: Radius.md,
    padding: Spacing.lg,
    marginBottom: Spacing.sm,
    ...Shadow,
  },
  weakHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  weakName: {
    ...Typo.label,
  },
  weakMastery: {
    fontSize: 14,
    fontWeight: '700',
  },
  progressBar: {
    height: 6,
    backgroundColor: Palette.divider,
    borderRadius: Radius.xs,
    marginBottom: Spacing.sm,
    overflow: 'hidden',
  },
  progressFill: {
    height: 6,
    borderRadius: Radius.xs,
  },
  weakReason: {
    ...Typo.small,
  },
  reviewItem: {
    backgroundColor: Palette.surface,
    borderRadius: Radius.md,
    padding: Spacing.lg,
    marginBottom: Spacing.sm,
    ...Shadow,
  },
  reviewQuestion: {
    ...Typo.body,
    marginBottom: Spacing.xs,
  },
  reviewKp: {
    ...Typo.small,
    color: Palette.primary,
  },
});
