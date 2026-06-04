import { Mistake } from '../../models/types';
import {
  AiTutorService,
  FeynmanEvaluation,
  FeynmanReply,
} from './AiTutorService';

const FOLLOW_UP_QUESTIONS = [
  '你能用更简单的话再讲一次吗？',
  '为什么这一步要这样做？',
  '如果数字换一下，你还会做吗？',
  '这类题最容易错在哪里？',
  '你能自己编一道类似题吗？',
];

/** 根据回答长度粗略打分（0-2）。 */
function scoreByLength(answer: string): number {
  const len = answer.trim().length;
  if (len > 40) return 2;
  if (len > 15) return 1.5;
  if (len > 5) return 1;
  return 0;
}

export class MockAiTutorService implements AiTutorService {
  async respondToFeynmanAnswer(
    _mistake: Mistake,
    questionIndex: number,
    answer: string,
    _previousAnswers: string[]
  ): Promise<FeynmanReply> {
    const len = answer.trim().length;
    let feedback: string;
    if (len > 30) {
      feedback = '讲得很清楚，继续保持！';
    } else if (len > 12) {
      feedback = '不错，可以再说得详细一点～';
    } else {
      feedback = '可以多说一点，把你的想法讲清楚。';
    }
    const followUpQuestion =
      len <= 12 ? FOLLOW_UP_QUESTIONS[questionIndex % FOLLOW_UP_QUESTIONS.length] : undefined;
    return { feedback, followUpQuestion };
  }

  async scoreFeynmanSession(
    _mistake: Mistake,
    answers: string[]
  ): Promise<FeynmanEvaluation> {
    const conceptScore = scoreByLength(answers[0] ?? '');
    const reasonScore = scoreByLength(answers[1] ?? '');
    const stepsScore = scoreByLength(answers[2] ?? '');
    const reminderScore = scoreByLength(answers[3] ?? '');
    const explanationScore = Math.min(2, (stepsScore + reminderScore) / 2);

    const totalScore = Math.min(
      10,
      Math.round(
        conceptScore + reasonScore + stepsScore + explanationScore + reminderScore
      )
    );

    const feedback =
      totalScore >= 8
        ? '你已经把这道题讲明白了，真棒！'
        : '讲得不错，再补充一下错因和步骤会更好哦。';

    return {
      conceptScore,
      reasonScore,
      stepsScore,
      explanationScore,
      reminderScore,
      totalScore,
      feedback,
    };
  }

  async generateHint(mistake: Mistake, level: 1 | 2 | 3): Promise<string> {
    if (level === 1) {
      return `提示：这道题考的是「${mistake.knowledgePointName}」，想想这个知识点的核心公式或方法是什么？`;
    } else if (level === 2) {
      return `关键步骤：先找到题目中的已知条件，然后用「${mistake.knowledgePointName}」的公式来计算。注意检查单位和进退位。`;
    } else {
      return `完整解析：\n${mistake.explanation}\n\n正确答案是：${mistake.correctAnswer}`;
    }
  }
}
