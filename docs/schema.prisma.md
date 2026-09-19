```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}


// ============================================================
// USER
// ============================================================

model User {
  id           String   @id @default(uuid()) @db.Uuid
  email        String   @unique
  name         String?
  passwordHash String?
  avatarUrl    String?

  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt
  lastLoginAt  DateTime?

  sessions     LearningSession[]

  @@index([createdAt])
}


// ============================================================
// TOPICS
// ============================================================

model Topic {
  id                       String        @id @default(uuid()) @db.Uuid
  title                    String
  slug                     String        @unique
  description              String?
  category                 TopicCategory
  subcategory              String?
  difficulty               Difficulty
  estimatedResearchMinutes Int?
  status                   TopicStatus   @default(ACTIVE)

  createdAt                DateTime      @default(now())
  updatedAt                DateTime      @updatedAt

  sessions                 LearningSession[]

  @@index([category])
  @@index([difficulty])
  @@index([status])
}


// ============================================================
// LEARNING SESSIONS
// ============================================================

model LearningSession {
  id          String        @id @default(uuid()) @db.Uuid

  // Nullable because guests can have sessions
  userId      String?       @db.Uuid
  topicId     String        @db.Uuid

  status      SessionStatus @default(CREATED)

  startedAt   DateTime      @default(now())
  completedAt DateTime?
  expiresAt   DateTime?

  createdAt   DateTime      @default(now())
  updatedAt   DateTime      @updatedAt

  user        User?         @relation(
    fields: [userId],
    references: [id],
    onDelete: SetNull
  )

  topic       Topic         @relation(
    fields: [topicId],
    references: [id],
    onDelete: Restrict
  )

  researchGuide ResearchGuide?
  notes         Note[]
  sources       Source[]
  presentations Presentation[]

  @@index([userId])
  @@index([topicId])
  @@index([status])
  @@index([expiresAt])
}


// ============================================================
// RESEARCH GUIDES
// ============================================================

model ResearchGuide {
  id                       String   @id @default(uuid()) @db.Uuid

  learningSessionId        String   @unique @db.Uuid

  objective                String
  presentationRequirements String?

  version                  Int      @default(1)

  generatedBy              String?
  modelVersion             String?
  promptVersion            String?

  createdAt                DateTime @default(now())
  updatedAt                DateTime @updatedAt

  learningSession          LearningSession @relation(
    fields: [learningSessionId],
    references: [id],
    onDelete: Cascade
  )

  questions                ResearchQuestion[]
}


// ============================================================
// RESEARCH QUESTIONS
// ============================================================

model ResearchQuestion {
  id              String         @id @default(uuid()) @db.Uuid

  researchGuideId String         @db.Uuid

  question        String
  orderIndex      Int
  required        Boolean        @default(true)
  status          QuestionStatus @default(PENDING)

  completedAt     DateTime?

  researchGuide   ResearchGuide  @relation(
    fields: [researchGuideId],
    references: [id],
    onDelete: Cascade
  )

  notes           Note[]

  @@unique([researchGuideId, orderIndex])
  @@index([researchGuideId])
}


// ============================================================
// NOTES
// ============================================================

model Note {
  id                 String  @id @default(uuid()) @db.Uuid

  learningSessionId  String  @db.Uuid
  researchQuestionId String? @db.Uuid

  content            String

  createdAt          DateTime @default(now())
  updatedAt          DateTime @updatedAt

  learningSession    LearningSession @relation(
    fields: [learningSessionId],
    references: [id],
    onDelete: Cascade
  )

  researchQuestion   ResearchQuestion? @relation(
    fields: [researchQuestionId],
    references: [id],
    onDelete: SetNull
  )

  noteSources        NoteSource[]

  @@index([learningSessionId])
  @@index([researchQuestionId])
}


// ============================================================
// SOURCES
// ============================================================

model Source {
  id                 String     @id @default(uuid()) @db.Uuid

  learningSessionId  String     @db.Uuid

  title              String
  url                String
  authorOrganization String?
  sourceType         SourceType
  description        String?

  createdAt          DateTime   @default(now())
  updatedAt          DateTime   @updatedAt

  learningSession    LearningSession @relation(
    fields: [learningSessionId],
    references: [id],
    onDelete: Cascade
  )

  noteSources        NoteSource[]

  @@index([learningSessionId])
}


// ============================================================
// NOTE ↔ SOURCE
// MANY-TO-MANY JUNCTION
// ============================================================

model NoteSource {
  noteId   String @db.Uuid
  sourceId String @db.Uuid

  note     Note   @relation(
    fields: [noteId],
    references: [id],
    onDelete: Cascade
  )

  source   Source @relation(
    fields: [sourceId],
    references: [id],
    onDelete: Cascade
  )

  @@id([noteId, sourceId])
  @@index([sourceId])
}


// ============================================================
// PRESENTATIONS
// ============================================================

model Presentation {
  id                String             @id @default(uuid()) @db.Uuid

  learningSessionId String             @db.Uuid

  status            PresentationStatus @default(CREATED)

  mediaUrl          String?
  storageKey        String?
  mimeType          String?
  sizeBytes         BigInt?
  durationSeconds   Int?

  submittedAt       DateTime?
  completedAt       DateTime?

  createdAt         DateTime           @default(now())
  updatedAt         DateTime           @updatedAt

  learningSession   LearningSession    @relation(
    fields: [learningSessionId],
    references: [id],
    onDelete: Cascade
  )

  transcript        Transcript?
  evaluations       Evaluation[]

  claims            Claim[]

  @@index([learningSessionId])
  @@index([status])
}


// ============================================================
// TRANSCRIPTS
// ============================================================

model Transcript {
  id              String   @id @default(uuid()) @db.Uuid

  presentationId  String   @unique @db.Uuid

  fullText        String
  language        String?
  provider        String?
  providerVersion String?

  createdAt       DateTime @default(now())

  presentation    Presentation @relation(
    fields: [presentationId],
    references: [id],
    onDelete: Cascade
  )

  segments        TranscriptSegment[]
}


// ============================================================
// TRANSCRIPT SEGMENTS
// ============================================================

model TranscriptSegment {
  id             String @id @default(uuid()) @db.Uuid

  transcriptId   String @db.Uuid

  sequenceNumber Int
  startMs        Int
  endMs          Int
  text           String

  transcript     Transcript @relation(
    fields: [transcriptId],
    references: [id],
    onDelete: Cascade
  )

  claims         Claim[]

  @@unique([transcriptId, sequenceNumber])
  @@index([transcriptId])
}


// ============================================================
// CLAIMS
// ============================================================

model Claim {
  id                     String                    @id @default(uuid()) @db.Uuid

  presentationId         String                    @db.Uuid
  transcriptSegmentId    String                    @db.Uuid

  text                   String
  claimType              ClaimType?

  verificationStatus     ClaimVerificationStatus?
  verificationConfidence Decimal?                  @db.Decimal(5, 4)

  createdAt              DateTime                  @default(now())

  presentation           Presentation @relation(
    fields: [presentationId],
    references: [id],
    onDelete: Cascade
  )

  transcriptSegment      TranscriptSegment @relation(
    fields: [transcriptSegmentId],
    references: [id],
    onDelete: Cascade
  )

  evidence               ClaimEvidence[]

  @@index([presentationId])
  @@index([transcriptSegmentId])
  @@index([verificationStatus])
}


// ============================================================
// EVALUATIONS
// ============================================================

model Evaluation {
  id              String           @id @default(uuid()) @db.Uuid

  presentationId  String           @db.Uuid

  status          EvaluationStatus @default(QUEUED)

  rubricVersion   String
  promptVersion   String?

  modelProvider   String?
  modelVersion    String?

  overallSummary  String?

  createdAt       DateTime         @default(now())
  completedAt     DateTime?

  presentation    Presentation @relation(
    fields: [presentationId],
    references: [id],
    onDelete: Cascade
  )

  dimensions      EvaluationDimension[]
  evidence        Evidence[]

  @@index([presentationId])
  @@index([status])
}


// ============================================================
// EVALUATION DIMENSIONS
// ============================================================

model EvaluationDimension {
  id               String                  @id @default(uuid()) @db.Uuid

  evaluationId     String                  @db.Uuid

  dimensionKey     EvaluationDimensionKey
  score            Decimal?                @db.Decimal(5, 2)
  summary          String?
  evidenceQuality  EvidenceQuality?

  evaluation       Evaluation @relation(
    fields: [evaluationId],
    references: [id],
    onDelete: Cascade
  )

  findings         EvaluationFinding[]

  @@unique([evaluationId, dimensionKey])
  @@index([evaluationId])
}


// ============================================================
// EVALUATION FINDINGS
// ============================================================

model EvaluationFinding {
  id                    String          @id @default(uuid()) @db.Uuid

  evaluationDimensionId String          @db.Uuid

  findingType           FindingType
  statement             String
  severity              FindingSeverity?

  transcriptStartMs     Int?
  transcriptEndMs       Int?

  evaluationDimension   EvaluationDimension @relation(
    fields: [evaluationDimensionId],
    references: [id],
    onDelete: Cascade
  )

  evidence              FindingEvidence[]

  @@index([evaluationDimensionId])
  @@index([findingType])
}


// ============================================================
// EVIDENCE
// ============================================================

model Evidence {
  id                String             @id @default(uuid()) @db.Uuid

  evaluationId      String             @db.Uuid

  sourceType        EvidenceSourceType
  sourceReference   String
  excerpt           String?
  confidence        Decimal?           @db.Decimal(5, 4)

  evaluation        Evaluation @relation(
    fields: [evaluationId],
    references: [id],
    onDelete: Cascade
  )

  claims            ClaimEvidence[]
  findings          FindingEvidence[]

  @@index([evaluationId])
  @@index([sourceType])
}


// ============================================================
// CLAIM ↔ EVIDENCE
// MANY-TO-MANY JUNCTION
// ============================================================

model ClaimEvidence {
  claimId    String @db.Uuid
  evidenceId String @db.Uuid

  claim      Claim    @relation(
    fields: [claimId],
    references: [id],
    onDelete: Cascade
  )

  evidence   Evidence @relation(
    fields: [evidenceId],
    references: [id],
    onDelete: Cascade
  )

  @@id([claimId, evidenceId])
  @@index([evidenceId])
}


// ============================================================
// FINDING ↔ EVIDENCE
// MANY-TO-MANY JUNCTION
// ============================================================

model FindingEvidence {
  findingId  String @db.Uuid
  evidenceId String @db.Uuid

  finding    EvaluationFinding @relation(
    fields: [findingId],
    references: [id],
    onDelete: Cascade
  )

  evidence   Evidence @relation(
    fields: [evidenceId],
    references: [id],
    onDelete: Cascade
  )

  @@id([findingId, evidenceId])
  @@index([evidenceId])
}


// ============================================================
// RAG KNOWLEDGE BASE
// ============================================================

model KnowledgeDocument {
  id            String   @id @default(uuid()) @db.Uuid

  title         String
  url           String?
  sourceType    String
  organization  String?
  publishedAt   DateTime?

  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  chunks        KnowledgeChunk[]

  @@index([sourceType])
  @@index([organization])
}


// ============================================================
// RAG KNOWLEDGE CHUNKS
// ============================================================

model KnowledgeChunk {
  id          String   @id @default(uuid()) @db.Uuid

  documentId  String   @db.Uuid

  content     String
  chunkIndex  Int
  metadata    Json?

  createdAt   DateTime @default(now())

  document    KnowledgeDocument @relation(
    fields: [documentId],
    references: [id],
    onDelete: Cascade
  )

  @@unique([documentId, chunkIndex])
  @@index([documentId])
}


// ============================================================
// ENUMS
// ============================================================

enum TopicCategory {
  SCIENCE_AND_TECHNOLOGY
}


enum Difficulty {
  BEGINNER
  INTERMEDIATE
  ADVANCED
}


enum TopicStatus {
  DRAFT
  ACTIVE
  ARCHIVED
}


enum SessionStatus {
  CREATED
  GUIDE_READY
  RESEARCHING
  READY_TO_PRESENT
  PRESENTING
  EVALUATING
  COMPLETED
  ABANDONED
}


enum QuestionStatus {
  PENDING
  COMPLETED
}


enum SourceType {
  ACADEMIC_PAPER
  BOOK
  SCIENTIFIC_ORGANIZATION
  UNIVERSITY
  TECHNICAL_DOCUMENTATION
  ARTICLE
  VIDEO
  NEWS
  OTHER
}


enum PresentationStatus {
  CREATED
  RECORDING
  UPLOADING
  SUBMITTED
  PROCESSING
  COMPLETED
  FAILED
}


enum ClaimType {
  FACTUAL
  CONCEPTUAL
  CAUSAL
  COMPARATIVE
  QUANTITATIVE
  INTERPRETIVE
}


enum ClaimVerificationStatus {
  SUPPORTED
  PARTIALLY_SUPPORTED
  CONTRADICTED
  UNVERIFIABLE
}


enum EvaluationStatus {
  QUEUED
  PROCESSING
  COMPLETED
  FAILED
}


enum EvaluationDimensionKey {
  ACCURACY
  UNDERSTANDING
  COVERAGE
  REASONING
  STRUCTURE
  COMMUNICATION
  EVIDENCE_USE
}


enum EvidenceQuality {
  WEAK
  MODERATE
  STRONG
}


enum FindingType {
  STRENGTH
  CORRECTION
  MISSED_CONCEPT
  SHALLOW_EXPLANATION
  REASONING_GAP
  EVIDENCE_GAP
}


enum FindingSeverity {
  LOW
  MEDIUM
  HIGH
}


enum EvidenceSourceType {
  USER_RESEARCH
  TRUSTED_REFERENCE
}
```
