import { Module } from '@nestjs/common';
import { GuidesController } from './guides.controller';
import { GuidesService } from './guides.service';
import { GuidesRepository } from './guides.repository';
import { SessionsModule } from '../../sessions/sessions.module';
import { AuthModule } from '../../auth/auth.module';
import { AiModule } from '../../ai/ai.module';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
  imports: [PrismaModule, SessionsModule, AuthModule, AiModule],
  controllers: [GuidesController],
  providers: [GuidesService, GuidesRepository],
  exports: [GuidesService, GuidesRepository],
})
export class GuidesModule {}
