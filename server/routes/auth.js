const { Router } = require('express');
const bcrypt = require('bcryptjs');
const db = require('../db');
const { signToken, authRequired } = require('../middleware/auth');

const router = Router();

router.post('/register', (req, res) => {
  const { phone, password, nickname, grade } = req.body;
  if (!phone || !password) {
    return res.status(400).json({ error: '手机号和密码不能为空' });
  }
  if (password.length < 4) {
    return res.status(400).json({ error: '密码至少4位' });
  }

  const existing = db.prepare('SELECT id FROM users WHERE phone = ?').get(phone);
  if (existing) {
    return res.status(409).json({ error: '该手机号已注册' });
  }

  const hash = bcrypt.hashSync(password, 10);
  const result = db.prepare(
    'INSERT INTO users (phone, password, nickname, grade) VALUES (?, ?, ?, ?)'
  ).run(phone, hash, nickname || `同学${phone.slice(-4)}`, grade || 3);

  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(result.lastInsertRowid);
  const token = signToken(user);

  res.json({
    token,
    user: sanitizeUser(user),
  });
});

router.post('/login', (req, res) => {
  const { phone, password } = req.body;
  if (!phone || !password) {
    return res.status(400).json({ error: '手机号和密码不能为空' });
  }

  const user = db.prepare('SELECT * FROM users WHERE phone = ?').get(phone);
  if (!user || !bcrypt.compareSync(password, user.password)) {
    return res.status(401).json({ error: '手机号或密码错误' });
  }

  const token = signToken(user);
  res.json({
    token,
    user: sanitizeUser(user),
  });
});

router.get('/me', authRequired, (req, res) => {
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.user.id);
  if (!user) return res.status(404).json({ error: '用户不存在' });
  res.json({ user: sanitizeUser(user) });
});

router.put('/me', authRequired, (req, res) => {
  const { nickname, grade, avatar_url } = req.body;
  db.prepare(
    `UPDATE users SET
       nickname   = COALESCE(?, nickname),
       grade      = COALESCE(?, grade),
       avatar_url = COALESCE(?, avatar_url),
       updated_at = datetime('now')
     WHERE id = ?`
  ).run(nickname, grade, avatar_url, req.user.id);

  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.user.id);
  res.json({ user: sanitizeUser(user) });
});

function sanitizeUser(u) {
  return {
    id: u.id,
    phone: u.phone,
    nickname: u.nickname,
    role: u.role,
    grade: u.grade,
    avatar_url: u.avatar_url,
    created_at: u.created_at,
  };
}

module.exports = router;
