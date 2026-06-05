import React, { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';
import { useMistakeStore } from '../store/mistakeStore';
import { Palette, Radius, Spacing, ShadowLight, Typo } from '../constants/theme';
import { MistakeCardPreview } from '../components/MistakeCardPreview';
import { EmptyState } from '../components/EmptyState';
import { ReviewScheduler } from '../services/review/ReviewScheduler';

const scheduler = new ReviewScheduler();

export function ReviewScreen({ navigation }: { navigation: any }) {
  const mistakes = useMistakeStore((s) => s.mistakes);
  const updateMistake = useMistakeStore((s) => s.updateMistake);
  const addReviewHistory = useMistakeStore((s) => s.addReviewHistory);

  const dueReviews = useMemo(() => scheduler.getDueReviewMistakes(mistakes), [mistakes]);

  const newMistakes = useMemo(
    () => mistakes.filter((m) => m.status === 'captured' || m.status === 'diagnosed'),
    [mistakes]
  );

  const handleReviewComplete = (mistakeId: string, passed: boolean) => {
    const mistake = mistakes.find((m) => m.id === mistakeId);
    if (!mistake) return;

    addReviewHistory(mistakeId, {
      date: new Date().toISOString(),
      stage: mistake.reviewStage,
      passed,
    });

    const updates = scheduler.advanceAfterReview(mistake, passed);
    updateMistake(mistakeId, updates);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <Text style={styles.title}>今日复习</Text>

        {dueReviews.length > 0 && (
          <View style={styles.statsBar}>
            <Text style={styles.statsText}>
              {dueReviews.length} 道题需要复习
            </Text>
          </View>
        )}

        <FlatList
          data={[...dueReviews, ...newMistakes]}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <View>
              <MistakeCardPreview
                mistake={item}
                onPress={() =>
                  navigation.navigate('MistakeDetail', { mistakeId: item.id })
                }
              />
              {item.nextReviewAt && (
                <View style={styles.reviewActions}>
                  <TouchableOpacity
                    style={styles.passBtn}
                    onPress={() => handleReviewComplete(item.id, true)}
                  >
                    <Text style={styles.passBtnText}>已掌握</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.failBtn}
                    onPress={() => handleReviewComplete(item.id, false)}
                  >
                    <Text style={styles.failBtnText}>还没掌握</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          )}
          ListEmptyComponent={
            <EmptyState
              title="太棒了，暂时没有要复习的内容！"
              subtitle="保持学习节奏，新的错题会自动安排复习。"
            />
          }
          showsVerticalScrollIndicator={false}
          contentContainerStyle={
            dueReviews.length === 0 && newMistakes.length === 0
              ? styles.emptyList
              : undefined
          }
        />
      </View>
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
  title: {
    ...Typo.h2,
    fontSize: 24,
    marginBottom: Spacing.lg,
  },
  statsBar: {
    backgroundColor: Palette.warningBg,
    borderRadius: Radius.md,
    padding: Spacing.md,
    marginBottom: Spacing.lg,
    borderWidth: 1,
    borderColor: Palette.warning + '33',
  },
  statsText: {
    fontSize: 14,
    color: Palette.warning,
    fontWeight: '600',
    textAlign: 'center',
  },
  reviewActions: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginTop: -Spacing.xs,
    marginBottom: Spacing.md,
    paddingHorizontal: Spacing.xs,
  },
  passBtn: {
    flex: 1,
    backgroundColor: Palette.successBg,
    borderRadius: Radius.sm,
    padding: Spacing.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Palette.success + '33',
    ...ShadowLight,
  },
  passBtnText: {
    color: Palette.success,
    fontSize: 13,
    fontWeight: '700',
  },
  failBtn: {
    flex: 1,
    backgroundColor: Palette.warningBg,
    borderRadius: Radius.sm,
    padding: Spacing.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Palette.warning + '33',
    ...ShadowLight,
  },
  failBtnText: {
    color: Palette.warning,
    fontSize: 13,
    fontWeight: '700',
  },
  emptyList: {
    flex: 1,
  },
});
