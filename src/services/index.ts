import { Features } from '../constants/config';
import { AiTutorService } from './ai/AiTutorService';
import { MockAiTutorService } from './ai/MockAiTutorService';
import { ZhipuAiTutorService } from './ai/ZhipuAiTutorService';
import { OcrService } from './ocr/OcrService';
import { MockOcrService } from './ocr/MockOcrService';
import { BaiduOcrService } from './ocr/BaiduOcrService';
import { VariantGenerator } from './variants/VariantGenerator';
import { RuleBasedVariantGenerator } from './variants/RuleBasedVariantGenerator';
import { AiVariantGenerator } from './variants/AiVariantGenerator';

/**
 * 服务工厂：根据 .env 是否配置了 key，自动返回真实实现或 Mock。
 * 单例缓存，避免重复创建。
 */

let aiTutorService: AiTutorService | null = null;
export function getAiTutorService(): AiTutorService {
  if (!aiTutorService) {
    aiTutorService = Features.aiEnabled
      ? new ZhipuAiTutorService()
      : new MockAiTutorService();
  }
  return aiTutorService;
}

let ocrService: OcrService | null = null;
export function getOcrService(): OcrService {
  if (!ocrService) {
    ocrService = Features.ocrEnabled ? new BaiduOcrService() : new MockOcrService();
  }
  return ocrService;
}

let variantGenerator: VariantGenerator | null = null;
export function getVariantGenerator(): VariantGenerator {
  if (!variantGenerator) {
    variantGenerator = Features.aiEnabled
      ? new AiVariantGenerator()
      : new RuleBasedVariantGenerator();
  }
  return variantGenerator;
}

export { Features };
