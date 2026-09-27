import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { NotesService } from './notes.service';
import { NotesRepository } from './notes.repository';
import { SessionsService } from '../../sessions/sessions.service';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { SessionStatus } from '@prisma/client';

describe('NotesService', () => {
  let notesService: NotesService;
  let mockNotesRepository: Partial<NotesRepository>;
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

  const mockNote = {
    id: 'note-1',
    learningSessionId: 'session-1',
    researchQuestionId: 'q-1',
    content: 'CRISPR Cas9 operates as RNA-guided molecular shears.',
    createdAt: new Date(),
    updatedAt: new Date(),
    learningSession: mockSession,
    researchQuestion: null,
    noteSources: [],
  };

  beforeEach(() => {
    mockNotesRepository = {
      create: async (data: any) => ({
        ...mockNote,
        id: 'new-note-id',
        content: data.content,
        researchQuestionId: data.researchQuestionId ?? null,
      }),
      findBySessionId: async () => [mockNote as any],
      findById: async (id: string) => {
        if (id === 'note-1') return mockNote as any;
        return null;
      },
      update: async (id: string, data: any) => ({
        ...mockNote,
        id,
        content: data.content ?? mockNote.content,
      }),
      delete: async (id: string) => ({
        ...mockNote,
        id,
      }),
      linkSource: async () => ({ noteId: 'note-1', sourceId: 'source-1' } as any),
      unlinkSource: async () => {},
    };

    mockSessionsService = {
      getSession: async () => mockSession as any,
      verifySessionOwnership: async (session: any, requester: any) => {
        if (requester.userId !== session.userId) {
          throw new ForbiddenException('Access denied');
        }
      },
    };

    notesService = new NotesService(
      mockNotesRepository as NotesRepository,
      mockSessionsService as SessionsService,
    );
  });

  it('creates a note when requester owns the session', async () => {
    const created = await notesService.createNote(
      'session-1',
      { content: 'New note content' },
      { userId: 'user-1' },
    );
    assert.equal(created.content, 'New note content');
  });

  it('rejects note creation when requester does not own session', async () => {
    mockSessionsService.getSession = async () => {
      throw new ForbiddenException('Access denied');
    };

    await assert.rejects(
      () => notesService.createNote('session-1', { content: 'test' }, { userId: 'intruder' }),
      ForbiddenException,
    );
  });

  it('fetches notes for owned session', async () => {
    const notes = await notesService.getNotesBySession('session-1', { userId: 'user-1' });
    assert.equal(notes.length, 1);
    assert.equal(notes[0].id, 'note-1');
  });

  it('updates an existing note for owner', async () => {
    const updated = await notesService.updateNote(
      'note-1',
      { content: 'Updated content' },
      { userId: 'user-1' },
    );
    assert.equal(updated.content, 'Updated content');
  });

  it('deletes an existing note for owner', async () => {
    const deleted = await notesService.deleteNote('note-1', { userId: 'user-1' });
    assert.equal(deleted.id, 'note-1');
  });

  it('throws NotFoundException when note does not exist', async () => {
    await assert.rejects(
      () => notesService.getNoteById('unknown-id', { userId: 'user-1' }),
      NotFoundException,
    );
  });
});
