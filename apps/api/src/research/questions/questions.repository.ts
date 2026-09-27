import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import {
  ResearchQuestion,
  ResearchGuide,
  LearningSession,
  QuestionStatus,
} from '@prisma/client';

export type QuestionWithSession = ResearchQuestion & {
  researchGuide: ResearchGuide & {
    learningSession: LearningSession;
  };
};

@Injectable()
export class QuestionsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findByIdWithSession(id: string): Promise<QuestionWithSession | null> {
    return this.prisma.researchQuestion.findUnique({
      where: { id },
      include: {
        researchGuide: {
          include: {
            learningSession: true,
          },
        },
      },
    });
  }

  async updateStatus(
    id: string,
    status: QuestionStatus,
    completedAt: Date | null,
  ): Promise<ResearchQuestion> {
    return this.prisma.researchQuestion.update({
      where: { id },
      data: {
        status,
        completedAt,
      },
    });
  }
}
