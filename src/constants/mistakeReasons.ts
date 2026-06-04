import { MistakeReasonType } from '../models/types';

export interface MistakeReasonOption {
  type: MistakeReasonType;
  label: string;
  childLabel: string;
  followUp?: string;
}

export const MISTAKE_REASONS: MistakeReasonOption[] = [
  {
    type: 'knowledge_gap',
    label: '知识点没学懂',
    childLabel: '我没学懂这个知识',
  },
  {
    type: 'method_error',
    label: '方法不会或步骤错',
    childLabel: '我不知道第一步怎么做',
  },
  {
    type: 'calculation_error',
    label: '计算错误',
    childLabel: '我会，但算错了',
    followUp: '我们再确认一下，是进位/退位错了，还是数字抄错了？',
  },
  {
    type: 'reading_error',
    label: '审题错误',
    childLabel: '我看漏了条件',
  },
  {
    type: 'transfer_error',
    label: '换个问法就不会',
    childLabel: '换个问法我就不会',
  },
  {
    type: 'format_error',
    label: '书写或格式错误',
    childLabel: '我写得不规范',
  },
];

export const STATUS_LABELS: Record<string, string> = {
  captured: '已收录',
  diagnosed: '已诊断',
  corrected: '已订正',
  explained: '已讲题',
  variant_passed: '变式通过',
  review_due: '待复习',
  mastered: '已出库',
};

export const GRADE_LABELS: Record<number, string> = {
  3: '三年级',
  4: '四年级',
  5: '五年级',
  6: '六年级',
};
