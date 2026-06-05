import { Mistake } from '../../models/types';

/** 费曼讲题五维评分，总分 0-10。 */
export interface FeynmanEvaluation {
  conceptScore: number; // 是否说清考点 0-2
  reasonScore: number; // 是否说清错因 0-2
  stepsScore: number; // 是否说清步骤 0-2
  explanationScore: number; // 是否能说明原因 0-2
  reminderScore: number; // 是否能总结避坑提醒 0-2
  totalScore: number; // 0-10
  feedback: string; // 总体点评
}

/** 单轮讲题的即时回应。 */
export interface FeynmanReply {
  feedback: string;
  followUpQuestion?: string;
}

export interface AiTutorService {
  /** 针对孩子某一问的回答，给出鼓励性反馈和可选追问。 */
  respondToFeynmanAnswer(
    mistake: Mistake,
    questionIndex: number,
    answer: string,
    previousAnswers: string[]
  ): Promise<FeynmanReply>;

  /** 讲题结束后，对全部回答做整体五维评分（0-10）。 */
  scoreFeynmanSession(
    mistake: Mistake,
    answers: string[]
  ): Promise<FeynmanEvaluation>;

  /** 分层提示：1=提示，2=关键步骤，3=完整解析。 */
  generateHint(mistake: Mistake, level: 1 | 2 | 3): Promise<string>;
}
