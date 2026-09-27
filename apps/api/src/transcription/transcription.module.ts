import { Module } from '@nestjs/common';
import { TranscriptionController } from './transcription.controller';
import { TranscriptionService } from './transcription.service';
import { TranscriptionRepository } from './transcription.repository';

@Module({
  controllers: [TranscriptionController],
  providers: [TranscriptionService, TranscriptionRepository],
  exports: [TranscriptionService],
})
export class TranscriptionModule {}
