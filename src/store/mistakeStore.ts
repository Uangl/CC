import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  Mistake,
  MistakeStatus,
  MistakeReasonType,
  VariantQuestion,
  ReviewHistory,
  Grade,
} from '../models/types';
import { SEED_MISTAKES } from '../data/seedData';
import { generateId } from '../utils/id';
import { apiFetch } from '../services/api/client';

const STORAGE_KEY = 'cuoti_mistakes';

const apiUrl = process.env.EXPO_PUBLIC_API_URL ?? '';
const useBackend = apiUrl.length > 0;

// ── snake_case ↔ camelCase converters ────────────────────

function toFrontendVariant(v: Record<string, unknown>): VariantQuestion {
  return {
    id: (v.id || v.id) as string,
    questionText: (v.question_text || v.questionText) as string,
    answer: v.answer as string,
    explanation: ((v.explanation as string) || ''),
    knowledgePointId: (v.knowledge_point_id || v.knowledgePointId) as string,
    difficulty: (v.difficulty || 1) as 1 | 2 | 3,
  };
}

function toFrontendReview(r: Record<string, unknown>): ReviewHistory {
  return {
    date: r.date as string,
    stage: r.stage as ReviewHistory['stage'],
    passed: !!r.passed,
    score: (r.score as number) ?? undefined,
  };
}

function toFrontend(m: Record<string, unknown>): Mistake {
  const variants = (m.variantQuestions || m.variant_questions || []) as Record<string, unknown>[];
  const reviews = (m.reviewHistory || m.review_history || []) as Record<string, unknown>[];
  return {
    id: m.id as string,
    imageUri: (m.image_uri as string) || undefined,
    subject: 'math',
    grade: (m.grade || 3) as Grade,
    questionText: (m.question_text as string) || '',
    studentAnswer: (m.student_answer as string) || '',
    correctAnswer: (m.correct_answer as string) || '',
    explanation: (m.explanation as string) || '',
    knowledgePointId: (m.knowledge_point_id as string) || '',
    knowledgePointName: (m.knowledge_point_name as string) || '',
    mistakeReason: (m.mistake_reason || 'knowledge_gap') as MistakeReasonType,
    difficulty: (m.difficulty || 1) as 1 | 2 | 3,
    status: (m.status || 'captured') as MistakeStatus,
    reviewStage: (m.review_stage || 'D0') as ReviewHistory['stage'],
    nextReviewAt: (m.next_review_at as string) || undefined,
    createdAt: (m.created_at as string) || new Date().toISOString(),
    updatedAt: (m.updated_at as string) || new Date().toISOString(),
    feynmanExplanation: (m.feynman_explanation as string) || undefined,
    feynmanScore: (m.feynman_score as number) ?? undefined,
    variantQuestions: variants.map(toFrontendVariant),
    reviewHistory: reviews.map(toFrontendReview),
  };
}

function toBackendCreate(d: Record<string, unknown>): Record<string, unknown> {
  return {
    image_uri: d.imageUri,
    grade: d.grade,
    question_text: d.questionText,
    student_answer: d.studentAnswer,
    correct_answer: d.correctAnswer,
    explanation: d.explanation,
    knowledge_point_id: d.knowledgePointId,
    knowledge_point_name: d.knowledgePointName,
    mistake_reason: d.mistakeReason,
    difficulty: d.difficulty,
    status: d.status,
    review_stage: d.reviewStage,
    next_review_at: d.nextReviewAt,
  };
}

function toBackendUpdate(u: Partial<Mistake>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  if (u.questionText !== undefined) out.question_text = u.questionText;
  if (u.studentAnswer !== undefined) out.student_answer = u.studentAnswer;
  if (u.correctAnswer !== undefined) out.correct_answer = u.correctAnswer;
  if (u.explanation !== undefined) out.explanation = u.explanation;
  if (u.mistakeReason !== undefined) out.mistake_reason = u.mistakeReason;
  if (u.difficulty !== undefined) out.difficulty = u.difficulty;
  if (u.status !== undefined) out.status = u.status;
  if (u.reviewStage !== undefined) out.review_stage = u.reviewStage;
  if (u.nextReviewAt !== undefined) out.next_review_at = u.nextReviewAt;
  if (u.feynmanExplanation !== undefined) out.feynman_explanation = u.feynmanExplanation;
  if (u.feynmanScore !== undefined) out.feynman_score = u.feynmanScore;
  return out;
}

// ── Store ────────────────────────────────────────────────

interface MistakeStore {
  mistakes: Mistake[];
  initialized: boolean;

  initialize: () => Promise<void>;
  addMistake: (mistake: Omit<Mistake, 'id' | 'createdAt' | 'updatedAt' | 'variantQuestions' | 'reviewHistory' | 'subject'>) => Promise<void>;
  updateMistake: (id: string, updates: Partial<Mistake>) => void;
  deleteMistake: (id: string) => void;
  getMistakeById: (id: string) => Mistake | undefined;
  getMistakesByStatus: (status: MistakeStatus) => Mistake[];
  getMistakesByGrade: (grade: Grade) => Mistake[];
  getMistakesByKnowledgePoint: (kpId: string) => Mistake[];
  getMistakesByReason: (reason: MistakeReasonType) => Mistake[];
  getDueReviews: () => Mistake[];
  updateFeynmanScore: (id: string, explanation: string, score: number) => void;
  updateVariantResults: (id: string, variants: VariantQuestion[], correctCount: number) => void;
  addReviewHistory: (id: string, entry: ReviewHistory) => void;
  persistMistakes: () => Promise<void>;
}

export const useMistakeStore = create<MistakeStore>((set, get) => ({
  mistakes: [],
  initialized: false,

  initialize: async () => {
    if (useBackend) {
      try {
        const data = await apiFetch<{ mistakes: Record<string, unknown>[] }>('/api/mistakes');
        const mistakes = data.mistakes.map(toFrontend);
        set({ mistakes, initialized: true });
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(mistakes));
        return;
      } catch {
        // backend unreachable — fall through to local
      }
    }

    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as Mistake[];
        if (parsed.length > 0) {
          set({ mistakes: parsed, initialized: true });
          return;
        }
      }
    } catch {
      // ignore parse errors
    }
    set({ mistakes: SEED_MISTAKES, initialized: true });
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(SEED_MISTAKES));
  },

  addMistake: async (mistakeData) => {
    if (useBackend) {
      try {
        const body = toBackendCreate(mistakeData as Record<string, unknown>);
        const data = await apiFetch<{ mistake: Record<string, unknown> }>('/api/mistakes', {
          method: 'POST',
          body: JSON.stringify(body),
        });
        const newMistake = toFrontend(data.mistake);
        set((state) => ({ mistakes: [newMistake, ...state.mistakes] }));
        get().persistMistakes();
        return;
      } catch {
        // backend failed — fall through to local
      }
    }

    const now = new Date().toISOString();
    const newMistake: Mistake = {
      ...mistakeData,
      id: generateId(),
      subject: 'math',
      createdAt: now,
      updatedAt: now,
      variantQuestions: [],
      reviewHistory: [],
    };
    set((state) => ({ mistakes: [newMistake, ...state.mistakes] }));
    get().persistMistakes();
  },

  updateMistake: (id, updates) => {
    set((state) => ({
      mistakes: state.mistakes.map((m) =>
        m.id === id ? { ...m, ...updates, updatedAt: new Date().toISOString() } : m
      ),
    }));
    get().persistMistakes();

    if (useBackend) {
      apiFetch(`/api/mistakes/${id}`, {
        method: 'PUT',
        body: JSON.stringify(toBackendUpdate(updates)),
      }).catch(() => {});
    }
  },

  deleteMistake: (id) => {
    set((state) => ({
      mistakes: state.mistakes.filter((m) => m.id !== id),
    }));
    get().persistMistakes();

    if (useBackend) {
      apiFetch(`/api/mistakes/${id}`, { method: 'DELETE' }).catch(() => {});
    }
  },

  getMistakeById: (id) => get().mistakes.find((m) => m.id === id),

  getMistakesByStatus: (status) =>
    get().mistakes.filter((m) => m.status === status),

  getMistakesByGrade: (grade) =>
    get().mistakes.filter((m) => m.grade === grade),

  getMistakesByKnowledgePoint: (kpId) =>
    get().mistakes.filter((m) => m.knowledgePointId === kpId),

  getMistakesByReason: (reason) =>
    get().mistakes.filter((m) => m.mistakeReason === reason),

  getDueReviews: () => {
    const now = new Date();
    return get().mistakes.filter((m) => {
      if (m.status === 'mastered') return false;
      if (!m.nextReviewAt) return false;
      return new Date(m.nextReviewAt) <= now;
    });
  },

  updateFeynmanScore: (id, explanation, score) => {
    const newStatus: MistakeStatus | undefined = score >= 8 ? 'explained' : undefined;
    set((state) => ({
      mistakes: state.mistakes.map((m) =>
        m.id === id
          ? {
              ...m,
              feynmanExplanation: explanation,
              feynmanScore: score,
              status: newStatus || m.status,
              updatedAt: new Date().toISOString(),
            }
          : m
      ),
    }));
    get().persistMistakes();

    if (useBackend) {
      apiFetch(`/api/mistakes/${id}`, {
        method: 'PUT',
        body: JSON.stringify({
          feynman_explanation: explanation,
          feynman_score: score,
          ...(newStatus ? { status: newStatus } : {}),
        }),
      }).catch(() => {});
    }
  },

  updateVariantResults: (id, variants, correctCount) => {
    const now = new Date();
    const passed = correctCount >= 2;
    const nextReview = new Date(now);
    nextReview.setDate(nextReview.getDate() + 1);

    set((state) => ({
      mistakes: state.mistakes.map((m) => {
        if (m.id !== id) return m;
        return {
          ...m,
          variantQuestions: variants,
          status: passed ? 'variant_passed' : m.status,
          nextReviewAt: passed ? nextReview.toISOString() : m.nextReviewAt,
          reviewStage: passed ? 'D1' : m.reviewStage,
          updatedAt: now.toISOString(),
        };
      }),
    }));
    get().persistMistakes();

    if (useBackend) {
      apiFetch(`/api/mistakes/${id}`, {
        method: 'PUT',
        body: JSON.stringify({
          ...(passed
            ? { status: 'variant_passed', review_stage: 'D1', next_review_at: nextReview.toISOString() }
            : {}),
          variantQuestions: variants,
        }),
      }).catch(() => {});
    }
  },

  addReviewHistory: (id, entry) => {
    set((state) => ({
      mistakes: state.mistakes.map((m) =>
        m.id === id
          ? {
              ...m,
              reviewHistory: [...m.reviewHistory, entry],
              updatedAt: new Date().toISOString(),
            }
          : m
      ),
    }));
    get().persistMistakes();

    if (useBackend) {
      apiFetch(`/api/mistakes/${id}`, {
        method: 'PUT',
        body: JSON.stringify({ newReviewEntry: entry }),
      }).catch(() => {});
    }
  },

  persistMistakes: async () => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(get().mistakes));
    } catch {
      // ignore storage errors
    }
  },
}));
