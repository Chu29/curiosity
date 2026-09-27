import { Controller, Get } from '@nestjs/common';
import { NotesService } from './notes.service';

@Controller('research/notes')
export class NotesController {
  constructor(private readonly notesService: NotesService) {}

  @Get('health')
  health(): { status: string } {
    return { status: 'ok' };
  }
}
