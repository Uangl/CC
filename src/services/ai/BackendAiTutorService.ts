import { Mistake } from '../../models/types';
import { AiTutorService, FeynmanEvaluation, FeynmanReply } from './AiTutorService';
import { MockAiTutorService } from './MockAiTutorService';
import { apiFetch } from '../api/client';

export class BackendAiTutorService implements AiTutorService {
  private fallback = new MockAiTutorService();

  async respondToFeynmanAnswer(
    mistake: Mistake,
    questionIndex: number,
    answer: string,
    _previousAnswers: string[]
  ): Promise<FeynmanReply> {
    try {
      return await apiFetch<FeynmanReply>('/api/ai/feynman-reply', {
        method: 'POST',
        body: JSON.stringify({ mistake, questionIndex, answer }),
        timeout: 20000,
      });
    } catch {
      return this.fallback.respondToFeynmanAnswer(mistake, questionIndex, answer, _previousAnswers);
    }
  }

  async scoreFeynmanSession(
    mistake: Mistake,
    answers: string[]
  ): Promise<FeynmanEvaluation> {
    try {
      return await apiFetch<FeynmanEvaluation>('/api/ai/feynman-score', {
        method: 'POST',
        body: JSON.stringify({ mistake, answers }),
        timeout: 20000,
      });
    } catch {
      return this.fallback.scoreFeynmanSession(mistake, answers);
    }
  }

  async generateHint(mistake: Mistake, level: 1 | 2 | 3): Promise<string> {
    try {
      const data = await apiFetch<{ hint: string }>('/api/ai/hint', {
        method: 'POST',
        body: JSON.stringify({ mistake, level }),
        timeout: 20000,
      });
      return data.hint;
    } catch {
      return this.fallback.generateHint(mistake, level);
    }
  }
}
