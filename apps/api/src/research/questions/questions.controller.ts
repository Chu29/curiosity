import { Controller, Get } from '@nestjs/common';
import { QuestionsService } from './questions.service';

@Controller('research/questions')
export class QuestionsController {
  constructor(private readonly questionsService: QuestionsService) {}

  @Get('health')
  health(): { status: string } {
    return { status: 'ok' };
  }
}
