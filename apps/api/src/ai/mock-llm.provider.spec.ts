import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { Topic, TopicCategory, Difficulty, TopicStatus } from '@prisma/client';
import { ResearchGuideDraftSchema } from '@curiosity/validation';
import { MockLlmProvider } from './mock-llm.provider';

describe('MockLlmProvider', () => {
  const provider = new MockLlmProvider();

  const sampleTopic: Topic = {
    id: '123e4567-e89b-12d3-a456-426614174000',
    title: 'Quantum Computing and Superposition',
    slug: 'quantum-computing-and-superposition',
    description: 'Investigating qubits and coherence.',
    category: TopicCategory.SCIENCE_AND_TECHNOLOGY,
    subcategory: 'Quantum Physics',
    difficulty: Difficulty.ADVANCED,
    estimatedResearchMinutes: 45,
    status: TopicStatus.ACTIVE,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  it('generates a draft that satisfies ResearchGuideDraftSchema', async () => {
    const draft = await provider.generateResearchGuide(sampleTopic);

    assert.ok(draft.objective.length >= 10);
    assert.ok(draft.questions.length >= 3);
    assert.ok(draft.presentationRequirements.length >= 10);

    const parseResult = ResearchGuideDraftSchema.safeParse(draft);
    assert.equal(parseResult.success, true);
  });

  it('includes key domain concepts and questions tailored to the topic', async () => {
    const draft = await provider.generateResearchGuide(sampleTopic);

    assert.ok(draft.parsedRequirements);
    assert.ok(draft.parsedRequirements.concepts.includes('Superposition'));
    assert.ok(draft.questions.some((q) => q.question.includes('Quantum Computing')));
    assert.equal(draft.parsedRequirements.timeLimitMinutes, 7);
  });
});
