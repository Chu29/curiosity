import {
  Controller,
  Post,
  Get,
  Param,
  UseGuards,
  Headers,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { GuidesService } from './guides.service';
import { AuthService } from '../../auth/auth.service';
import { OptionalJwtAuthGuard } from '../../auth/guards/optional-jwt-auth.guard';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';

@Controller()
export class GuidesController {
  constructor(
    private readonly guidesService: GuidesService,
    private readonly authService: AuthService,
  ) {}

  @Get('research/guides/health')
  health(): { status: string } {
    return { status: 'ok' };
  }

  @Post('sessions/:sessionId/research-guide')
  @HttpCode(HttpStatus.CREATED)
  @UseGuards(OptionalJwtAuthGuard)
  async generateGuide(
    @Param('sessionId') sessionId: string,
    @CurrentUser() user: any,
    @Headers('x-guest-token') headerGuestToken?: string,
  ) {
    let guestId: string | null = null;
    if (headerGuestToken) {
      guestId = await this.authService.validateGuestToken(headerGuestToken);
    }

    return this.guidesService.generateGuideForSession(sessionId, {
      userId: user?.id ?? null,
      guestId,
    });
  }

  @Get('sessions/:sessionId/research-guide')
  @UseGuards(OptionalJwtAuthGuard)
  async getGuide(
    @Param('sessionId') sessionId: string,
    @CurrentUser() user: any,
    @Headers('x-guest-token') headerGuestToken?: string,
  ) {
    let guestId: string | null = null;
    if (headerGuestToken) {
      guestId = await this.authService.validateGuestToken(headerGuestToken);
    }

    return this.guidesService.getGuideBySessionId(sessionId, {
      userId: user?.id ?? null,
      guestId,
    });
  }
}
