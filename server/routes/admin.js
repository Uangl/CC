const { Router } = require('express');
const bcrypt = require('bcryptjs');
const db = require('../db');
const { adminRequired } = require('../middleware/auth');

const router = Router();
router.use(adminRequired);

router.get('/users', (req, res) => {
  const users = db.prepare(`
    SELECT u.id, u.phone, u.nickname, u.role, u.grade, u.created_at,
           (SELECT COUNT(*) FROM mistakes WHERE user_id = u.id) AS mistake_count,
           (SELECT COUNT(*) FROM mistakes WHERE user_id = u.id AND status = 'mastered') AS mastered_count
    FROM users u ORDER BY u.created_at DESC
  `).all();
  res.json({ users });
});

router.get('/users/:id', (req, res) => {
  const user = db.prepare(`
    SELECT id, phone, nickname, role, grade, avatar_url, created_at
    FROM users WHERE id = ?
  `).get(req.params.id);
  if (!user) return res.status(404).json({ error: '用户不存在' });

  const mistakes = db.prepare(`
    SELECT id, question_text, status, knowledge_point_name, feynman_score, created_at
    FROM mistakes WHERE user_id = ? ORDER BY created_at DESC
  `).all(req.params.id);

  res.json({ user, mistakes });
});

router.put('/users/:id', (req, res) => {
  const { role, grade, nickname } = req.body;
  db.prepare(`
    UPDATE users SET
      role     = COALESCE(?, role),
      grade    = COALESCE(?, grade),
      nickname = COALESCE(?, nickname),
      updated_at = datetime('now')
    WHERE id = ?
  `).run(role, grade, nickname, req.params.id);

  const user = db.prepare('SELECT id, phone, nickname, role, grade, created_at FROM users WHERE id = ?')
    .get(req.params.id);
  res.json({ user });
});

router.post('/users/:id/reset-password', (req, res) => {
  const newPwd = req.body.password || 'reset123';
  const hash = bcrypt.hashSync(newPwd, 10);
  db.prepare('UPDATE users SET password = ? WHERE id = ?').run(hash, req.params.id);
  res.json({ ok: true, message: `密码已重置` });
});

router.delete('/users/:id', (req, res) => {
  if (Number(req.params.id) === req.user.id) {
    return res.status(400).json({ error: '不能删除自己' });
  }
  db.prepare('DELETE FROM users WHERE id = ?').run(req.params.id);
  res.json({ ok: true });
});

router.get('/stats', (req, res) => {
  const totalUsers = db.prepare('SELECT COUNT(*) AS n FROM users').get().n;
  const totalMistakes = db.prepare('SELECT COUNT(*) AS n FROM mistakes').get().n;
  const totalMastered = db.prepare("SELECT COUNT(*) AS n FROM mistakes WHERE status='mastered'").get().n;
  const todayNew = db.prepare(
    "SELECT COUNT(*) AS n FROM mistakes WHERE created_at >= date('now')"
  ).get().n;

  const topKnowledgePoints = db.prepare(`
    SELECT knowledge_point_name, COUNT(*) AS count
    FROM mistakes WHERE status != 'mastered'
    GROUP BY knowledge_point_id ORDER BY count DESC LIMIT 10
  `).all();

  res.json({ totalUsers, totalMistakes, totalMastered, todayNew, topKnowledgePoints });
});

module.exports = router;
