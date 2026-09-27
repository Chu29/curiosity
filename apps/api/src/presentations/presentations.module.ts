import { Module } from '@nestjs/common';
import { PresentationsController } from './presentations.controller';
import { PresentationsService } from './presentations.service';
import { PresentationsRepository } from './presentations.repository';

@Module({
  controllers: [PresentationsController],
  providers: [PresentationsService, PresentationsRepository],
  exports: [PresentationsService],
})
export class PresentationsModule {}
