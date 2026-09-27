import { Injectable, NotFoundException } from '@nestjs/common';
import { SourcesRepository, SourceWithSession } from './sources.repository';
import { SessionsService } from '../../sessions/sessions.service';
import { ResourceRequester } from '../../auth/guards/ownership.util';
import { CreateSourceDto, UpdateSourceDto } from './dto';
import { Source } from '@prisma/client';

@Injectable()
export class SourcesService {
  constructor(
    private readonly sourcesRepository: SourcesRepository,
    private readonly sessionsService: SessionsService,
  ) {}

  async createSource(
    sessionId: string,
    dto: CreateSourceDto,
    requester: ResourceRequester,
  ): Promise<SourceWithSession> {
    await this.sessionsService.getSession(sessionId, requester);

    return this.sourcesRepository.create({
      learningSessionId: sessionId,
      title: dto.title,
      url: dto.url,
      authorOrganization: dto.authorOrganization,
      sourceType: dto.sourceType,
      description: dto.description,
    });
  }

  async getSourcesBySession(
    sessionId: string,
    requester: ResourceRequester,
  ): Promise<SourceWithSession[]> {
    await this.sessionsService.getSession(sessionId, requester);
    return this.sourcesRepository.findBySessionId(sessionId);
  }

  async getSourceById(
    sourceId: string,
    requester: ResourceRequester,
  ): Promise<SourceWithSession> {
    const source = await this.sourcesRepository.findById(sourceId);
    if (!source || !source.learningSession) {
      throw new NotFoundException(`Source not found: ${sourceId}`);
    }

    await this.sessionsService.verifySessionOwnership(source.learningSession, requester);
    return source;
  }

  async updateSource(
    sourceId: string,
    dto: UpdateSourceDto,
    requester: ResourceRequester,
  ): Promise<SourceWithSession> {
    const source = await this.getSourceById(sourceId, requester);
    return this.sourcesRepository.update(source.id, dto);
  }

  async deleteSource(
    sourceId: string,
    requester: ResourceRequester,
  ): Promise<Source> {
    const source = await this.getSourceById(sourceId, requester);
    return this.sourcesRepository.delete(source.id);
  }
}
