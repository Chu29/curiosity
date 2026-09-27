import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { SessionStatus, TopicCategory, Difficulty, TopicStatus, QuestionStatus } from '@prisma/client';
import { GuidesService } from './guides.service';
import { GuidesRepository } from './guides.repository';
import { SessionsService } from '../../sessions/sessions.service';
import { LLMProvider } from '../../ai/llm-provider.interface';
import { BadGatewayException, BadRequestException, NotFoundException } from '@nestjs/common';

describe('GuidesService', () => {
  let guidesService: GuidesService;
  let mockGuidesRepository: Partial<GuidesRepository>;
  let mockSessionsService: Partial<SessionsService>;
  let mockLlmProvider: Partial<LLMProvider>;

  const mockTopic = {
    id: 'topic-1',
    title: 'CRISPR Gene Editing',
    slug: 'crispr-gene-editing',
    description: 'Precision genomics',
    category: TopicCategory.SCIENCE_AND_TECHNOLOGY,
    subcategory: 'Biotechnology',
    difficulty: Difficulty.INTERMEDIATE,
    estimatedResearchMinutes: 30,
    status: TopicStatus.ACTIVE,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockSession = {
    id: 'session-1',
    userId: 'user-1',
    topicId: 'topic-1',
    status: SessionStatus.CREATED,
    startedAt: new Date(),
    completedAt: null,
    expiresAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    topic: mockTopic,
  };

  const mockDraft = {
    objective: 'Investigate the molecular mechanisms of CRISPR-Cas9 endonuclease systems.',
    questions: [
      { question: 'How does gRNA guide Cas9 to target DNA sequences?', required: true },
      { question: 'What is the difference between NHEJ and HDR repair pathways?', required: true },
      { question: 'What are the main strategies for minimizing off-target mutations?', required: true },
    ],
    presentationRequirements: JSON.stringify({
      timeLimitMinutes: 5,
      requiredCoverage: ['Mechanism', 'Repair pathways', 'Off-target challenges'],
      concepts: ['Cas9', 'gRNA', 'PAM sequence'],
      suggestedSourceTypes: ['Journals'],
      suggestedPlatforms: [{ name: 'PubMed', url: 'https://pubmed.ncbi.nlm.nih.gov' }],
      checklist: ['Define CRISPR', 'Review repair mechanisms'],
    }),
  };

  beforeEach(() => {
    mockGuidesRepository = {
      findBySessionId: async () => null,
      createGuide: async (data: any) => ({
        id: 'guide-1',
        learningSessionId: data.learningSessionId,
        objective: data.objective,
        presentationRequirements: data.presentationRequirements,
        version: 1,
        generatedBy: 'mock-llm',
        modelVersion: 'v1',
        promptVersion: 'v1',
        createdAt: new Date(),
        updatedAt: new Date(),
        questions: data.questions.map((q: any, i: number) => ({
          id: `q-${i}`,
          researchGuideId: 'guide-1',
          question: q.question,
          orderIndex: q.orderIndex,
          required: q.required,
          status: QuestionStatus.PENDING,
          completedAt: null,
        })),
      }),
    };

    mockSessionsService = {
      getSession: async () => mockSession as any,
      transitionStatus: async () => mockSession as any,
    };

    mockLlmProvider = {
      providerName: 'mock-llm',
      modelVersion: 'v1',
      promptVersion: 'v1',
      generateResearchGuide: async () => mockDraft as any,
    };

    guidesService = new GuidesService(
      mockGuidesRepository as GuidesRepository,
      mockSessionsService as SessionsService,
      mockLlmProvider as LLMProvider,
    );
  });

  it('generates, validates, and persists a research guide', async () => {
    let transitionCalledWith: any = null;
    mockSessionsService.transitionStatus = async (_sId, status) => {
      transitionCalledWith = status;
      return mockSession as any;
    };

    const guide = await guidesService.generateGuideForSession('session-1', { userId: 'user-1' });

    assert.equal(guide.id, 'guide-1');
    assert.equal(guide.objective, mockDraft.objective);
    assert.equal(guide.questions.length, 3);
    assert.equal(guide.parsedRequirements?.timeLimitMinutes, 5);
    assert.equal(transitionCalledWith, SessionStatus.GUIDE_READY);
  });

  it('idempotently returns existing guide if already generated', async () => {
    const existingGuide = {
      id: 'existing-guide-id',
      learningSessionId: 'session-1',
      objective: 'Existing objective',
      presentationRequirements: mockDraft.presentationRequirements,
      version: 1,
      generatedBy: 'mock-llm',
      modelVersion: 'v1',
      promptVersion: 'v1',
      createdAt: new Date(),
      updatedAt: new Date(),
      questions: [],
    };
    mockGuidesRepository.findBySessionId = async () => existingGuide;

    const result = await guidesService.generateGuideForSession('session-1', { userId: 'user-1' });
    assert.equal(result.id, 'existing-guide-id');
    assert.equal(result.objective, 'Existing objective');
  });

  it('rejects guide generation when LLM output violates schema', async () => {
    mockLlmProvider.generateResearchGuide = async () => ({
      objective: 'Too short', // fails schema min(10)
      questions: [],
      presentationRequirements: '',
    });

    await assert.rejects(
      () => guidesService.generateGuideForSession('session-1', { userId: 'user-1' }),
      BadGatewayException,
    );
  });

  it('rejects guide generation for abandoned or completed sessions', async () => {
    mockSessionsService.getSession = async () => ({
      ...mockSession,
      status: SessionStatus.ABANDONED,
    }) as any;

    await assert.rejects(
      () => guidesService.generateGuideForSession('session-1', { userId: 'user-1' }),
      BadRequestException,
    );
  });
});
