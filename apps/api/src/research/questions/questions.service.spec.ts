import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { QuestionStatus, SessionStatus } from '@prisma/client';
import { QuestionsService } from './questions.service';
import { QuestionsRepository } from './questions.repository';
import { SessionsService } from '../../sessions/sessions.service';
import { ForbiddenException, NotFoundException } from '@nestjs/common';

describe('QuestionsService', () => {
  let questionsService: QuestionsService;
  let mockQuestionsRepository: Partial<QuestionsRepository>;
  let mockSessionsService: Partial<SessionsService>;

  const mockRecord = {
    id: 'question-1',
    researchGuideId: 'guide-1',
    question: 'How do quantum gates work?',
    orderIndex: 0,
    required: true,
    status: QuestionStatus.PENDING,
    completedAt: null,
    researchGuide: {
      id: 'guide-1',
      learningSessionId: 'session-1',
      objective: 'Objective',
      presentationRequirements: null,
      version: 1,
      generatedBy: null,
      modelVersion: null,
      promptVersion: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      learningSession: {
        id: 'session-1',
        userId: 'user-1',
        topicId: 'topic-1',
        status: SessionStatus.RESEARCHING,
        startedAt: new Date(),
        completedAt: null,
        expiresAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    },
  };

  beforeEach(() => {
    mockQuestionsRepository = {
      findByIdWithSession: async (id: string) => {
        if (id === 'question-1') return mockRecord as any;
        return null;
      },
      updateStatus: async (id: string, status: QuestionStatus, completedAt: Date | null) => ({
        ...mockRecord,
        id,
        status,
        completedAt,
      }),
    };

    mockSessionsService = {
      verifySessionOwnership: async (session: any, requester: any) => {
        if (requester.userId !== session.userId) {
          throw new ForbiddenException('Access denied');
        }
      },
    };

    questionsService = new QuestionsService(
      mockQuestionsRepository as QuestionsRepository,
      mockSessionsService as SessionsService,
    );
  });

  it('marks a question COMPLETED when owned by requester', async () => {
    const updated = await questionsService.markComplete('question-1', { userId: 'user-1' });
    assert.equal(updated.status, QuestionStatus.COMPLETED);
    assert.ok(updated.completedAt instanceof Date);
  });

  it('marks a question PENDING when incomplete requested', async () => {
    const updated = await questionsService.markIncomplete('question-1', { userId: 'user-1' });
    assert.equal(updated.status, QuestionStatus.PENDING);
    assert.equal(updated.completedAt, null);
  });

  it('rejects update when requester is not the session owner', async () => {
    await assert.rejects(
      () => questionsService.markComplete('question-1', { userId: 'different-user' }),
      ForbiddenException,
    );
  });

  it('throws NotFoundException when question does not exist', async () => {
    await assert.rejects(
      () => questionsService.markComplete('non-existent', { userId: 'user-1' }),
      NotFoundException,
    );
  });
});
