# Technical Architecture Document (TAD)
## Science & Technology Research & Presentation Platform

**Status:** Baseline architecture — build on this, do not redesign from scratch.
**Companion docs:** `science_technology_learning_platform_srs.docx` (SRS v1.0), `schema.prisma` (domain model, as supplied)

> This revision has been checked directly against the supplied SRS and Prisma
> schema. Section 6.1 lists the two open gaps found between them (no
> `pgvector`/embedding column yet, no `FollowUpResponse` model) — resolve
> those before starting Phase 7/8 implementation.

---

## 1. Purpose of This Document

This document describes *how* the platform is built: the technology stack, the
repository/folder layout, exact dependency versions to pin at implementation
time, and the end-to-end flow of data through the system for the core
learning loop.

It does not restate product requirements (see the SRS) or the full domain
model (see the Prisma schema) — it focuses on structure and flow.

---

## 2. Architectural Style

```text
Monorepo
   ├── apps/web   (Next.js — presentation layer)
   ├── apps/api   (NestJS — application layer)
   └── packages/* (shared types, validation, config)
```

- **Layered backend**: Controller → Application Service → Domain Logic → Repository → Prisma → PostgreSQL
- **Domain-module organization**, not a single monolithic service
- **Asynchronous processing** for anything AI/media related (transcription, claim extraction, evidence retrieval, evaluation)
- **Provider abstraction** for every external AI capability (LLM, embeddings, transcription), so vendors can be swapped without touching domain code
- **Evidence-first evaluation**: no direct "LLM grades the presentation" call — evaluation is a multi-stage, inspectable pipeline

---

## 3. Technology Stack

Pin exact patch versions in `package.json` and the lockfile at implementation
start. Treat the versions below as the researched baseline to verify against
current registries before pinning — do not silently drift to new majors
mid-MVP.

### 3.1 Backend

| Library | Suggested version | Notes |
|---|---|---|
| Node.js | 22.x LTS | Runtime |
| NestJS (`@nestjs/core`, `@nestjs/common`) | 10.x | Application framework |
| TypeScript | 5.6.x | Language |
| Prisma (`prisma`, `@prisma/client`) | 5.20.x | ORM + migrations |
| PostgreSQL | 16.x | Primary datastore |
| `pgvector` (Postgres extension) | 0.7.x | Vector search for RAG |
| Redis | 7.x | Queue backing store |
| BullMQ | 5.x | Background job processing |
| `@nestjs/passport`, `passport-jwt` | latest compatible w/ Nest 10 | Auth strategy |
| `bcrypt` | 5.x | Password hashing |
| `class-validator`, `class-transformer` | latest | DTO validation |
| `zod` | 3.x | Schema validation (shared with frontend via `packages/validation`) |
| `@aws-sdk/client-s3` (or MinIO SDK) | latest | Object storage abstraction target |
| `pino` / `nestjs-pino` | latest | Structured logging |

### 3.2 Frontend

| Library | Suggested version | Notes |
|---|---|---|
| Next.js | 14.x (App Router) | Framework |
| React | 18.x | UI library |
| TypeScript | 5.6.x | Language |
| Tailwind CSS | 3.4.x | Styling |
| TanStack Query | 5.x | Server-state/data fetching |
| React Hook Form | 7.x | Form state |
| Zod | 3.x | Form/schema validation (shared package) |

### 3.3 AI / RAG

| Component | Approach |
|---|---|
| LLM provider | Abstracted behind `LLMProvider` interface — implementation swappable |
| Embedding provider | Abstracted behind `EmbeddingProvider` interface |
| Transcription provider | Abstracted behind `TranscriptionProvider` interface |
| Vector store | PostgreSQL + `pgvector` (no separate vector DB for MVP) |

### 3.4 Infrastructure

| Component | Choice |
|---|---|
| Containerization | Docker + Docker Compose (local dev: Postgres, Redis) |
| Object storage | S3-compatible (abstracted) |
| Monorepo tooling | `pnpm` workspaces + Turborepo |
| CI | GitHub Actions (lint, typecheck, test, build) |

---

## 4. Monorepo Structure

```text
research-platform/
│
├── apps/
│   ├── web/                      # Next.js frontend
│   └── api/                      # NestJS backend
│
├── packages/
│   ├── types/                    # Shared TS types/interfaces
│   ├── validation/                # Shared Zod schemas
│   ├── config/                    # Shared config/env helpers
│   └── eslint-config/
│
├── prisma/
│   ├── schema.prisma
│   └── migrations/
│
├── docs/
│   ├── SRS.md
│   ├── TAD.md                    # this file
│   └── architecture/
│
├── docker/
│   └── docker-compose.yml
│
├── package.json
├── pnpm-workspace.yaml
├── turbo.json
└── README.md
```

---

## 5. Backend Structure (`apps/api`)

```text
apps/api/src/
├── main.ts
├── app.module.ts
│
├── auth/
│   ├── auth.controller.ts
│   ├── auth.service.ts
│   ├── auth.module.ts
│   ├── dto/
│   ├── guards/
│   └── strategies/
│
├── users/
├── topics/
├── sessions/
│
├── research/
│   ├── guides/
│   ├── questions/
│   ├── notes/
│   └── sources/
│
├── presentations/
├── transcription/
│
├── evaluation/
│   ├── claims/
│   ├── evidence/
│   ├── findings/
│   ├── dimensions/
│   └── pipeline/
│
├── knowledge/
├── ai/          # LLMProvider / EmbeddingProvider / TranscriptionProvider impls
├── jobs/        # BullMQ queues, processors
├── prisma/      # PrismaService, repository base classes
└── common/      # filters, interceptors, pipes, decorators
```

Each domain module follows the same internal shape:

```text
<module>/
├── <module>.controller.ts   # HTTP only — no business logic
├── <module>.service.ts      # Application/domain logic
├── <module>.repository.ts   # Persistence abstraction over Prisma
├── <module>.module.ts
└── dto/
```

---

## 6. Domain Model (as defined in `schema.prisma`)

This is the actual baseline entity set — use these names, not generic
placeholders, in code, API payloads, and further docs.

```text
User
Topic
LearningSession        (userId nullable — guest support)
  ├── ResearchGuide
  │     └── ResearchQuestion[]
  ├── Note[] ──┐
  ├── Source[] ┴── NoteSource (join)
  └── Presentation[]
        ├── Transcript
        │     └── TranscriptSegment[]
        ├── Claim[] (linked to a TranscriptSegment)
        │     └── ClaimEvidence (join → Evidence)
        └── Evaluation[]
              ├── EvaluationDimension[]
              │     └── EvaluationFinding[]
              │           └── FindingEvidence (join → Evidence)
              └── Evidence[]

KnowledgeDocument
  └── KnowledgeChunk[]   (content, chunkIndex, metadata Json — see 6.1)
```

Key enums (already defined in the schema — do not redefine ad hoc):

```text
TopicCategory            SCIENCE_AND_TECHNOLOGY            (single value — enforces BR-01 MVP scope)
Difficulty                BEGINNER | INTERMEDIATE | ADVANCED
TopicStatus                DRAFT | ACTIVE | ARCHIVED
SessionStatus              CREATED | GUIDE_READY | RESEARCHING | READY_TO_PRESENT |
                            PRESENTING | EVALUATING | COMPLETED | ABANDONED
QuestionStatus              PENDING | COMPLETED
SourceType                  ACADEMIC_PAPER | BOOK | SCIENTIFIC_ORGANIZATION | UNIVERSITY |
                            TECHNICAL_DOCUMENTATION | ARTICLE | VIDEO | NEWS | OTHER
PresentationStatus          CREATED | RECORDING | UPLOADING | SUBMITTED | PROCESSING |
                            COMPLETED | FAILED
ClaimType                   FACTUAL | CONCEPTUAL | CAUSAL | COMPARATIVE | QUANTITATIVE | INTERPRETIVE
ClaimVerificationStatus     SUPPORTED | PARTIALLY_SUPPORTED | CONTRADICTED | UNVERIFIABLE
EvaluationStatus            QUEUED | PROCESSING | COMPLETED | FAILED
EvaluationDimensionKey      ACCURACY | UNDERSTANDING | COVERAGE | REASONING | STRUCTURE |
                            COMMUNICATION | EVIDENCE_USE
EvidenceQuality              WEAK | MODERATE | STRONG
FindingType                  STRENGTH | CORRECTION | MISSED_CONCEPT | SHALLOW_EXPLANATION |
                            REASONING_GAP | EVIDENCE_GAP
FindingSeverity               LOW | MEDIUM | HIGH
EvidenceSourceType             USER_RESEARCH | TRUSTED_REFERENCE
```

Notice `Evidence` belongs to an `Evaluation`, not directly to a
`KnowledgeChunk` — it's a claim/finding-level citation record
(`sourceType`, `sourceReference`, `excerpt`, `confidence`) produced by the
retrieval stage, not a raw chunk hit. `ClaimEvidence` and `FindingEvidence`
are the join tables that let one piece of evidence support multiple
claims/findings and vice versa. Design the `EvidenceRetrievalService` to
retrieve chunks/notes/sources and then *construct* `Evidence` rows from the
results — don't try to expose `KnowledgeChunk` itself as evidence.

### 6.1 Gaps between this baseline schema and the architecture described elsewhere in this doc

These are not yet resolved — flag them before implementing the affected phase rather than assuming they're handled:

1. **No vector column on `KnowledgeChunk` (or anywhere).** The schema has no
   `pgvector` extension declared and no `Unsupported("vector")` /embedding
   field. Section 9's "PostgreSQL + pgvector" retrieval flow requires this;
   add something like `embedding Unsupported("vector(1536)")?` to
   `KnowledgeChunk` (and, if user-supplied source content is embedded
   directly rather than only referenced, to `Source`/`Note` or a new chunk
   table for them) via a migration before Phase 8 work starts.
2. **No `FollowUpResponse` model.** The SRS (§7.5 FR-PRES-05, §9 Data
   Requirements) describes an optional follow-up Q&A step with its own
   entity, but the supplied schema has no corresponding table. Since
   follow-up Q&A is a "Should" (not "Must") requirement, it's reasonable to
   defer the model until that feature is scheduled — but don't silently
   bolt follow-up answers onto `Note` or `Claim`; add a dedicated model
   (e.g. `FollowUpResponse { id, presentationId, question, responseTranscript,
   createdAt }`) when the feature is built.

---

## 7. Frontend Structure (`apps/web`)

```text
apps/web/
├── app/
│   ├── page.tsx
│   ├── explore/
│   ├── topics/
│   ├── sessions/
│   ├── dashboard/
│   └── auth/
│
├── components/
│   ├── ui/
│   ├── topics/
│   ├── research/
│   ├── presentation/
│   └── evaluation/
│
├── hooks/
├── lib/
│   ├── api/       # typed API client
│   ├── auth/
│   └── utils/
│
├── schemas/       # re-exports from packages/validation
└── types/         # re-exports from packages/types
```

---

## 8. Core Application Flow

### 7.1 End-to-end learning loop

```text
Random Topic
     │
     ▼
Research Guide (AI-generated, structured)
     │
     ▼
Independent Research (learner-driven — notes + sources, no AI assist)
     │
     ▼
Presentation (audio/video upload)
     │
     ▼
Transcription (background job → Transcript + TranscriptSegment[])
     │
     ▼
Follow-up Q&A (optional, SHOULD-priority per SRS FR-PRES-05 — MVP may ship
                without it; see §6.1 for the missing FollowUpResponse model)
     │
     ▼
Claim Extraction (LLM, structured output → Claim[], each linked to a
                   TranscriptSegment)
     │
     ▼
Evidence Retrieval (similarity search against learner Sources, Notes, and
                     the KnowledgeDocument/KnowledgeChunk base → produces
                     Evidence rows tagged USER_RESEARCH or TRUSTED_REFERENCE)
     │
     ▼
Claim Verification (per Claim: SUPPORTED / PARTIALLY_SUPPORTED /
                     CONTRADICTED / UNVERIFIABLE, linked to Evidence via
                     ClaimEvidence)
     │
     ▼
Evaluation Generation (EvaluationDimension[] + EvaluationFinding[],
                        findings linked to Evidence via FindingEvidence)
     │
     ▼
Feedback (shown to learner)
```

Per SRS §8.4/FR-EVAL-04/BR-06: user-supplied Notes and Sources are never
treated as authoritative just because they exist — they're evidence
candidates tagged `USER_RESEARCH`, weighed against `TRUSTED_REFERENCE`
evidence during verification, not accepted at face value.

### 7.2 Request/response vs. background processing

Synchronous (blocking HTTP):

```text
Topic selection, session CRUD, notes/sources CRUD, guide retrieval
```

Asynchronous (queued via BullMQ, processed by workers):

```text
Transcription → Claim Extraction → Evidence Retrieval →
Claim Verification → Evaluation Generation
```

Example submission flow:

```text
POST /api/v1/presentations/:id/submit
        │
        ▼
Presentation.status = SUBMITTED
        │
        ▼
Job enqueued (BullMQ)
        │
        ▼
HTTP 202 returned immediately
        │
        ▼
Worker: transcribe → extract claims → retrieve evidence →
        verify claims → generate evaluation → persist
        │
        ▼
Client polls / is notified evaluation is COMPLETED
```

### 7.3 Research guide generation flow

```text
Topic
  │
  ▼
Prompt Template (guide-generation prompt, versioned)
  │
  ▼
LLMProvider.generateResearchGuide()
  │
  ▼
Raw JSON response
  │
  ▼
Schema validation (Zod) — reject/retry on malformed output
  │
  ▼
Domain validation (business rules)
  │
  ▼
Persist ResearchGuide (linked to Session)
```

### 7.4 Evaluation pipeline (internal service chain)

```text
EvaluationService
      │
      ▼
TranscriptService              (fetch/confirm transcript)
      │
      ▼
ClaimExtractionService         (LLMProvider.extractClaims)
      │
      ▼
EvidenceRetrievalService       (embed claim → pgvector search)
      │
      ▼
ClaimVerificationService       (LLMProvider.verifyClaims w/ evidence)
      │
      ▼
EvaluationGenerationService    (dimension-level findings + feedback)
      │
      ▼
EvaluationPersistenceService   (write Evaluation + Findings)
```

Each stage is an independently testable service — never a single
`evaluatePresentation()` monolith.

---

## 9. Provider Abstraction Layer

```typescript
interface LLMProvider {
  generateResearchGuide(topic: Topic): Promise<ResearchGuideDraft>;
  extractClaims(transcript: Transcript): Promise<Claim[]>;
  verifyClaims(claims: Claim[], evidence: Evidence[]): Promise<ClaimVerification[]>;
  evaluatePresentation(input: EvaluationInput): Promise<EvaluationDraft>;
}

interface EmbeddingProvider {
  generateEmbedding(text: string): Promise<number[]>;
}

interface TranscriptionProvider {
  transcribe(mediaRef: MediaReference): Promise<Transcript>;
}
```

All three live under `apps/api/src/ai/`, with a concrete implementation per
vendor and a module-level binding that selects the active implementation from
config. No controller, service outside `ai/`, or repository calls a vendor
SDK directly.

---

## 10. Data Flow for RAG

> Requires the `pgvector` schema migration described in §6.1 — the baseline
> schema does not yet have an embedding column. Treat the flow below as the
> target state once that migration lands, not as already-implemented.

```text
KnowledgeDocument
       │
       ▼
KnowledgeChunk (chunkIndex, content; chunking strategy: fixed-size w/ overlap, MVP baseline)
       │
       ▼
Embedding (EmbeddingProvider)
       │
       ▼
pgvector column added to KnowledgeChunk (see §6.1 migration)

--- at evaluation time ---

Claim
  │
  ▼
Embedding (EmbeddingProvider)
  │
  ▼
Vector similarity search (pgvector) over:
    - Learner Sources (and their Notes, via the NoteSource join)
    - Platform KnowledgeChunk base
  │
  ▼
Top-K matches → EvidenceRetrievalService constructs Evidence rows
    (sourceType = USER_RESEARCH for Source/Note hits,
     sourceType = TRUSTED_REFERENCE for KnowledgeChunk hits)
  │
  ▼
LLMProvider.verifyClaims(claim, evidence) → ClaimVerificationStatus
  │
  ▼
ClaimEvidence rows persisted linking Claim ↔ Evidence
```

---

## 11. Security Architecture

```text
Client
  │  (Authorization: Bearer <access token>)
  ▼
JWT Auth Guard (Passport strategy)
  │
  ▼
Ownership Guard (session/resource belongs to requesting user, or guest token matches)
  │
  ▼
Controller → Service → Repository
```

Baseline controls:
- Password hashing (`bcrypt`)
- Short-lived access tokens + longer-lived refresh tokens
- Per-resource ownership checks (notes, sources, presentations, evaluations, sessions)
- Input validation on every DTO (`class-validator` + Zod at the edges)
- File validation: MIME-type allowlist, size limits, virus/format checks before job enqueue
- Signed URLs for object storage reads/writes where applicable
- Rate limiting on auth and AI-triggering endpoints

---

## 12. Observability

```text
Request ─┬─> requestId
         │
Job     ─┼─> jobId  ────┐
         │              │
Evaluation ─> evaluationId
                          │
                          ▼
                 Structured log line
                 { requestId, jobId, evaluationId, stage, durationMs }
```

- Structured logging (`pino`) with correlation IDs propagated from HTTP request → job → each pipeline stage
- Health endpoints: `GET /health`, `GET /health/live`, `GET /health/ready`
- Every LLM/embedding/transcription call logs provider, model, prompt version, and latency for cost and quality tracing

---

## 13. Environment Configuration

```env
NODE_ENV=

DATABASE_URL=
REDIS_URL=

JWT_ACCESS_SECRET=
JWT_REFRESH_SECRET=

LLM_API_KEY=
EMBEDDING_API_KEY=
TRANSCRIPTION_API_KEY=

STORAGE_ENDPOINT=
STORAGE_BUCKET=
STORAGE_ACCESS_KEY=
STORAGE_SECRET_KEY=
```

Secrets are never committed; `packages/config` centralizes env parsing/validation (Zod) so a missing/invalid var fails fast at boot.

---

## 14. Local Development

```text
docker compose up -d      # Postgres + Redis
pnpm install
pnpm prisma migrate dev
pnpm dev                  # Turborepo runs web + api in parallel
```

---

## 15. Testing Strategy

| Level | Scope |
|---|---|
| Unit | State transitions, domain services, validation, claim classification, repository logic (mocked Prisma) |
| Integration | NestJS + Prisma + real PostgreSQL (test DB) |
| E2E | Full loop: register → topic → session → guide → research → submit → evaluate → view result |

---

## 16. Versioning for Reproducible Evaluations

Every evaluation persists:

```text
evaluationVersion
rubricVersion
promptVersion
llmProvider + model
embeddingModel
knowledgeBaseVersion
```

This makes it possible to explain, months later, why a given evaluation
looked the way it did — and to safely change prompts/models/rubrics without
silently invalidating historical evaluations.

---

## 17. Deferred / Explicitly Out of MVP Architecture

- Separate vector database (stay on `pgvector` until scale demands otherwise)
- Microservices split (stay modular-monolith within `apps/api`)
- Multi-domain topic architecture beyond Science & Technology
- Hybrid/advanced retrieval (keyword + vector) — pure vector search for MVP
- Real-time evaluation streaming — polling/notification is sufficient for MVP

---

*This TAD builds on the existing SRS and Prisma schema baseline. Any deviation from the structures above should be proposed with an explicit trade-off explanation before implementation.*
