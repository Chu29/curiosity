import { describe, it, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { Topic, TopicCategory, Difficulty, TopicStatus } from '@prisma/client';
import { ResearchGuideDraftSchema } from '@curiosity/validation';
import { GeminiLlmProvider } from './gemini-llm.provider';

describe('GeminiLlmProvider', () => {
  let provider: GeminiLlmProvider;
  let originalFetch: typeof global.fetch;

  const sampleTopic: Topic = {
    id: 'topic-gemini-1',
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
    process.env.GEMINI_API_KEY = 'test-gemini-key';
    provider = new GeminiLlmProvider();
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it('generates a valid research guide draft from Gemini response', async () => {
    const mockGeminiOutput = {
      objective: 'Analyze the NIRSpec and MIRI instruments on JWST to understand transmission spectroscopy.',
      questions: [
        { question: 'How do infrared diffraction gratings separate faint starlight?', required: true },
        { question: 'What chemical signatures indicate water vapor or methane in exoplanet spectra?', required: true },
        { question: 'How does JWST suppress thermal noise from the observatory itself?', required: true },
      ],
      timeLimitMinutes: 5,
      requiredCoverage: ['Optical design', 'Data reduction', 'Exoplanet spectroscopy'],
      concepts: ['NIRSpec', 'Transmission Spectroscopy', 'Rayleigh Scattering', 'Cryocooler'],
      suggestedSourceTypes: ['Astrophysical Journal Papers', 'NASA Technical Reports'],
      suggestedPlatforms: [{ name: 'NASA ADS', url: 'https://ui.adsabs.harvard.edu' }],
      checklist: ['Define transmission spectroscopy', 'Review NIRSpec throughput'],
    };

    global.fetch = async (url: any, init: any) => {
      assert.ok(String(url).includes('generativelanguage.googleapis.com'));
      assert.ok(String(url).includes('gemini-2.0-flash'));
      assert.equal(init?.method, 'POST');

      return {
        ok: true,
        status: 200,
        json: async () => ({
          candidates: [
            {
              content: {
                parts: [
                  {
                    text: JSON.stringify(mockGeminiOutput),
                  },
                ],
              },
            },
          ],
        }),
      } as any;
    };

    const draft = await provider.generateResearchGuide(sampleTopic);

    assert.equal(draft.objective, mockGeminiOutput.objective);
    assert.equal(draft.questions.length, 3);
    assert.equal(draft.parsedRequirements?.timeLimitMinutes, 5);

    const validation = ResearchGuideDraftSchema.safeParse(draft);
    assert.equal(validation.success, true);
  });

  it('throws an error when Gemini API returns non-200', async () => {
    global.fetch = async () => ({
      ok: false,
      status: 403,
      text: async () => 'API key invalid',
    } as any);

    await assert.rejects(
      () => provider.generateResearchGuide(sampleTopic),
      (err: Error) => {
        assert.match(err.message, /Gemini API returned status 403/);
        return true;
      },
    );
  });
});
