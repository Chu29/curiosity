import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { ResearchGuide, ResearchQuestion } from '@prisma/client';

export type ResearchGuideWithQuestions = ResearchGuide & {
  questions: ResearchQuestion[];
};

export interface CreateGuideData {
  learningSessionId: string;
  objective: string;
  presentationRequirements?: string | null;
  version?: number;
  generatedBy?: string | null;
  modelVersion?: string | null;
  promptVersion?: string | null;
  questions: Array<{
    question: string;
    orderIndex: number;
    required: boolean;
  }>;
}

@Injectable()
export class GuidesRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findBySessionId(learningSessionId: string): Promise<ResearchGuideWithQuestions | null> {
    return this.prisma.researchGuide.findUnique({
      where: { learningSessionId },
      include: {
        questions: {
          orderBy: { orderIndex: 'asc' },
        },
      },
    });
  }

  async findById(id: string): Promise<ResearchGuideWithQuestions | null> {
    return this.prisma.researchGuide.findUnique({
      where: { id },
      include: {
        questions: {
          orderBy: { orderIndex: 'asc' },
        },
      },
    });
  }

  async createGuide(data: CreateGuideData): Promise<ResearchGuideWithQuestions> {
    return this.prisma.researchGuide.create({
      data: {
        learningSessionId: data.learningSessionId,
        objective: data.objective,
        presentationRequirements: data.presentationRequirements ?? null,
        version: data.version ?? 1,
        generatedBy: data.generatedBy ?? null,
        modelVersion: data.modelVersion ?? null,
        promptVersion: data.promptVersion ?? null,
        questions: {
          create: data.questions.map((q) => ({
            question: q.question,
            orderIndex: q.orderIndex,
            required: q.required,
          })),
        },
      },
      include: {
        questions: {
          orderBy: { orderIndex: 'asc' },
        },
      },
    });
  }
}
