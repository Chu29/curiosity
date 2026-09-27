import { Injectable, NotFoundException } from '@nestjs/common';
import { ResearchQuestion, QuestionStatus } from '@prisma/client';
import { QuestionsRepository } from './questions.repository';
import { SessionsService } from '../../sessions/sessions.service';
import { ResourceRequester } from '../../auth/guards/ownership.util';

@Injectable()
export class QuestionsService {
  constructor(
    private readonly questionsRepository: QuestionsRepository,
    private readonly sessionsService: SessionsService,
  ) {}

  async markComplete(
    questionId: string,
    requester: ResourceRequester,
  ): Promise<ResearchQuestion> {
    const record = await this.questionsRepository.findByIdWithSession(questionId);
    if (!record) {
      throw new NotFoundException(`Research question not found: ${questionId}`);
    }

    await this.sessionsService.verifySessionOwnership(
      record.researchGuide.learningSession,
      requester,
    );

    return this.questionsRepository.updateStatus(
      questionId,
      QuestionStatus.COMPLETED,
      new Date(),
    );
  }

  async markIncomplete(
    questionId: string,
    requester: ResourceRequester,
  ): Promise<ResearchQuestion> {
    const record = await this.questionsRepository.findByIdWithSession(questionId);
    if (!record) {
      throw new NotFoundException(`Research question not found: ${questionId}`);
    }

    await this.sessionsService.verifySessionOwnership(
      record.researchGuide.learningSession,
      requester,
    );

    return this.questionsRepository.updateStatus(
      questionId,
      QuestionStatus.PENDING,
      null,
    );
  }
}
