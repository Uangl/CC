import { AiTutorService } from './ai/AiTutorService';
import { MockAiTutorService } from './ai/MockAiTutorService';
import { BackendAiTutorService } from './ai/BackendAiTutorService';
import { OcrService } from './ocr/OcrService';
import { MockOcrService } from './ocr/MockOcrService';
import { VariantGenerator } from './variants/VariantGenerator';
import { RuleBasedVariantGenerator } from './variants/RuleBasedVariantGenerator';
import { BackendVariantGenerator } from './variants/BackendVariantGenerator';

const apiUrl = process.env.EXPO_PUBLIC_API_URL ?? '';
const backendEnabled = apiUrl.length > 0;

let aiTutorService: AiTutorService | null = null;
export function getAiTutorService(): AiTutorService {
  if (!aiTutorService) {
    aiTutorService = backendEnabled
      ? new BackendAiTutorService()
      : new MockAiTutorService();
  }
  return aiTutorService;
}

let ocrService: OcrService | null = null;
export function getOcrService(): OcrService {
  if (!ocrService) {
    ocrService = new MockOcrService();
  }
  return ocrService;
}

let variantGenerator: VariantGenerator | null = null;
export function getVariantGenerator(): VariantGenerator {
  if (!variantGenerator) {
    variantGenerator = backendEnabled
      ? new BackendVariantGenerator()
      : new RuleBasedVariantGenerator();
  }
  return variantGenerator;
}

export { backendEnabled };
