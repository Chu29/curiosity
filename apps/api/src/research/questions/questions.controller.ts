import {
  Controller,
  Post,
  Get,
  Param,
  UseGuards,
  Headers,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { QuestionsService } from './questions.service';
import { AuthService } from '../../auth/auth.service';
import { OptionalJwtAuthGuard } from '../../auth/guards/optional-jwt-auth.guard';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';

@Controller()
export class QuestionsController {
  constructor(
    private readonly questionsService: QuestionsService,
    private readonly authService: AuthService,
  ) {}

  @Get('research/questions/health')
  health(): { status: string } {
    return { status: 'ok' };
  }

  @Post('research-questions/:questionId/complete')
  @HttpCode(HttpStatus.OK)
  @UseGuards(OptionalJwtAuthGuard)
  async completeQuestion(
    @Param('questionId') questionId: string,
    @CurrentUser() user: any,
    @Headers('x-guest-token') headerGuestToken?: string,
  ) {
    let guestId: string | null = null;
    if (headerGuestToken) {
      guestId = await this.authService.validateGuestToken(headerGuestToken);
    }

    return this.questionsService.markComplete(questionId, {
      userId: user?.id ?? null,
      guestId,
    });
  }

  @Post('research-questions/:questionId/incomplete')
  @HttpCode(HttpStatus.OK)
  @UseGuards(OptionalJwtAuthGuard)
  async incompleteQuestion(
    @Param('questionId') questionId: string,
    @CurrentUser() user: any,
    @Headers('x-guest-token') headerGuestToken?: string,
  ) {
    let guestId: string | null = null;
    if (headerGuestToken) {
      guestId = await this.authService.validateGuestToken(headerGuestToken);
    }

    return this.questionsService.markIncomplete(questionId, {
      userId: user?.id ?? null,
      guestId,
    });
  }
}
