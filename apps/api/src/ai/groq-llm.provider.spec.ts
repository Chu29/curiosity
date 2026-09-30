import { describe, it, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { Topic, TopicCategory, Difficulty, TopicStatus } from '@prisma/client';
import { ResearchGuideDraftSchema } from '@curiosity/validation';
import { GroqLlmProvider } from './groq-llm.provider';

describe('GroqLlmProvider', () => {
  let provider: GroqLlmProvider;
  let originalFetch: typeof global.fetch;

  const sampleTopic: Topic = {
    id: 'topic-groq-1',
    title: 'James Webb Space Telescope Spectroscopy',
    slug: 'jwst-spectroscopy',
    description: 'Infrared spectroscopy of early galaxies and exoplanet atmospheres.',
    category: TopicCategory.SCIENCE_AND_TECHNOLOGY,
    subcategory: 'Astrophysics',
    difficulty: Difficulty.ADVANCED,
    estimatedResearchMinutes: 45,
    status: TopicStatus.ACTIVE,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(() => {
    originalFetch = global.fetch;
    process.env.LLM_API_KEY = 'test-groq-key';
    process.env.LLM_MODEL = 'openai/gpt-oss-20b';
    provider = new GroqLlmProvider();
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it('generates a schema-valid research guide draft', async () => {
    const mockOutput = {
      objective: 'Analyze the instruments used by JWST to study early galaxies and exoplanet atmospheres.',
      questions: [
        { question: 'How do infrared instruments separate faint starlight?', required: true },
        { question: 'Which chemical signatures can spectroscopy identify?', required: true },
        { question: 'How does JWST suppress thermal noise?', required: true },
      ],
      timeLimitMinutes: 5,
      requiredCoverage: ['Optical design', 'Data reduction', 'Exoplanet spectroscopy'],
      concepts: ['NIRSpec', 'Transmission spectroscopy', 'Rayleigh scattering'],
      suggestedSourceTypes: ['Astrophysical journal papers'],
      suggestedPlatforms: [{ name: 'NASA ADS', url: 'https://ui.adsabs.harvard.edu' }],
      checklist: ['Define spectroscopy', 'Review instrument throughput'],
    };

    global.fetch = async (url: any, init: any) => {
      assert.equal(String(url), 'https://api.groq.com/openai/v1/chat/completions');
      assert.equal(init?.method, 'POST');
      assert.equal(init?.headers?.Authorization, 'Bearer test-groq-key');
      return {
        ok: true,
        status: 200,
        json: async () => ({ choices: [{ message: { content: JSON.stringify(mockOutput) } }] }),
      } as any;
    };

    const draft = await provider.generateResearchGuide(sampleTopic);
    assert.equal(draft.objective, mockOutput.objective);
    assert.equal(draft.questions.length, 3);
    assert.equal(ResearchGuideDraftSchema.safeParse(draft).success, true);
  });

  it('surfaces upstream provider failures', async () => {
    global.fetch = async () => ({
      ok: false,
      status: 429,
      text: async () => 'rate limited',
    } as any);

    await assert.rejects(
      () => provider.generateResearchGuide(sampleTopic),
      (err: Error) => {
        assert.match(err.message, /Groq API returned status 429/);
        return true;
      },
    );
  });
});
