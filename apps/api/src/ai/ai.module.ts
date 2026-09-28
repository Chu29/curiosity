import { Module } from '@nestjs/common';
import { LLM_PROVIDER } from './llm-provider.interface';
import { MockLlmProvider } from './mock-llm.provider';
import { OpenAiLlmProvider } from './openai-llm.provider';
import { GeminiLlmProvider } from './gemini-llm.provider';

@Module({
  providers: [
    MockLlmProvider,
    OpenAiLlmProvider,
    GeminiLlmProvider,
    {
      provide: LLM_PROVIDER,
      useFactory: (
        mock: MockLlmProvider,
        openai: OpenAiLlmProvider,
        gemini: GeminiLlmProvider,
      ) => {
        const providerName = (process.env.LLM_PROVIDER || 'gemini').toLowerCase();
        const geminiKey = process.env.GEMINI_API_KEY || process.env.LLM_API_KEY;
        const openAiKey = process.env.LLM_API_KEY;

        if (providerName === 'mock' || (!geminiKey && !openAiKey)) {
          return mock;
        }

        if (providerName === 'openai') {
          if (!openAiKey || openAiKey.startsWith('mock-')) {
            return mock;
          }
          return openai;
        }

        // Default: Gemini
        if (!geminiKey || geminiKey.startsWith('mock-')) {
          return mock;
        }
        return gemini;
      },
      inject: [MockLlmProvider, OpenAiLlmProvider, GeminiLlmProvider],
    },
  ],
  exports: [LLM_PROVIDER],
})
export class AiModule {}
