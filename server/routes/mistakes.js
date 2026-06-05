const { Router } = require('express');
const { authRequired } = require('../middleware/auth');
const db = require('../db');
const crypto = require('crypto');

const router = Router();
router.use(authRequired);

function genId() {
  return `${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
}

// ── 列表（支持筛选） ─────────────────────────────────────
router.get('/', (req, res) => {
  const { status, grade, reason, kp, q } = req.query;
  let sql = 'SELECT * FROM mistakes WHERE user_id = ?';
  const params = [req.user.id];

  if (status) { sql += ' AND status = ?'; params.push(status); }
  if (grade)  { sql += ' AND grade = ?';  params.push(Number(grade)); }
  if (reason) { sql += ' AND mistake_reason = ?'; params.push(reason); }
  if (kp)     { sql += ' AND knowledge_point_id = ?'; params.push(kp); }
  if (q)      { sql += ' AND question_text LIKE ?'; params.push(`%${q}%`); }

  sql += ' ORDER BY created_at DESC';

  const mistakes = db.prepare(sql).all(...params);
  for (const m of mistakes) {
    m.variantQuestions = db.prepare(
      'SELECT * FROM variant_questions WHERE mistake_id = ?'
    ).all(m.id);
    m.reviewHistory = db.prepare(
      'SELECT * FROM review_history WHERE mistake_id = ? ORDER BY date'
    ).all(m.id);
  }

  res.json({ mistakes });
});

// ── 详情 ─────────────────────────────────────────────────
router.get('/:id', (req, res) => {
  const m = db.prepare(
    'SELECT * FROM mistakes WHERE id = ? AND user_id = ?'
  ).get(req.params.id, req.user.id);
  if (!m) return res.status(404).json({ error: '错题不存在' });

  m.variantQuestions = db.prepare(
    'SELECT * FROM variant_questions WHERE mistake_id = ?'
  ).all(m.id);
  m.reviewHistory = db.prepare(
    'SELECT * FROM review_history WHERE mistake_id = ? ORDER BY date'
  ).all(m.id);

  res.json({ mistake: m });
});

// ── 创建 ─────────────────────────────────────────────────
router.post('/', (req, res) => {
  const id = genId();
  const {
    image_uri, grade, question_text, student_answer, correct_answer,
    explanation, knowledge_point_id, knowledge_point_name,
    mistake_reason, difficulty, status, review_stage, next_review_at,
  } = req.body;

  db.prepare(`
    INSERT INTO mistakes (
      id, user_id, image_uri, grade, question_text, student_answer,
      correct_answer, explanation, knowledge_point_id, knowledge_point_name,
      mistake_reason, difficulty, status, review_stage, next_review_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    id, req.user.id, image_uri || '', grade || 3, question_text || '',
    student_answer || '', correct_answer || '', explanation || '',
    knowledge_point_id || '', knowledge_point_name || '',
    mistake_reason || 'knowledge_gap', difficulty || 1,
    status || 'captured', review_stage || 'D0', next_review_at || null
  );

  const m = db.prepare('SELECT * FROM mistakes WHERE id = ?').get(id);
  m.variantQuestions = [];
  m.reviewHistory = [];
  res.json({ mistake: m });
});

// ── 更新 ─────────────────────────────────────────────────
router.put('/:id', (req, res) => {
  const existing = db.prepare(
    'SELECT * FROM mistakes WHERE id = ? AND user_id = ?'
  ).get(req.params.id, req.user.id);
  if (!existing) return res.status(404).json({ error: '错题不存在' });

  const fields = [
    'status', 'review_stage', 'next_review_at', 'feynman_explanation',
    'feynman_score', 'explanation', 'difficulty', 'mistake_reason',
    'question_text', 'student_answer', 'correct_answer',
  ];

  const updates = [];
  const values = [];
  for (const f of fields) {
    if (req.body[f] !== undefined) {
      updates.push(`${f} = ?`);
      values.push(req.body[f]);
    }
  }
  if (updates.length > 0) {
    updates.push("updated_at = datetime('now')");
    values.push(req.params.id);
    db.prepare(`UPDATE mistakes SET ${updates.join(', ')} WHERE id = ?`).run(...values);
  }

  // 保存变式题
  if (Array.isArray(req.body.variantQuestions)) {
    db.prepare('DELETE FROM variant_questions WHERE mistake_id = ?').run(req.params.id);
    const ins = db.prepare(`
      INSERT INTO variant_questions (id, mistake_id, question_text, answer, explanation, knowledge_point_id, difficulty)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    for (const v of req.body.variantQuestions) {
      ins.run(v.id || genId(), req.params.id, v.questionText || v.question_text,
        v.answer, v.explanation || '', v.knowledgePointId || v.knowledge_point_id || '',
        v.difficulty || 1);
    }
  }

  // 追加复习记录
  if (req.body.newReviewEntry) {
    const e = req.body.newReviewEntry;
    db.prepare(`
      INSERT INTO review_history (mistake_id, date, stage, passed, score)
      VALUES (?, ?, ?, ?, ?)
    `).run(req.params.id, e.date || new Date().toISOString(), e.stage, e.passed ? 1 : 0, e.score ?? null);
  }

  const m = db.prepare('SELECT * FROM mistakes WHERE id = ?').get(req.params.id);
  m.variantQuestions = db.prepare(
    'SELECT * FROM variant_questions WHERE mistake_id = ?'
  ).all(m.id);
  m.reviewHistory = db.prepare(
    'SELECT * FROM review_history WHERE mistake_id = ? ORDER BY date'
  ).all(m.id);

  res.json({ mistake: m });
});

// ── 删除 ─────────────────────────────────────────────────
router.delete('/:id', (req, res) => {
  db.prepare(
    'DELETE FROM mistakes WHERE id = ? AND user_id = ?'
  ).run(req.params.id, req.user.id);
  res.json({ ok: true });
});

module.exports = router;
