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
} from 'react-native';
import { useMistakeStore } from '../store/mistakeStore';
import { Colors } from '../constants/colors';
import { MockAiTutorService } from '../services/ai/MockAiTutorService';

const aiService = new MockAiTutorService();

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
  const [answers, setAnswers] = useState<string[]>([]);
  const [totalScore, setTotalScore] = useState(0);
  const [completed, setCompleted] = useState(false);
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

  const handleSend = async () => {
    const text = inputText.trim();
    if (!text) return;

    const newMessages: ChatMessage[] = [
      ...messages,
      { role: 'student', text },
    ];
    setMessages(newMessages);
    setInputText('');

    const newAnswers = [...answers, text];
    setAnswers(newAnswers);

    const evaluation = await aiService.evaluateFeynmanResponse(
      mistake,
      currentQuestion,
      text
    );

    const scoreForThisQ = evaluation.totalScore;
    const newTotalScore = totalScore + scoreForThisQ;
    setTotalScore(newTotalScore);

    newMessages.push({ role: 'ai', text: evaluation.feedback });

    if (evaluation.followUpQuestion && text.length < 30) {
      newMessages.push({ role: 'ai', text: evaluation.followUpQuestion });
      setMessages([...newMessages]);
      scrollToBottom();
      return;
    }

    const nextQ = currentQuestion + 1;
    if (nextQ < FEYNMAN_QUESTIONS.length) {
      setCurrentQuestion(nextQ);
      newMessages.push({ role: 'ai', text: FEYNMAN_QUESTIONS[nextQ] });
      setMessages([...newMessages]);
    } else {
      const finalScore = Math.min(10, Math.round(newTotalScore / FEYNMAN_QUESTIONS.length * 2.5));
      const passed = finalScore >= 8;

      const fullExplanation = newAnswers.join('\n');
      updateFeynmanScore(mistake.id, fullExplanation, finalScore);

      let resultText: string;
      if (passed) {
        resultText = `太棒了！你的讲题得分是 ${finalScore}/10 分！\n你已经把这道题讲明白了，真是个好老师！\n现在可以去做变式题，巩固一下吧。`;
      } else {
        resultText = `你的讲题得分是 ${finalScore}/10 分。\n还差一点点哦，再补充一下原因和步骤，争取达到 8 分以上！`;
      }

      newMessages.push({ role: 'ai', text: resultText });
      setMessages([...newMessages]);
      setCompleted(true);
    }

    scrollToBottom();
  };

  const scrollToBottom = () => {
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
  };

  const handleFinish = () => {
    navigation.goBack();
  };

  const handleVariants = () => {
    navigation.replace('VariantPractice', { mistakeId: mistake.id });
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={90}
      >
        <View style={styles.headerBar}>
          <Text style={styles.headerTitle}>费曼讲题</Text>
          <Text style={styles.headerProgress}>
            {Math.min(currentQuestion + 1, FEYNMAN_QUESTIONS.length)}/{FEYNMAN_QUESTIONS.length}
          </Text>
        </View>

        <ScrollView
          ref={scrollRef}
          style={styles.chatArea}
          contentContainerStyle={styles.chatContent}
          showsVerticalScrollIndicator={false}
          onContentSizeChange={() => scrollToBottom()}
        >
          {messages.map((msg, idx) => (
            <View
              key={idx}
              style={[
                styles.bubble,
                msg.role === 'ai' ? styles.aiBubble : styles.studentBubble,
              ]}
            >
              <Text
                style={[
                  styles.bubbleText,
                  msg.role === 'student' && styles.studentText,
                ]}
              >
                {msg.role === 'ai' ? '🤖 ' : ''}
                {msg.text}
              </Text>
            </View>
          ))}

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
              placeholderTextColor={Colors.textLight}
            />
            <TouchableOpacity
              style={[styles.sendBtn, !inputText.trim() && styles.sendBtnDisabled]}
              onPress={handleSend}
              disabled={!inputText.trim()}
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
    backgroundColor: Colors.background,
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: Colors.text,
  },
  headerProgress: {
    fontSize: 14,
    color: Colors.primary,
    fontWeight: '600',
  },
  chatArea: {
    flex: 1,
  },
  chatContent: {
    padding: 16,
    paddingBottom: 20,
  },
  bubble: {
    maxWidth: '85%',
    padding: 14,
    borderRadius: 16,
    marginBottom: 10,
  },
  aiBubble: {
    backgroundColor: Colors.surface,
    alignSelf: 'flex-start',
    borderBottomLeftRadius: 4,
  },
  studentBubble: {
    backgroundColor: Colors.primary,
    alignSelf: 'flex-end',
    borderBottomRightRadius: 4,
  },
  bubbleText: {
    fontSize: 15,
    color: Colors.text,
    lineHeight: 22,
  },
  studentText: {
    color: Colors.white,
  },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: 12,
    backgroundColor: Colors.surface,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    gap: 10,
  },
  textInput: {
    flex: 1,
    backgroundColor: Colors.grayLight,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 15,
    color: Colors.text,
    maxHeight: 100,
  },
  sendBtn: {
    backgroundColor: Colors.primary,
    borderRadius: 20,
    paddingHorizontal: 18,
    paddingVertical: 10,
  },
  sendBtnDisabled: {
    opacity: 0.5,
  },
  sendBtnText: {
    color: Colors.white,
    fontSize: 15,
    fontWeight: '600',
  },
  completedActions: {
    gap: 10,
    marginTop: 16,
  },
  variantBtn: {
    backgroundColor: Colors.primary,
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
  },
  variantBtnText: {
    color: Colors.white,
    fontSize: 15,
    fontWeight: '600',
  },
  finishBtn: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  finishBtnText: {
    color: Colors.textSecondary,
    fontSize: 15,
  },
});
