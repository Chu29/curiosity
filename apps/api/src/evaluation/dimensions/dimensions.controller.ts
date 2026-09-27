import { Controller, Get } from '@nestjs/common';
import { DimensionsService } from './dimensions.service';

@Controller('evaluation/dimensions')
export class DimensionsController {
  constructor(private readonly dimensionsService: DimensionsService) {}

  @Get('health')
  health(): { status: string } {
    return { status: 'ok' };
  }
}
