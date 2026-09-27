import { Controller, Get } from '@nestjs/common';
import { SourcesService } from './sources.service';

@Controller('research/sources')
export class SourcesController {
  constructor(private readonly sourcesService: SourcesService) {}

  @Get('health')
  health(): { status: string } {
    return { status: 'ok' };
  }
}
