import { Mistake } from '../../models/types';

export interface FeynmanEvaluation {
  conceptScore: number;
  reasonScore: number;
  stepsScore: number;
  explanationScore: number;
  reminderScore: number;
  totalScore: number;
  feedback: string;
  followUpQuestion?: string;
}

export interface AiTutorService {
  evaluateFeynmanResponse(
    mistake: Mistake,
    questionIndex: number,
    answer: string
  ): Promise<FeynmanEvaluation>;

  generateFollowUp(
    mistake: Mistake,
    questionIndex: number,
    answer: string
  ): Promise<string>;

  generateHint(mistake: Mistake, level: 1 | 2 | 3): Promise<string>;
}
