import { Injectable, Logger } from '@nestjs/common';
import { Topic } from '@prisma/client';
import { ResearchGuideDraft, ParsedRequirements } from '@curiosity/types';
import { LLMProvider } from './llm-provider.interface';

@Injectable()
export class OpenAiLlmProvider implements LLMProvider {
  private readonly logger = new Logger(OpenAiLlmProvider.name);

  readonly providerName = 'openai';
  readonly modelVersion = 'gpt-4o-mini';
  readonly promptVersion = 'research-guide-prompt-v1.0';

  private readonly apiKey: string;

  constructor() {
    this.apiKey = process.env.LLM_API_KEY || '';
  }

  async generateResearchGuide(topic: Topic): Promise<ResearchGuideDraft> {
    this.logger.log(`Requesting OpenAI research guide for topic: ${topic.title}`);

    const prompt = `You are an expert scientific curriculum and research advisor on a Science & Technology Learning Platform.
Your mission is to formulate an evidence-grounded research guide for an independent learner investigating: "${topic.title}".
Category: ${topic.category}
Subcategory: ${topic.subcategory || 'General'}
Difficulty: ${topic.difficulty}
Description: ${topic.description || 'N/A'}

Rules:
1. Do NOT provide answers to questions. Provide an objective, research questions, key concepts, suggested sources, and presentation requirements.
2. Return ONLY a valid JSON object matching this exact schema:
{
  "objective": "A 2-3 sentence statement explaining what the learner will investigate and accomplish.",
  "questions": [
    { "question": "Clear research question 1", "required": true },
    { "question": "Clear research question 2", "required": true },
    { "question": "Clear research question 3", "required": true },
    { "question": "Clear research question 4", "required": true },
    { "question": "Clear research question 5", "required": true }
  ],
  "timeLimitMinutes": 5,
  "requiredCoverage": ["Key area 1", "Key area 2", "Key area 3"],
  "concepts": ["Concept 1", "Concept 2", "Concept 3", "Concept 4"],
  "suggestedSourceTypes": ["Peer-reviewed papers", "Technical specifications", "Academic textbooks"],
  "suggestedPlatforms": [
    { "name": "Google Scholar", "url": "https://scholar.google.com" },
    { "name": "arXiv", "url": "https://arxiv.org" }
  ],
  "checklist": [
    "Identify foundational principles",
    "Gather empirical data and benchmarks",
    "Synthesize conclusions"
  ]
}`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: this.modelVersion,
        messages: [
          { role: 'system', content: 'You are a precise academic research assistant. Return JSON only.' },
          { role: 'user', content: prompt },
        ],
        response_format: { type: 'json_object' },
        temperature: 0.3,
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      this.logger.error(`OpenAI API error (${response.status}): ${errText}`);
      throw new Error(`OpenAI API returned status ${response.status}`);
    }

    const payload = (await response.json()) as {
      choices?: Array<{
        message?: {
          content?: string;
        };
      }>;
    };
    const rawContent = payload.choices?.[0]?.message?.content;
    if (!rawContent) {
      throw new Error('OpenAI returned empty message content');
    }

    const parsed = JSON.parse(rawContent);

    const parsedRequirements: ParsedRequirements = {
      timeLimitMinutes: parsed.timeLimitMinutes || 5,
      requiredCoverage: parsed.requiredCoverage || [],
      concepts: parsed.concepts || [],
      suggestedSourceTypes: parsed.suggestedSourceTypes || [],
      suggestedPlatforms: parsed.suggestedPlatforms || [],
      checklist: parsed.checklist || [],
    };

    return {
      objective: parsed.objective,
      questions: parsed.questions,
      presentationRequirements: JSON.stringify(parsedRequirements),
      parsedRequirements,
    };
  }
}
