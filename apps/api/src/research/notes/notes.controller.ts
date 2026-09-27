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
import { NotesService } from './notes.service';
import { AuthService } from '../../auth/auth.service';
import { CreateNoteDto, UpdateNoteDto } from './dto';
import { OptionalJwtAuthGuard } from '../../auth/guards/optional-jwt-auth.guard';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';

@Controller()
export class NotesController {
  constructor(
    private readonly notesService: NotesService,
    private readonly authService: AuthService,
  ) {}

  @Get('research/notes/health')
  health(): { status: string } {
    return { status: 'ok' };
  }

  @Post('sessions/:sessionId/notes')
  @HttpCode(HttpStatus.CREATED)
  @UseGuards(OptionalJwtAuthGuard)
  async createNote(
    @Param('sessionId') sessionId: string,
    @Body() dto: CreateNoteDto,
    @CurrentUser() user: any,
    @Headers('x-guest-token') headerGuestToken?: string,
  ) {
    let guestId: string | null = null;
    if (headerGuestToken) {
      guestId = await this.authService.validateGuestToken(headerGuestToken);
    }

    return this.notesService.createNote(sessionId, dto, {
      userId: user?.id ?? null,
      guestId,
    });
  }

  @Get('sessions/:sessionId/notes')
  @UseGuards(OptionalJwtAuthGuard)
  async getNotesBySession(
    @Param('sessionId') sessionId: string,
    @CurrentUser() user: any,
    @Headers('x-guest-token') headerGuestToken?: string,
  ) {
    let guestId: string | null = null;
    if (headerGuestToken) {
      guestId = await this.authService.validateGuestToken(headerGuestToken);
    }

    return this.notesService.getNotesBySession(sessionId, {
      userId: user?.id ?? null,
      guestId,
    });
  }

  @Get('notes/:noteId')
  @UseGuards(OptionalJwtAuthGuard)
  async getNoteById(
    @Param('noteId') noteId: string,
    @CurrentUser() user: any,
    @Headers('x-guest-token') headerGuestToken?: string,
  ) {
    let guestId: string | null = null;
    if (headerGuestToken) {
      guestId = await this.authService.validateGuestToken(headerGuestToken);
    }

    return this.notesService.getNoteById(noteId, {
      userId: user?.id ?? null,
      guestId,
    });
  }

  @Patch('notes/:noteId')
  @UseGuards(OptionalJwtAuthGuard)
  async updateNote(
    @Param('noteId') noteId: string,
    @Body() dto: UpdateNoteDto,
    @CurrentUser() user: any,
    @Headers('x-guest-token') headerGuestToken?: string,
  ) {
    let guestId: string | null = null;
    if (headerGuestToken) {
      guestId = await this.authService.validateGuestToken(headerGuestToken);
    }

    return this.notesService.updateNote(noteId, dto, {
      userId: user?.id ?? null,
      guestId,
    });
  }

  @Delete('notes/:noteId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseGuards(OptionalJwtAuthGuard)
  async deleteNote(
    @Param('noteId') noteId: string,
    @CurrentUser() user: any,
    @Headers('x-guest-token') headerGuestToken?: string,
  ) {
    let guestId: string | null = null;
    if (headerGuestToken) {
      guestId = await this.authService.validateGuestToken(headerGuestToken);
    }

    await this.notesService.deleteNote(noteId, {
      userId: user?.id ?? null,
      guestId,
    });
  }

  @Post('notes/:noteId/sources/:sourceId')
  @HttpCode(HttpStatus.OK)
  @UseGuards(OptionalJwtAuthGuard)
  async linkSource(
    @Param('noteId') noteId: string,
    @Param('sourceId') sourceId: string,
    @CurrentUser() user: any,
    @Headers('x-guest-token') headerGuestToken?: string,
  ) {
    let guestId: string | null = null;
    if (headerGuestToken) {
      guestId = await this.authService.validateGuestToken(headerGuestToken);
    }

    await this.notesService.linkSource(noteId, sourceId, {
      userId: user?.id ?? null,
      guestId,
    });
    return { status: 'linked' };
  }

  @Delete('notes/:noteId/sources/:sourceId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseGuards(OptionalJwtAuthGuard)
  async unlinkSource(
    @Param('noteId') noteId: string,
    @Param('sourceId') sourceId: string,
    @CurrentUser() user: any,
    @Headers('x-guest-token') headerGuestToken?: string,
  ) {
    let guestId: string | null = null;
    if (headerGuestToken) {
      guestId = await this.authService.validateGuestToken(headerGuestToken);
    }

    await this.notesService.unlinkSource(noteId, sourceId, {
      userId: user?.id ?? null,
      guestId,
    });
  }
}
