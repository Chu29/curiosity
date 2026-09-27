import { Topic } from '@prisma/client';
import { ResearchGuideDraft } from '@curiosity/types';

export const LLM_PROVIDER = Symbol('LLM_PROVIDER');

export interface LLMProvider {
  readonly providerName: string;
  readonly modelVersion: string;
  readonly promptVersion: string;

  generateResearchGuide(topic: Topic): Promise<ResearchGuideDraft>;
}
