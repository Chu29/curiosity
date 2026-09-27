import { Controller, Get } from '@nestjs/common';
import { EvidenceService } from './evidence.service';

@Controller('evaluation/evidence')
export class EvidenceController {
  constructor(private readonly evidenceService: EvidenceService) {}

  @Get('health')
  health(): { status: string } {
    return { status: 'ok' };
  }
}
