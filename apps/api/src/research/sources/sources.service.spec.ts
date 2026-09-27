import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { SourcesService } from './sources.service';
import { SourcesRepository } from './sources.repository';
import { SessionsService } from '../../sessions/sessions.service';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { SessionStatus, SourceType } from '@prisma/client';

describe('SourcesService', () => {
  let sourcesService: SourcesService;
  let mockSourcesRepository: Partial<SourcesRepository>;
  let mockSessionsService: Partial<SessionsService>;

  const mockSession = {
    id: 'session-1',
    userId: 'user-1',
    topicId: 'topic-1',
    status: SessionStatus.RESEARCHING,
    startedAt: new Date(),
    completedAt: null,
    expiresAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockSource = {
    id: 'source-1',
    learningSessionId: 'session-1',
    title: 'A Programmable Dual-RNA-Guided DNA Endonuclease in Adaptive Bacterial Immunity',
    url: 'https://science.sciencemag.org/content/337/6096/816',
    authorOrganization: 'Doudna et al. / Science',
    sourceType: SourceType.ACADEMIC_PAPER,
    description: 'Foundational paper on Cas9.',
    createdAt: new Date(),
    updatedAt: new Date(),
    learningSession: mockSession,
    _count: { noteSources: 1 },
  };

  beforeEach(() => {
    mockSourcesRepository = {
      create: async (data: any) => ({
        ...mockSource,
        id: 'new-source-id',
        title: data.title,
        url: data.url,
        sourceType: data.sourceType,
      }),
      findBySessionId: async () => [mockSource as any],
      findById: async (id: string) => {
        if (id === 'source-1') return mockSource as any;
        return null;
      },
      update: async (id: string, data: any) => ({
        ...mockSource,
        id,
        title: data.title ?? mockSource.title,
      }),
      delete: async (id: string) => ({
        ...mockSource,
        id,
      }),
    };

    mockSessionsService = {
      getSession: async () => mockSession as any,
      verifySessionOwnership: async (session: any, requester: any) => {
        if (requester.userId !== session.userId) {
          throw new ForbiddenException('Access denied');
        }
      },
    };

    sourcesService = new SourcesService(
      mockSourcesRepository as SourcesRepository,
      mockSessionsService as SessionsService,
    );
  });

  it('creates a source when requester owns the session', async () => {
    const created = await sourcesService.createSource(
      'session-1',
      {
        title: 'New paper',
        url: 'https://arxiv.org/abs/1234.5678',
        sourceType: SourceType.ACADEMIC_PAPER,
      },
      { userId: 'user-1' },
    );
    assert.equal(created.title, 'New paper');
    assert.equal(created.sourceType, SourceType.ACADEMIC_PAPER);
  });

  it('rejects source creation when requester does not own session', async () => {
    mockSessionsService.getSession = async () => {
      throw new ForbiddenException('Access denied');
    };

    await assert.rejects(
      () =>
        sourcesService.createSource(
          'session-1',
          {
            title: 'test',
            url: 'https://example.com',
            sourceType: SourceType.ARTICLE,
          },
          { userId: 'intruder' },
        ),
      ForbiddenException,
    );
  });

  it('fetches sources for owned session', async () => {
    const sources = await sourcesService.getSourcesBySession('session-1', { userId: 'user-1' });
    assert.equal(sources.length, 1);
    assert.equal(sources[0].id, 'source-1');
  });

  it('updates an existing source for owner', async () => {
    const updated = await sourcesService.updateSource(
      'source-1',
      { title: 'Updated title' },
      { userId: 'user-1' },
    );
    assert.equal(updated.title, 'Updated title');
  });

  it('deletes an existing source for owner', async () => {
    const deleted = await sourcesService.deleteSource('source-1', { userId: 'user-1' });
    assert.equal(deleted.id, 'source-1');
  });

  it('throws NotFoundException when source does not exist', async () => {
    await assert.rejects(
      () => sourcesService.getSourceById('unknown-id', { userId: 'user-1' }),
      NotFoundException,
    );
  });
});
