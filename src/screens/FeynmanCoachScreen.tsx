import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { useMistakeStore } from '../store/mistakeStore';
import { Palette, Radius, Spacing, Shadow, ShadowLight, Typo } from '../constants/theme';
import { getAiTutorService } from '../services';

const aiService = getAiTutorService();

const FEYNMAN_QUESTIONS = [
  '这道题考的是什么知识点？',
  '你刚才为什么做错了？',
  '正确的做法分几步？请讲一讲。',
  '下次遇到类似的题，你要提醒自己什么？',
];

interface ChatMessage {
  role: 'ai' | 'student';
  text: string;
}

export function FeynmanCoachScreen({ route, navigation }: { route: any; navigation: any }) {
  const { mistakeId } = route.params as { mistakeId: string };
  const mistake = useMistakeStore((s) => s.getMistakeById(mistakeId));
  const updateFeynmanScore = useMistakeStore((s) => s.updateFeynmanScore);

  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [inputText, setInputText] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: 'ai',
      text: `你好！我是你的AI小同学。你来当小老师，给我讲讲这道题吧！\n\n题目：${mistake?.questionText || ''}`,
    },
    {
      role: 'ai',
      text: FEYNMAN_QUESTIONS[0],
    },
  ]);
  const [busy, setBusy] = useState(false);
  const [completed, setCompleted] = useState(false);

  const answersRef = useRef<string[]>([]);
  const awaitingFollowUpRef = useRef(false);
  const scrollRef = useRef<ScrollView>(null);

  if (!mistake) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.center}>
          <Text>错题不存在</Text>
        </View>
      </SafeAreaView>
    );
  }

  const scrollToBottom = () => {
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
  };

  const pushMessages = (items: ChatMessage[]) => {
    setMessages((prev) => [...prev, ...items]);
    scrollToBottom();
  };

  const finishSession = async () => {
    pushMessages([{ role: 'ai', text: '让我看看你刚才讲得怎么样…🤔' }]);
    const evaluation = await aiService.scoreFeynmanSession(
      mistake,
      answersRef.current
    );
    const finalScore = evaluation.totalScore;
    const passed = finalScore >= 8;

    const fullExplanation = answersRef.current
      .map((a, i) => `${FEYNMAN_QUESTIONS[i]}\n${a}`)
      .join('\n\n');
    updateFeynmanScore(mistake.id, fullExplanation, finalScore);

    const resultText = passed
      ? `太棒了！你的讲题得分是 ${finalScore}/10 分！\n${evaluation.feedback}\n现在可以去做变式题，巩固一下吧。`
      : `你的讲题得分是 ${finalScore}/10 分。\n${evaluation.feedback}\n再补充一下原因和步骤，争取达到 8 分以上！`;

    pushMessages([{ role: 'ai', text: resultText }]);
    setCompleted(true);
  };

  const advanceToNext = async () => {
    const nextQ = currentQuestion + 1;
    if (nextQ < FEYNMAN_QUESTIONS.length) {
      setCurrentQuestion(nextQ);
      pushMessages([{ role: 'ai', text: FEYNMAN_QUESTIONS[nextQ] }]);
    } else {
      await finishSession();
    }
  };

  const handleSend = async () => {
    const text = inputText.trim();
    if (!text || busy) return;

    setInputText('');
    pushMessages([{ role: 'student', text }]);
    setBusy(true);

    try {
      if (awaitingFollowUpRef.current) {
        // 追问的补充回答：并入当前问题，然后进入下一题
        answersRef.current[currentQuestion] =
          `${answersRef.current[currentQuestion] ?? ''} ${text}`.trim();
        awaitingFollowUpRef.current = false;

        const reply = await aiService.respondToFeynmanAnswer(
          mistake,
          currentQuestion,
          answersRef.current[currentQuestion],
          answersRef.current
        );
        pushMessages([{ role: 'ai', text: reply.feedback }]);
        await advanceToNext();
      } else {
        answersRef.current[currentQuestion] = text;

        const reply = await aiService.respondToFeynmanAnswer(
          mistake,
          currentQuestion,
          text,
          answersRef.current
        );
        pushMessages([{ role: 'ai', text: reply.feedback }]);

        const isLast = currentQuestion === FEYNMAN_QUESTIONS.length - 1;
        if (reply.followUpQuestion && !isLast) {
          awaitingFollowUpRef.current = true;
          pushMessages([{ role: 'ai', text: reply.followUpQuestion }]);
        } else {
          await advanceToNext();
        }
      }
    } finally {
      setBusy(false);
      scrollToBottom();
    }
  };

  const handleFinish = () => navigation.goBack();
  const handleVariants = () =>
    navigation.replace('VariantPractice', { mistakeId: mistake.id });

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={90}
      >
        <View style={styles.headerBar}>
          <View style={styles.headerRow}>
            <Text style={styles.headerTitle}>费曼讲题</Text>
            <Text style={styles.headerProgress}>
              {Math.min(currentQuestion + 1, FEYNMAN_QUESTIONS.length)}/
              {FEYNMAN_QUESTIONS.length}
            </Text>
          </View>
          <View style={styles.progressTrack}>
            <View
              style={[
                styles.progressFill,
                {
                  width: `${
                    (Math.min(currentQuestion + 1, FEYNMAN_QUESTIONS.length) /
                      FEYNMAN_QUESTIONS.length) *
                    100
                  }%`,
                },
              ]}
            />
          </View>
        </View>

        <ScrollView
          ref={scrollRef}
          style={styles.chatArea}
          contentContainerStyle={styles.chatContent}
          showsVerticalScrollIndicator={false}
          onContentSizeChange={() => scrollToBottom()}
        >
          {messages.map((msg, idx) =>
            msg.role === 'ai' ? (
              <View key={idx} style={styles.aiRow}>
                <View style={styles.avatar}>
                  <Text style={styles.avatarEmoji}>🤖</Text>
                </View>
                <View style={[styles.bubble, styles.aiBubble]}>
                  <Text style={styles.bubbleText}>{msg.text}</Text>
                </View>
              </View>
            ) : (
              <View key={idx} style={[styles.bubble, styles.studentBubble]}>
                <Text style={[styles.bubbleText, styles.studentText]}>
                  {msg.text}
                </Text>
              </View>
            )
          )}

          {busy && (
            <View style={styles.aiRow}>
              <View style={styles.avatar}>
                <Text style={styles.avatarEmoji}>🤖</Text>
              </View>
              <View style={[styles.bubble, styles.aiBubble, styles.typingBubble]}>
                <ActivityIndicator size="small" color={Palette.primary} />
                <Text style={styles.typingText}>AI小同学正在思考…</Text>
              </View>
            </View>
          )}

          {completed && (
            <View style={styles.completedActions}>
              <TouchableOpacity style={styles.variantBtn} onPress={handleVariants}>
                <Text style={styles.variantBtnText}>去做变式题</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.finishBtn} onPress={handleFinish}>
                <Text style={styles.finishBtnText}>返回</Text>
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>

        {!completed && (
          <View style={styles.inputBar}>
            <TextInput
              style={styles.textInput}
              placeholder="输入你的讲解..."
              value={inputText}
              onChangeText={setInputText}
              multiline
              maxLength={500}
              editable={!busy}
              placeholderTextColor={Palette.textMuted}
            />
            <TouchableOpacity
              style={[
                styles.sendBtn,
                (!inputText.trim() || busy) && styles.sendBtnDisabled,
              ]}
              onPress={handleSend}
              disabled={!inputText.trim() || busy}
            >
              <Text style={styles.sendBtnText}>发送</Text>
            </TouchableOpacity>
          </View>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Palette.bg,
  },
  flex: {
    flex: 1,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerBar: {
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.md,
    backgroundColor: Palette.surface,
    borderBottomWidth: 1,
    borderBottomColor: Palette.divider,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  headerTitle: {
    ...Typo.h3,
  },
  headerProgress: {
    fontSize: 14,
    color: Palette.primary,
    fontWeight: '700',
  },
  progressTrack: {
    height: 6,
    backgroundColor: Palette.divider,
    borderRadius: Radius.full,
    overflow: 'hidden',
  },
  progressFill: {
    height: 6,
    backgroundColor: Palette.primary,
    borderRadius: Radius.full,
  },
  chatArea: {
    flex: 1,
  },
  chatContent: {
    padding: Spacing.lg,
    paddingBottom: Spacing.xl,
  },
  aiRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    alignSelf: 'flex-start',
    maxWidth: '90%',
    marginBottom: Spacing.md,
    gap: Spacing.sm,
  },
  avatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: Palette.primaryBg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarEmoji: {
    fontSize: 18,
  },
  bubble: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderRadius: Radius.lg,
    ...ShadowLight,
  },
  aiBubble: {
    flexShrink: 1,
    backgroundColor: Palette.surface,
    borderBottomLeftRadius: Radius.xs,
  },
  studentBubble: {
    maxWidth: '85%',
    backgroundColor: Palette.primary,
    alignSelf: 'flex-end',
    borderBottomRightRadius: Radius.xs,
    marginBottom: Spacing.md,
  },
  bubbleText: {
    ...Typo.body,
  },
  studentText: {
    color: Palette.textInverse,
  },
  typingBubble: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  typingText: {
    ...Typo.caption,
  },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: Spacing.md,
    backgroundColor: Palette.surface,
    borderTopWidth: 1,
    borderTopColor: Palette.divider,
    gap: Spacing.sm,
  },
  textInput: {
    flex: 1,
    backgroundColor: Palette.bg,
    borderRadius: Radius.lg,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    fontSize: 15,
    color: Palette.text,
    borderWidth: 1,
    borderColor: Palette.border,
    maxHeight: 100,
  },
  sendBtn: {
    backgroundColor: Palette.primary,
    borderRadius: Radius.lg,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    justifyContent: 'center',
    ...ShadowLight,
  },
  sendBtnDisabled: {
    opacity: 0.5,
  },
  sendBtnText: {
    color: Palette.textInverse,
    fontSize: 15,
    fontWeight: '700',
  },
  completedActions: {
    gap: Spacing.sm,
    marginTop: Spacing.lg,
  },
  variantBtn: {
    backgroundColor: Palette.primary,
    borderRadius: Radius.md,
    padding: 16,
    alignItems: 'center',
    ...Shadow,
  },
  variantBtnText: {
    color: Palette.textInverse,
    fontSize: 16,
    fontWeight: '700',
  },
  finishBtn: {
    backgroundColor: Palette.surface,
    borderRadius: Radius.md,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Palette.border,
  },
  finishBtnText: {
    color: Palette.textSecondary,
    fontSize: 15,
    fontWeight: '600',
  },
});
