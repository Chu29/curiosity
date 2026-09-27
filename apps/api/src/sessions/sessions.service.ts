import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { LearningSession, SessionStatus } from '@prisma/client';
import { SessionsRepository } from './sessions.repository';
import { TopicsService } from '../topics/topics.service';
import { RedisService } from '../common/redis.service';
import { assertResourceOwnership, ResourceRequester } from '../auth/guards/ownership.util';
import { validateSessionTransition } from './session-state-machine';

@Injectable()
export class SessionsService {
  private readonly GUEST_SESSION_TTL_SECONDS = 24 * 60 * 60; // 24 hours

  constructor(
    private readonly sessionsRepository: SessionsRepository,
    private readonly topicsService: TopicsService,
    private readonly redisService: RedisService,
  ) {}

  async createSession(
    topicId: string,
    requester: ResourceRequester,
  ): Promise<LearningSession> {
    if (!requester || (!requester.userId && !requester.guestId)) {
      throw new UnauthorizedException('Authentication or valid guest token required to start a session');
    }

    // Ensure topic exists and is active
    await this.topicsService.getTopicById(topicId);

    const expiresAt = requester.guestId
      ? new Date(Date.now() + this.GUEST_SESSION_TTL_SECONDS * 1000)
      : null;

    const session = await this.sessionsRepository.create({
      topicId,
      userId: requester.userId ?? null,
      expiresAt,
    });

    if (requester.guestId) {
      // Store guest ownership association in Redis
      await this.redisService.client.set(
        `session_owner:${session.id}`,
        requester.guestId,
        'EX',
        this.GUEST_SESSION_TTL_SECONDS,
      );
    }

    return session;
  }

  async startSession(
    sessionId: string,
    requester: ResourceRequester,
  ): Promise<LearningSession> {
    const session = await this.sessionsRepository.findById(sessionId);
    if (!session) {
      throw new NotFoundException(`Session not found: ${sessionId}`);
    }

    await this.verifySessionOwnership(session, requester);
    validateSessionTransition(session.status, SessionStatus.RESEARCHING);

    return this.sessionsRepository.updateStatus(sessionId, SessionStatus.RESEARCHING);
  }

  async abandonSession(
    sessionId: string,
    requester: ResourceRequester,
  ): Promise<LearningSession> {
    const session = await this.sessionsRepository.findById(sessionId);
    if (!session) {
      throw new NotFoundException(`Session not found: ${sessionId}`);
    }

    await this.verifySessionOwnership(session, requester);
    validateSessionTransition(session.status, SessionStatus.ABANDONED);

    return this.sessionsRepository.updateStatus(sessionId, SessionStatus.ABANDONED);
  }

  async getSession(
    sessionId: string,
    requester: ResourceRequester,
  ): Promise<LearningSession> {
    const session = await this.sessionsRepository.findById(sessionId);
    if (!session) {
      throw new NotFoundException(`Session not found: ${sessionId}`);
    }

    await this.verifySessionOwnership(session, requester);
    return session;
  }

  private async verifySessionOwnership(
    session: LearningSession,
    requester: ResourceRequester,
  ): Promise<void> {
    let guestOwnerId: string | null = null;
    if (!session.userId) {
      guestOwnerId = await this.redisService.client.get(`session_owner:${session.id}`);
    }

    assertResourceOwnership(
      { userId: session.userId, guestId: guestOwnerId },
      requester,
    );
  }
}
