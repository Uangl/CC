export interface OcrResult {
  questionText: string;
  confidence: number;
}

export interface OcrService {
  recognizeImage(imageUri: string): Promise<OcrResult>;
}
