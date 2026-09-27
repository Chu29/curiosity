import { Injectable, NotFoundException } from '@nestjs/common';
import { NotesRepository, NoteWithRelations } from './notes.repository';
import { SessionsService } from '../../sessions/sessions.service';
import { ResourceRequester } from '../../auth/guards/ownership.util';
import { CreateNoteDto, UpdateNoteDto } from './dto';
import { Note } from '@prisma/client';

@Injectable()
export class NotesService {
  constructor(
    private readonly notesRepository: NotesRepository,
    private readonly sessionsService: SessionsService,
  ) {}

  async createNote(
    sessionId: string,
    dto: CreateNoteDto,
    requester: ResourceRequester,
  ): Promise<NoteWithRelations> {
    await this.sessionsService.getSession(sessionId, requester);

    return this.notesRepository.create({
      learningSessionId: sessionId,
      content: dto.content,
      researchQuestionId: dto.researchQuestionId,
      sourceIds: dto.sourceIds,
    });
  }

  async getNotesBySession(
    sessionId: string,
    requester: ResourceRequester,
  ): Promise<NoteWithRelations[]> {
    await this.sessionsService.getSession(sessionId, requester);
    return this.notesRepository.findBySessionId(sessionId);
  }

  async getNoteById(
    noteId: string,
    requester: ResourceRequester,
  ): Promise<NoteWithRelations> {
    const note = await this.notesRepository.findById(noteId);
    if (!note || !note.learningSession) {
      throw new NotFoundException(`Note not found: ${noteId}`);
    }

    await this.sessionsService.verifySessionOwnership(note.learningSession, requester);
    return note;
  }

  async updateNote(
    noteId: string,
    dto: UpdateNoteDto,
    requester: ResourceRequester,
  ): Promise<NoteWithRelations> {
    const note = await this.getNoteById(noteId, requester);
    return this.notesRepository.update(note.id, dto);
  }

  async deleteNote(
    noteId: string,
    requester: ResourceRequester,
  ): Promise<Note> {
    const note = await this.getNoteById(noteId, requester);
    return this.notesRepository.delete(note.id);
  }

  async linkSource(
    noteId: string,
    sourceId: string,
    requester: ResourceRequester,
  ): Promise<void> {
    await this.getNoteById(noteId, requester);
    await this.notesRepository.linkSource(noteId, sourceId);
  }

  async unlinkSource(
    noteId: string,
    sourceId: string,
    requester: ResourceRequester,
  ): Promise<void> {
    await this.getNoteById(noteId, requester);
    await this.notesRepository.unlinkSource(noteId, sourceId);
  }
}
