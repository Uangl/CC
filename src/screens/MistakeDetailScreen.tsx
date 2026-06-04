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
import { Colors } from '../constants/colors';
import { StatusBadge } from '../components/StatusBadge';
import { GRADE_LABELS } from '../constants/mistakeReasons';
import { MISTAKE_REASONS } from '../constants/mistakeReasons';
import { MockAiTutorService } from '../services/ai/MockAiTutorService';

const aiService = new MockAiTutorService();

export function MistakeDetailScreen({ route, navigation }: { route: any; navigation: any }) {
  const { mistakeId } = route.params as { mistakeId: string };
  const mistake = useMistakeStore((s) => s.getMistakeById(mistakeId));
  const updateMistake = useMistakeStore((s) => s.updateMistake);

  const [hintLevel, setHintLevel] = useState(0);
  const [hintText, setHintText] = useState('');

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
    const nextLevel = Math.min(hintLevel + 1, 3) as 1 | 2 | 3;
    const hint = await aiService.generateHint(mistake, nextLevel);
    setHintLevel(nextLevel);
    setHintText(hint);
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
              <Text style={[styles.infoValue, { color: Colors.orange }]}>
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
            <TouchableOpacity style={styles.hintBtn} onPress={handleShowHint}>
              <Text style={styles.hintBtnText}>看提示</Text>
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
                <TouchableOpacity style={styles.hintBtn} onPress={handleShowHint}>
                  <Text style={styles.hintBtnText}>
                    {hintLevel === 1 ? '看步骤' : '看完整解析'}
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
              <Text style={[styles.actionText, { color: Colors.green }]}>
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
                    { color: rh.passed ? Colors.green : Colors.error },
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  grade: {
    fontSize: 14,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  image: {
    width: '100%',
    height: 200,
    borderRadius: 12,
    backgroundColor: Colors.grayLight,
    marginBottom: 16,
  },
  section: {
    marginBottom: 20,
  },
  sectionLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 8,
  },
  questionText: {
    fontSize: 16,
    color: Colors.text,
    lineHeight: 24,
    backgroundColor: Colors.surface,
    padding: 14,
    borderRadius: 10,
  },
  answerRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  answerBox: {
    flex: 1,
    padding: 14,
    borderRadius: 10,
  },
  wrongAnswer: {
    backgroundColor: Colors.error + '10',
  },
  correctAnswer: {
    backgroundColor: Colors.green + '10',
  },
  answerLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginBottom: 4,
  },
  answerValue: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.text,
  },
  infoRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  infoItem: {
    flex: 1,
    backgroundColor: Colors.surface,
    padding: 12,
    borderRadius: 10,
  },
  infoLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.text,
  },
  feynmanScore: {
    fontSize: 14,
    color: Colors.primary,
    fontWeight: '600',
    marginBottom: 6,
  },
  feynmanText: {
    fontSize: 14,
    color: Colors.text,
    lineHeight: 22,
    backgroundColor: Colors.surface,
    padding: 12,
    borderRadius: 8,
  },
  hintBtn: {
    backgroundColor: Colors.primary + '15',
    borderRadius: 10,
    padding: 14,
    alignItems: 'center',
    marginTop: 8,
  },
  hintBtnText: {
    color: Colors.primary,
    fontSize: 14,
    fontWeight: '600',
  },
  hintBox: {
    backgroundColor: Colors.surface,
    borderRadius: 10,
    padding: 14,
    borderLeftWidth: 3,
    borderLeftColor: Colors.primary,
  },
  hintLevel: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.primary,
    marginBottom: 6,
  },
  hintContent: {
    fontSize: 14,
    color: Colors.text,
    lineHeight: 22,
  },
  actions: {
    gap: 10,
    marginBottom: 20,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  actionMaster: {
    borderColor: Colors.green + '40',
    backgroundColor: Colors.green + '08',
  },
  actionIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  actionText: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.text,
  },
  historyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    padding: 12,
    borderRadius: 8,
    marginBottom: 6,
    gap: 12,
  },
  historyDate: {
    fontSize: 13,
    color: Colors.textSecondary,
    flex: 1,
  },
  historyStage: {
    fontSize: 13,
    color: Colors.primary,
    fontWeight: '500',
  },
  historyResult: {
    fontSize: 13,
    fontWeight: '600',
  },
});
