'use strict';
/* ====================================================================
   混凝土配合比智能推荐工具 · 联网版 后端
   职责：
     1) 集中存储 / 下发台账 Excel（多人共用一份中心数据，免每次上传）
     2) 代理 AI 大模型调用（OpenAI 兼容接口，密钥仅存服务端，流式返回）
     3) 托管前端静态页面 public/index.html
   依赖：仅 express（AI 调用使用 Node 18+ 内置 fetch）
   ==================================================================== */
const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

const DATA_DIR    = path.join(__dirname, 'data');
const LEDGER_PATH = path.join(DATA_DIR, 'ledger.xlsx');
const PREV_PATH   = path.join(DATA_DIR, 'ledger.prev.xlsx');

/* ---- AI 配置（OpenAI 兼容 /chat/completions）---- */
const AI_BASE  = (process.env.AI_API_BASE || 'https://api.deepseek.com/v1').replace(/\/$/, '');
const AI_KEY   = process.env.AI_API_KEY   || '';
const AI_MODEL = process.env.AI_MODEL     || 'deepseek-chat';
const AI_TEMP  = process.env.AI_TEMPERATURE != null ? Number(process.env.AI_TEMPERATURE) : 0.4;

/* ---- 可选：管理员令牌，设置后更新云端台账需携带 X-Admin-Token ---- */
const ADMIN_TOKEN = process.env.ADMIN_TOKEN || '';

if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

/* ---- 宽松 CORS（内部工具，方便前端从 file:// 或其它主机调用）---- */
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-Admin-Token');
  if (req.method === 'OPTIONS') return res.sendStatus(204);
  next();
});

/* ====================================================================
   健康检查 / 能力探测
   ==================================================================== */
app.get('/api/status', (req, res) => {
  const hasLedger = fs.existsSync(LEDGER_PATH);
  res.json({
    ok: true,
    ledger: hasLedger,
    ledgerMtime: hasLedger ? fs.statSync(LEDGER_PATH).mtime.toISOString() : null,
    ledgerSize: hasLedger ? fs.statSync(LEDGER_PATH).size : 0,
    ai: { enabled: !!AI_KEY, model: AI_MODEL, base: AI_BASE }
  });
});

/* ====================================================================
   下发中心台账（原始 xlsx，由前端用现有逻辑解析）
   ==================================================================== */
app.get('/api/ledger.xlsx', (req, res) => {
  if (!fs.existsSync(LEDGER_PATH)) {
    return res.status(404).json({ error: '云端暂无台账，请管理员先上传' });
  }
  const st = fs.statSync(LEDGER_PATH);
  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', 'inline; filename="ledger.xlsx"');
  res.setHeader('X-Ledger-Mtime', st.mtime.toISOString());
  res.setHeader('Cache-Control', 'no-store');
  fs.createReadStream(LEDGER_PATH).pipe(res);
});

/* ====================================================================
   管理员更新中心台账（原始 xlsx 作为请求体 POST）
   ==================================================================== */
app.post('/api/ledger.xlsx',
  express.raw({ type: () => true, limit: '64mb' }),
  (req, res) => {
    if (ADMIN_TOKEN && req.get('X-Admin-Token') !== ADMIN_TOKEN) {
      return res.status(401).json({ error: '管理员令牌无效' });
    }
    const body = req.body;
    if (!body || !body.length) return res.status(400).json({ error: '空文件' });
    // xlsx 实为 zip，签名应以 'PK'(0x50 0x4B) 开头
    if (!(body[0] === 0x50 && body[1] === 0x4b)) {
      return res.status(400).json({ error: '不是有效的 .xlsx 文件（需 Office Open XML 格式）' });
    }
    try {
      if (fs.existsSync(LEDGER_PATH)) fs.copyFileSync(LEDGER_PATH, PREV_PATH); // 保留一份上一版
      fs.writeFileSync(LEDGER_PATH, body);
      res.json({ ok: true, size: body.length, mtime: new Date().toISOString() });
    } catch (e) {
      res.status(500).json({ error: '保存失败：' + e.message });
    }
  }
);

/* ====================================================================
   AI 智能研判（流式）
   前端发送 { summary, question }，服务端拼接提示词后调用大模型，
   将增量文本以纯文本流逐字返回。
   ==================================================================== */
const SYSTEM_PROMPT =
`你是一名资深的混凝土配合比设计与试验检测工程师，熟悉中国铁路工程实践及《普通混凝土配合比设计规程》(JGJ 55)、` +
`《铁路混凝土工程施工技术规程》等标准。用户会给你一份由"历史台账相似匹配算法"自动生成的配合比推荐结果，` +
`请你以专业工程师视角进行复核与研判。要求：\n` +
`1. 用中文、条理清晰，使用规范的工程术语；\n` +
`2. 不要编造台账中不存在的数据，缺数据就说明"台账未提供"；\n` +
`3. 给出可操作的数值方向（如水胶比/砂率/胶材的建议调整区间），但强调最终以试验为准；\n` +
`4. 严禁输出与混凝土配合比无关的内容。`;

function buildUserPrompt(payload) {
  const summary = (payload && payload.summary ? String(payload.summary) : '（未提供推荐数据）').slice(0, 12000);
  const q = payload && payload.question ? String(payload.question).slice(0, 800) : '';
  return (
`以下是算法生成的混凝土配合比推荐结果，请进行专业复核与研判：

${summary}
${q ? '\n用户补充关注点：' + q + '\n' : ''}
请按如下结构输出（使用小标题）：
## 总体评价
（该推荐是否合理、可否直接试配 / 需先调整）
## 关键参数研判
（水胶比、胶材用量、砂率、掺合料占比、外加剂、坍落度是否与强度/耐久/工作性要求匹配）
## 主要风险与注意事项
## 试配建议
（给出可操作的调整方向、试拌与检测要点）
## 一句话结论`
  );
}

app.post('/api/ai/analyze', express.json({ limit: '4mb' }), async (req, res) => {
  if (!AI_KEY) {
    return res.status(503).json({ error: 'AI 未配置：请在服务端 .env 设置 AI_API_KEY 后重启' });
  }
  let upstream;
  try {
    upstream = await fetch(AI_BASE + '/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + AI_KEY },
      body: JSON.stringify({
        model: AI_MODEL,
        stream: true,
        temperature: AI_TEMP,
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user',   content: buildUserPrompt(req.body || {}) }
        ]
      })
    });
  } catch (e) {
    return res.status(502).json({ error: '无法连接 AI 服务：' + e.message });
  }
  if (!upstream.ok || !upstream.body) {
    const detail = await upstream.text().catch(() => '');
    return res.status(502).json({ error: 'AI 服务返回错误 ' + upstream.status, detail: detail.slice(0, 500) });
  }

  res.setHeader('Content-Type', 'text/plain; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('X-Accel-Buffering', 'no'); // 关闭 nginx 缓冲，保证流式

  const reader = upstream.body.getReader();
  const decoder = new TextDecoder('utf-8');
  let buf = '';
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buf += decoder.decode(value, { stream: true });
      const lines = buf.split('\n');
      buf = lines.pop(); // 末段可能不完整，留到下一轮
      for (const line of lines) {
        const s = line.trim();
        if (!s.startsWith('data:')) continue;
        const data = s.slice(5).trim();
        if (data === '[DONE]') { res.end(); return; }
        try {
          const j = JSON.parse(data);
          const delta = j.choices && j.choices[0] && j.choices[0].delta && j.choices[0].delta.content;
          if (delta) res.write(delta);
        } catch (_) { /* 忽略非 JSON 心跳行 */ }
      }
    }
    res.end();
  } catch (e) {
    try { res.write('\n\n[AI 流式中断：' + e.message + ']'); } catch (_) {}
    res.end();
  }
});

/* ====================================================================
   静态前端
   ==================================================================== */
app.use(express.static(path.join(__dirname, 'public')));

app.listen(PORT, () => {
  console.log('混凝土配合比智能推荐工具 · 联网版');
  console.log('  本地访问:  http://localhost:' + PORT);
  console.log('  中心台账:  ' + (fs.existsSync(LEDGER_PATH) ? '已就绪' : '未上传（首次需管理员上传）'));
  console.log('  AI 引擎:   ' + (AI_KEY ? (AI_MODEL + ' @ ' + AI_BASE) : '未配置（设置 AI_API_KEY 后启用）'));
});
