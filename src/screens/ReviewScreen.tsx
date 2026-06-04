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
import { Colors } from '../constants/colors';
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
  statsBar: {
    backgroundColor: Colors.orange + '15',
    borderRadius: 10,
    padding: 12,
    marginBottom: 16,
  },
  statsText: {
    fontSize: 14,
    color: Colors.orange,
    fontWeight: '600',
    textAlign: 'center',
  },
  reviewActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: -4,
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  passBtn: {
    flex: 1,
    backgroundColor: Colors.green + '15',
    borderRadius: 8,
    padding: 10,
    alignItems: 'center',
  },
  passBtnText: {
    color: Colors.green,
    fontSize: 13,
    fontWeight: '600',
  },
  failBtn: {
    flex: 1,
    backgroundColor: Colors.orange + '15',
    borderRadius: 8,
    padding: 10,
    alignItems: 'center',
  },
  failBtnText: {
    color: Colors.orange,
    fontSize: 13,
    fontWeight: '600',
  },
  emptyList: {
    flex: 1,
  },
});
