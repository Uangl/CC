# 混凝土配合比智能推荐工具 · 联网版

中铁一局 · 试验检测中心内部工具。在原「单文件 / 本地」版本基础上，升级为 **云端中心台账 + AI 智能研判** 的联网版：

- **云端中心台账**：台账数据集中存放在本单位服务器，网页打开自动加载，多人共用同一份数据，**无需每次手动上传 Excel**；管理员可一键更新中心台账。
- **AI 智能研判**：在原有 100 分制相似匹配算法之上，新增由大模型（OpenAI 兼容接口，DeepSeek / 通义 / Kimi / 智谱 / OpenAI 等均可）对推荐结果做专业复核、风险研判与试配建议，**流式输出**。
- **离线兜底**：未连接后端时，自动回落为原来的「本地上传 + 本地算法」模式，单个 `index.html` 也能独立使用。

> 推荐结果由算法匹配与 AI 辅助生成，**仅作为试配初始推荐**，正式配合比必须经试验验证后确定。

---

## 架构

```
浏览器 (public/index.html)
   │  ① 自动 GET /api/ledger.xlsx        —— 拉取中心台账，沿用原解析+评分逻辑（在浏览器内）
   │  ② 算法在本地算出推荐配比
   │  ③ POST /api/ai/analyze {summary}   —— 请求 AI 研判
   ▼
Node 后端 (server.js, 仅依赖 express)
   ├─ 存储/下发 data/ledger.xlsx（管理员可 POST 更新）
   └─ 代理调用 AI（密钥仅在服务端 .env，流式回传）
        │
        ▼
   OpenAI 兼容大模型接口（/chat/completions）
```

设计要点：**台账解析与评分逻辑完全保留在前端**（即原版那套经过打磨的列识别 / 评分模型未改动），后端只负责「集中存数据」和「安全代理 AI」，因此风险小、可维护。

---

## 目录结构

```
.
├── server.js          后端：台账下发/更新 + AI 流式代理 + 托管前端
├── public/
│   └── index.html     前端：原工具 + 云端加载 + AI 研判面板
├── data/              中心台账存放处（ledger.xlsx，已被 .gitignore 忽略）
├── package.json
├── .env.example       环境变量模板
└── README.md
```

---

## 快速开始

需要 Node.js ≥ 18（已用 v22 验证）。

```bash
# 1. 安装依赖
npm install

# 2. 配置环境变量
cp .env.example .env
#    编辑 .env，至少填入 AI_API_KEY（不填则 AI 功能显示“未配置”，其余功能正常）

# 3. 启动
npm start
#    打开 http://localhost:3000
```

首次启动时 `data/` 内没有台账，网页会提示「云端暂无台账」。由**管理员**在网页「数据源 → 更新云端台账（管理员）」上传一次 `《…混凝土配合比管理台账（自拌）》.xlsx`，之后所有人打开即自动加载。

---

## 环境变量

| 变量 | 说明 | 示例 |
|---|---|---|
| `PORT` | 服务端口 | `3000` |
| `AI_API_BASE` | AI 接口基址（到 `/chat/completions` 之前） | `https://api.deepseek.com/v1` |
| `AI_API_KEY` | API Key，**仅存服务端**，不下发浏览器 | `sk-xxxx` |
| `AI_MODEL` | 模型名 | `deepseek-chat` |
| `AI_TEMPERATURE` | 采样温度 0~1（可选） | `0.4` |
| `ADMIN_TOKEN` | 更新中心台账所需令牌（可选，公网部署建议设置） | `任意字符串` |

### 常见 AI 提供商（均为 OpenAI 兼容）

| 提供商 | `AI_API_BASE` | 典型 `AI_MODEL` |
|---|---|---|
| DeepSeek | `https://api.deepseek.com/v1` | `deepseek-chat` |
| 通义千问 | `https://dashscope.aliyuncs.com/compatible-mode/v1` | `qwen-plus` |
| Kimi (Moonshot) | `https://api.moonshot.cn/v1` | `moonshot-v1-8k` |
| 智谱 GLM | `https://open.bigmodel.cn/api/paas/v4` | `glm-4` |
| OpenAI | `https://api.openai.com/v1` | `gpt-4o-mini` |

切换提供商只需改 `.env` 三个变量并重启，前端无需改动。

---

## API 参考

| 方法 / 路径 | 作用 | 备注 |
|---|---|---|
| `GET /api/status` | 探测后端能力 | 返回是否有台账、AI 是否启用、模型名 |
| `GET /api/ledger.xlsx` | 下载中心台账原始 xlsx | 无台账返回 404；响应头含 `X-Ledger-Mtime` |
| `POST /api/ledger.xlsx` | 更新中心台账 | 请求体为 xlsx 原始字节；校验 `PK` 签名；如设了 `ADMIN_TOKEN` 需带 `X-Admin-Token` 头；自动备份上一版为 `ledger.prev.xlsx` |
| `POST /api/ai/analyze` | AI 研判（流式） | 请求体 `{ "summary": "...", "question": "..." }`；返回 `text/plain` 流式增量文本；未配置 Key 返回 503 |

---

## 安全说明

- **AI 密钥只在服务端**（`.env`），浏览器永远拿不到，避免泄露。
- **台账数据只在本单位服务器**：`data/ledger.xlsx` 已被 `.gitignore` 忽略，不会进入代码仓库；不发往任何第三方（仅其文字摘要会发给你自己配置的 AI 接口用于研判）。
- 公网部署务必设置 `ADMIN_TOKEN`，否则任何人都能覆盖中心台账。
- 建议将本服务部署在内网，或前置反向代理 + 鉴权。

## 降级 / 离线行为

- 后端不可达：网页自动切到「本地上传」模式，沿用原始单机算法，AI 面板显示「离线」。
- 后端可达但未配 AI Key：台账云端共享正常，AI 面板显示「未配置」并禁用按钮。
- 直接双击 `public/index.html`（file://）打开：等价于原单文件版（本地上传 + 本地算法）。

## 部署建议

- 进程守护：`pm2 start server.js --name mix` 或 systemd。
- 反向代理（nginx）注意**关闭对 `/api/ai/analyze` 的响应缓冲**以保证流式（服务端已发送 `X-Accel-Buffering: no`）。
- 如需自定义后端地址（前后端分离部署），在 `index.html` 加载前设置 `window.MIX_API_BASE = 'https://你的后端'`。

---

## 与原版的差异（改了什么）

1. 顶部新增「运行模式 / AI 引擎」状态；页脚改为联网版说明。
2. 「01 数据上传」改为「01 数据源」：云端台账（默认，自动加载 + 管理员更新）/ 本地上传 双模式。
3. 文件解析抽出 `processArrayBuffer()`，本地上传与云端拉取共用同一套解析逻辑（**评分/匹配逻辑零改动**）。
4. 结果区新增「5.9 AI 智能研判」模块（流式）。
5. 新增后端 `server.js` 与配置文件。
