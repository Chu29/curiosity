import { Module } from '@nestjs/common';
import { FindingsController } from './findings.controller';
import { FindingsService } from './findings.service';
import { FindingsRepository } from './findings.repository';

@Module({
  controllers: [FindingsController],
  providers: [FindingsService, FindingsRepository],
  exports: [FindingsService],
})
export class FindingsModule {}
