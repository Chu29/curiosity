import { Module } from '@nestjs/common';
import { LLM_PROVIDER } from './llm-provider.interface';
import { MockLlmProvider } from './mock-llm.provider';
import { OpenAiLlmProvider } from './openai-llm.provider';

@Module({
  providers: [
    MockLlmProvider,
    OpenAiLlmProvider,
    {
      provide: LLM_PROVIDER,
      useFactory: (mock: MockLlmProvider, openai: OpenAiLlmProvider) => {
        const apiKey = process.env.LLM_API_KEY;
        if (!apiKey || apiKey.startsWith('mock-')) {
          return mock;
        }
        return openai;
      },
      inject: [MockLlmProvider, OpenAiLlmProvider],
    },
  ],
  exports: [LLM_PROVIDER],
})
export class AiModule {}
