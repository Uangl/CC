import { OcrService, OcrResult } from './OcrService';

export class MockOcrService implements OcrService {
  async recognizeImage(_imageUri: string): Promise<OcrResult> {
    return {
      questionText: '',
      confidence: 0,
    };
  }
}
