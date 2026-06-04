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
import { Colors } from '../constants/colors';
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
          <Text style={styles.resultIcon}>{passed ? '🎉' : '💪'}</Text>
          <Text style={styles.resultTitle}>
            {passed ? '变式题通过！' : '继续加油！'}
          </Text>
          <Text style={styles.resultScore}>
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
              placeholderTextColor={Colors.textLight}
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
                { backgroundColor: isCorrect ? Colors.green + '15' : Colors.error + '15' },
              ]}
            >
              <Text style={styles.resultEmoji}>{isCorrect ? '✅' : '❌'}</Text>
              <Text
                style={[
                  styles.resultText,
                  { color: isCorrect ? Colors.green : Colors.error },
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
                <Text style={[styles.compareValue, { color: Colors.green }]}>
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
    backgroundColor: Colors.background,
  },
  container: {
    flex: 1,
    padding: 20,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: Colors.textSecondary,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.text,
  },
  headerProgress: {
    fontSize: 14,
    color: Colors.primary,
    fontWeight: '600',
  },
  progressBar: {
    height: 4,
    backgroundColor: Colors.grayLight,
    borderRadius: 2,
    marginBottom: 20,
  },
  progressFill: {
    height: 4,
    backgroundColor: Colors.primary,
    borderRadius: 2,
  },
  questionCard: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
  },
  knowledgeTag: {
    fontSize: 12,
    color: Colors.primary,
    backgroundColor: Colors.primary + '10',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 10,
    alignSelf: 'flex-start',
    marginBottom: 12,
    overflow: 'hidden',
  },
  questionText: {
    fontSize: 16,
    color: Colors.text,
    lineHeight: 26,
  },
  answerSection: {
    gap: 12,
  },
  answerLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.text,
  },
  answerInput: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    color: Colors.text,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  submitBtn: {
    backgroundColor: Colors.primary,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  submitBtnText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: '700',
  },
  resultSection: {
    gap: 14,
  },
  resultBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    gap: 10,
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
    gap: 12,
  },
  answerItem: {
    flex: 1,
    backgroundColor: Colors.surface,
    padding: 12,
    borderRadius: 10,
  },
  compareLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginBottom: 4,
  },
  compareValue: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.text,
  },
  explanationBox: {
    backgroundColor: Colors.surface,
    borderRadius: 10,
    padding: 14,
    borderLeftWidth: 3,
    borderLeftColor: Colors.primary,
  },
  explanationLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.primary,
    marginBottom: 6,
  },
  explanationText: {
    fontSize: 14,
    color: Colors.text,
    lineHeight: 22,
  },
  nextBtn: {
    backgroundColor: Colors.primary,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  nextBtnText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: '700',
  },
  resultContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  resultIcon: {
    fontSize: 64,
    marginBottom: 20,
  },
  resultTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 8,
  },
  resultScore: {
    fontSize: 18,
    color: Colors.primary,
    fontWeight: '600',
    marginBottom: 12,
  },
  resultDesc: {
    fontSize: 15,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 32,
  },
  backBtn: {
    backgroundColor: Colors.primary,
    borderRadius: 12,
    paddingHorizontal: 40,
    paddingVertical: 14,
  },
  backBtnText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
});
