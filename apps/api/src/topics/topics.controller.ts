import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { TopicsService } from './topics.service';
import { Difficulty } from '@prisma/client';
import { OptionalJwtAuthGuard } from '../auth/guards/optional-jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Controller('topics')
export class TopicsController {
  constructor(private readonly topicsService: TopicsService) {}

  @Get('random')
  @UseGuards(OptionalJwtAuthGuard)
  async getRandomTopic(
    @CurrentUser() user: any,
    @Query('difficulty') difficulty?: Difficulty,
    @Query('subcategory') subcategory?: string,
  ) {
    return this.topicsService.getRandomTopic(user?.id, { difficulty, subcategory });
  }

  @Get(':topicId')
  async getTopicById(@Param('topicId') topicId: string) {
    return this.topicsService.getTopicById(topicId);
  }

  @Get()
  async getAllTopics() {
    return this.topicsService.getAllActiveTopics();
  }
}
