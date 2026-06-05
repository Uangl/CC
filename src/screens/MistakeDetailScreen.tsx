import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  SafeAreaView,
} from 'react-native';
import { useMistakeStore } from '../store/mistakeStore';
import { Palette, Radius, Spacing, Shadow, Typo } from '../constants/theme';
import { StatusBadge } from '../components/StatusBadge';
import { GRADE_LABELS } from '../constants/mistakeReasons';
import { MISTAKE_REASONS } from '../constants/mistakeReasons';
import { getAiTutorService } from '../services';

const aiService = getAiTutorService();

export function MistakeDetailScreen({ route, navigation }: { route: any; navigation: any }) {
  const { mistakeId } = route.params as { mistakeId: string };
  const mistake = useMistakeStore((s) => s.getMistakeById(mistakeId));
  const updateMistake = useMistakeStore((s) => s.updateMistake);

  const [hintLevel, setHintLevel] = useState(0);
  const [hintText, setHintText] = useState('');
  const [hintLoading, setHintLoading] = useState(false);

  const reasonLabel = useMemo(
    () =>
      MISTAKE_REASONS.find((r) => r.type === mistake?.mistakeReason)?.childLabel || '',
    [mistake?.mistakeReason]
  );

  if (!mistake) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.center}>
          <Text>错题不存在</Text>
        </View>
      </SafeAreaView>
    );
  }

  const handleShowHint = async () => {
    if (hintLoading) return;
    const nextLevel = Math.min(hintLevel + 1, 3) as 1 | 2 | 3;
    setHintLoading(true);
    try {
      const hint = await aiService.generateHint(mistake, nextLevel);
      setHintLevel(nextLevel);
      setHintText(hint);
    } finally {
      setHintLoading(false);
    }
  };

  const handleFeynman = () => {
    navigation.navigate('FeynmanCoach', { mistakeId: mistake.id });
  };

  const handleVariants = () => {
    navigation.navigate('VariantPractice', { mistakeId: mistake.id });
  };

  const handleMastered = () => {
    Alert.alert('确认出库', '确定已经完全掌握这道题了吗？', [
      { text: '取消', style: 'cancel' },
      {
        text: '确定',
        onPress: () => updateMistake(mistake.id, { status: 'mastered' }),
      },
    ]);
  };

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    return `${d.getMonth() + 1}月${d.getDate()}日`;
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.grade}>{GRADE_LABELS[mistake.grade]}</Text>
          <StatusBadge status={mistake.status} />
        </View>

        {mistake.imageUri && (
          <Image
            source={{ uri: mistake.imageUri }}
            style={styles.image}
            resizeMode="contain"
          />
        )}

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>题干</Text>
          <Text style={styles.questionText}>{mistake.questionText}</Text>
        </View>

        <View style={styles.answerRow}>
          <View style={[styles.answerBox, styles.wrongAnswer]}>
            <Text style={styles.answerLabel}>学生答案</Text>
            <Text style={styles.answerValue}>{mistake.studentAnswer}</Text>
          </View>
          <View style={[styles.answerBox, styles.correctAnswer]}>
            <Text style={styles.answerLabel}>正确答案</Text>
            <Text style={styles.answerValue}>{mistake.correctAnswer}</Text>
          </View>
        </View>

        <View style={styles.infoRow}>
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>知识点</Text>
            <Text style={styles.infoValue}>{mistake.knowledgePointName}</Text>
          </View>
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>错因</Text>
            <Text style={styles.infoValue}>{reasonLabel}</Text>
          </View>
        </View>

        {mistake.nextReviewAt && mistake.status !== 'mastered' && (
          <View style={styles.infoRow}>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>下次复习</Text>
              <Text style={[styles.infoValue, { color: Palette.warning }]}>
                {formatDate(mistake.nextReviewAt)}
              </Text>
            </View>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>复习阶段</Text>
              <Text style={styles.infoValue}>{mistake.reviewStage}</Text>
            </View>
          </View>
        )}

        {mistake.feynmanScore !== undefined && (
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>讲题记录</Text>
            <Text style={styles.feynmanScore}>
              费曼讲题得分：{mistake.feynmanScore}/10
            </Text>
            {mistake.feynmanExplanation && (
              <Text style={styles.feynmanText}>{mistake.feynmanExplanation}</Text>
            )}
          </View>
        )}

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>分层提示</Text>
          {hintLevel === 0 ? (
            <TouchableOpacity
              style={styles.hintBtn}
              onPress={handleShowHint}
              disabled={hintLoading}
            >
              <Text style={styles.hintBtnText}>
                {hintLoading ? '思考中…' : '看提示'}
              </Text>
            </TouchableOpacity>
          ) : (
            <>
              <View style={styles.hintBox}>
                <Text style={styles.hintLevel}>
                  {hintLevel === 1
                    ? '💡 提示'
                    : hintLevel === 2
                      ? '📝 关键步骤'
                      : '📖 完整解析'}
                </Text>
                <Text style={styles.hintContent}>{hintText}</Text>
              </View>
              {hintLevel < 3 && (
                <TouchableOpacity
                  style={styles.hintBtn}
                  onPress={handleShowHint}
                  disabled={hintLoading}
                >
                  <Text style={styles.hintBtnText}>
                    {hintLoading
                      ? '思考中…'
                      : hintLevel === 1
                        ? '看步骤'
                        : '看完整解析'}
                  </Text>
                </TouchableOpacity>
              )}
            </>
          )}
        </View>

        <View style={styles.actions}>
          <TouchableOpacity style={styles.actionBtn} onPress={handleFeynman}>
            <Text style={styles.actionIcon}>🎤</Text>
            <Text style={styles.actionText}>讲给AI小同学听</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionBtn} onPress={handleVariants}>
            <Text style={styles.actionIcon}>📝</Text>
            <Text style={styles.actionText}>做变式题</Text>
          </TouchableOpacity>

          {mistake.status !== 'mastered' && (
            <TouchableOpacity
              style={[styles.actionBtn, styles.actionMaster]}
              onPress={handleMastered}
            >
              <Text style={styles.actionIcon}>✅</Text>
              <Text style={[styles.actionText, { color: Palette.success }]}>
                标记已掌握
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {mistake.reviewHistory.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>复习历史</Text>
            {mistake.reviewHistory.map((rh, idx) => (
              <View key={idx} style={styles.historyItem}>
                <Text style={styles.historyDate}>{formatDate(rh.date)}</Text>
                <Text style={styles.historyStage}>{rh.stage}</Text>
                <Text
                  style={[
                    styles.historyResult,
                    { color: rh.passed ? Palette.success : Palette.error },
                  ]}
                >
                  {rh.passed ? '通过' : '未通过'}
                </Text>
              </View>
            ))}
          </View>
        )}

        <View style={{ height: 40 }} />
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  grade: {
    ...Typo.label,
    color: Palette.textSecondary,
  },
  image: {
    width: '100%',
    height: 200,
    borderRadius: Radius.md,
    backgroundColor: Palette.divider,
    marginBottom: Spacing.lg,
  },
  section: {
    marginBottom: Spacing.xl,
  },
  sectionLabel: {
    ...Typo.label,
    color: Palette.textSecondary,
    marginBottom: Spacing.sm,
  },
  questionText: {
    ...Typo.body,
    fontSize: 16,
    lineHeight: 24,
    backgroundColor: Palette.surface,
    padding: Spacing.lg,
    borderRadius: Radius.md,
    ...Shadow,
  },
  answerRow: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginBottom: Spacing.lg,
  },
  answerBox: {
    flex: 1,
    padding: Spacing.lg,
    borderRadius: Radius.md,
    borderWidth: 1,
  },
  wrongAnswer: {
    backgroundColor: Palette.errorBg,
    borderColor: Palette.error + '30',
  },
  correctAnswer: {
    backgroundColor: Palette.successBg,
    borderColor: Palette.success + '30',
  },
  answerLabel: {
    ...Typo.small,
    marginBottom: Spacing.xs,
  },
  answerValue: {
    fontSize: 15,
    fontWeight: '600',
    color: Palette.text,
  },
  infoRow: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginBottom: Spacing.md,
  },
  infoItem: {
    flex: 1,
    backgroundColor: Palette.surface,
    padding: Spacing.md,
    borderRadius: Radius.md,
    ...Shadow,
  },
  infoLabel: {
    ...Typo.small,
    marginBottom: Spacing.xs,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '600',
    color: Palette.text,
  },
  feynmanScore: {
    fontSize: 14,
    color: Palette.primary,
    fontWeight: '700',
    marginBottom: Spacing.sm,
  },
  feynmanText: {
    ...Typo.body,
    fontSize: 14,
    backgroundColor: Palette.surface,
    padding: Spacing.md,
    borderRadius: Radius.sm,
    ...Shadow,
  },
  hintBtn: {
    backgroundColor: Palette.primaryBg,
    borderRadius: Radius.md,
    padding: Spacing.lg,
    alignItems: 'center',
    marginTop: Spacing.sm,
  },
  hintBtnText: {
    color: Palette.primary,
    fontSize: 14,
    fontWeight: '700',
  },
  hintBox: {
    backgroundColor: Palette.surface,
    borderRadius: Radius.md,
    padding: Spacing.lg,
    borderLeftWidth: 3,
    borderLeftColor: Palette.primary,
    ...Shadow,
  },
  hintLevel: {
    fontSize: 13,
    fontWeight: '700',
    color: Palette.primary,
    marginBottom: Spacing.sm,
  },
  hintContent: {
    ...Typo.body,
    fontSize: 14,
  },
  actions: {
    gap: Spacing.sm,
    marginBottom: Spacing.xl,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Palette.surface,
    borderRadius: Radius.md,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Palette.border,
    ...Shadow,
  },
  actionMaster: {
    borderColor: Palette.success + '40',
    backgroundColor: Palette.successBg,
  },
  actionIcon: {
    fontSize: 20,
    marginRight: Spacing.md,
  },
  actionText: {
    fontSize: 15,
    fontWeight: '600',
    color: Palette.text,
  },
  historyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Palette.surface,
    padding: Spacing.md,
    borderRadius: Radius.sm,
    marginBottom: Spacing.sm,
    gap: Spacing.md,
    ...Shadow,
  },
  historyDate: {
    ...Typo.caption,
    flex: 1,
  },
  historyStage: {
    fontSize: 13,
    color: Palette.primary,
    fontWeight: '600',
  },
  historyResult: {
    fontSize: 13,
    fontWeight: '700',
  },
});
