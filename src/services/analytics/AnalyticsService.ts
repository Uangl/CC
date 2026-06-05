import {
  Mistake,
  MistakeReasonType,
  WeakPointSummary,
  ParentReport,
  Grade,
} from '../../models/types';
import { MISTAKE_REASONS } from '../../constants/mistakeReasons';

export class AnalyticsService {
  getWeakPoints(mistakes: Mistake[]): WeakPointSummary[] {
    const activeMistakes = mistakes.filter((m) => m.status !== 'mastered');
    const grouped = new Map<string, Mistake[]>();

    for (const m of activeMistakes) {
      const key = m.knowledgePointId;
      if (!grouped.has(key)) grouped.set(key, []);
      grouped.get(key)!.push(m);
    }

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const summaries: WeakPointSummary[] = [];

    for (const [kpId, kpMistakes] of grouped) {
      const first = kpMistakes[0];
      const recentMistakes = kpMistakes.filter(
        (m) => new Date(m.createdAt) >= sevenDaysAgo
      ).length;
      const masteredCount = mistakes.filter(
        (m) => m.knowledgePointId === kpId && m.status === 'mastered'
      ).length;

      const reasonCounts = new Map<MistakeReasonType, number>();
      for (const m of kpMistakes) {
        reasonCounts.set(m.mistakeReason, (reasonCounts.get(m.mistakeReason) || 0) + 1);
      }
      let mainReason: MistakeReasonType = 'knowledge_gap';
      let maxCount = 0;
      for (const [reason, count] of reasonCounts) {
        if (count > maxCount) {
          mainReason = reason;
          maxCount = count;
        }
      }

      const mainReasonLabel =
        MISTAKE_REASONS.find((r) => r.type === mainReason)?.label || '未知';

      const rawMastery =
        100 -
        Math.min(
          90,
          kpMistakes.length * 12 + recentMistakes * 8 - masteredCount * 15
        );
      const mastery = Math.max(0, Math.min(100, rawMastery));

      const suggestion =
        mastery < 40
          ? `建议先讲会 1 道「${first.knowledgePointName}」错题，再做 3 道变式题`
          : mastery < 70
            ? `继续练习「${first.knowledgePointName}」的变式题，巩固薄弱环节`
            : `「${first.knowledgePointName}」掌握不错，保持复习即可`;

      summaries.push({
        knowledgePointId: kpId,
        knowledgePointName: first.knowledgePointName,
        grade: first.grade as Grade,
        totalMistakes: kpMistakes.length,
        recentMistakes,
        masteredCount,
        mastery,
        mainReason,
        mainReasonLabel,
        suggestion,
      });
    }

    return summaries.sort((a, b) => a.mastery - b.mastery);
  }

  getParentReport(mistakes: Mistake[]): ParentReport {
    const now = new Date();
    const weekStart = new Date(now);
    weekStart.setDate(weekStart.getDate() - weekStart.getDay());
    weekStart.setHours(0, 0, 0, 0);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 6);
    weekEnd.setHours(23, 59, 59, 999);

    const newMistakes = mistakes.filter(
      (m) => new Date(m.createdAt) >= weekStart && new Date(m.createdAt) <= weekEnd
    );
    const masteredThisWeek = mistakes.filter(
      (m) =>
        m.status === 'mastered' &&
        new Date(m.updatedAt) >= weekStart &&
        new Date(m.updatedAt) <= weekEnd
    );

    const weakPoints = this.getWeakPoints(mistakes).slice(0, 5);

    const reasonCounts = new Map<MistakeReasonType, number>();
    for (const m of mistakes) {
      reasonCounts.set(m.mistakeReason, (reasonCounts.get(m.mistakeReason) || 0) + 1);
    }
    const total = mistakes.length || 1;
    const reasonDistribution = Array.from(reasonCounts.entries())
      .map(([reason, count]) => ({
        reason,
        label: MISTAKE_REASONS.find((r) => r.type === reason)?.label || '未知',
        count,
        percentage: Math.round((count / total) * 100),
      }))
      .sort((a, b) => b.count - a.count);

    const suggestions = this.generateSuggestions(reasonDistribution, weakPoints);

    return {
      weekStart: weekStart.toISOString(),
      weekEnd: weekEnd.toISOString(),
      newMistakesCount: newMistakes.length,
      masteredCount: masteredThisWeek.length,
      topWeakPoints: weakPoints,
      reasonDistribution,
      suggestions,
    };
  }

  private generateSuggestions(
    reasonDistribution: ParentReport['reasonDistribution'],
    weakPoints: WeakPointSummary[]
  ): string[] {
    const suggestions: string[] = [];

    if (reasonDistribution.length > 0) {
      const topReason = reasonDistribution[0];
      if (topReason.reason === 'reading_error') {
        suggestions.push(
          '本周孩子主要不是不会算，而是审题时容易漏条件。陪练时请先让孩子圈关键词，再开始计算。'
        );
      } else if (topReason.reason === 'calculation_error') {
        suggestions.push(
          '本周计算错误较多，建议每天做5分钟口算练习，重点关注进位和退位。'
        );
      } else if (topReason.reason === 'knowledge_gap') {
        suggestions.push(
          '本周有些知识点还没掌握牢固，建议回顾课本对应章节，用费曼方法让孩子讲给您听。'
        );
      } else if (topReason.reason === 'method_error') {
        suggestions.push(
          '本周孩子在解题步骤上出错较多，建议陪练时让孩子先说解题思路，再动笔计算。'
        );
      } else if (topReason.reason === 'transfer_error') {
        suggestions.push(
          '孩子在题目变换问法后容易出错，建议多做变式练习，培养灵活运用知识的能力。'
        );
      } else {
        suggestions.push(
          '建议关注书写规范，让孩子养成列竖式对齐、标单位的好习惯。'
        );
      }
    }

    suggestions.push('建议每天只讲 1 道代表性错题，不要一次刷太多。');

    if (weakPoints.length > 0) {
      suggestions.push(
        `本周薄弱知识点是「${weakPoints[0].knowledgePointName}」，可以重点关注。`
      );
    }

    return suggestions;
  }
}
