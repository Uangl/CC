import { Mistake, VariantQuestion } from '../../models/types';
import { VariantGenerator } from './VariantGenerator';

const VARIANT_TEMPLATES: Record<string, VariantQuestion[]> = {
  g1_add_sub_10: [
    {
      id: '',
      questionText: '3 + 5 = ?',
      answer: '8',
      explanation: '3 + 5 = 8，可以用数手指或凑十法',
      knowledgePointId: 'g1_add_sub_10',
      difficulty: 1,
    },
    {
      id: '',
      questionText: '9 - 4 = ?',
      answer: '5',
      explanation: '9 - 4 = 5',
      knowledgePointId: 'g1_add_sub_10',
      difficulty: 1,
    },
    {
      id: '',
      questionText: '小明有6颗糖，吃了2颗，还剩几颗？',
      answer: '4颗',
      explanation: '6 - 2 = 4颗',
      knowledgePointId: 'g1_add_sub_10',
      difficulty: 1,
    },
  ],
  g1_add_sub_20: [
    {
      id: '',
      questionText: '8 + 7 = ?',
      answer: '15',
      explanation: '凑十法：8 + 2 = 10，10 + 5 = 15',
      knowledgePointId: 'g1_add_sub_20',
      difficulty: 1,
    },
    {
      id: '',
      questionText: '15 - 8 = ?',
      answer: '7',
      explanation: '15 - 8 = 7，想加算减：8 + 7 = 15',
      knowledgePointId: 'g1_add_sub_20',
      difficulty: 1,
    },
    {
      id: '',
      questionText: '妈妈买了13个苹果，吃了6个，还剩几个？',
      answer: '7个',
      explanation: '13 - 6 = 7个',
      knowledgePointId: 'g1_add_sub_20',
      difficulty: 2,
    },
  ],
  g1_rmb: [
    {
      id: '',
      questionText: '1元 = 几角？',
      answer: '10角',
      explanation: '1元 = 10角',
      knowledgePointId: 'g1_rmb',
      difficulty: 1,
    },
    {
      id: '',
      questionText: '一支铅笔5角，一块橡皮3角，一共多少钱？',
      answer: '8角',
      explanation: '5角 + 3角 = 8角',
      knowledgePointId: 'g1_rmb',
      difficulty: 1,
    },
    {
      id: '',
      questionText: '小明有1元钱，买了一支铅笔花了6角，还剩多少钱？',
      answer: '4角',
      explanation: '1元 = 10角，10角 - 6角 = 4角',
      knowledgePointId: 'g1_rmb',
      difficulty: 2,
    },
  ],
  g2_add_sub_100: [
    {
      id: '',
      questionText: '45 + 38 = ?',
      answer: '83',
      explanation: '竖式计算：5+8=13，写3进1；4+3+1=8，所以45+38=83',
      knowledgePointId: 'g2_add_sub_100',
      difficulty: 1,
    },
    {
      id: '',
      questionText: '72 - 35 = ?',
      answer: '37',
      explanation: '竖式计算：2-5不够减，退位变12-5=7；6-3=3，所以72-35=37',
      knowledgePointId: 'g2_add_sub_100',
      difficulty: 2,
    },
    {
      id: '',
      questionText: '学校有56本故事书，又买来27本，一共有多少本？',
      answer: '83本',
      explanation: '56 + 27 = 83本',
      knowledgePointId: 'g2_add_sub_100',
      difficulty: 1,
    },
  ],
  g2_multiply_table: [
    {
      id: '',
      questionText: '7 × 8 = ?',
      answer: '56',
      explanation: '七八五十六',
      knowledgePointId: 'g2_multiply_table',
      difficulty: 1,
    },
    {
      id: '',
      questionText: '每排坐6人，坐了4排，一共坐了多少人？',
      answer: '24人',
      explanation: '6 × 4 = 24人',
      knowledgePointId: 'g2_multiply_table',
      difficulty: 1,
    },
    {
      id: '',
      questionText: '9 × 6 = ?',
      answer: '54',
      explanation: '九六五十四',
      knowledgePointId: 'g2_multiply_table',
      difficulty: 1,
    },
  ],
  g2_divide_table: [
    {
      id: '',
      questionText: '56 ÷ 7 = ?',
      answer: '8',
      explanation: '因为 7 × 8 = 56，所以 56 ÷ 7 = 8',
      knowledgePointId: 'g2_divide_table',
      difficulty: 1,
    },
    {
      id: '',
      questionText: '有24个苹果，平均分给6个小朋友，每人几个？',
      answer: '4个',
      explanation: '24 ÷ 6 = 4个',
      knowledgePointId: 'g2_divide_table',
      difficulty: 1,
    },
    {
      id: '',
      questionText: '45 ÷ 9 = ?',
      answer: '5',
      explanation: '因为 9 × 5 = 45，所以 45 ÷ 9 = 5',
      knowledgePointId: 'g2_divide_table',
      difficulty: 1,
    },
  ],
  g2_length: [
    {
      id: '',
      questionText: '3米 = 几厘米？',
      answer: '300厘米',
      explanation: '1米 = 100厘米，3米 = 3 × 100 = 300厘米',
      knowledgePointId: 'g2_length',
      difficulty: 1,
    },
    {
      id: '',
      questionText: '一根绳子长80厘米，剪去25厘米，还剩多少厘米？',
      answer: '55厘米',
      explanation: '80 - 25 = 55厘米',
      knowledgePointId: 'g2_length',
      difficulty: 1,
    },
    {
      id: '',
      questionText: '哪个更长：500厘米还是4米？',
      answer: '500厘米更长',
      explanation: '4米 = 400厘米，500厘米 > 400厘米',
      knowledgePointId: 'g2_length',
      difficulty: 2,
    },
  ],
  g3_area: [
    {
      id: '',
      questionText: '一个长方形的长是15厘米，宽是9厘米，面积是多少平方厘米？',
      answer: '135平方厘米',
      explanation: '长方形面积 = 长 × 宽 = 15 × 9 = 135平方厘米',
      knowledgePointId: 'g3_area',
      difficulty: 1,
    },
    {
      id: '',
      questionText: '一个正方形的边长是7厘米，面积是多少平方厘米？',
      answer: '49平方厘米',
      explanation: '正方形面积 = 边长 × 边长 = 7 × 7 = 49平方厘米',
      knowledgePointId: 'g3_area',
      difficulty: 1,
    },
    {
      id: '',
      questionText: '一块长方形草坪长20米，宽15米，如果每平方米草坪要花5元，一共要花多少元？',
      answer: '1500元',
      explanation: '面积 = 20 × 15 = 300平方米，费用 = 300 × 5 = 1500元',
      knowledgePointId: 'g3_area',
      difficulty: 2,
    },
    {
      id: '',
      questionText: '一个长方形面积是72平方厘米，长是9厘米，宽是多少厘米？',
      answer: '8厘米',
      explanation: '宽 = 面积 ÷ 长 = 72 ÷ 9 = 8厘米',
      knowledgePointId: 'g3_area',
      difficulty: 2,
    },
  ],
  g3_multiply: [
    {
      id: '',
      questionText: '34 × 26 = ?',
      answer: '884',
      explanation: '34 × 26 = 34 × 20 + 34 × 6 = 680 + 204 = 884',
      knowledgePointId: 'g3_multiply',
      difficulty: 2,
    },
    {
      id: '',
      questionText: '一箱苹果有24个，买了15箱，一共有多少个苹果？',
      answer: '360个',
      explanation: '24 × 15 = 360个',
      knowledgePointId: 'g3_multiply',
      difficulty: 1,
    },
    {
      id: '',
      questionText: '47 × 53 = ?',
      answer: '2491',
      explanation: '47 × 53 = 47 × 50 + 47 × 3 = 2350 + 141 = 2491',
      knowledgePointId: 'g3_multiply',
      difficulty: 3,
    },
  ],
  g4_decimal_add: [
    {
      id: '',
      questionText: '4.28 + 3.56 = ?',
      answer: '7.84',
      explanation: '小数点对齐：4.28 + 3.56 = 7.84',
      knowledgePointId: 'g4_decimal_add',
      difficulty: 1,
    },
    {
      id: '',
      questionText: '10.5 - 3.78 = ?',
      answer: '6.72',
      explanation: '10.50 - 3.78 = 6.72，注意退位',
      knowledgePointId: 'g4_decimal_add',
      difficulty: 2,
    },
    {
      id: '',
      questionText: '小明买了一本书花了12.5元，又买了一支笔花了3.8元，一共花了多少元？',
      answer: '16.3元',
      explanation: '12.5 + 3.8 = 16.3元',
      knowledgePointId: 'g4_decimal_add',
      difficulty: 1,
    },
    {
      id: '',
      questionText: '7.02 - 4.35 = ?',
      answer: '2.67',
      explanation: '7.02 - 4.35 = 2.67，注意连续退位',
      knowledgePointId: 'g4_decimal_add',
      difficulty: 2,
    },
  ],
  g5_polygon_area: [
    {
      id: '',
      questionText: '一个平行四边形底是14厘米，高是8厘米，面积是多少？',
      answer: '112平方厘米',
      explanation: '平行四边形面积 = 底 × 高 = 14 × 8 = 112平方厘米',
      knowledgePointId: 'g5_polygon_area',
      difficulty: 1,
    },
    {
      id: '',
      questionText: '一个梯形上底6厘米，下底10厘米，高5厘米，面积是多少？',
      answer: '40平方厘米',
      explanation: '梯形面积 = (上底+下底) × 高 ÷ 2 = (6+10) × 5 ÷ 2 = 40平方厘米',
      knowledgePointId: 'g5_polygon_area',
      difficulty: 2,
    },
    {
      id: '',
      questionText: '一个三角形底是16厘米，高是9厘米，面积是多少？',
      answer: '72平方厘米',
      explanation: '三角形面积 = 底 × 高 ÷ 2 = 16 × 9 ÷ 2 = 72平方厘米',
      knowledgePointId: 'g5_polygon_area',
      difficulty: 1,
    },
  ],
  g5_equation: [
    {
      id: '',
      questionText: '3x - 7 = 14，x = ?',
      answer: 'x = 7',
      explanation: '3x = 14 + 7 = 21，x = 21 ÷ 3 = 7',
      knowledgePointId: 'g5_equation',
      difficulty: 2,
    },
    {
      id: '',
      questionText: '5x + 3 = 28，x = ?',
      answer: 'x = 5',
      explanation: '5x = 28 - 3 = 25，x = 25 ÷ 5 = 5',
      knowledgePointId: 'g5_equation',
      difficulty: 1,
    },
    {
      id: '',
      questionText: '小明有一些糖果，吃了8个后还剩12个，小明原来有多少个糖果？（用方程解）',
      answer: 'x = 20',
      explanation: '设原来有x个，x - 8 = 12，x = 12 + 8 = 20',
      knowledgePointId: 'g5_equation',
      difficulty: 2,
    },
  ],
  g6_fraction_mul: [
    {
      id: '',
      questionText: '一块地有5公顷，种玉米的面积占总面积的 3/5，种玉米多少公顷？',
      answer: '3公顷',
      explanation: '5 × 3/5 = 3公顷',
      knowledgePointId: 'g6_fraction_mul',
      difficulty: 1,
    },
    {
      id: '',
      questionText: '2/3 × 3/4 = ?',
      answer: '1/2',
      explanation: '2/3 × 3/4 = 6/12 = 1/2',
      knowledgePointId: 'g6_fraction_mul',
      difficulty: 1,
    },
    {
      id: '',
      questionText: '一本书有240页，小明看了全书的 3/8，他看了多少页？',
      answer: '90页',
      explanation: '240 × 3/8 = 720/8 = 90页',
      knowledgePointId: 'g6_fraction_mul',
      difficulty: 2,
    },
  ],
  g6_circle: [
    {
      id: '',
      questionText: '圆的直径是8厘米，它的面积是多少？（π取3.14）',
      answer: '50.24平方厘米',
      explanation: '半径 = 8 ÷ 2 = 4厘米，面积 = 3.14 × 4² = 3.14 × 16 = 50.24平方厘米',
      knowledgePointId: 'g6_circle',
      difficulty: 2,
    },
    {
      id: '',
      questionText: '圆的半径是3厘米，它的周长是多少？（π取3.14）',
      answer: '18.84厘米',
      explanation: '周长 = 2πr = 2 × 3.14 × 3 = 18.84厘米',
      knowledgePointId: 'g6_circle',
      difficulty: 1,
    },
    {
      id: '',
      questionText: '一个圆形花坛的半径是4米，沿花坛走一圈，要走多少米？（π取3.14）',
      answer: '25.12米',
      explanation: '周长 = 2πr = 2 × 3.14 × 4 = 25.12米',
      knowledgePointId: 'g6_circle',
      difficulty: 1,
    },
  ],
};

let variantCounter = 0;

export class RuleBasedVariantGenerator implements VariantGenerator {
  async generateVariants(
    mistake: Mistake,
    count: number
  ): Promise<VariantQuestion[]> {
    const templates = VARIANT_TEMPLATES[mistake.knowledgePointId] || [];

    if (templates.length === 0) {
      return this.generateGenericVariants(mistake, count);
    }

    const shuffled = [...templates].sort(() => Math.random() - 0.5);
    const selected = shuffled.slice(0, count);

    return selected.map((t) => ({
      ...t,
      id: `variant_${++variantCounter}_${Date.now()}`,
    }));
  }

  private generateGenericVariants(
    mistake: Mistake,
    count: number
  ): VariantQuestion[] {
    const variants: VariantQuestion[] = [];
    for (let i = 0; i < count; i++) {
      variants.push({
        id: `variant_${++variantCounter}_${Date.now()}`,
        questionText: `【${mistake.knowledgePointName}】变式题 ${i + 1}：请根据所学知识，完成以下练习。（本题由系统自动生成）`,
        answer: '请参考课本中的方法解答',
        explanation: `这道题考查的是「${mistake.knowledgePointName}」，解题关键是掌握基本方法和公式。`,
        knowledgePointId: mistake.knowledgePointId,
        difficulty: mistake.difficulty,
      });
    }
    return variants;
  }
}
