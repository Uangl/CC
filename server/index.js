require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ── Routes ──────────────────────────────────────────────
app.use('/api/auth',     require('./routes/auth'));
app.use('/api/mistakes', require('./routes/mistakes'));
app.use('/api/ai',       require('./routes/ai'));
app.use('/api/ocr',      require('./routes/ocr'));
app.use('/api/admin',    require('./routes/admin'));

// ── Health check ────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    deepseek: !!process.env.DEEPSEEK_API_KEY,
    baiduOcr: !!(process.env.BAIDU_OCR_API_KEY && process.env.BAIDU_OCR_SECRET_KEY),
  });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`\n  错题小老师后端已启动: http://localhost:${PORT}`);
  console.log(`  健康检查: http://localhost:${PORT}/api/health`);
  console.log(`\n  预置账号:`);
  console.log(`    管理员  admin / admin123`);
  console.log(`    测试    test  / test123`);
  console.log(`    测试    xiaoming / test123\n`);
});
