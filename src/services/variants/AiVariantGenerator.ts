import { Mistake, VariantQuestion } from '../../models/types';
import { VariantGenerator } from './VariantGenerator';
import { RuleBasedVariantGenerator } from './RuleBasedVariantGenerator';
import { zhipuChat, parseJsonLoose, ChatMessage } from '../ai/zhipuClient';
import { GRADE_LABELS } from '../../constants/mistakeReasons';

interface RawVariant {
  questionText?: string;
  answer?: string;
  explanation?: string;
  difficulty?: number;
}

let counter = 0;

/**
 * 用智谱 GLM-4-Flash 生成变式题。强调"换数字、换问法、换场景"，
 * 并要求模型仔细计算保证答案正确。失败或数量不足时降级到规则题库。
 */
export class AiVariantGenerator implements VariantGenerator {
  private fallback = new RuleBasedVariantGenerator();

  async generateVariants(
    mistake: Mistake,
    count: number
  ): Promise<VariantQuestion[]> {
    const messages: ChatMessage[] = [
      {
        role: 'system',
        content:
          '你是一位小学数学老师，根据给定的错题和知识点出变式题。' +
          '要求：1)紧扣同一知识点；2)通过"换数字、换问法、换场景"区别于原题，不要照搬；' +
          '3)难度适合对应年级；4)务必仔细计算，确保 answer 完全正确。' +
          `只返回 JSON 数组，长度为 ${count}，每个元素格式：` +
          '{"questionText":"题干","answer":"答案","explanation":"简要解析","difficulty":1到3的整数}。',
      },
      {
        role: 'user',
        content:
          `年级：${GRADE_LABELS[mistake.grade]}\n` +
          `知识点：${mistake.knowledgePointName}\n` +
          `原错题：${mistake.questionText}\n` +
          `正确答案：${mistake.correctAnswer}\n\n` +
          `请出 ${count} 道变式题。`,
      },
    ];

    try {
      const text = await zhipuChat(messages, { temperature: 0.8, maxTokens: 1500 });
      const parsed = parseJsonLoose<RawVariant[]>(text);

      if (Array.isArray(parsed)) {
        const variants = parsed
          .filter((v) => v.questionText && v.answer)
          .map((v) => ({
            id: `ai_variant_${++counter}_${Date.now()}`,
            questionText: String(v.questionText).trim(),
            answer: String(v.answer).trim(),
            explanation: String(v.explanation ?? '').trim(),
            knowledgePointId: mistake.knowledgePointId,
            difficulty: (v.difficulty === 1 || v.difficulty === 2 || v.difficulty === 3
              ? v.difficulty
              : mistake.difficulty) as 1 | 2 | 3,
          }));

        if (variants.length >= count) {
          return variants.slice(0, count);
        }
      }
    } catch {
      // ignore, fall through
    }
    return this.fallback.generateVariants(mistake, count);
  }
}
