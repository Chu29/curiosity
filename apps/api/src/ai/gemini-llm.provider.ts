import { Injectable, Logger } from '@nestjs/common';
import { Topic } from '@prisma/client';
import { ResearchGuideDraft, ParsedRequirements } from '@curiosity/types';
import { LLMProvider } from './llm-provider.interface';

@Injectable()
export class GeminiLlmProvider implements LLMProvider {
  private readonly logger = new Logger(GeminiLlmProvider.name);

  readonly providerName = 'google-gemini';
  readonly modelVersion: string;
  readonly promptVersion = 'research-guide-prompt-v1.0';

  private readonly apiKey: string;

  constructor() {
    this.apiKey = process.env.GEMINI_API_KEY || process.env.LLM_API_KEY || '';
    this.modelVersion = process.env.GEMINI_MODEL || 'gemini-2.0-flash';
  }

  async generateResearchGuide(topic: Topic): Promise<ResearchGuideDraft> {
    this.logger.log(`Requesting Google Gemini research guide for topic: ${topic.title} (${this.modelVersion})`);

    const systemPrompt = `You are an expert scientific curriculum and research advisor on a Science & Technology Learning Platform.
Your mission is to formulate an evidence-grounded research guide for an independent learner.
Rules:
1. Do NOT provide direct answers to questions. Provide an objective, structured research questions, key concepts, suggested source types, suggested platforms, and presentation requirements.
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

    const userPrompt = `Topic to investigate:
Title: ${topic.title}
Category: ${topic.category}
Subcategory: ${topic.subcategory || 'General'}
Difficulty: ${topic.difficulty}
Description: ${topic.description || 'N/A'}`;

    const url = `https://generativelanguage.googleapis.com/v1beta/models/${this.modelVersion}:generateContent?key=${encodeURIComponent(this.apiKey)}`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        system_instruction: {
          parts: [{ text: systemPrompt }],
        },
        contents: [
          {
            role: 'user',
            parts: [{ text: userPrompt }],
          },
        ],
        generationConfig: {
          responseMimeType: 'application/json',
          temperature: 0.3,
        },
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      this.logger.error(`Gemini API error (${response.status}): ${errText}`);
      throw new Error(`Gemini API returned status ${response.status}`);
    }

    const payload = (await response.json()) as {
      candidates?: Array<{
        content?: {
          parts?: Array<{
            text?: string;
          }>;
        };
      }>;
    };

    const rawContent = payload.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!rawContent) {
      throw new Error('Gemini API returned empty response candidate');
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
