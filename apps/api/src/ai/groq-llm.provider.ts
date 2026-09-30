import { Injectable, Logger } from '@nestjs/common';
import { Topic } from '@prisma/client';
import { ResearchGuideDraft, ParsedRequirements } from '@curiosity/types';
import { LLMProvider } from './llm-provider.interface';

@Injectable()
export class GroqLlmProvider implements LLMProvider {
  private readonly logger = new Logger(GroqLlmProvider.name);
  readonly providerName = 'groq';
  readonly modelVersion: string;
  readonly promptVersion = 'research-guide-prompt-v1.0';

  private readonly apiKey: string;
  private readonly baseUrl: string;

  constructor() {
    this.apiKey = process.env.LLM_API_KEY || '';
    this.modelVersion = process.env.LLM_MODEL || 'openai/gpt-oss-20b';
    this.baseUrl = process.env.LLM_BASE_URL || 'https://api.groq.com/openai/v1';
  }

  async generateResearchGuide(topic: Topic): Promise<ResearchGuideDraft> {
    this.logger.log(`Requesting Groq research guide for topic: ${topic.title} (${this.modelVersion})`);

    const prompt = `You are an expert scientific curriculum and research advisor on a Science & Technology Learning Platform.
Create an evidence-grounded research guide for an independent learner.
Topic: ${topic.title}
Category: ${topic.category}
Subcategory: ${topic.subcategory || 'General'}
Difficulty: ${topic.difficulty}
Description: ${topic.description || 'N/A'}

Do not provide direct answers to the research questions. Return only valid JSON with objective, at least five questions, timeLimitMinutes, requiredCoverage, concepts, suggestedSourceTypes, suggestedPlatforms, and checklist. Each question must have question and required fields. Suggested platforms must have name and URL fields.`;

    const response = await fetch(`${this.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: this.modelVersion,
        messages: [
          { role: 'system', content: 'Return JSON only. Do not answer the learner\'s research questions.' },
          { role: 'user', content: prompt },
        ],
        response_format: { type: 'json_object' },
        temperature: 0.3,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      this.logger.error(`Groq API error (${response.status}): ${errorText}`);
      throw new Error(`Groq API returned status ${response.status}`);
    }

    const payload = (await response.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    const rawContent = payload.choices?.[0]?.message?.content;
    if (!rawContent) throw new Error('Groq API returned empty message content');

    const parsed = JSON.parse(rawContent) as {
      objective: string;
      questions: Array<{ question: string; required?: boolean | string }>;
      timeLimitMinutes?: number;
      requiredCoverage?: string[] | string;
      concepts?: string[];
      suggestedSourceTypes?: string[];
      suggestedPlatforms?: ParsedRequirements['suggestedPlatforms'];
      checklist?: string[];
    };

    const parsedRequirements: ParsedRequirements = {
      timeLimitMinutes: parsed.timeLimitMinutes || 5,
      requiredCoverage: this.asStringArray(parsed.requiredCoverage),
      concepts: parsed.concepts || [],
      suggestedSourceTypes: parsed.suggestedSourceTypes || [],
      suggestedPlatforms: parsed.suggestedPlatforms || [],
      checklist: parsed.checklist || [],
    };

    return {
      objective: parsed.objective,
      questions: parsed.questions.map((question) => ({
        question: question.question,
        required: this.asBoolean(question.required),
      })),
      presentationRequirements: JSON.stringify(parsedRequirements),
      parsedRequirements,
    };
  }

  private asStringArray(value: string[] | string | undefined): string[] {
    if (Array.isArray(value)) return value.filter(Boolean);
    return value ? [value] : [];
  }

  private asBoolean(value: boolean | string | undefined): boolean {
    if (typeof value === 'boolean') return value;
    return value?.toLowerCase() !== 'false';
  }
}
