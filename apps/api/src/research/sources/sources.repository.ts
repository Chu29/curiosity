import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Source, LearningSession, SourceType } from '@prisma/client';

export type SourceWithSession = Source & {
  learningSession?: LearningSession;
  _count?: {
    noteSources: number;
  };
};

export interface CreateSourceData {
  learningSessionId: string;
  title: string;
  url: string;
  authorOrganization?: string | null;
  sourceType: SourceType;
  description?: string | null;
}

export interface UpdateSourceData {
  title?: string;
  url?: string;
  authorOrganization?: string | null;
  sourceType?: SourceType;
  description?: string | null;
}

@Injectable()
export class SourcesRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findBySessionId(learningSessionId: string): Promise<SourceWithSession[]> {
    return this.prisma.source.findMany({
      where: { learningSessionId },
      include: {
        _count: {
          select: { noteSources: true },
        },
      },
      orderBy: { createdAt: 'asc' },
    });
  }

  async findById(id: string): Promise<SourceWithSession | null> {
    return this.prisma.source.findUnique({
      where: { id },
      include: {
        learningSession: true,
        _count: {
          select: { noteSources: true },
        },
      },
    });
  }

  async create(data: CreateSourceData): Promise<SourceWithSession> {
    return this.prisma.source.create({
      data: {
        learningSessionId: data.learningSessionId,
        title: data.title,
        url: data.url,
        authorOrganization: data.authorOrganization ?? null,
        sourceType: data.sourceType,
        description: data.description ?? null,
      },
      include: {
        _count: {
          select: { noteSources: true },
        },
      },
    });
  }

  async update(id: string, data: UpdateSourceData): Promise<SourceWithSession> {
    return this.prisma.source.update({
      where: { id },
      data: {
        ...(data.title !== undefined ? { title: data.title } : {}),
        ...(data.url !== undefined ? { url: data.url } : {}),
        ...(data.authorOrganization !== undefined ? { authorOrganization: data.authorOrganization } : {}),
        ...(data.sourceType !== undefined ? { sourceType: data.sourceType } : {}),
        ...(data.description !== undefined ? { description: data.description } : {}),
      },
      include: {
        _count: {
          select: { noteSources: true },
        },
      },
    });
  }

  async delete(id: string): Promise<Source> {
    return this.prisma.source.delete({
      where: { id },
    });
  }
}
