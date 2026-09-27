import { Controller, Get } from '@nestjs/common';
import { PresentationsService } from './presentations.service';

@Controller('presentations')
export class PresentationsController {
  constructor(private readonly presentationsService: PresentationsService) {}

  @Get('health')
  health(): { status: string } {
    return { status: 'ok' };
  }
}
