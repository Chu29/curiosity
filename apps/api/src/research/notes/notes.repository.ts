import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Note, LearningSession, Source, NoteSource, ResearchQuestion } from '@prisma/client';

export type NoteWithRelations = Note & {
  learningSession?: LearningSession;
  researchQuestion?: ResearchQuestion | null;
  noteSources?: Array<NoteSource & { source: Source }>;
};

export interface CreateNoteData {
  learningSessionId: string;
  content: string;
  researchQuestionId?: string | null;
  sourceIds?: string[];
}

export interface UpdateNoteData {
  content?: string;
  researchQuestionId?: string | null;
  sourceIds?: string[];
}

@Injectable()
export class NotesRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findBySessionId(learningSessionId: string): Promise<NoteWithRelations[]> {
    return this.prisma.note.findMany({
      where: { learningSessionId },
      include: {
        researchQuestion: true,
        noteSources: {
          include: {
            source: true,
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    });
  }

  async findById(id: string): Promise<NoteWithRelations | null> {
    return this.prisma.note.findUnique({
      where: { id },
      include: {
        learningSession: true,
        researchQuestion: true,
        noteSources: {
          include: {
            source: true,
          },
        },
      },
    });
  }

  async create(data: CreateNoteData): Promise<NoteWithRelations> {
    const { learningSessionId, content, researchQuestionId, sourceIds } = data;

    return this.prisma.note.create({
      data: {
        learningSessionId,
        content,
        researchQuestionId: researchQuestionId ?? null,
        noteSources: sourceIds && sourceIds.length > 0 ? {
          create: sourceIds.map((sourceId) => ({
            sourceId,
          })),
        } : undefined,
      },
      include: {
        researchQuestion: true,
        noteSources: {
          include: {
            source: true,
          },
        },
      },
    });
  }

  async update(id: string, data: UpdateNoteData): Promise<NoteWithRelations> {
    const { content, researchQuestionId, sourceIds } = data;

    return this.prisma.$transaction(async (tx) => {
      if (sourceIds !== undefined) {
        await tx.noteSource.deleteMany({
          where: { noteId: id },
        });

        if (sourceIds.length > 0) {
          await tx.noteSource.createMany({
            data: sourceIds.map((sourceId) => ({
              noteId: id,
              sourceId,
            })),
          });
        }
      }

      return tx.note.update({
        where: { id },
        data: {
          ...(content !== undefined ? { content } : {}),
          ...(researchQuestionId !== undefined ? { researchQuestionId } : {}),
        },
        include: {
          researchQuestion: true,
          noteSources: {
            include: {
              source: true,
            },
          },
        },
      });
    });
  }

  async delete(id: string): Promise<Note> {
    return this.prisma.note.delete({
      where: { id },
    });
  }

  async linkSource(noteId: string, sourceId: string): Promise<NoteSource> {
    return this.prisma.noteSource.upsert({
      where: {
        noteId_sourceId: {
          noteId,
          sourceId,
        },
      },
      create: {
        noteId,
        sourceId,
      },
      update: {},
    });
  }

  async unlinkSource(noteId: string, sourceId: string): Promise<void> {
    await this.prisma.noteSource.deleteMany({
      where: {
        noteId,
        sourceId,
      },
    });
  }
}
