import { Module } from '@nestjs/common';
import { LoggerModule } from 'nestjs-pino';
import { randomUUID } from 'crypto';
import { HealthController } from './common/health.controller';
import { RedisModule } from './common/redis.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { TopicsModule } from './topics/topics.module';
import { SessionsModule } from './sessions/sessions.module';
import { GuidesModule } from './research/guides/guides.module';
import { QuestionsModule } from './research/questions/questions.module';
import { NotesModule } from './research/notes/notes.module';
import { SourcesModule } from './research/sources/sources.module';
import { PresentationsModule } from './presentations/presentations.module';
import { TranscriptionModule } from './transcription/transcription.module';
import { ClaimsModule } from './evaluation/claims/claims.module';
import { EvidenceModule } from './evaluation/evidence/evidence.module';
import { FindingsModule } from './evaluation/findings/findings.module';
import { DimensionsModule } from './evaluation/dimensions/dimensions.module';
import { PipelineModule } from './evaluation/pipeline/pipeline.module';
import { KnowledgeModule } from './knowledge/knowledge.module';
import { AiModule } from './ai/ai.module';
import { JobsModule } from './jobs/jobs.module';
import { PrismaModule } from './prisma/prisma.module';

@Module({
  imports: [
    LoggerModule.forRoot({
      pinoHttp: {
        genReqId: (req, res) => {
          const existing = req.headers['x-request-id'] || req.headers['x-correlation-id'];
          const id = (Array.isArray(existing) ? existing[0] : existing) || randomUUID();
          res.setHeader('X-Request-Id', id);
          return id;
        },
        customProps: (req) => ({
          requestId: (req as any).id,
        }),
        transport:
          process.env['NODE_ENV'] !== 'production'
            ? {
                target: 'pino-pretty',
                options: {
                  colorize: true,
                  singleLine: true,
                  translateTime: 'SYS:standard',
                  messageFormat: '[req:{req.id}] {msg}',
                },
              }
            : undefined,
      },
    }),
    RedisModule,
    PrismaModule,
    AuthModule,
    UsersModule,
    TopicsModule,
    SessionsModule,
    GuidesModule,
    QuestionsModule,
    NotesModule,
    SourcesModule,
    PresentationsModule,
    TranscriptionModule,
    ClaimsModule,
    EvidenceModule,
    FindingsModule,
    DimensionsModule,
    PipelineModule,
    KnowledgeModule,
    AiModule,
    JobsModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
