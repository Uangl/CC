import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  SafeAreaView,
} from 'react-native';
import { useMistakeStore } from '../store/mistakeStore';
import { Palette, Radius, Spacing, Shadow, Typo } from '../constants/theme';
import { getVariantGenerator } from '../services';
import { VariantQuestion } from '../models/types';

const generator = getVariantGenerator();

export function VariantPracticeScreen({ route, navigation }: { route: any; navigation: any }) {
  const { mistakeId } = route.params as { mistakeId: string };
  const mistake = useMistakeStore((s) => s.getMistakeById(mistakeId));
  const updateVariantResults = useMistakeStore((s) => s.updateVariantResults);

  const [variants, setVariants] = useState<VariantQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [userAnswer, setUserAnswer] = useState('');
  const [showResult, setShowResult] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [correctCount, setCorrectCount] = useState(0);
  const [completed, setCompleted] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (mistake) {
      generator.generateVariants(mistake, 3).then((v) => {
        setVariants(v);
        setLoading(false);
      });
    }
  }, [mistake]);

  if (!mistake || loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.center}>
          <Text style={styles.loadingText}>
            {!mistake ? '错题不存在' : '正在生成变式题...'}
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  const currentVariant = variants[currentIndex];

  const handleSubmit = () => {
    if (!userAnswer.trim()) {
      Alert.alert('请输入答案');
      return;
    }

    const normalizedUser = userAnswer.trim().replace(/\s+/g, '');
    const normalizedAnswer = currentVariant.answer.trim().replace(/\s+/g, '');
    const correct = normalizedUser === normalizedAnswer;

    setIsCorrect(correct);
    setShowResult(true);
    if (correct) {
      setCorrectCount((c) => c + 1);
    }
  };

  const handleNext = () => {
    if (currentIndex + 1 >= variants.length) {
      const finalCorrect = correctCount + (isCorrect ? 0 : 0);
      updateVariantResults(mistake.id, variants, finalCorrect);
      setCompleted(true);
      return;
    }

    setCurrentIndex((i) => i + 1);
    setUserAnswer('');
    setShowResult(false);
    setIsCorrect(false);
  };

  if (completed) {
    const passed = correctCount >= 2;
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.resultContainer}>
          <View style={styles.resultCard}>
            <View
              style={[
                styles.resultIconCircle,
                { backgroundColor: passed ? Palette.successBg : Palette.warningBg },
              ]}
            >
              <Text style={styles.resultIcon}>{passed ? '🎉' : '💪'}</Text>
            </View>
            <Text style={styles.resultTitle}>
              {passed ? '变式题通过！' : '继续加油！'}
            </Text>
            <Text
              style={[
                styles.resultScore,
                { color: passed ? Palette.success : Palette.warning },
              ]}
            >
              {correctCount}/{variants.length} 道正确
            </Text>
            <Text style={styles.resultDesc}>
              {passed
                ? '做得很好！系统已安排下一次复习，帮你彻底掌握这个知识点。'
                : '还需要多练习，建议重新看看解析，再试一次。'}
            </Text>
            <TouchableOpacity
              style={styles.backBtn}
              onPress={() => navigation.goBack()}
            >
              <Text style={styles.backBtnText}>返回</Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>变式练习</Text>
          <Text style={styles.headerProgress}>
            第 {currentIndex + 1}/{variants.length} 题
          </Text>
        </View>

        <View style={styles.progressBar}>
          <View
            style={[
              styles.progressFill,
              { width: `${((currentIndex + (showResult ? 1 : 0)) / variants.length) * 100}%` },
            ]}
          />
        </View>

        <View style={styles.questionCard}>
          <Text style={styles.knowledgeTag}>{mistake.knowledgePointName}</Text>
          <Text style={styles.questionText}>{currentVariant.questionText}</Text>
        </View>

        {!showResult ? (
          <View style={styles.answerSection}>
            <Text style={styles.answerLabel}>你的答案</Text>
            <TextInput
              style={styles.answerInput}
              placeholder="输入答案..."
              value={userAnswer}
              onChangeText={setUserAnswer}
              placeholderTextColor={Palette.textMuted}
            />
            <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit}>
              <Text style={styles.submitBtnText}>提交答案</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.resultSection}>
            <View
              style={[
                styles.resultBanner,
                {
                  backgroundColor: isCorrect ? Palette.successBg : Palette.errorBg,
                  borderColor: isCorrect ? Palette.success : Palette.error,
                },
              ]}
            >
              <Text style={styles.resultEmoji}>{isCorrect ? '✅' : '❌'}</Text>
              <Text
                style={[
                  styles.resultText,
                  { color: isCorrect ? Palette.success : Palette.error },
                ]}
              >
                {isCorrect ? '回答正确！' : '回答有误'}
              </Text>
            </View>

            <View style={styles.answerCompare}>
              <View style={styles.answerItem}>
                <Text style={styles.compareLabel}>你的答案</Text>
                <Text style={styles.compareValue}>{userAnswer}</Text>
              </View>
              <View style={styles.answerItem}>
                <Text style={styles.compareLabel}>正确答案</Text>
                <Text style={[styles.compareValue, { color: Palette.success }]}>
                  {currentVariant.answer}
                </Text>
              </View>
            </View>

            <View style={styles.explanationBox}>
              <Text style={styles.explanationLabel}>解析</Text>
              <Text style={styles.explanationText}>
                {currentVariant.explanation}
              </Text>
            </View>

            <TouchableOpacity style={styles.nextBtn} onPress={handleNext}>
              <Text style={styles.nextBtnText}>
                {currentIndex + 1 >= variants.length ? '查看结果' : '下一题'}
              </Text>
            </TouchableOpacity>
          </View>
        )}
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
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    ...Typo.body,
    color: Palette.textSecondary,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  headerTitle: {
    ...Typo.h2,
  },
  headerProgress: {
    fontSize: 14,
    color: Palette.primary,
    fontWeight: '700',
  },
  progressBar: {
    height: 6,
    backgroundColor: Palette.divider,
    borderRadius: Radius.full,
    marginBottom: Spacing.xl,
    overflow: 'hidden',
  },
  progressFill: {
    height: 6,
    backgroundColor: Palette.primary,
    borderRadius: Radius.full,
  },
  questionCard: {
    backgroundColor: Palette.surface,
    borderRadius: Radius.lg,
    padding: Spacing.xl,
    marginBottom: Spacing.xl,
    ...Shadow,
  },
  knowledgeTag: {
    fontSize: 12,
    fontWeight: '600',
    color: Palette.primary,
    backgroundColor: Palette.primaryBg,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: Radius.full,
    alignSelf: 'flex-start',
    marginBottom: Spacing.md,
    overflow: 'hidden',
  },
  questionText: {
    fontSize: 16,
    color: Palette.text,
    lineHeight: 26,
  },
  answerSection: {
    gap: Spacing.md,
  },
  answerLabel: {
    ...Typo.label,
    fontSize: 15,
  },
  answerInput: {
    backgroundColor: Palette.surface,
    borderRadius: Radius.sm,
    padding: 14,
    fontSize: 15,
    color: Palette.text,
    borderWidth: 1,
    borderColor: Palette.border,
  },
  submitBtn: {
    backgroundColor: Palette.primary,
    borderRadius: Radius.md,
    padding: 16,
    alignItems: 'center',
    ...Shadow,
  },
  submitBtnText: {
    color: Palette.textInverse,
    fontSize: 16,
    fontWeight: '700',
  },
  resultSection: {
    gap: Spacing.lg,
  },
  resultBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.lg,
    borderRadius: Radius.md,
    borderWidth: 1,
    gap: Spacing.sm,
  },
  resultEmoji: {
    fontSize: 24,
  },
  resultText: {
    fontSize: 16,
    fontWeight: '700',
  },
  answerCompare: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  answerItem: {
    flex: 1,
    backgroundColor: Palette.surface,
    padding: Spacing.md,
    borderRadius: Radius.sm,
    borderWidth: 1,
    borderColor: Palette.border,
  },
  compareLabel: {
    ...Typo.small,
    marginBottom: Spacing.xs,
  },
  compareValue: {
    fontSize: 15,
    fontWeight: '600',
    color: Palette.text,
  },
  explanationBox: {
    backgroundColor: Palette.primaryBg,
    borderRadius: Radius.sm,
    padding: 14,
    borderLeftWidth: 3,
    borderLeftColor: Palette.primary,
  },
  explanationLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: Palette.primaryDark,
    marginBottom: Spacing.xs,
  },
  explanationText: {
    fontSize: 14,
    color: Palette.text,
    lineHeight: 22,
  },
  nextBtn: {
    backgroundColor: Palette.primary,
    borderRadius: Radius.md,
    padding: 16,
    alignItems: 'center',
    ...Shadow,
  },
  nextBtnText: {
    color: Palette.textInverse,
    fontSize: 16,
    fontWeight: '700',
  },
  resultContainer: {
    flex: 1,
    justifyContent: 'center',
    padding: Spacing.xl,
  },
  resultCard: {
    backgroundColor: Palette.surface,
    borderRadius: Radius.lg,
    paddingVertical: Spacing.xxxl,
    paddingHorizontal: Spacing.xl,
    alignItems: 'center',
    ...Shadow,
  },
  resultIconCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  resultIcon: {
    fontSize: 52,
  },
  resultTitle: {
    ...Typo.h2,
    fontSize: 24,
    marginBottom: Spacing.sm,
  },
  resultScore: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: Spacing.md,
  },
  resultDesc: {
    ...Typo.body,
    color: Palette.textSecondary,
    textAlign: 'center',
    marginBottom: Spacing.xxl,
  },
  backBtn: {
    backgroundColor: Palette.primary,
    borderRadius: Radius.md,
    paddingVertical: 16,
    alignItems: 'center',
    alignSelf: 'stretch',
    ...Shadow,
  },
  backBtnText: {
    color: Palette.textInverse,
    fontSize: 16,
    fontWeight: '600',
  },
});
