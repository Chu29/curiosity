import { Module } from '@nestjs/common';
import { DimensionsController } from './dimensions.controller';
import { DimensionsService } from './dimensions.service';
import { DimensionsRepository } from './dimensions.repository';

@Module({
  controllers: [DimensionsController],
  providers: [DimensionsService, DimensionsRepository],
  exports: [DimensionsService],
})
export class DimensionsModule {}
