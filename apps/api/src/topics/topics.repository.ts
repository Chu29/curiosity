import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Topic, TopicStatus, Difficulty, SessionStatus } from '@prisma/client';

export interface RandomTopicOptions {
  excludeTopicIds?: string[];
  difficulty?: Difficulty;
  subcategory?: string;
}

@Injectable()
export class TopicsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findCompletedTopicIdsByUser(userId: string): Promise<string[]> {
    const sessions = await this.prisma.learningSession.findMany({
      where: {
        userId,
        status: SessionStatus.COMPLETED,
      },
      select: { topicId: true },
    });
    return sessions.map((s) => s.topicId);
  }

  async findRandomActive(options?: RandomTopicOptions): Promise<Topic | null> {
    const whereClause: any = {
      status: TopicStatus.ACTIVE,
    };

    if (options?.difficulty) {
      whereClause.difficulty = options.difficulty;
    }

    if (options?.subcategory) {
      whereClause.subcategory = { contains: options.subcategory, mode: 'insensitive' };
    }

    if (options?.excludeTopicIds && options.excludeTopicIds.length > 0) {
      whereClause.id = { notIn: options.excludeTopicIds };
    }

    const count = await this.prisma.topic.count({ where: whereClause });
    if (count === 0) {
      return null;
    }

    const skip = Math.floor(Math.random() * count);
    const topics = await this.prisma.topic.findMany({
      where: whereClause,
      skip,
      take: 1,
    });

    return topics[0] ?? null;
  }

  async findById(id: string): Promise<Topic | null> {
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
    if (isUuid) {
      return this.prisma.topic.findUnique({ where: { id } });
    }
    return this.prisma.topic.findUnique({ where: { slug: id } });
  }

  async findBySlug(slug: string): Promise<Topic | null> {
    return this.prisma.topic.findUnique({ where: { slug } });
  }

  async findAllActive(): Promise<Topic[]> {
    return this.prisma.topic.findMany({
      where: { status: TopicStatus.ACTIVE },
      orderBy: { createdAt: 'desc' },
    });
  }
}
