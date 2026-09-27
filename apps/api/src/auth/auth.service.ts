import {
  Injectable,
  ConflictException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { randomUUID, randomBytes } from 'crypto';
import { validateEnv } from '@curiosity/config';
import { UsersService } from '../users/users.service';
import { RedisService } from '../common/redis.service';
import { RegisterDto, LoginDto } from './dto';

export interface AuthResponse {
  user: {
    id: string;
    email: string;
    name: string | null;
    createdAt: Date;
  };
  accessToken: string;
  refreshToken: string;
}

export interface GuestSessionResponse {
  guestToken: string;
  guestId: string;
  expiresAt: string;
}

@Injectable()
export class AuthService {
  private readonly REFRESH_TOKEN_TTL_SECONDS = 7 * 24 * 60 * 60; // 7 days
  private readonly GUEST_SESSION_TTL_SECONDS = 24 * 60 * 60; // 24 hours

  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly redisService: RedisService,
  ) {}

  async register(dto: RegisterDto): Promise<AuthResponse> {
    const existing = await this.usersService.findByEmail(dto.email);
    if (existing) {
      throw new ConflictException('An account with this email already exists');
    }

    const passwordHash = await bcrypt.hash(dto.password, 10);
    const user = await this.usersService.create({
      email: dto.email,
      passwordHash,
      name: dto.name,
    });

    const tokens = await this.generateTokens(user.id, user.email);

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        createdAt: user.createdAt,
      },
      ...tokens,
    };
  }

  async login(dto: LoginDto): Promise<AuthResponse> {
    const user = await this.usersService.findByEmail(dto.email);
    if (!user || !user.passwordHash) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const passwordValid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!passwordValid) {
      throw new UnauthorizedException('Invalid email or password');
    }

    await this.usersService.updateLastLogin(user.id);
    const tokens = await this.generateTokens(user.id, user.email);

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        createdAt: user.createdAt,
      },
      ...tokens,
    };
  }

  async refresh(refreshToken: string): Promise<{ accessToken: string; refreshToken: string }> {
    const env = validateEnv();
    let payload: { sub: string; email: string; jti: string };

    try {
      payload = await this.jwtService.verifyAsync(refreshToken, {
        secret: env.JWT_REFRESH_SECRET,
      });
    } catch {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    const redisKey = `refresh_token:${payload.sub}:${payload.jti}`;
    const exists = await this.redisService.client.get(redisKey);
    if (!exists) {
      throw new UnauthorizedException('Refresh token revoked or expired');
    }

    // Invalidate old token (rotation)
    await this.redisService.client.del(redisKey);

    // Issue new token pair
    return this.generateTokens(payload.sub, payload.email);
  }

  async logout(userId?: string, refreshToken?: string): Promise<{ success: boolean }> {
    if (refreshToken) {
      const env = validateEnv();
      try {
        const payload = await this.jwtService.verifyAsync(refreshToken, {
          secret: env.JWT_REFRESH_SECRET,
        });
        const redisKey = `refresh_token:${payload.sub}:${payload.jti}`;
        await this.redisService.client.del(redisKey);
      } catch {
        // Even if token was invalid/expired, proceed safely
      }
    }

    if (userId) {
      // Invalidate any other active refresh tokens for this user
      const stream = this.redisService.client.scanStream({
        match: `refresh_token:${userId}:*`,
        count: 100,
      });
      stream.on('data', (keys: string[]) => {
        if (keys.length) {
          const pipeline = this.redisService.client.pipeline();
          keys.forEach((key) => pipeline.del(key));
          pipeline.exec();
        }
      });
    }

    return { success: true };
  }

  async createGuestSession(): Promise<GuestSessionResponse> {
    const guestId = randomUUID();
    const guestToken = `gst_${randomBytes(32).toString('hex')}`;
    const expiresAt = new Date(Date.now() + this.GUEST_SESSION_TTL_SECONDS * 1000).toISOString();

    const redisKey = `guest_session:${guestToken}`;
    await this.redisService.client.set(
      redisKey,
      JSON.stringify({ guestId, createdAt: new Date().toISOString() }),
      'EX',
      this.GUEST_SESSION_TTL_SECONDS,
    );

    return {
      guestToken,
      guestId,
      expiresAt,
    };
  }

  async validateGuestToken(guestToken: string): Promise<string | null> {
    if (!guestToken) return null;
    const data = await this.redisService.client.get(`guest_session:${guestToken}`);
    if (!data) return null;
    try {
      const parsed = JSON.parse(data);
      return parsed.guestId ?? null;
    } catch {
      return null;
    }
  }

  private async generateTokens(
    userId: string,
    email: string,
  ): Promise<{ accessToken: string; refreshToken: string }> {
    const env = validateEnv();
    const jti = randomUUID();

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(
        { sub: userId, email },
        {
          secret: env.JWT_ACCESS_SECRET,
          expiresIn: '15m',
        },
      ),
      this.jwtService.signAsync(
        { sub: userId, email, jti },
        {
          secret: env.JWT_REFRESH_SECRET,
          expiresIn: '7d',
        },
      ),
    ]);

    // Store refresh token in Redis with matching 7-day TTL
    const redisKey = `refresh_token:${userId}:${jti}`;
    await this.redisService.client.set(
      redisKey,
      'valid',
      'EX',
      this.REFRESH_TOKEN_TTL_SECONDS,
    );

    return { accessToken, refreshToken };
  }
}
