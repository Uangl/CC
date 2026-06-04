import { Mistake } from '../../models/types';
import {
  AiTutorService,
  FeynmanEvaluation,
  FeynmanReply,
} from './AiTutorService';
import { MockAiTutorService } from './MockAiTutorService';
import { zhipuChat, parseJsonLoose, ChatMessage } from './zhipuClient';

const FEYNMAN_QUESTIONS = [
  '这道题考的是什么知识点？',
  '你刚才为什么做错了？',
  '正确的做法分几步？',
  '下次遇到类似的题，你要提醒自己什么？',
];

function mistakeContext(mistake: Mistake): string {
  return [
    `年级：${mistake.grade}年级`,
    `知识点：${mistake.knowledgePointName}`,
    `题目：${mistake.questionText}`,
    `学生答案：${mistake.studentAnswer}`,
    `正确答案：${mistake.correctAnswer}`,
    mistake.explanation ? `参考解析：${mistake.explanation}` : '',
  ]
    .filter(Boolean)
    .join('\n');
}

/**
 * 智谱 GLM-4-Flash 实现。所有方法在网络/解析失败时自动降级到 Mock，
 * 保证 App 始终可用。
 */
export class ZhipuAiTutorService implements AiTutorService {
  private fallback = new MockAiTutorService();

  async respondToFeynmanAnswer(
    mistake: Mistake,
    questionIndex: number,
    answer: string,
    _previousAnswers: string[]
  ): Promise<FeynmanReply> {
    const question = FEYNMAN_QUESTIONS[questionIndex] ?? '';
    const messages: ChatMessage[] = [
      {
        role: 'system',
        content:
          '你是一个友好的小学生 AI 同学，正在听同学用费曼学习法给你讲数学错题。' +
          '请用温和、鼓励的语气，用适合小学生的简单语言。' +
          '只返回 JSON，格式：{"feedback":"一句鼓励或点评","followUp":"一个简短追问或留空字符串"}。' +
          '如果同学讲得清楚完整，followUp 留空；如果讲得太简单或没说清楚，给一个引导性追问。',
      },
      {
        role: 'user',
        content:
          `${mistakeContext(mistake)}\n\n` +
          `我问的问题：${question}\n` +
          `同学的回答：${answer}`,
      },
    ];

    try {
      const text = await zhipuChat(messages, { temperature: 0.7, maxTokens: 300 });
      const parsed = parseJsonLoose<{ feedback?: string; followUp?: string }>(text);
      if (parsed && parsed.feedback) {
        const followUp = parsed.followUp?.trim();
        return {
          feedback: parsed.feedback.trim(),
          followUpQuestion: followUp ? followUp : undefined,
        };
      }
    } catch {
      // ignore, fall through
    }
    return this.fallback.respondToFeynmanAnswer(
      mistake,
      questionIndex,
      answer,
      _previousAnswers
    );
  }

  async scoreFeynmanSession(
    mistake: Mistake,
    answers: string[]
  ): Promise<FeynmanEvaluation> {
    const answersText = FEYNMAN_QUESTIONS.map(
      (q, i) => `问题${i + 1}：${q}\n回答${i + 1}：${answers[i] ?? '（未回答）'}`
    ).join('\n\n');

    const messages: ChatMessage[] = [
      {
        role: 'system',
        content:
          '你是一位小学数学老师，要给学生的"费曼讲题"打分。' +
          '从五个维度各打 0-2 分（可打小数）：' +
          'concept=是否说清考点，reason=是否说清错因，steps=是否说清步骤，' +
          'explanation=是否能说明为什么这么做，reminder=是否能总结避坑提醒。' +
          '只返回 JSON，格式：' +
          '{"concept":0-2,"reason":0-2,"steps":0-2,"explanation":0-2,"reminder":0-2,"feedback":"一句总体点评"}。',
      },
      {
        role: 'user',
        content: `${mistakeContext(mistake)}\n\n学生的讲题：\n${answersText}`,
      },
    ];

    try {
      const text = await zhipuChat(messages, { temperature: 0.3, maxTokens: 400 });
      const parsed = parseJsonLoose<{
        concept?: number;
        reason?: number;
        steps?: number;
        explanation?: number;
        reminder?: number;
        feedback?: string;
      }>(text);

      if (parsed) {
        const clamp = (n: unknown) =>
          Math.max(0, Math.min(2, typeof n === 'number' ? n : 0));
        const conceptScore = clamp(parsed.concept);
        const reasonScore = clamp(parsed.reason);
        const stepsScore = clamp(parsed.steps);
        const explanationScore = clamp(parsed.explanation);
        const reminderScore = clamp(parsed.reminder);
        const totalScore = Math.round(
          conceptScore + reasonScore + stepsScore + explanationScore + reminderScore
        );
        return {
          conceptScore,
          reasonScore,
          stepsScore,
          explanationScore,
          reminderScore,
          totalScore: Math.min(10, totalScore),
          feedback:
            parsed.feedback?.trim() ||
            (totalScore >= 8 ? '讲得很棒！' : '继续加油，再补充一下细节。'),
        };
      }
    } catch {
      // ignore, fall through
    }
    return this.fallback.scoreFeynmanSession(mistake, answers);
  }

  async generateHint(mistake: Mistake, level: 1 | 2 | 3): Promise<string> {
    const levelDesc =
      level === 1
        ? '只给一个方向性的小提示，点出考点和思路，绝对不要给出答案或具体计算。'
        : level === 2
          ? '给出关键解题步骤的框架，可以提到要用的公式，但不要算出最终答案。'
          : '给出完整的解题过程和最终答案，讲清每一步为什么这样做。';

    const messages: ChatMessage[] = [
      {
        role: 'system',
        content:
          '你是一位耐心的小学数学老师，用适合小学生的简单语言回答。直接给出提示内容，不要寒暄。',
      },
      {
        role: 'user',
        content: `${mistakeContext(mistake)}\n\n请${levelDesc}`,
      },
    ];

    try {
      const text = await zhipuChat(messages, { temperature: 0.4, maxTokens: 500 });
      if (text.trim()) return text.trim();
    } catch {
      // ignore, fall through
    }
    return this.fallback.generateHint(mistake, level);
  }
}
