import { ForbiddenException, UnauthorizedException } from '@nestjs/common';

export interface ResourceRequester {
  userId?: string | null;
  guestId?: string | null;
}

/**
 * Asserts that the requesting principal (authenticated user or validated guest)
 * owns the target resource, per rules-and-boundaries.md §9.
 *
 * Rules:
 * 1. If resource is owned by a registered user (`resourceUserId` is non-null):
 *    - Requester MUST be an authenticated user with `requester.userId === resourceUserId`.
 *    - Guest access is denied.
 * 2. If resource is a guest session (`resourceUserId` is null):
 *    - Requester MUST provide matching `guestId === resourceGuestId`.
 *    - An empty or mismatched guestId is denied.
 * 3. Never allow anonymous or unverified access ("no userId" never means public).
 */
export function assertResourceOwnership(
  resourceOwner: { userId?: string | null; guestId?: string | null },
  requester: ResourceRequester,
): void {
  if (!requester || (!requester.userId && !requester.guestId)) {
    throw new UnauthorizedException('Authentication or valid guest token required');
  }

  // If resource belongs to a registered user
  if (resourceOwner.userId) {
    if (!requester.userId || requester.userId !== resourceOwner.userId) {
      throw new ForbiddenException('Access denied: You do not own this resource');
    }
    return;
  }

  // If resource was created by a guest session
  if (resourceOwner.guestId) {
    if (!requester.guestId || requester.guestId !== resourceOwner.guestId) {
      throw new ForbiddenException('Access denied: Invalid guest credentials for this resource');
    }
    return;
  }

  // Fail-safe: if resource has no owner specified, it is never public
  throw new ForbiddenException('Access denied: Resource has unverified ownership');
}
