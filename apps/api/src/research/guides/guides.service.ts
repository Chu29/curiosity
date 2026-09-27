import {
  Injectable,
  Inject,
  NotFoundException,
  BadRequestException,
  BadGatewayException,
  Logger,
} from '@nestjs/common';
import { SessionStatus } from '@prisma/client';
import { GuidesRepository, ResearchGuideWithQuestions } from './guides.repository';
import { SessionsService } from '../../sessions/sessions.service';
import { LLM_PROVIDER, LLMProvider } from '../../ai/llm-provider.interface';
import { ResourceRequester } from '../../auth/guards/ownership.util';
import {
  ResearchGuideDraftSchema,
  ParsedRequirementsSchema,
  ParsedRequirements,
} from '@curiosity/validation';

export interface FormattedResearchGuide extends ResearchGuideWithQuestions {
  parsedRequirements?: ParsedRequirements;
}

@Injectable()
export class GuidesService {
  private readonly logger = new Logger(GuidesService.name);

  constructor(
    private readonly guidesRepository: GuidesRepository,
    private readonly sessionsService: SessionsService,
    @Inject(LLM_PROVIDER) private readonly llmProvider: LLMProvider,
  ) {}

  async generateGuideForSession(
    sessionId: string,
    requester: ResourceRequester,
  ): Promise<FormattedResearchGuide> {
    const session = await this.sessionsService.getSession(sessionId, requester);

    // If guide already exists, return existing (idempotent)
    const existingGuide = await this.guidesRepository.findBySessionId(sessionId);
    if (existingGuide) {
      return this.formatGuide(existingGuide);
    }

    if (
      session.status === SessionStatus.ABANDONED ||
      session.status === SessionStatus.COMPLETED
    ) {
      throw new BadRequestException('Cannot generate research guide for a terminated session');
    }

    this.logger.log(`Requesting LLM research guide for session: ${sessionId}, topic: ${session.topic.title}`);
    const rawDraft = await this.llmProvider.generateResearchGuide(session.topic);

    // Step 1: Zod schema validation (rules-and-boundaries.md §5.1)
    const schemaResult = ResearchGuideDraftSchema.safeParse(rawDraft);
    if (!schemaResult.success) {
      this.logger.error(`LLM output failed schema validation: ${JSON.stringify(schemaResult.error.errors)}`);
      throw new BadGatewayException('LLM returned a malformed research guide schema');
    }

    const validatedDraft = schemaResult.data;

    // Step 2: Domain validation (business rules: FR-GUIDE-01..06)
    if (!validatedDraft.questions || validatedDraft.questions.length < 3) {
      throw new BadGatewayException('Research guide must contain at least 3 structured questions');
    }

    // Step 3: Persist guide and questions
    const createdGuide = await this.guidesRepository.createGuide({
      learningSessionId: sessionId,
      objective: validatedDraft.objective,
      presentationRequirements: validatedDraft.presentationRequirements,
      version: 1,
      generatedBy: this.llmProvider.providerName,
      modelVersion: this.llmProvider.modelVersion,
      promptVersion: this.llmProvider.promptVersion,
      questions: validatedDraft.questions.map((q, idx) => ({
        question: q.question,
        orderIndex: idx,
        required: q.required,
      })),
    });

    // Step 4: Advance session lifecycle if currently in CREATED
    if (session.status === SessionStatus.CREATED) {
      await this.sessionsService.transitionStatus(
        sessionId,
        SessionStatus.GUIDE_READY,
        requester,
      );
    }

    return this.formatGuide(createdGuide);
  }

  async getGuideBySessionId(
    sessionId: string,
    requester: ResourceRequester,
  ): Promise<FormattedResearchGuide> {
    // Assert ownership
    await this.sessionsService.getSession(sessionId, requester);

    const guide = await this.guidesRepository.findBySessionId(sessionId);
    if (!guide) {
      throw new NotFoundException(`Research guide not found for session ${sessionId}`);
    }

    return this.formatGuide(guide);
  }

  private formatGuide(guide: ResearchGuideWithQuestions): FormattedResearchGuide {
    let parsed: ParsedRequirements | undefined;

    if (guide.presentationRequirements) {
      try {
        const json = JSON.parse(guide.presentationRequirements);
        const parseCheck = ParsedRequirementsSchema.safeParse(json);
        if (parseCheck.success) {
          parsed = parseCheck.data;
        }
      } catch {
        // Plain text presentation requirements
      }
    }

    return {
      ...guide,
      parsedRequirements: parsed,
    };
  }
}
