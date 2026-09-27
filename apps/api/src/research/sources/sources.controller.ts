import {
  Controller,
  Post,
  Get,
  Patch,
  Delete,
  Param,
  Body,
  UseGuards,
  Headers,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { SourcesService } from './sources.service';
import { AuthService } from '../../auth/auth.service';
import { CreateSourceDto, UpdateSourceDto } from './dto';
import { OptionalJwtAuthGuard } from '../../auth/guards/optional-jwt-auth.guard';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';

@Controller()
export class SourcesController {
  constructor(
    private readonly sourcesService: SourcesService,
    private readonly authService: AuthService,
  ) {}

  @Get('research/sources/health')
  health(): { status: string } {
    return { status: 'ok' };
  }

  @Post('sessions/:sessionId/sources')
  @HttpCode(HttpStatus.CREATED)
  @UseGuards(OptionalJwtAuthGuard)
  async createSource(
    @Param('sessionId') sessionId: string,
    @Body() dto: CreateSourceDto,
    @CurrentUser() user: any,
    @Headers('x-guest-token') headerGuestToken?: string,
  ) {
    let guestId: string | null = null;
    if (headerGuestToken) {
      guestId = await this.authService.validateGuestToken(headerGuestToken);
    }

    return this.sourcesService.createSource(sessionId, dto, {
      userId: user?.id ?? null,
      guestId,
    });
  }

  @Get('sessions/:sessionId/sources')
  @UseGuards(OptionalJwtAuthGuard)
  async getSourcesBySession(
    @Param('sessionId') sessionId: string,
    @CurrentUser() user: any,
    @Headers('x-guest-token') headerGuestToken?: string,
  ) {
    let guestId: string | null = null;
    if (headerGuestToken) {
      guestId = await this.authService.validateGuestToken(headerGuestToken);
    }

    return this.sourcesService.getSourcesBySession(sessionId, {
      userId: user?.id ?? null,
      guestId,
    });
  }

  @Get('sources/:sourceId')
  @UseGuards(OptionalJwtAuthGuard)
  async getSourceById(
    @Param('sourceId') sourceId: string,
    @CurrentUser() user: any,
    @Headers('x-guest-token') headerGuestToken?: string,
  ) {
    let guestId: string | null = null;
    if (headerGuestToken) {
      guestId = await this.authService.validateGuestToken(headerGuestToken);
    }

    return this.sourcesService.getSourceById(sourceId, {
      userId: user?.id ?? null,
      guestId,
    });
  }

  @Patch('sources/:sourceId')
  @UseGuards(OptionalJwtAuthGuard)
  async updateSource(
    @Param('sourceId') sourceId: string,
    @Body() dto: UpdateSourceDto,
    @CurrentUser() user: any,
    @Headers('x-guest-token') headerGuestToken?: string,
  ) {
    let guestId: string | null = null;
    if (headerGuestToken) {
      guestId = await this.authService.validateGuestToken(headerGuestToken);
    }

    return this.sourcesService.updateSource(sourceId, dto, {
      userId: user?.id ?? null,
      guestId,
    });
  }

  @Delete('sources/:sourceId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseGuards(OptionalJwtAuthGuard)
  async deleteSource(
    @Param('sourceId') sourceId: string,
    @CurrentUser() user: any,
    @Headers('x-guest-token') headerGuestToken?: string,
  ) {
    let guestId: string | null = null;
    if (headerGuestToken) {
      guestId = await this.authService.validateGuestToken(headerGuestToken);
    }

    await this.sourcesService.deleteSource(sourceId, {
      userId: user?.id ?? null,
      guestId,
    });
  }
}
