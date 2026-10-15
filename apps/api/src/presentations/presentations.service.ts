import { Injectable } from '@nestjs/common';
import { BadRequestException, ConflictException, Inject, NotFoundException } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { Presentation, PresentationStatus, SessionStatus } from '@prisma/client';
import { SessionsService } from '../sessions/sessions.service';
import { ResourceRequester } from '../auth/guards/ownership.util';
import { STORAGE_PROVIDER, StorageProvider } from '../storage/storage-provider.interface';
import { PresentationsRepository, PresentationWithSession } from './presentations.repository';

const MAX_UPLOAD_BYTES = 100 * 1024 * 1024;
const ALLOWED_MIME_TYPES = new Set(['audio/webm', 'audio/ogg', 'audio/mp4', 'audio/mpeg']);

export interface UploadedAudioFile {
  buffer: Buffer;
  mimetype: string;
  size: number;
}

@Injectable()
export class PresentationsService {
  constructor(
    private readonly presentationsRepository: PresentationsRepository,
    private readonly sessionsService: SessionsService,
    @Inject(STORAGE_PROVIDER) private readonly storageProvider: StorageProvider,
  ) {}

  async create(sessionId: string, requester: ResourceRequester): Promise<Presentation> {
    const session = await this.sessionsService.getSession(sessionId, requester);
    if (session.status !== SessionStatus.READY_TO_PRESENT) {
      throw new ConflictException('Session must be READY_TO_PRESENT before creating a presentation');
    }
    return this.presentationsRepository.create(sessionId);
  }

  async start(id: string, requester: ResourceRequester): Promise<Presentation> {
    const presentation = await this.getOwned(id, requester);
    if (presentation.status !== PresentationStatus.CREATED) {
      throw new ConflictException('Presentation has already started or is not startable');
    }
    if (presentation.learningSession.status !== SessionStatus.READY_TO_PRESENT) {
      throw new ConflictException('Session must be READY_TO_PRESENT before starting');
    }
    await this.presentationsRepository.updateStatus(id, PresentationStatus.RECORDING);
    await this.sessionsService.transitionStatus(presentation.learningSessionId, SessionStatus.PRESENTING, requester);
    return (await this.presentationsRepository.findById(id)) as PresentationWithSession;
  }

  async upload(id: string, file: UploadedAudioFile, requester: ResourceRequester): Promise<Presentation> {
    const presentation = await this.getOwned(id, requester);
    if (presentation.status !== PresentationStatus.RECORDING) {
      throw new ConflictException('Presentation is not recording');
    }
    this.validateFile(file);
    await this.presentationsRepository.updateStatus(id, PresentationStatus.UPLOADING);
    const key = `sessions/${presentation.learningSessionId}/presentations/${id}/${randomUUID()}`;
    try {
      const result = await this.storageProvider.upload({ key, body: file.buffer, contentType: file.mimetype });
      return this.presentationsRepository.markUploaded(id, {
        ...result,
        mimeType: file.mimetype,
        sizeBytes: BigInt(file.size),
      });
    } catch {
      await this.presentationsRepository.updateStatus(id, PresentationStatus.RECORDING);
      throw new ConflictException('Recording storage failed. Please retry the upload.');
    }
  }

  async submit(id: string, requester: ResourceRequester): Promise<Presentation> {
    const presentation = await this.getOwned(id, requester);
    if (presentation.status === PresentationStatus.SUBMITTED) {
      throw new ConflictException('Presentation has already been submitted');
    }
    if (presentation.status !== PresentationStatus.RECORDING || !presentation.storageKey) {
      throw new ConflictException('An uploaded recording is required before submission');
    }
    return this.presentationsRepository.submit(id, new Date());
  }

  private async getOwned(id: string, requester: ResourceRequester): Promise<PresentationWithSession> {
    const presentation = await this.presentationsRepository.findById(id);
    if (!presentation) throw new NotFoundException(`Presentation not found: ${id}`);
    await this.sessionsService.verifySessionOwnership(presentation.learningSession, requester);
    return presentation;
  }

  private validateFile(file: UploadedAudioFile | undefined): asserts file is UploadedAudioFile {
    if (!file || !file.buffer || file.size === 0) throw new BadRequestException('An audio recording is required');
    if (!ALLOWED_MIME_TYPES.has(file.mimetype)) throw new BadRequestException('Unsupported audio type');
    if (file.size > MAX_UPLOAD_BYTES) throw new BadRequestException('Audio recording must be 100 MB or smaller');
  }
}
