import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class OptionalJwtAuthGuard extends AuthGuard('jwt') {
  override handleRequest<TUser = any>(err: any, user: any): TUser {
    // If invalid token, error, or unauthenticated, allow request to continue with null user
    if (err || !user) {
      return null as unknown as TUser;
    }
    return user;
  }
}
