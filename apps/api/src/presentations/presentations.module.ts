import { Module } from '@nestjs/common';
import { PresentationsController } from './presentations.controller';
import { PresentationsService } from './presentations.service';
import { PresentationsRepository } from './presentations.repository';
import { SessionsModule } from '../sessions/sessions.module';
import { AuthModule } from '../auth/auth.module';
import { StorageModule } from '../storage/storage.module';

@Module({
  imports: [SessionsModule, AuthModule, StorageModule],
  controllers: [PresentationsController],
  providers: [PresentationsService, PresentationsRepository],
  exports: [PresentationsService],
})
export class PresentationsModule {}
