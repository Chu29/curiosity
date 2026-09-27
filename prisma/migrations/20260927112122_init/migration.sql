-- CreateEnum
CREATE TYPE "TopicCategory" AS ENUM ('SCIENCE_AND_TECHNOLOGY');

-- CreateEnum
CREATE TYPE "Difficulty" AS ENUM ('BEGINNER', 'INTERMEDIATE', 'ADVANCED');

-- CreateEnum
CREATE TYPE "TopicStatus" AS ENUM ('DRAFT', 'ACTIVE', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "SessionStatus" AS ENUM ('CREATED', 'GUIDE_READY', 'RESEARCHING', 'READY_TO_PRESENT', 'PRESENTING', 'EVALUATING', 'COMPLETED', 'ABANDONED');

-- CreateEnum
CREATE TYPE "QuestionStatus" AS ENUM ('PENDING', 'COMPLETED');

-- CreateEnum
CREATE TYPE "SourceType" AS ENUM ('ACADEMIC_PAPER', 'BOOK', 'SCIENTIFIC_ORGANIZATION', 'UNIVERSITY', 'TECHNICAL_DOCUMENTATION', 'ARTICLE', 'VIDEO', 'NEWS', 'OTHER');

-- CreateEnum
CREATE TYPE "PresentationStatus" AS ENUM ('CREATED', 'RECORDING', 'UPLOADING', 'SUBMITTED', 'PROCESSING', 'COMPLETED', 'FAILED');

-- CreateEnum
CREATE TYPE "ClaimType" AS ENUM ('FACTUAL', 'CONCEPTUAL', 'CAUSAL', 'COMPARATIVE', 'QUANTITATIVE', 'INTERPRETIVE');

-- CreateEnum
CREATE TYPE "ClaimVerificationStatus" AS ENUM ('SUPPORTED', 'PARTIALLY_SUPPORTED', 'CONTRADICTED', 'UNVERIFIABLE');

-- CreateEnum
CREATE TYPE "EvaluationStatus" AS ENUM ('QUEUED', 'PROCESSING', 'COMPLETED', 'FAILED');

-- CreateEnum
CREATE TYPE "EvaluationDimensionKey" AS ENUM ('ACCURACY', 'UNDERSTANDING', 'COVERAGE', 'REASONING', 'STRUCTURE', 'COMMUNICATION', 'EVIDENCE_USE');

-- CreateEnum
CREATE TYPE "EvidenceQuality" AS ENUM ('WEAK', 'MODERATE', 'STRONG');

-- CreateEnum
CREATE TYPE "FindingType" AS ENUM ('STRENGTH', 'CORRECTION', 'MISSED_CONCEPT', 'SHALLOW_EXPLANATION', 'REASONING_GAP', 'EVIDENCE_GAP');

-- CreateEnum
CREATE TYPE "FindingSeverity" AS ENUM ('LOW', 'MEDIUM', 'HIGH');

-- CreateEnum
CREATE TYPE "EvidenceSourceType" AS ENUM ('USER_RESEARCH', 'TRUSTED_REFERENCE');

-- CreateTable
CREATE TABLE "User" (
    "id" UUID NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "passwordHash" TEXT,
    "avatarUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "lastLoginAt" TIMESTAMP(3),

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Topic" (
    "id" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "category" "TopicCategory" NOT NULL,
    "subcategory" TEXT,
    "difficulty" "Difficulty" NOT NULL,
    "estimatedResearchMinutes" INTEGER,
    "status" "TopicStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Topic_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LearningSession" (
    "id" UUID NOT NULL,
    "userId" UUID,
    "topicId" UUID NOT NULL,
    "status" "SessionStatus" NOT NULL DEFAULT 'CREATED',
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LearningSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ResearchGuide" (
    "id" UUID NOT NULL,
    "learningSessionId" UUID NOT NULL,
    "objective" TEXT NOT NULL,
    "presentationRequirements" TEXT,
    "version" INTEGER NOT NULL DEFAULT 1,
    "generatedBy" TEXT,
    "modelVersion" TEXT,
    "promptVersion" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ResearchGuide_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ResearchQuestion" (
    "id" UUID NOT NULL,
    "researchGuideId" UUID NOT NULL,
    "question" TEXT NOT NULL,
    "orderIndex" INTEGER NOT NULL,
    "required" BOOLEAN NOT NULL DEFAULT true,
    "status" "QuestionStatus" NOT NULL DEFAULT 'PENDING',
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "ResearchQuestion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Note" (
    "id" UUID NOT NULL,
    "learningSessionId" UUID NOT NULL,
    "researchQuestionId" UUID,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Note_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Source" (
    "id" UUID NOT NULL,
    "learningSessionId" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "authorOrganization" TEXT,
    "sourceType" "SourceType" NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Source_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NoteSource" (
    "noteId" UUID NOT NULL,
    "sourceId" UUID NOT NULL,

    CONSTRAINT "NoteSource_pkey" PRIMARY KEY ("noteId","sourceId")
);

-- CreateTable
CREATE TABLE "Presentation" (
    "id" UUID NOT NULL,
    "learningSessionId" UUID NOT NULL,
    "status" "PresentationStatus" NOT NULL DEFAULT 'CREATED',
    "mediaUrl" TEXT,
    "storageKey" TEXT,
    "mimeType" TEXT,
    "sizeBytes" BIGINT,
    "durationSeconds" INTEGER,
    "submittedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Presentation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Transcript" (
    "id" UUID NOT NULL,
    "presentationId" UUID NOT NULL,
    "fullText" TEXT NOT NULL,
    "language" TEXT,
    "provider" TEXT,
    "providerVersion" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Transcript_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TranscriptSegment" (
    "id" UUID NOT NULL,
    "transcriptId" UUID NOT NULL,
    "sequenceNumber" INTEGER NOT NULL,
    "startMs" INTEGER NOT NULL,
    "endMs" INTEGER NOT NULL,
    "text" TEXT NOT NULL,

    CONSTRAINT "TranscriptSegment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Claim" (
    "id" UUID NOT NULL,
    "presentationId" UUID NOT NULL,
    "transcriptSegmentId" UUID NOT NULL,
    "text" TEXT NOT NULL,
    "claimType" "ClaimType",
    "verificationStatus" "ClaimVerificationStatus",
    "verificationConfidence" DECIMAL(5,4),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Claim_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Evaluation" (
    "id" UUID NOT NULL,
    "presentationId" UUID NOT NULL,
    "status" "EvaluationStatus" NOT NULL DEFAULT 'QUEUED',
    "rubricVersion" TEXT NOT NULL,
    "promptVersion" TEXT,
    "modelProvider" TEXT,
    "modelVersion" TEXT,
    "overallSummary" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "Evaluation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EvaluationDimension" (
    "id" UUID NOT NULL,
    "evaluationId" UUID NOT NULL,
    "dimensionKey" "EvaluationDimensionKey" NOT NULL,
    "score" DECIMAL(5,2),
    "summary" TEXT,
    "evidenceQuality" "EvidenceQuality",

    CONSTRAINT "EvaluationDimension_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EvaluationFinding" (
    "id" UUID NOT NULL,
    "evaluationDimensionId" UUID NOT NULL,
    "findingType" "FindingType" NOT NULL,
    "statement" TEXT NOT NULL,
    "severity" "FindingSeverity",
    "transcriptStartMs" INTEGER,
    "transcriptEndMs" INTEGER,

    CONSTRAINT "EvaluationFinding_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Evidence" (
    "id" UUID NOT NULL,
    "evaluationId" UUID NOT NULL,
    "sourceType" "EvidenceSourceType" NOT NULL,
    "sourceReference" TEXT NOT NULL,
    "excerpt" TEXT,
    "confidence" DECIMAL(5,4),

    CONSTRAINT "Evidence_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ClaimEvidence" (
    "claimId" UUID NOT NULL,
    "evidenceId" UUID NOT NULL,

    CONSTRAINT "ClaimEvidence_pkey" PRIMARY KEY ("claimId","evidenceId")
);

-- CreateTable
CREATE TABLE "FindingEvidence" (
    "findingId" UUID NOT NULL,
    "evidenceId" UUID NOT NULL,

    CONSTRAINT "FindingEvidence_pkey" PRIMARY KEY ("findingId","evidenceId")
);

-- CreateTable
CREATE TABLE "KnowledgeDocument" (
    "id" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "url" TEXT,
    "sourceType" TEXT NOT NULL,
    "organization" TEXT,
    "publishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "KnowledgeDocument_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "KnowledgeChunk" (
    "id" UUID NOT NULL,
    "documentId" UUID NOT NULL,
    "content" TEXT NOT NULL,
    "chunkIndex" INTEGER NOT NULL,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "KnowledgeChunk_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_createdAt_idx" ON "User"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "Topic_slug_key" ON "Topic"("slug");

-- CreateIndex
CREATE INDEX "Topic_category_idx" ON "Topic"("category");

-- CreateIndex
CREATE INDEX "Topic_difficulty_idx" ON "Topic"("difficulty");

-- CreateIndex
CREATE INDEX "Topic_status_idx" ON "Topic"("status");

-- CreateIndex
CREATE INDEX "LearningSession_userId_idx" ON "LearningSession"("userId");

-- CreateIndex
CREATE INDEX "LearningSession_topicId_idx" ON "LearningSession"("topicId");

-- CreateIndex
CREATE INDEX "LearningSession_status_idx" ON "LearningSession"("status");

-- CreateIndex
CREATE INDEX "LearningSession_expiresAt_idx" ON "LearningSession"("expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "ResearchGuide_learningSessionId_key" ON "ResearchGuide"("learningSessionId");

-- CreateIndex
CREATE INDEX "ResearchQuestion_researchGuideId_idx" ON "ResearchQuestion"("researchGuideId");

-- CreateIndex
CREATE UNIQUE INDEX "ResearchQuestion_researchGuideId_orderIndex_key" ON "ResearchQuestion"("researchGuideId", "orderIndex");

-- CreateIndex
CREATE INDEX "Note_learningSessionId_idx" ON "Note"("learningSessionId");

-- CreateIndex
CREATE INDEX "Note_researchQuestionId_idx" ON "Note"("researchQuestionId");

-- CreateIndex
CREATE INDEX "Source_learningSessionId_idx" ON "Source"("learningSessionId");

-- CreateIndex
CREATE INDEX "NoteSource_sourceId_idx" ON "NoteSource"("sourceId");

-- CreateIndex
CREATE INDEX "Presentation_learningSessionId_idx" ON "Presentation"("learningSessionId");

-- CreateIndex
CREATE INDEX "Presentation_status_idx" ON "Presentation"("status");

-- CreateIndex
CREATE UNIQUE INDEX "Transcript_presentationId_key" ON "Transcript"("presentationId");

-- CreateIndex
CREATE INDEX "TranscriptSegment_transcriptId_idx" ON "TranscriptSegment"("transcriptId");

-- CreateIndex
CREATE UNIQUE INDEX "TranscriptSegment_transcriptId_sequenceNumber_key" ON "TranscriptSegment"("transcriptId", "sequenceNumber");

-- CreateIndex
CREATE INDEX "Claim_presentationId_idx" ON "Claim"("presentationId");

-- CreateIndex
CREATE INDEX "Claim_transcriptSegmentId_idx" ON "Claim"("transcriptSegmentId");

-- CreateIndex
CREATE INDEX "Claim_verificationStatus_idx" ON "Claim"("verificationStatus");

-- CreateIndex
CREATE INDEX "Evaluation_presentationId_idx" ON "Evaluation"("presentationId");

-- CreateIndex
CREATE INDEX "Evaluation_status_idx" ON "Evaluation"("status");

-- CreateIndex
CREATE INDEX "EvaluationDimension_evaluationId_idx" ON "EvaluationDimension"("evaluationId");

-- CreateIndex
CREATE UNIQUE INDEX "EvaluationDimension_evaluationId_dimensionKey_key" ON "EvaluationDimension"("evaluationId", "dimensionKey");

-- CreateIndex
CREATE INDEX "EvaluationFinding_evaluationDimensionId_idx" ON "EvaluationFinding"("evaluationDimensionId");

-- CreateIndex
CREATE INDEX "EvaluationFinding_findingType_idx" ON "EvaluationFinding"("findingType");

-- CreateIndex
CREATE INDEX "Evidence_evaluationId_idx" ON "Evidence"("evaluationId");

-- CreateIndex
CREATE INDEX "Evidence_sourceType_idx" ON "Evidence"("sourceType");

-- CreateIndex
CREATE INDEX "ClaimEvidence_evidenceId_idx" ON "ClaimEvidence"("evidenceId");

-- CreateIndex
CREATE INDEX "FindingEvidence_evidenceId_idx" ON "FindingEvidence"("evidenceId");

-- CreateIndex
CREATE INDEX "KnowledgeDocument_sourceType_idx" ON "KnowledgeDocument"("sourceType");

-- CreateIndex
CREATE INDEX "KnowledgeDocument_organization_idx" ON "KnowledgeDocument"("organization");

-- CreateIndex
CREATE INDEX "KnowledgeChunk_documentId_idx" ON "KnowledgeChunk"("documentId");

-- CreateIndex
CREATE UNIQUE INDEX "KnowledgeChunk_documentId_chunkIndex_key" ON "KnowledgeChunk"("documentId", "chunkIndex");

-- AddForeignKey
ALTER TABLE "LearningSession" ADD CONSTRAINT "LearningSession_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LearningSession" ADD CONSTRAINT "LearningSession_topicId_fkey" FOREIGN KEY ("topicId") REFERENCES "Topic"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ResearchGuide" ADD CONSTRAINT "ResearchGuide_learningSessionId_fkey" FOREIGN KEY ("learningSessionId") REFERENCES "LearningSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ResearchQuestion" ADD CONSTRAINT "ResearchQuestion_researchGuideId_fkey" FOREIGN KEY ("researchGuideId") REFERENCES "ResearchGuide"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Note" ADD CONSTRAINT "Note_learningSessionId_fkey" FOREIGN KEY ("learningSessionId") REFERENCES "LearningSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Note" ADD CONSTRAINT "Note_researchQuestionId_fkey" FOREIGN KEY ("researchQuestionId") REFERENCES "ResearchQuestion"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Source" ADD CONSTRAINT "Source_learningSessionId_fkey" FOREIGN KEY ("learningSessionId") REFERENCES "LearningSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NoteSource" ADD CONSTRAINT "NoteSource_noteId_fkey" FOREIGN KEY ("noteId") REFERENCES "Note"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NoteSource" ADD CONSTRAINT "NoteSource_sourceId_fkey" FOREIGN KEY ("sourceId") REFERENCES "Source"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Presentation" ADD CONSTRAINT "Presentation_learningSessionId_fkey" FOREIGN KEY ("learningSessionId") REFERENCES "LearningSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transcript" ADD CONSTRAINT "Transcript_presentationId_fkey" FOREIGN KEY ("presentationId") REFERENCES "Presentation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TranscriptSegment" ADD CONSTRAINT "TranscriptSegment_transcriptId_fkey" FOREIGN KEY ("transcriptId") REFERENCES "Transcript"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Claim" ADD CONSTRAINT "Claim_presentationId_fkey" FOREIGN KEY ("presentationId") REFERENCES "Presentation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Claim" ADD CONSTRAINT "Claim_transcriptSegmentId_fkey" FOREIGN KEY ("transcriptSegmentId") REFERENCES "TranscriptSegment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Evaluation" ADD CONSTRAINT "Evaluation_presentationId_fkey" FOREIGN KEY ("presentationId") REFERENCES "Presentation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EvaluationDimension" ADD CONSTRAINT "EvaluationDimension_evaluationId_fkey" FOREIGN KEY ("evaluationId") REFERENCES "Evaluation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EvaluationFinding" ADD CONSTRAINT "EvaluationFinding_evaluationDimensionId_fkey" FOREIGN KEY ("evaluationDimensionId") REFERENCES "EvaluationDimension"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Evidence" ADD CONSTRAINT "Evidence_evaluationId_fkey" FOREIGN KEY ("evaluationId") REFERENCES "Evaluation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClaimEvidence" ADD CONSTRAINT "ClaimEvidence_claimId_fkey" FOREIGN KEY ("claimId") REFERENCES "Claim"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClaimEvidence" ADD CONSTRAINT "ClaimEvidence_evidenceId_fkey" FOREIGN KEY ("evidenceId") REFERENCES "Evidence"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FindingEvidence" ADD CONSTRAINT "FindingEvidence_findingId_fkey" FOREIGN KEY ("findingId") REFERENCES "EvaluationFinding"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FindingEvidence" ADD CONSTRAINT "FindingEvidence_evidenceId_fkey" FOREIGN KEY ("evidenceId") REFERENCES "Evidence"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KnowledgeChunk" ADD CONSTRAINT "KnowledgeChunk_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "KnowledgeDocument"("id") ON DELETE CASCADE ON UPDATE CASCADE;
