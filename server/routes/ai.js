const { Router } = require('express');
const { authRequired } = require('../middleware/auth');

const router = Router();
router.use(authRequired);

const DEEPSEEK_URL = 'https://api.deepseek.com/chat/completions';
const MODEL = 'deepseek-chat';

async function deepseekChat(messages, { temperature = 0.6, max_tokens = 1024 } = {}) {
  const key = process.env.DEEPSEEK_API_KEY;
  if (!key) throw new Error('DEEPSEEK_API_KEY not configured');

  const res = await fetch(DEEPSEEK_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${key}`,
    },
    body: JSON.stringify({ model: MODEL, messages, temperature, max_tokens }),
  });
  if (!res.ok) {
    const txt = await res.text().catch(() => '');
    throw new Error(`DeepSeek ${res.status}: ${txt}`);
  }
  const data = await res.json();
  return data.choices?.[0]?.message?.content ?? '';
}

function parseJsonLoose(text) {
  if (!text) return null;
  let s = text.replace(/```json/gi, '').replace(/```/g, '').trim();
  const i = s.indexOf('{');
  const j = s.indexOf('[');
  let start, close;
  if (j !== -1 && (i === -1 || j < i)) { start = j; close = ']'; }
  else if (i !== -1) { start = i; close = '}'; }
  else return null;
  const end = s.lastIndexOf(close);
  if (end <= start) return null;
  try { return JSON.parse(s.slice(start, end + 1)); } catch { return null; }
}

function mistakeContext(m) {
  return [
    `年级：${m.grade}年级`,
    `知识点：${m.knowledgePointName || m.knowledge_point_name}`,
    `题目：${m.questionText || m.question_text}`,
    `学生答案：${m.studentAnswer || m.student_answer}`,
    `正确答案：${m.correctAnswer || m.correct_answer}`,
    (m.explanation) ? `参考解析：${m.explanation}` : '',
  ].filter(Boolean).join('\n');
}

// ── 费曼单轮回应 ─────────────────────────────────────────
router.post('/feynman-reply', async (req, res) => {
  const { mistake, questionIndex, answer } = req.body;
  const question = [
    '这道题考的是什么知识点？',
    '你刚才为什么做错了？',
    '正确的做法分几步？',
    '下次遇到类似的题，你要提醒自己什么？',
  ][questionIndex] || '';

  try {
    const text = await deepseekChat([
      {
        role: 'system',
        content:
          '你是一个友好的小学生AI同学，正在听同学用费曼学习法给你讲数学错题。' +
          '用温和鼓励的语气，适合小学生的简单语言。' +
          '只返回JSON：{"feedback":"一句鼓励或点评","followUp":"简短追问或空字符串"}。' +
          '如果同学讲得清楚完整，followUp留空。',
      },
      {
        role: 'user',
        content: `${mistakeContext(mistake)}\n\n我问的问题：${question}\n同学的回答：${answer}`,
      },
    ], { temperature: 0.7, max_tokens: 300 });

    const parsed = parseJsonLoose(text);
    if (parsed?.feedback) {
      return res.json({
        feedback: parsed.feedback,
        followUpQuestion: parsed.followUp?.trim() || undefined,
      });
    }
  } catch (e) {
    console.error('feynman-reply error:', e.message);
  }
  // fallback
  const len = (answer || '').trim().length;
  res.json({
    feedback: len > 30 ? '讲得很清楚，继续保持！' : len > 12 ? '不错，可以再详细一点～' : '可以多说一点哦。',
    followUpQuestion: len <= 12 ? '你能用更简单的话再讲一次吗？' : undefined,
  });
});

// ── 费曼整体评分 ─────────────────────────────────────────
router.post('/feynman-score', async (req, res) => {
  const { mistake, answers } = req.body;
  const questions = [
    '这道题考的是什么知识点？',
    '你刚才为什么做错了？',
    '正确的做法分几步？',
    '下次遇到类似的题，你要提醒自己什么？',
  ];
  const answersText = questions
    .map((q, i) => `问题${i + 1}：${q}\n回答${i + 1}：${(answers || [])[i] || '（未回答）'}`)
    .join('\n\n');

  try {
    const text = await deepseekChat([
      {
        role: 'system',
        content:
          '你是小学数学老师，给学生的"费曼讲题"打分。五个维度各0-2分：' +
          'concept=说清考点，reason=说清错因，steps=说清步骤，' +
          'explanation=说明为什么，reminder=总结避坑提醒。' +
          '只返回JSON：{"concept":0-2,"reason":0-2,"steps":0-2,"explanation":0-2,"reminder":0-2,"feedback":"一句总体点评"}。',
      },
      { role: 'user', content: `${mistakeContext(mistake)}\n\n学生的讲题：\n${answersText}` },
    ], { temperature: 0.3, max_tokens: 400 });

    const p = parseJsonLoose(text);
    if (p) {
      const clamp = (n) => Math.max(0, Math.min(2, Number(n) || 0));
      const total = Math.min(10, Math.round(
        clamp(p.concept) + clamp(p.reason) + clamp(p.steps) +
        clamp(p.explanation) + clamp(p.reminder)
      ));
      return res.json({
        conceptScore: clamp(p.concept), reasonScore: clamp(p.reason),
        stepsScore: clamp(p.steps), explanationScore: clamp(p.explanation),
        reminderScore: clamp(p.reminder), totalScore: total,
        feedback: p.feedback || (total >= 8 ? '讲得很棒！' : '继续加油！'),
      });
    }
  } catch (e) {
    console.error('feynman-score error:', e.message);
  }
  // fallback
  const score = (answers || []).reduce((s, a) => s + Math.min(2, (a || '').length / 25), 0);
  const total = Math.min(10, Math.round(score * 2));
  res.json({
    conceptScore: 1, reasonScore: 1, stepsScore: 1,
    explanationScore: 1, reminderScore: 1, totalScore: total,
    feedback: total >= 8 ? '讲得不错！' : '再补充一下细节。',
  });
});

// ── 分层提示 ─────────────────────────────────────────────
router.post('/hint', async (req, res) => {
  const { mistake, level } = req.body;
  const levelDesc =
    level === 1 ? '只给方向性小提示，点出考点和思路，不给答案。'
    : level === 2 ? '给出关键解题步骤框架，可提到公式，不算最终答案。'
    : '给出完整解题过程和最终答案，讲清每步为什么。';

  try {
    const text = await deepseekChat([
      { role: 'system', content: '你是耐心的小学数学老师，用适合小学生的简单语言。直接给提示内容。' },
      { role: 'user', content: `${mistakeContext(mistake)}\n\n请${levelDesc}` },
    ], { temperature: 0.4, max_tokens: 500 });
    if (text.trim()) return res.json({ hint: text.trim() });
  } catch (e) {
    console.error('hint error:', e.message);
  }
  const kp = mistake.knowledgePointName || mistake.knowledge_point_name || '';
  const hints = [
    `提示：这道题考「${kp}」，想想核心公式是什么？`,
    `关键步骤：找已知条件，用「${kp}」公式计算。注意单位和进退位。`,
    `完整解析：\n${mistake.explanation || '请参考课本'}\n\n答案：${mistake.correctAnswer || mistake.correct_answer || ''}`,
  ];
  res.json({ hint: hints[Math.min((level || 1) - 1, 2)] });
});

// ── 生成变式题 ───────────────────────────────────────────
router.post('/variants', async (req, res) => {
  const { mistake, count = 3 } = req.body;
  const gradeLabels = { 1: '一年级', 2: '二年级', 3: '三年级', 4: '四年级', 5: '五年级', 6: '六年级' };

  try {
    const text = await deepseekChat([
      {
        role: 'system',
        content:
          `你是小学数学老师，根据错题和知识点出变式题。` +
          `要求：1)紧扣同一知识点 2)换数字换问法换场景 3)难度适合年级 4)务必仔细计算确保answer正确。` +
          `只返回JSON数组，长度${count}，每元素：{"questionText":"题干","answer":"答案","explanation":"简要解析","difficulty":1-3}。`,
      },
      {
        role: 'user',
        content:
          `年级：${gradeLabels[mistake.grade] || mistake.grade + '年级'}\n` +
          `知识点：${mistake.knowledgePointName || mistake.knowledge_point_name}\n` +
          `原错题：${mistake.questionText || mistake.question_text}\n` +
          `正确答案：${mistake.correctAnswer || mistake.correct_answer}\n\n请出${count}道变式题。`,
      },
    ], { temperature: 0.8, max_tokens: 1500 });

    const parsed = parseJsonLoose(text);
    if (Array.isArray(parsed)) {
      const variants = parsed
        .filter(v => v.questionText && v.answer)
        .slice(0, count)
        .map((v, i) => ({
          id: `dv_${Date.now()}_${i}`,
          questionText: v.questionText,
          answer: v.answer,
          explanation: v.explanation || '',
          knowledgePointId: mistake.knowledgePointId || mistake.knowledge_point_id,
          difficulty: [1,2,3].includes(v.difficulty) ? v.difficulty : 1,
        }));
      if (variants.length >= count) {
        return res.json({ variants });
      }
    }
  } catch (e) {
    console.error('variants error:', e.message);
  }
  res.json({ variants: [], fallback: true });
});

module.exports = router;
