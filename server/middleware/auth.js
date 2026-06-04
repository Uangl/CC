const jwt = require('jsonwebtoken');

const SECRET = process.env.JWT_SECRET || 'cuoti-dev-secret';

function signToken(user) {
  return jwt.sign(
    { id: user.id, phone: user.phone, role: user.role },
    SECRET,
    { expiresIn: '30d' }
  );
}

function authRequired(req, res, next) {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    return res.status(401).json({ error: '请先登录' });
  }
  try {
    req.user = jwt.verify(header.slice(7), SECRET);
    next();
  } catch {
    return res.status(401).json({ error: '登录已过期，请重新登录' });
  }
}

function adminRequired(req, res, next) {
  authRequired(req, res, () => {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: '需要管理员权限' });
    }
    next();
  });
}

module.exports = { signToken, authRequired, adminRequired };
