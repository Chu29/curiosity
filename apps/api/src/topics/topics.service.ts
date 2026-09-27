import { Injectable, NotFoundException } from '@nestjs/common';
import { TopicsRepository, RandomTopicOptions } from './topics.repository';
import { Topic, Difficulty } from '@prisma/client';

@Injectable()
export class TopicsService {
  constructor(private readonly topicsRepository: TopicsRepository) {}

  async getRandomTopic(
    userId?: string | null,
    filters?: { difficulty?: Difficulty; subcategory?: string },
  ): Promise<Topic> {
    let excludeTopicIds: string[] = [];

    // FR-TOP-04: Exclude recently completed topics for authenticated users
    if (userId) {
      excludeTopicIds = await this.topicsRepository.findCompletedTopicIdsByUser(userId);
    }

    let topic = await this.topicsRepository.findRandomActive({
      ...filters,
      excludeTopicIds,
    });

    // Fallback if all topics in filter have been completed
    if (!topic && excludeTopicIds.length > 0) {
      topic = await this.topicsRepository.findRandomActive(filters);
    }

    if (!topic) {
      throw new NotFoundException('No active topics found matching the criteria');
    }

    return topic;
  }

  async getTopicById(id: string): Promise<Topic> {
    const topic = await this.topicsRepository.findById(id);
    if (!topic) {
      throw new NotFoundException(`Topic not found: ${id}`);
    }
    return topic;
  }

  async getAllActiveTopics(): Promise<Topic[]> {
    return this.topicsRepository.findAllActive();
  }
}
