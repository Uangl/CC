import { Mistake, VariantQuestion } from '../../models/types';
import { VariantGenerator } from './VariantGenerator';
import { RuleBasedVariantGenerator } from './RuleBasedVariantGenerator';
import { apiFetch } from '../api/client';

export class BackendVariantGenerator implements VariantGenerator {
  private fallback = new RuleBasedVariantGenerator();

  async generateVariants(mistake: Mistake, count: number): Promise<VariantQuestion[]> {
    try {
      const data = await apiFetch<{ variants: VariantQuestion[]; fallback?: boolean }>(
        '/api/ai/variants',
        {
          method: 'POST',
          body: JSON.stringify({ mistake, count }),
          timeout: 25000,
        }
      );
      if (data.variants.length >= count) return data.variants.slice(0, count);
    } catch {
      // fall through
    }
    return this.fallback.generateVariants(mistake, count);
  }
}
