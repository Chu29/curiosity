import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { SessionStatus } from '@prisma/client';
import {
  validateSessionTransition,
  InvalidSessionStateException,
  VALID_SESSION_TRANSITIONS,
} from './session-state-machine';

describe('Session State Machine', () => {
  it('allows valid progressive lifecycle transitions', () => {
    assert.doesNotThrow(() => validateSessionTransition(SessionStatus.CREATED, SessionStatus.GUIDE_READY));
    assert.doesNotThrow(() => validateSessionTransition(SessionStatus.CREATED, SessionStatus.RESEARCHING));
    assert.doesNotThrow(() => validateSessionTransition(SessionStatus.GUIDE_READY, SessionStatus.RESEARCHING));
    assert.doesNotThrow(() => validateSessionTransition(SessionStatus.RESEARCHING, SessionStatus.READY_TO_PRESENT));
    assert.doesNotThrow(() => validateSessionTransition(SessionStatus.READY_TO_PRESENT, SessionStatus.PRESENTING));
    assert.doesNotThrow(() => validateSessionTransition(SessionStatus.PRESENTING, SessionStatus.EVALUATING));
    assert.doesNotThrow(() => validateSessionTransition(SessionStatus.EVALUATING, SessionStatus.COMPLETED));
  });

  it('allows ABANDONED transition from any non-terminal state', () => {
    const nonTerminal = [
      SessionStatus.CREATED,
      SessionStatus.GUIDE_READY,
      SessionStatus.RESEARCHING,
      SessionStatus.READY_TO_PRESENT,
      SessionStatus.PRESENTING,
      SessionStatus.EVALUATING,
    ];

    for (const status of nonTerminal) {
      assert.doesNotThrow(() => validateSessionTransition(status, SessionStatus.ABANDONED));
    }
  });

  it('rejects illegal skipping of states with INVALID_SESSION_STATE', () => {
    assert.throws(
      () => validateSessionTransition(SessionStatus.CREATED, SessionStatus.COMPLETED),
      (err: any) => {
        assert.equal(err instanceof InvalidSessionStateException, true);
        assert.equal(err.getResponse().error, 'INVALID_SESSION_STATE');
        return true;
      },
    );

    assert.throws(
      () => validateSessionTransition(SessionStatus.RESEARCHING, SessionStatus.COMPLETED),
      InvalidSessionStateException,
    );
  });

  it('rejects any transition from terminal states (COMPLETED or ABANDONED)', () => {
    assert.throws(
      () => validateSessionTransition(SessionStatus.COMPLETED, SessionStatus.RESEARCHING),
      InvalidSessionStateException,
    );

    assert.throws(
      () => validateSessionTransition(SessionStatus.ABANDONED, SessionStatus.CREATED),
      InvalidSessionStateException,
    );
  });
});
