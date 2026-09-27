import { Module } from '@nestjs/common';
import { NotesController } from './notes.controller';
import { NotesService } from './notes.service';
import { NotesRepository } from './notes.repository';
import { SessionsModule } from '../../sessions/sessions.module';
import { AuthModule } from '../../auth/auth.module';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
  imports: [PrismaModule, SessionsModule, AuthModule],
  controllers: [NotesController],
  providers: [NotesService, NotesRepository],
  exports: [NotesService, NotesRepository],
})
export class NotesModule {}
