import { Mistake, VariantQuestion } from '../../models/types';

export interface VariantGenerator {
  generateVariants(mistake: Mistake, count: number): Promise<VariantQuestion[]>;
}
