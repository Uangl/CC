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

const STORAGE_KEY = 'cuoti_mistakes';

interface MistakeStore {
  mistakes: Mistake[];
  initialized: boolean;

  initialize: () => Promise<void>;
  addMistake: (mistake: Omit<Mistake, 'id' | 'createdAt' | 'updatedAt' | 'variantQuestions' | 'reviewHistory' | 'subject'>) => void;
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

  addMistake: (mistakeData) => {
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
  },

  deleteMistake: (id) => {
    set((state) => ({
      mistakes: state.mistakes.filter((m) => m.id !== id),
    }));
    get().persistMistakes();
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
    set((state) => ({
      mistakes: state.mistakes.map((m) =>
        m.id === id
          ? {
              ...m,
              feynmanExplanation: explanation,
              feynmanScore: score,
              status: score >= 8 ? 'explained' : m.status,
              updatedAt: new Date().toISOString(),
            }
          : m
      ),
    }));
    get().persistMistakes();
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
  },

  persistMistakes: async () => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(get().mistakes));
    } catch {
      // ignore storage errors
    }
  },
}));
