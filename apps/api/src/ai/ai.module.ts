import { Module } from '@nestjs/common';
import { LLM_PROVIDER } from './llm-provider.interface';
import { MockLlmProvider } from './mock-llm.provider';
import { GroqLlmProvider } from './groq-llm.provider';

@Module({
  providers: [
    MockLlmProvider,
    GroqLlmProvider,
    {
      provide: LLM_PROVIDER,
      useFactory: (
        mock: MockLlmProvider,
        groq: GroqLlmProvider,
      ) => {
        const providerName = (process.env.LLM_PROVIDER || 'groq').toLowerCase();
        const llmKey = process.env.LLM_API_KEY;

        if (providerName === 'mock' || !llmKey || llmKey.startsWith('mock-')) {
          return mock;
        }

        return providerName === 'groq' ? groq : mock;
      },
      inject: [MockLlmProvider, GroqLlmProvider],
    },
  ],
  exports: [LLM_PROVIDER],
})
export class AiModule {}
