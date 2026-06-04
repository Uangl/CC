/**
 * 第三方服务配置。
 *
 * 通过 Expo 的 EXPO_PUBLIC_* 环境变量读取（在 .env 文件中配置）。
 * 修改 .env 后需要重启：npx expo start -c
 *
 * 安全说明：MVP 阶段 key 直接打包进客户端，仅适合个人/小范围使用。
 * 正式上线请改为后端代理转发，避免 key 泄露。
 */

export const Config = {
  zhipu: {
    apiKey: process.env.EXPO_PUBLIC_ZHIPU_API_KEY ?? '',
    model: 'glm-4-flash',
    baseUrl: 'https://open.bigmodel.cn/api/paas/v4/chat/completions',
  },
  baiduOcr: {
    apiKey: process.env.EXPO_PUBLIC_BAIDU_OCR_API_KEY ?? '',
    secretKey: process.env.EXPO_PUBLIC_BAIDU_OCR_SECRET_KEY ?? '',
    tokenUrl: 'https://aip.baidubce.com/oauth/2.0/token',
    ocrUrl: 'https://aip.baidubce.com/rest/2.0/ocr/v1/general_basic',
  },
};

export const Features = {
  /** 是否启用真实 AI（智谱）。未配置 key 时自动降级为 Mock。 */
  aiEnabled: Config.zhipu.apiKey.length > 0,
  /** 是否启用真实 OCR（百度）。未配置 key 时自动降级为手动输入。 */
  ocrEnabled:
    Config.baiduOcr.apiKey.length > 0 && Config.baiduOcr.secretKey.length > 0,
};
