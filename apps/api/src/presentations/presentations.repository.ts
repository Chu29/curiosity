import { Injectable } from '@nestjs/common';
import { LearningSession, Presentation, PresentationStatus } from '@prisma/client';
import { PrismaService as Prisma } from '../prisma/prisma.service';

export interface PresentationWithSession extends Presentation {
  learningSession: LearningSession;
}

@Injectable()
export class PresentationsRepository {
  constructor(private readonly prisma: Prisma) {}

  create(learningSessionId: string): Promise<Presentation> {
    return this.prisma.presentation.create({ data: { learningSessionId } });
  }

  findById(id: string): Promise<PresentationWithSession | null> {
    return this.prisma.presentation.findUnique({
      where: { id },
      include: { learningSession: true },
    }) as Promise<PresentationWithSession | null>;
  }

  updateStatus(id: string, status: PresentationStatus): Promise<Presentation> {
    return this.prisma.presentation.update({ where: { id }, data: { status } });
  }

  markUploaded(id: string, data: { mediaUrl: string; storageKey: string; mimeType: string; sizeBytes: bigint }): Promise<Presentation> {
    return this.prisma.presentation.update({
      where: { id },
      data: { ...data, status: PresentationStatus.RECORDING },
    });
  }

  submit(id: string, submittedAt: Date): Promise<Presentation> {
    return this.prisma.presentation.update({
      where: { id },
      data: { status: PresentationStatus.SUBMITTED, submittedAt },
    });
  }

}
