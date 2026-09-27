import {
  Controller,
  Post,
  Get,
  Param,
  Body,
  UseGuards,
  Headers,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { SessionsService } from './sessions.service';
import { AuthService } from '../auth/auth.service';
import { CreateSessionDto, SessionActionDto } from './dto';
import { OptionalJwtAuthGuard } from '../auth/guards/optional-jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Controller('sessions')
export class SessionsController {
  constructor(
    private readonly sessionsService: SessionsService,
    private readonly authService: AuthService,
  ) {}

  @Post()
  @UseGuards(OptionalJwtAuthGuard)
  async createSession(
    @Body() dto: CreateSessionDto,
    @CurrentUser() user: any,
    @Headers('x-guest-token') headerGuestToken?: string,
  ) {
    const rawGuestToken = dto.guestToken || headerGuestToken;
    let guestId: string | null = null;

    if (rawGuestToken) {
      guestId = await this.authService.validateGuestToken(rawGuestToken);
    }

    return this.sessionsService.createSession(dto.topicId, {
      userId: user?.id ?? null,
      guestId,
    });
  }

  @Post(':sessionId/start')
  @HttpCode(HttpStatus.OK)
  @UseGuards(OptionalJwtAuthGuard)
  async startSession(
    @Param('sessionId') sessionId: string,
    @Body() dto: SessionActionDto,
    @CurrentUser() user: any,
    @Headers('x-guest-token') headerGuestToken?: string,
  ) {
    const rawGuestToken = dto?.guestToken || headerGuestToken;
    let guestId: string | null = null;

    if (rawGuestToken) {
      guestId = await this.authService.validateGuestToken(rawGuestToken);
    }

    return this.sessionsService.startSession(sessionId, {
      userId: user?.id ?? null,
      guestId,
    });
  }

  @Post(':sessionId/ready-to-present')
  @HttpCode(HttpStatus.OK)
  @UseGuards(OptionalJwtAuthGuard)
  async readyToPresent(
    @Param('sessionId') sessionId: string,
    @Body() dto: SessionActionDto,
    @CurrentUser() user: any,
    @Headers('x-guest-token') headerGuestToken?: string,
  ) {
    const rawGuestToken = dto?.guestToken || headerGuestToken;
    let guestId: string | null = null;

    if (rawGuestToken) {
      guestId = await this.authService.validateGuestToken(rawGuestToken);
    }

    return this.sessionsService.readyToPresent(sessionId, {
      userId: user?.id ?? null,
      guestId,
    });
  }

  @Post(':sessionId/abandon')
  @HttpCode(HttpStatus.OK)
  @UseGuards(OptionalJwtAuthGuard)
  async abandonSession(
    @Param('sessionId') sessionId: string,
    @Body() dto: SessionActionDto,
    @CurrentUser() user: any,
    @Headers('x-guest-token') headerGuestToken?: string,
  ) {
    const rawGuestToken = dto?.guestToken || headerGuestToken;
    let guestId: string | null = null;

    if (rawGuestToken) {
      guestId = await this.authService.validateGuestToken(rawGuestToken);
    }

    return this.sessionsService.abandonSession(sessionId, {
      userId: user?.id ?? null,
      guestId,
    });
  }

  @Get(':sessionId')
  @UseGuards(OptionalJwtAuthGuard)
  async getSession(
    @Param('sessionId') sessionId: string,
    @CurrentUser() user: any,
    @Headers('x-guest-token') headerGuestToken?: string,
  ) {
    let guestId: string | null = null;

    if (headerGuestToken) {
      guestId = await this.authService.validateGuestToken(headerGuestToken);
    }

    return this.sessionsService.getSession(sessionId, {
      userId: user?.id ?? null,
      guestId,
    });
  }
}
