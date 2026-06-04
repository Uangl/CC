import { Mistake, ReviewStage, MistakeStatus } from '../../models/types';

const REVIEW_INTERVALS: Record<ReviewStage, { nextStage: ReviewStage; daysUntilNext: number }> = {
  D0: { nextStage: 'D1', daysUntilNext: 1 },
  D1: { nextStage: 'D3', daysUntilNext: 3 },
  D3: { nextStage: 'D7', daysUntilNext: 7 },
  D7: { nextStage: 'D14', daysUntilNext: 14 },
  D14: { nextStage: 'D30', daysUntilNext: 30 },
  D30: { nextStage: 'D30', daysUntilNext: 0 },
};

export class ReviewScheduler {
  scheduleNextReview(mistake: Mistake): { nextReviewAt: string; reviewStage: ReviewStage; status: MistakeStatus } {
    const config = REVIEW_INTERVALS[mistake.reviewStage];
    const nextDate = new Date();
    nextDate.setDate(nextDate.getDate() + config.daysUntilNext);

    return {
      nextReviewAt: nextDate.toISOString(),
      reviewStage: config.nextStage,
      status: 'review_due',
    };
  }

  checkMasteryCondition(mistake: Mistake): boolean {
    const hasCorrectOriginal = mistake.reviewHistory.some((r) => r.passed);
    const hasFeynmanPass = (mistake.feynmanScore ?? 0) >= 8;
    const hasVariantPass = mistake.status === 'variant_passed' ||
      mistake.reviewHistory.filter((r) => r.passed).length >= 1;
    const reviewCount = mistake.reviewHistory.filter((r) => r.passed).length;
    const hasEnoughReviews = reviewCount >= 2;

    return hasCorrectOriginal && hasFeynmanPass && hasVariantPass && hasEnoughReviews;
  }

  advanceAfterReview(mistake: Mistake, passed: boolean): Partial<Mistake> {
    if (!passed) {
      const retryDate = new Date();
      retryDate.setDate(retryDate.getDate() + 1);
      return {
        nextReviewAt: retryDate.toISOString(),
        status: 'review_due',
      };
    }

    if (this.checkMasteryCondition(mistake)) {
      return {
        status: 'mastered',
        nextReviewAt: undefined,
        reviewStage: 'D30',
      };
    }

    const next = this.scheduleNextReview(mistake);
    return {
      nextReviewAt: next.nextReviewAt,
      reviewStage: next.reviewStage,
      status: next.status,
    };
  }

  getDueReviewMistakes(mistakes: Mistake[]): Mistake[] {
    const now = new Date();
    return mistakes.filter((m) => {
      if (m.status === 'mastered') return false;
      if (!m.nextReviewAt) return false;
      return new Date(m.nextReviewAt) <= now;
    });
  }
}
