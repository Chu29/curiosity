import { Controller, Get } from '@nestjs/common';
import { GuidesService } from './guides.service';

@Controller('research/guides')
export class GuidesController {
  constructor(private readonly guidesService: GuidesService) {}

  @Get('health')
  health(): { status: string } {
    return { status: 'ok' };
  }
}
