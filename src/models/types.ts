export type MistakeStatus =
  | 'captured'
  | 'diagnosed'
  | 'corrected'
  | 'explained'
  | 'variant_passed'
  | 'review_due'
  | 'mastered';

export type MistakeReasonType =
  | 'knowledge_gap'
  | 'method_error'
  | 'calculation_error'
  | 'reading_error'
  | 'transfer_error'
  | 'format_error';

export type Grade = 3 | 4 | 5 | 6;

export type ReviewStage = 'D0' | 'D1' | 'D3' | 'D7' | 'D14' | 'D30';

export interface KnowledgePoint {
  id: string;
  name: string;
  grade: Grade;
  parentId?: string;
  description: string;
  commonMistakes: string[];
  prerequisiteIds: string[];
}

export interface Mistake {
  id: string;
  imageUri?: string;
  subject: 'math';
  grade: Grade;
  questionText: string;
  studentAnswer: string;
  correctAnswer: string;
  explanation: string;
  knowledgePointId: string;
  knowledgePointName: string;
  mistakeReason: MistakeReasonType;
  difficulty: 1 | 2 | 3;
  status: MistakeStatus;
  reviewStage: ReviewStage;
  nextReviewAt?: string;
  createdAt: string;
  updatedAt: string;
  feynmanExplanation?: string;
  feynmanScore?: number;
  variantQuestions: VariantQuestion[];
  reviewHistory: ReviewHistory[];
}

export interface VariantQuestion {
  id: string;
  questionText: string;
  answer: string;
  explanation: string;
  knowledgePointId: string;
  difficulty: 1 | 2 | 3;
}

export interface ReviewHistory {
  date: string;
  stage: ReviewStage;
  passed: boolean;
  score?: number;
}

export interface FeynmanSession {
  mistakeId: string;
  responses: FeynmanResponse[];
  totalScore: number;
  completedAt: string;
}

export interface FeynmanResponse {
  question: string;
  answer: string;
  followUp?: string;
}

export interface WeakPointSummary {
  knowledgePointId: string;
  knowledgePointName: string;
  grade: Grade;
  totalMistakes: number;
  recentMistakes: number;
  masteredCount: number;
  mastery: number;
  mainReason: MistakeReasonType;
  mainReasonLabel: string;
  suggestion: string;
}

export interface ParentReport {
  weekStart: string;
  weekEnd: string;
  newMistakesCount: number;
  masteredCount: number;
  topWeakPoints: WeakPointSummary[];
  reasonDistribution: ReasonDistributionItem[];
  suggestions: string[];
}

export interface ReasonDistributionItem {
  reason: MistakeReasonType;
  label: string;
  count: number;
  percentage: number;
}
