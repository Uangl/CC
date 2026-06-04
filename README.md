# 错题小老师

小学数学 AI 错题补弱 App

> 不是把错题存起来，而是把错题讲明白、练透、清掉。

## 快速启动

### 1. 启动后端

```bash
cd server
cp .env.example .env        # 填入 DEEPSEEK_API_KEY 等配置
npm install
npm run dev                  # 启动在 http://localhost:3000
```

预置账号：
| 角色 | 账号 | 密码 |
|------|------|------|
| 管理员 | admin | admin123 |
| 测试学生 | test | test123 |
| 测试学生 | xiaoming | test123 |

### 2. 启动前端

```bash
# 在项目根目录
cp .env.example .env
# 编辑 .env，设 EXPO_PUBLIC_API_URL=http://<你电脑IP>:3000
npm install
npx expo start -c
```

> 不启动后端也能运行：App 自动降级为离线模拟模式。

## 技术架构

```
┌─────────────────────┐
│   Expo React Native  │  前端（TypeScript + Zustand + React Navigation）
│   + 新设计系统        │
└──────────┬──────────┘
           │ REST API + JWT
┌──────────┴──────────┐
│   Express 后端       │  鉴权 · 数据存储 · API 代理
│   SQLite + JWT       │
└──────────┬──────────┘
           │
    ┌──────┴──────┐
    │  DeepSeek   │  AI 讲题评分 / 追问 / 提示 / 变式题
    │  百度 OCR   │  拍题文字识别
    └─────────────┘
```

## 功能清单

| 功能 | 状态 |
|------|------|
| 登录 / 注册 / JWT 鉴权 | ✅ |
| 管理员后台（用户管理、全局统计） | ✅ |
| 首页（今日任务、薄弱点、快捷入口） | ✅ |
| 拍错题（相机/相册/手动录入） | ✅ |
| 创建错题卡（1-6年级、42个知识点、6种错因） | ✅ |
| 错题本（筛选、搜索、状态标签） | ✅ |
| 错题详情（分层提示 AI 生成） | ✅ |
| 费曼讲题（聊天式 UI、DeepSeek 评分） | ✅ |
| 变式题练习（DeepSeek 生成 + 规则兜底） | ✅ |
| 间隔复习（D0→D1→D3→D7 调度） | ✅ |
| 薄弱知识点统计 | ✅ |
| 家长周报 | ✅ |
| 12 道种子数据 | ✅ |
| 隐私保护（无社交/排名） | ✅ |
| 新设计系统（统一色板/间距/阴影/字体） | ✅ |

## 项目结构

```
server/                    Express 后端
  index.js                 入口
  db.js                    SQLite schema + seed
  middleware/auth.js       JWT 鉴权中间件
  routes/
    auth.js                登录/注册/个人信息
    mistakes.js            错题 CRUD
    ai.js                  DeepSeek 代理（讲题/评分/提示/变式题）
    ocr.js                 百度 OCR 代理
    admin.js               管理员 API（用户管理/统计）

src/                       Expo React Native 前端
  constants/theme.ts       设计系统（色板/间距/字体/阴影）
  models/types.ts          TypeScript 类型
  store/
    authStore.ts           登录状态（Zustand）
    mistakeStore.ts        错题数据（Zustand + AsyncStorage）
  services/
    api/client.ts          后端 HTTP 客户端
    ai/                    AI 服务（接口 + Mock + 后端实现）
    variants/              变式题（接口 + 规则 + 后端实现）
  screens/                 13 个页面（含登录/注册/管理员）
  components/              共享组件
  navigation/              Auth Flow + Tab + Stack
```

## 后端 API 配置

在 `server/.env` 中配置：

| 变量 | 说明 | 申请地址 |
|------|------|---------|
| `DEEPSEEK_API_KEY` | DeepSeek AI | https://platform.deepseek.com/ |
| `BAIDU_OCR_API_KEY` | 百度 OCR API Key | https://console.bce.baidu.com/ |
| `BAIDU_OCR_SECRET_KEY` | 百度 OCR Secret Key | 同上 |
| `JWT_SECRET` | JWT 签名密钥 | 自定义随机字符串 |

不配置时后端仍可运行，AI 接口会返回 fallback 响应。

## 费用估算

| 服务 | 免费额度 | 超出后 |
|------|----------|--------|
| DeepSeek V3 | 新用户送 ¥500万 tokens | ¥1/百万 tokens |
| 百度 OCR | 1000次/月 | ¥0.004/次 |
| **月均（100学生）** | | **约 ¥5-20** |
