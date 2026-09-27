import { Controller, Get } from '@nestjs/common';
import { FindingsService } from './findings.service';

@Controller('evaluation/findings')
export class FindingsController {
  constructor(private readonly findingsService: FindingsService) {}

  @Get('health')
  health(): { status: string } {
    return { status: 'ok' };
  }
}
