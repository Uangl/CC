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
import { Colors } from '../constants/colors';
import { getKnowledgePointsByGrade } from '../data/knowledgePoints';
import { MISTAKE_REASONS } from '../constants/mistakeReasons';
import { GRADE_LABELS } from '../constants/mistakeReasons';
import { useMistakeStore } from '../store/mistakeStore';
import { Grade, MistakeReasonType, KnowledgePoint } from '../models/types';
import { getOcrService, Features } from '../services';

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

  // 有图片且配置了 OCR 时，自动识别题干并预填
  useEffect(() => {
    if (!imageUri || !Features.ocrEnabled) return;
    let active = true;
    setOcrLoading(true);
    getOcrService()
      .recognizeImage(imageUri)
      .then((result) => {
        if (active && result.questionText) {
          setQuestionText((prev) => prev || result.questionText);
        }
      })
      .finally(() => {
        if (active) setOcrLoading(false);
      });
    return () => {
      active = false;
    };
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
              <ActivityIndicator size="small" color={Colors.primary} />
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
          placeholderTextColor={Colors.textLight}
        />

        <Text style={styles.label}>学生答案</Text>
        <TextInput
          style={styles.input}
          placeholder="孩子写的答案"
          value={studentAnswer}
          onChangeText={setStudentAnswer}
          placeholderTextColor={Colors.textLight}
        />

        <Text style={styles.label}>正确答案</Text>
        <TextInput
          style={styles.input}
          placeholder="正确答案"
          value={correctAnswer}
          onChangeText={setCorrectAnswer}
          placeholderTextColor={Colors.textLight}
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
    backgroundColor: Colors.background,
  },
  container: {
    flex: 1,
    padding: 20,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 20,
  },
  image: {
    width: '100%',
    height: 200,
    borderRadius: 12,
    backgroundColor: Colors.grayLight,
    marginBottom: 20,
  },
  label: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 8,
    marginTop: 16,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  ocrHint: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 16,
    marginBottom: 8,
  },
  ocrHintText: {
    fontSize: 12,
    color: Colors.primary,
  },
  input: {
    backgroundColor: Colors.surface,
    borderRadius: 10,
    padding: 14,
    fontSize: 15,
    color: Colors.text,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  textArea: {
    backgroundColor: Colors.surface,
    borderRadius: 10,
    padding: 14,
    fontSize: 15,
    color: Colors.text,
    minHeight: 100,
    textAlignVertical: 'top',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  chipActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  chipText: {
    fontSize: 13,
    color: Colors.text,
  },
  chipTextActive: {
    color: Colors.white,
    fontWeight: '600',
  },
  reasonList: {
    gap: 8,
  },
  reasonCard: {
    backgroundColor: Colors.surface,
    borderRadius: 10,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  reasonCardActive: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primary + '10',
  },
  reasonText: {
    fontSize: 14,
    color: Colors.text,
  },
  reasonTextActive: {
    color: Colors.primary,
    fontWeight: '600',
  },
  followUp: {
    backgroundColor: Colors.orange + '15',
    borderRadius: 10,
    padding: 14,
    marginTop: 8,
  },
  followUpText: {
    fontSize: 13,
    color: Colors.orange,
    lineHeight: 20,
  },
  saveBtn: {
    backgroundColor: Colors.primary,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 24,
  },
  saveBtnText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: '700',
  },
});
