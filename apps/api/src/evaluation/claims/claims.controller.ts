import { Controller, Get } from '@nestjs/common';
import { ClaimsService } from './claims.service';

@Controller('evaluation/claims')
export class ClaimsController {
  constructor(private readonly claimsService: ClaimsService) {}

  @Get('health')
  health(): { status: string } {
    return { status: 'ok' };
  }
}
