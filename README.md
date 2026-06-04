# 错题小老师

小学数学 AI 错题补弱 App MVP

> 不是把错题存起来，而是把错题讲明白、练透、清掉。

## 启动

```bash
npm install
npx expo start
```

扫描终端中的二维码（需安装 Expo Go），或按 `w` 在浏览器中打开。

## 技术栈

- Expo React Native + TypeScript
- Zustand 状态管理
- React Navigation 页面导航
- AsyncStorage 本地持久化
- Mock AI / OCR / 变式题服务（Adapter 模式，可替换真实实现）

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
| 知识点库（3-6 年级，27 个知识点） | ✅ |
| 种子数据（8 道错题样例） | ✅ |
| 出库条件判断 | ✅ |
| 隐私保护（纯本地、无社交） | ✅ |

## 项目结构

```
src/
  models/          TypeScript 类型定义
  constants/       颜色、错因枚举、状态标签
  data/            知识点库、种子数据
  store/           Zustand 状态管理
  services/
    ai/            AI 讲题评分（接口 + Mock）
    ocr/           OCR 识别（接口 + Mock）
    variants/      变式题生成（接口 + 规则引擎）
    review/        间隔复习调度
    analytics/     薄弱点统计、家长周报
  screens/         11 个页面
  components/      共享组件
  navigation/      底部 Tab + Stack 导航
  utils/           工具函数
```

## 核心闭环

拍照/上传 → 创建错题卡 → 选知识点/错因 → 分层提示 → 费曼讲题 → AI 评分 → 变式题练习 → 间隔复习 → 出库

## 后续接入建议

### 接入真实 OCR
实现 `OcrService` 接口，替换 `MockOcrService`。推荐百度 OCR 或腾讯云 OCR。

### 接入真实 AI
实现 `AiTutorService` 接口，替换 `MockAiTutorService`。推荐使用 Claude API 进行讲题评分和追问。

### 接入真实变式题生成
实现 `VariantGenerator` 接口，替换 `RuleBasedVariantGenerator`。可用 AI 根据知识点动态生成。

### 接入后端
- 将 AsyncStorage 替换为 API 调用
- 添加用户认证（家长手机号登录）
- 数据同步与备份

## 当前限制

- OCR 为空实现，需手动输入题目
- AI 评分为 Mock，基于文本长度粗略评分
- 变式题为预置题库，覆盖有限
- 无用户认证，数据仅保存本地
- 无推送通知提醒复习
