import { Module } from '@nestjs/common';
import { SourcesController } from './sources.controller';
import { SourcesService } from './sources.service';
import { SourcesRepository } from './sources.repository';
import { SessionsModule } from '../../sessions/sessions.module';
import { AuthModule } from '../../auth/auth.module';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
  imports: [PrismaModule, SessionsModule, AuthModule],
  controllers: [SourcesController],
  providers: [SourcesService, SourcesRepository],
  exports: [SourcesService, SourcesRepository],
})
export class SourcesModule {}
