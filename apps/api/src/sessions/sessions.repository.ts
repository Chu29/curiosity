import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { LearningSession, SessionStatus } from '@prisma/client';

export interface CreateSessionRecord {
  topicId: string;
  userId?: string | null;
  expiresAt?: Date | null;
}

@Injectable()
export class SessionsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: CreateSessionRecord): Promise<LearningSession> {
    return this.prisma.learningSession.create({
      data: {
        topicId: data.topicId,
        userId: data.userId ?? null,
        expiresAt: data.expiresAt ?? null,
        status: SessionStatus.CREATED,
      },
      include: {
        topic: true,
      },
    });
  }

  async findById(id: string): Promise<LearningSession | null> {
    return this.prisma.learningSession.findUnique({
      where: { id },
      include: {
        topic: true,
      },
    });
  }

  async updateStatus(
    id: string,
    status: SessionStatus,
    completedAt?: Date | null,
  ): Promise<LearningSession> {
    return this.prisma.learningSession.update({
      where: { id },
      data: {
        status,
        ...(completedAt !== undefined ? { completedAt } : {}),
      },
      include: {
        topic: true,
      },
    });
  }
}
