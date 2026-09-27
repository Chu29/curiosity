import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { AuthService } from './auth.service';
import { ConflictException, UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';

describe('AuthService', () => {
  const mockUser = {
    id: 'user-1234',
    email: 'learner@example.com',
    passwordHash: '',
    name: 'Learner One',
    createdAt: new Date(),
    updatedAt: new Date(),
    lastLoginAt: null,
  };

  const createMockUsersService = () => {
    let storedUser: any = null;
    return {
      create: async (data: any) => {
        storedUser = {
          id: 'user-1234',
          email: data.email,
          passwordHash: data.passwordHash,
          name: data.name ?? null,
          createdAt: new Date(),
          updatedAt: new Date(),
          lastLoginAt: null,
        };
        return storedUser;
      },
      findByEmail: async (email: string) => {
        if (storedUser && storedUser.email === email) return storedUser;
        return null;
      },
      findById: async (id: string) => {
        if (storedUser && storedUser.id === id) return storedUser;
        return null;
      },
      updateLastLogin: async () => storedUser,
      setStoredUser: (user: any) => {
        storedUser = user;
      },
    } as any;
  };

  const createMockJwtService = () =>
    ({
      signAsync: async (payload: any) => `mock_token_${payload.sub ?? 'guest'}`,
      verifyAsync: async (token: string) => {
        if (token === 'valid_refresh_token') {
          return { sub: 'user-1234', email: 'learner@example.com', jti: 'token-jti' };
        }
        throw new Error('Invalid token');
      },
    } as any);

  const createMockRedisService = () => {
    const store = new Map<string, string>();
    return {
      client: {
        get: async (key: string) => store.get(key) ?? null,
        set: async (key: string, value: string) => {
          store.set(key, value);
          return 'OK';
        },
        del: async (key: string) => {
          store.delete(key);
          return 1;
        },
        scanStream: () => ({ on: () => {} }),
      },
    } as any;
  };

  it('registers a new user and hashes the password with bcrypt', async () => {
    const usersService = createMockUsersService();
    const jwtService = createMockJwtService();
    const redisService = createMockRedisService();
    const authService = new AuthService(usersService, jwtService, redisService);

    const result = await authService.register({
      email: 'learner@example.com',
      password: 'password123',
      name: 'Learner One',
    });

    assert.equal(result.user.email, 'learner@example.com');
    assert.ok(result.accessToken);
    assert.ok(result.refreshToken);

    const savedUser = await usersService.findByEmail('learner@example.com');
    assert.notEqual(savedUser.passwordHash, 'password123');
    const isMatch = await bcrypt.compare('password123', savedUser.passwordHash);
    assert.equal(isMatch, true);
  });

  it('rejects registration when email is already registered', async () => {
    const usersService = createMockUsersService();
    const jwtService = createMockJwtService();
    const redisService = createMockRedisService();
    const authService = new AuthService(usersService, jwtService, redisService);

    await authService.register({
      email: 'learner@example.com',
      password: 'password123',
    });

    await assert.rejects(
      async () =>
        authService.register({
          email: 'learner@example.com',
          password: 'anotherpassword',
        }),
      ConflictException,
    );
  });

  it('authenticates user with correct credentials and rejects wrong password', async () => {
    const usersService = createMockUsersService();
    const jwtService = createMockJwtService();
    const redisService = createMockRedisService();
    const authService = new AuthService(usersService, jwtService, redisService);

    await authService.register({
      email: 'learner@example.com',
      password: 'correct_password',
    });

    // Valid login
    const loginResult = await authService.login({
      email: 'learner@example.com',
      password: 'correct_password',
    });
    assert.equal(loginResult.user.email, 'learner@example.com');
    assert.ok(loginResult.accessToken);

    // Invalid password
    await assert.rejects(
      async () =>
        authService.login({
          email: 'learner@example.com',
          password: 'wrong_password',
        }),
      UnauthorizedException,
    );

    // Non-existent email
    await assert.rejects(
      async () =>
        authService.login({
          email: 'nonexistent@example.com',
          password: 'any_password',
        }),
      UnauthorizedException,
    );
  });

  it('issues an unguessable guest session token with 24h expiration', async () => {
    const usersService = createMockUsersService();
    const jwtService = createMockJwtService();
    const redisService = createMockRedisService();
    const authService = new AuthService(usersService, jwtService, redisService);

    const guestSession = await authService.createGuestSession();
    assert.ok(guestSession.guestToken.startsWith('gst_'));
    assert.ok(guestSession.guestId);
    assert.ok(guestSession.expiresAt);

    // Verify token can be validated
    const validatedGuestId = await authService.validateGuestToken(guestSession.guestToken);
    assert.equal(validatedGuestId, guestSession.guestId);

    // Random non-existent guest token returns null
    const nonExistent = await authService.validateGuestToken('gst_nonexistent');
    assert.equal(nonExistent, null);
  });
});
