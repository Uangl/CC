import { Mistake } from '../../models/types';
import { AiTutorService, FeynmanEvaluation } from './AiTutorService';

const FOLLOW_UP_QUESTIONS = [
  '你能用更简单的话再讲一次吗？',
  '为什么这一步要这样做？',
  '如果数字换一下，你还会做吗？',
  '这类题最容易错在哪里？',
  '你能自己编一道类似题吗？',
  '你觉得这个知识点还有什么要注意的？',
  '如果你教同学做这道题，你会怎么讲？',
];

export class MockAiTutorService implements AiTutorService {
  async evaluateFeynmanResponse(
    _mistake: Mistake,
    questionIndex: number,
    answer: string
  ): Promise<FeynmanEvaluation> {
    const length = answer.trim().length;
    const hasDetail = length > 20;
    const hasGoodDetail = length > 50;

    let conceptScore = 0;
    let reasonScore = 0;
    let stepsScore = 0;
    let explanationScore = 0;
    let reminderScore = 0;

    if (questionIndex === 0) {
      conceptScore = hasGoodDetail ? 2 : hasDetail ? 1 : 0;
      reasonScore = hasDetail ? 1 : 0;
    } else if (questionIndex === 1) {
      reasonScore = hasGoodDetail ? 2 : hasDetail ? 1 : 0;
      conceptScore = hasDetail ? 1 : 0;
    } else if (questionIndex === 2) {
      stepsScore = hasGoodDetail ? 2 : hasDetail ? 1 : 0;
      explanationScore = hasDetail ? 1 : 0;
    } else if (questionIndex === 3) {
      reminderScore = hasGoodDetail ? 2 : hasDetail ? 1 : 0;
      explanationScore = hasGoodDetail ? 2 : hasDetail ? 1 : 0;
    }

    const totalScore =
      conceptScore + reasonScore + stepsScore + explanationScore + reminderScore;

    let feedback: string;
    if (totalScore >= 4) {
      feedback = '讲得很棒！你已经理解了这道题的关键。';
    } else if (totalScore >= 2) {
      feedback = '不错，但还可以再详细一点。试试解释得更清楚？';
    } else {
      feedback = '再想想看，试着用自己的话把道理说清楚。';
    }

    const followUpQuestion =
      totalScore < 4
        ? FOLLOW_UP_QUESTIONS[
            Math.floor(Math.random() * FOLLOW_UP_QUESTIONS.length)
          ]
        : undefined;

    return {
      conceptScore,
      reasonScore,
      stepsScore,
      explanationScore,
      reminderScore,
      totalScore,
      feedback,
      followUpQuestion,
    };
  }

  async generateFollowUp(
    _mistake: Mistake,
    _questionIndex: number,
    _answer: string
  ): Promise<string> {
    return FOLLOW_UP_QUESTIONS[
      Math.floor(Math.random() * FOLLOW_UP_QUESTIONS.length)
    ];
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
