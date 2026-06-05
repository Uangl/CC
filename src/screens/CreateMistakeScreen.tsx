import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Image,
  Alert,
  SafeAreaView,
  ActivityIndicator,
} from 'react-native';
import { Palette, Radius, Spacing, Shadow, Typo } from '../constants/theme';
import { getKnowledgePointsByGrade } from '../data/knowledgePoints';
import { MISTAKE_REASONS } from '../constants/mistakeReasons';
import { GRADE_LABELS } from '../constants/mistakeReasons';
import { useMistakeStore } from '../store/mistakeStore';
import { Grade, MistakeReasonType, KnowledgePoint } from '../models/types';
import { backendEnabled } from '../services';
import { apiUpload } from '../services/api/client';

export function CreateMistakeScreen({ route, navigation }: { route: any; navigation: any }) {
  const imageUri = route.params?.imageUri as string | undefined;
  const addMistake = useMistakeStore((s) => s.addMistake);

  const [questionText, setQuestionText] = useState('');
  const [studentAnswer, setStudentAnswer] = useState('');
  const [correctAnswer, setCorrectAnswer] = useState('');
  const [grade, setGrade] = useState<Grade>(3);
  const [selectedKp, setSelectedKp] = useState<KnowledgePoint | null>(null);
  const [selectedReason, setSelectedReason] = useState<MistakeReasonType | null>(null);
  const [showReasonFollowUp, setShowReasonFollowUp] = useState(false);
  const [ocrLoading, setOcrLoading] = useState(false);

  const gradeKps = getKnowledgePointsByGrade(grade);

  useEffect(() => {
    if (!imageUri || !backendEnabled) return;
    let cancelled = false;

    const doOcr = async () => {
      setOcrLoading(true);
      try {
        const formData = new FormData();
        formData.append('image', {
          uri: imageUri,
          type: 'image/jpeg',
          name: 'photo.jpg',
        } as unknown as Blob);

        const result = await apiUpload<{ questionText: string; confidence: number }>(
          '/api/ocr/recognize',
          formData
        );
        if (!cancelled && result.questionText) {
          setQuestionText(result.questionText);
        }
      } catch {
        // OCR failed silently — user can type manually
      } finally {
        if (!cancelled) setOcrLoading(false);
      }
    };

    doOcr();
    return () => { cancelled = true; };
  }, [imageUri]);

  const handleSave = () => {
    if (!questionText.trim()) {
      Alert.alert('请输入题干');
      return;
    }
    if (!studentAnswer.trim()) {
      Alert.alert('请输入学生答案');
      return;
    }
    if (!correctAnswer.trim()) {
      Alert.alert('请输入正确答案');
      return;
    }
    if (!selectedKp) {
      Alert.alert('请选择知识点');
      return;
    }
    if (!selectedReason) {
      Alert.alert('请选择错因');
      return;
    }

    addMistake({
      imageUri,
      grade,
      questionText: questionText.trim(),
      studentAnswer: studentAnswer.trim(),
      correctAnswer: correctAnswer.trim(),
      explanation: '',
      knowledgePointId: selectedKp.id,
      knowledgePointName: selectedKp.name,
      mistakeReason: selectedReason,
      difficulty: 1,
      status: 'captured',
      reviewStage: 'D0',
    });

    Alert.alert('保存成功', '错题已收录！', [
      { text: '好的', onPress: () => navigation.popToTop() },
    ]);
  };

  const handleReasonSelect = (reason: MistakeReasonType) => {
    setSelectedReason(reason);
    const reasonConfig = MISTAKE_REASONS.find((r) => r.type === reason);
    if (reasonConfig?.followUp) {
      setShowReasonFollowUp(true);
    } else {
      setShowReasonFollowUp(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>创建错题卡</Text>

        {imageUri && (
          <Image source={{ uri: imageUri }} style={styles.image} resizeMode="contain" />
        )}

        <View style={styles.labelRow}>
          <Text style={styles.label}>题干</Text>
          {ocrLoading && (
            <View style={styles.ocrHint}>
              <ActivityIndicator size="small" color={Palette.primary} />
              <Text style={styles.ocrHintText}>正在识别图片文字…</Text>
            </View>
          )}
        </View>
        <TextInput
          style={styles.textArea}
          multiline
          placeholder="请输入题目内容..."
          value={questionText}
          onChangeText={setQuestionText}
          placeholderTextColor={Palette.textMuted}
        />

        <Text style={styles.label}>学生答案</Text>
        <TextInput
          style={styles.input}
          placeholder="孩子写的答案"
          value={studentAnswer}
          onChangeText={setStudentAnswer}
          placeholderTextColor={Palette.textMuted}
        />

        <Text style={styles.label}>正确答案</Text>
        <TextInput
          style={styles.input}
          placeholder="正确答案"
          value={correctAnswer}
          onChangeText={setCorrectAnswer}
          placeholderTextColor={Palette.textMuted}
        />

        <Text style={styles.label}>年级</Text>
        <View style={styles.chipRow}>
          {([1, 2, 3, 4, 5, 6] as Grade[]).map((g) => (
            <TouchableOpacity
              key={g}
              style={[styles.chip, grade === g && styles.chipActive]}
              onPress={() => {
                setGrade(g);
                setSelectedKp(null);
              }}
            >
              <Text style={[styles.chipText, grade === g && styles.chipTextActive]}>
                {GRADE_LABELS[g]}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.label}>知识点</Text>
        <View style={styles.chipRow}>
          {gradeKps.map((kp) => (
            <TouchableOpacity
              key={kp.id}
              style={[styles.chip, selectedKp?.id === kp.id && styles.chipActive]}
              onPress={() => setSelectedKp(kp)}
            >
              <Text
                style={[
                  styles.chipText,
                  selectedKp?.id === kp.id && styles.chipTextActive,
                ]}
              >
                {kp.name}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.label}>错因</Text>
        <View style={styles.reasonList}>
          {MISTAKE_REASONS.map((r) => (
            <TouchableOpacity
              key={r.type}
              style={[
                styles.reasonCard,
                selectedReason === r.type && styles.reasonCardActive,
              ]}
              onPress={() => handleReasonSelect(r.type)}
            >
              <Text
                style={[
                  styles.reasonText,
                  selectedReason === r.type && styles.reasonTextActive,
                ]}
              >
                {r.childLabel}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {showReasonFollowUp && selectedReason === 'calculation_error' && (
          <View style={styles.followUp}>
            <Text style={styles.followUpText}>
              我们再确认一下，是进位/退位错了，还是数字抄错了？
            </Text>
          </View>
        )}

        <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
          <Text style={styles.saveBtnText}>保存错题</Text>
        </TouchableOpacity>

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
  title: {
    ...Typo.h2,
    marginBottom: Spacing.xl,
  },
  image: {
    width: '100%',
    height: 200,
    borderRadius: Radius.md,
    backgroundColor: Palette.divider,
    marginBottom: Spacing.xl,
  },
  label: {
    ...Typo.label,
    fontSize: 15,
    marginBottom: Spacing.sm,
    marginTop: Spacing.lg,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  ocrHint: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    marginTop: Spacing.lg,
    marginBottom: Spacing.sm,
  },
  ocrHintText: {
    ...Typo.small,
    color: Palette.primary,
  },
  input: {
    backgroundColor: Palette.surface,
    borderRadius: Radius.sm,
    padding: 14,
    fontSize: 15,
    color: Palette.text,
    borderWidth: 1,
    borderColor: Palette.border,
  },
  textArea: {
    backgroundColor: Palette.surface,
    borderRadius: Radius.sm,
    padding: 14,
    fontSize: 15,
    color: Palette.text,
    minHeight: 100,
    textAlignVertical: 'top',
    borderWidth: 1,
    borderColor: Palette.border,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  chip: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.full,
    backgroundColor: Palette.surface,
    borderWidth: 1,
    borderColor: Palette.border,
  },
  chipActive: {
    backgroundColor: Palette.primary,
    borderColor: Palette.primary,
  },
  chipText: {
    fontSize: 13,
    color: Palette.text,
  },
  chipTextActive: {
    color: Palette.textInverse,
    fontWeight: '600',
  },
  reasonList: {
    gap: Spacing.sm,
  },
  reasonCard: {
    backgroundColor: Palette.surface,
    borderRadius: Radius.md,
    padding: 14,
    borderWidth: 1,
    borderColor: Palette.border,
  },
  reasonCardActive: {
    borderColor: Palette.primary,
    backgroundColor: Palette.primaryBg,
  },
  reasonText: {
    fontSize: 14,
    color: Palette.text,
  },
  reasonTextActive: {
    color: Palette.primary,
    fontWeight: '600',
  },
  followUp: {
    backgroundColor: Palette.warningBg,
    borderRadius: Radius.md,
    padding: 14,
    marginTop: Spacing.sm,
    borderWidth: 1,
    borderColor: Palette.warning + '33',
  },
  followUpText: {
    ...Typo.caption,
    color: Palette.warning,
    lineHeight: 20,
  },
  saveBtn: {
    backgroundColor: Palette.primary,
    borderRadius: Radius.md,
    padding: 16,
    alignItems: 'center',
    marginTop: Spacing.xxl,
    ...Shadow,
  },
  saveBtnText: {
    color: Palette.textInverse,
    fontSize: 16,
    fontWeight: '700',
  },
});
