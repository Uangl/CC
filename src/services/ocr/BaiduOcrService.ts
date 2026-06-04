import * as FileSystem from 'expo-file-system';
import { OcrService, OcrResult } from './OcrService';
import { Config } from '../../constants/config';

interface CachedToken {
  token: string;
  expiresAt: number;
}

/**
 * 百度通用文字识别（general_basic）实现。
 * 免费额度每月 1000 次。token 缓存复用，过期自动刷新。
 *
 * 注意：在 Web 端因 CORS 限制可能失败；移动端（Expo Go / 原生）正常。
 * 失败时返回空文本，由界面降级为手动输入。
 */
export class BaiduOcrService implements OcrService {
  private cachedToken: CachedToken | null = null;

  private async getAccessToken(): Promise<string> {
    if (this.cachedToken && this.cachedToken.expiresAt > Date.now()) {
      return this.cachedToken.token;
    }

    const url =
      `${Config.baiduOcr.tokenUrl}?grant_type=client_credentials` +
      `&client_id=${encodeURIComponent(Config.baiduOcr.apiKey)}` +
      `&client_secret=${encodeURIComponent(Config.baiduOcr.secretKey)}`;

    const res = await fetch(url, { method: 'POST' });
    if (!res.ok) throw new Error(`Baidu token error: ${res.status}`);

    const data = (await res.json()) as {
      access_token?: string;
      expires_in?: number;
    };
    if (!data.access_token) throw new Error('Baidu token missing');

    this.cachedToken = {
      token: data.access_token,
      // 提前 1 小时过期，留出余量
      expiresAt: Date.now() + ((data.expires_in ?? 2592000) - 3600) * 1000,
    };
    return this.cachedToken.token;
  }

  async recognizeImage(imageUri: string): Promise<OcrResult> {
    try {
      const base64 = await FileSystem.readAsStringAsync(imageUri, {
        encoding: FileSystem.EncodingType.Base64,
      });

      const token = await this.getAccessToken();
      const res = await fetch(`${Config.baiduOcr.ocrUrl}?access_token=${token}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: `image=${encodeURIComponent(base64)}`,
      });
      if (!res.ok) throw new Error(`Baidu OCR error: ${res.status}`);

      const data = (await res.json()) as {
        words_result?: { words: string }[];
        error_msg?: string;
      };

      if (data.error_msg) throw new Error(`Baidu OCR: ${data.error_msg}`);

      const lines = (data.words_result ?? []).map((w) => w.words);
      return {
        questionText: lines.join('\n'),
        confidence: lines.length > 0 ? 0.9 : 0,
      };
    } catch {
      return { questionText: '', confidence: 0 };
    }
  }
}
