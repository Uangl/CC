# 错题小老师

小学数学 AI 错题补弱 App MVP

> 不是把错题存起来，而是把错题讲明白、练透、清掉。

## 启动

```bash
npm install
npx expo start
```

扫描终端中的二维码（需安装 Expo Go），或按 `w` 在浏览器中打开。

> 不配置任何 key 也能完整运行：智能服务会自动降级为本地模拟。

## 接入真实 AI / OCR（阶段一 · 免费方案）

1. 复制环境变量模板：`cp .env.example .env`
2. 填入 key（两项都可单独配置，缺省项自动用模拟）：
   - **智谱 GLM-4-Flash（免费）** — AI 讲题评分/追问、分层提示、变式题生成
     申请：<https://open.bigmodel.cn/> → 控制台 → API Keys，填入 `EXPO_PUBLIC_ZHIPU_API_KEY`
   - **百度 OCR（免费 1000 次/月）** — 拍照识别题干
     申请：<https://console.bce.baidu.com/> → 文字识别 → 创建应用，填入 `EXPO_PUBLIC_BAIDU_OCR_API_KEY` 和 `EXPO_PUBLIC_BAIDU_OCR_SECRET_KEY`
3. 重启并清缓存：`npx expo start -c`
4. 在「我的」页可查看服务是否「已启用」

说明：
- 真实服务建议在**手机 / Expo Go**（原生环境）测试；Web 端因浏览器 CORS 限制可能失败并自动降级。
- 任一接口网络/解析失败都会**自动回退到本地模拟**，不会让 App 卡住或报错。
- MVP 阶段 key 打包进客户端，仅适合个人 / 小范围使用；正式上线请改为后端代理（见下文）。

## 技术栈

- Expo React Native + TypeScript
- Zustand 状态管理
- React Navigation 页面导航
- AsyncStorage 本地持久化
- Adapter 模式服务层：真实实现（智谱 / 百度）+ Mock，按 key 自动切换

## 功能清单

| 功能 | 状态 |
|------|------|
| 首页（今日任务、薄弱点、快捷入口） | ✅ |
| 拍错题（相机/相册/手动录入） | ✅ |
| 创建错题卡（年级、知识点、错因选择） | ✅ |
| 错题本（筛选、搜索、状态标签） | ✅ |
| 错题详情（分层提示、操作入口） | ✅ |
| 费曼讲题（聊天式 UI、4 问追问、评分） | ✅ |
| 变式题练习（3 道题、评判、状态流转） | ✅ |
| 间隔复习（D0→D1→D3→D7 调度） | ✅ |
| 薄弱知识点统计（掌握度、错因分析） | ✅ |
| 家长周报（错因分布、陪练建议） | ✅ |
| 知识点库（1-6 年级，42 个知识点） | ✅ |
| 种子数据（12 道错题样例） | ✅ |
| 出库条件判断 | ✅ |
| 隐私保护（纯本地、无社交） | ✅ |
| 真实 AI 接入（智谱 GLM-4-Flash） | ✅ 可选 |
| 真实 OCR 接入（百度文字识别） | ✅ 可选 |

## 项目结构

```
src/
  models/          TypeScript 类型定义
  constants/       颜色、错因枚举、状态标签
  data/            知识点库、种子数据
  store/           Zustand 状态管理
  services/
    index.ts       服务工厂（按 key 自动返回真实/Mock 实现）
    ai/            AiTutorService 接口 + Mock + 智谱实现 + zhipuClient
    ocr/           OcrService 接口 + Mock + 百度实现
    variants/      VariantGenerator 接口 + 规则引擎 + AI 生成
    review/        间隔复习调度
    analytics/     薄弱点统计、家长周报
  screens/         11 个页面
  components/      共享组件
  navigation/      底部 Tab + Stack 导航
  utils/           工具函数
```

## 服务切换原理

`src/constants/config.ts` 读取 `.env` 中的 key 并暴露 `Features.aiEnabled` /
`Features.ocrEnabled`。`src/services/index.ts` 工厂据此返回真实实现或 Mock，
界面只调用 `getAiTutorService()` / `getOcrService()` / `getVariantGenerator()`，
不关心底层是真是假。替换/升级模型时只需改工厂，无需动界面。

## 核心闭环

拍照/上传 → 创建错题卡 → 选知识点/错因 → 分层提示 → 费曼讲题 → AI 评分 → 变式题练习 → 间隔复习 → 出库

## 后续接入建议

### 升级模型（阶段二/三）
工厂模式下升级很简单：新增一个实现 `AiTutorService` 的类（如 `DeepSeekAiTutorService`、
`ClaudeAiTutorService`），在 `services/index.ts` 工厂里切换即可，界面零改动。

### 接入后端代理（正式上线必做）
当前 key 打包进客户端存在泄露风险。上线前应：
- 搭建后端，把智谱/百度调用放到服务端，客户端只调用自己的后端
- 将 AsyncStorage 替换为后端 API，做数据同步与备份
- 添加用户认证（家长手机号登录）

## 当前限制

- key 内置于客户端，仅适合个人/小范围；正式上线需后端代理
- AI 变式题由模型生成，极少数情况下答案可能需人工复核（已要求模型自检 + 规则题库兜底）
- Web 端因 CORS 可能无法直连真实服务（手机端正常）
- 无用户认证，数据仅保存本地
- 无推送通知提醒复习
