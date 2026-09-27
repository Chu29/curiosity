import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { assertResourceOwnership } from './ownership.util';
import { ForbiddenException, UnauthorizedException } from '@nestjs/common';

describe('assertResourceOwnership', () => {
  const userId = '11111111-1111-1111-1111-111111111111';
  const otherUserId = '22222222-2222-2222-2222-222222222222';
  const guestId = '33333333-3333-3333-3333-333333333333';
  const otherGuestId = '44444444-4444-4444-4444-444444444444';

  it('allows access when authenticated user matches resource owner', () => {
    assert.doesNotThrow(() => {
      assertResourceOwnership({ userId }, { userId });
    });
  });

  it('rejects access when authenticated user does not match resource owner', () => {
    assert.throws(
      () => assertResourceOwnership({ userId }, { userId: otherUserId }),
      ForbiddenException,
    );
  });

  it('rejects access when guest attempts to access user-owned resource', () => {
    assert.throws(
      () => assertResourceOwnership({ userId }, { guestId }),
      ForbiddenException,
    );
  });

  it('allows access when guest identifier matches guest resource', () => {
    assert.doesNotThrow(() => {
      assertResourceOwnership({ userId: null, guestId }, { guestId });
    });
  });

  it('rejects access when guest identifier does not match guest resource', () => {
    assert.throws(
      () => assertResourceOwnership({ userId: null, guestId }, { guestId: otherGuestId }),
      ForbiddenException,
    );
  });

  it('rejects access when requester provides no credentials', () => {
    assert.throws(
      () => assertResourceOwnership({ userId }, {}),
      UnauthorizedException,
    );
  });

  it('rejects access when resource has neither userId nor guestId (never public)', () => {
    assert.throws(
      () => assertResourceOwnership({ userId: null, guestId: null }, { userId }),
      ForbiddenException,
    );
  });
});
