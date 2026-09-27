import { SessionStatus } from '@prisma/client';
import { BadRequestException } from '@nestjs/common';

export const VALID_SESSION_TRANSITIONS: Record<SessionStatus, SessionStatus[]> = {
  [SessionStatus.CREATED]: [
    SessionStatus.GUIDE_READY,
    SessionStatus.RESEARCHING,
    SessionStatus.ABANDONED,
  ],
  [SessionStatus.GUIDE_READY]: [
    SessionStatus.RESEARCHING,
    SessionStatus.ABANDONED,
  ],
  [SessionStatus.RESEARCHING]: [
    SessionStatus.READY_TO_PRESENT,
    SessionStatus.ABANDONED,
  ],
  [SessionStatus.READY_TO_PRESENT]: [
    SessionStatus.PRESENTING,
    SessionStatus.RESEARCHING,
    SessionStatus.ABANDONED,
  ],
  [SessionStatus.PRESENTING]: [
    SessionStatus.EVALUATING,
    SessionStatus.ABANDONED,
  ],
  [SessionStatus.EVALUATING]: [
    SessionStatus.COMPLETED,
    SessionStatus.ABANDONED,
  ],
  [SessionStatus.COMPLETED]: [],
  [SessionStatus.ABANDONED]: [],
};

export class InvalidSessionStateException extends BadRequestException {
  constructor(currentStatus: SessionStatus, targetStatus: SessionStatus) {
    super({
      statusCode: 400,
      error: 'INVALID_SESSION_STATE',
      message: `Cannot transition session from ${currentStatus} to ${targetStatus}`,
      currentStatus,
      targetStatus,
      allowedTransitions: VALID_SESSION_TRANSITIONS[currentStatus] ?? [],
    });
  }
}

export function validateSessionTransition(
  currentStatus: SessionStatus,
  targetStatus: SessionStatus,
): void {
  const allowed = VALID_SESSION_TRANSITIONS[currentStatus] ?? [];
  if (!allowed.includes(targetStatus)) {
    throw new InvalidSessionStateException(currentStatus, targetStatus);
  }
}
