import { Controller, Get, Headers, HttpCode, HttpStatus, Param, Post, UploadedFile, UseGuards, UseInterceptors, Body } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { PresentationsService, UploadedAudioFile } from './presentations.service';
import { OptionalJwtAuthGuard } from '../auth/guards/optional-jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { AuthService } from '../auth/auth.service';
import { EmptyPresentationDto } from './dto';

@Controller()
export class PresentationsController {
  constructor(private readonly presentationsService: PresentationsService, private readonly authService: AuthService) {}

  @Post('/sessions/:sessionId/presentations')
  @UseGuards(OptionalJwtAuthGuard)
  async create(@Param('sessionId') sessionId: string, @CurrentUser() user: any, @Headers('x-guest-token') guestToken?: string) {
    return this.presentationsService.create(sessionId, { userId: user?.id ?? null, guestId: await this.guestId(guestToken) });
  }

  @Post('presentations/:presentationId/start')
  @HttpCode(HttpStatus.OK)
  @UseGuards(OptionalJwtAuthGuard)
  async start(@Param('presentationId') id: string, @CurrentUser() user: any, @Headers('x-guest-token') guestToken?: string) {
    return this.presentationsService.start(id, { userId: user?.id ?? null, guestId: await this.guestId(guestToken) });
  }

  @Post('presentations/:presentationId/upload')
  @HttpCode(HttpStatus.OK)
  @UseGuards(OptionalJwtAuthGuard)
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: 100 * 1024 * 1024 } }))
  async upload(@Param('presentationId') id: string, @UploadedFile() file: UploadedAudioFile, @CurrentUser() user: any, @Headers('x-guest-token') guestToken?: string) {
    return this.presentationsService.upload(id, file, { userId: user?.id ?? null, guestId: await this.guestId(guestToken) });
  }

  @Post('presentations/:presentationId/submit')
  @HttpCode(HttpStatus.OK)
  @UseGuards(OptionalJwtAuthGuard)
  async submit(@Param('presentationId') id: string, @CurrentUser() user: any, @Headers('x-guest-token') guestToken?: string, @Body() _dto?: EmptyPresentationDto) {
    return this.presentationsService.submit(id, { userId: user?.id ?? null, guestId: await this.guestId(guestToken) });
  }

  private async guestId(token?: string): Promise<string | null> {
    return token ? this.authService.validateGuestToken(token) : null;
  }

  @Get('health')
  health(): { status: string } {
    return { status: 'ok' };
  }
}
