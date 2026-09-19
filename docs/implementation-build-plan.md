# Implementation / Phased Build Plan
## Science & Technology Learning Platform — MVP

**Status:** Execution plan for implementation
**Companion docs:** `PRD.md`, `science_technology_learning_platform_srs.md`, `schema.prisma.md`, `TAD.md`, `design-frontend-spec.md`, `rules-and-boundaries.md`

> This plan reconciles the 9-phase order in `TAD.md` §43 with the 7-step
> build order in the journey doc §12 — they agree on sequence; this
> document is the more granular version of both, broken into milestones
> small enough to build, test, and verify one at a time.

---

## 1. How to Use This Document

**One milestone at a time. Do not start a milestone until the previous
one's Definition of Done is fully met.** Each milestone below is scoped to
be buildable and independently testable in isolation — that's the point:
a milestone that can't be demoed or tested on its own is scoped too large
and should be split further before starting it, not built as one big
commit.

Rules while executing this plan (see `rules-and-boundaries.md` for the
full set):

- Do not implement a later phase's functionality early "while you're in
  there," even if it looks convenient. If Phase 4 work reveals a genuine
  need for something scoped to Phase 7, note it and continue — don't reach
  ahead.
- Do not skip a milestone's tests to move faster. A milestone isn't done
  until its Definition of Done is met, including tests.
- If a milestone turns out to require a schema or architecture change not
  already documented, stop and follow the Change Protocol in
  `rules-and-boundaries.md` §6 before continuing.
- Every phase ends with a **checkpoint**: a concrete, demoable state of
  the product. If you can't demo the checkpoint, the phase isn't actually
  done regardless of how much code was written.

---

## 2. Dependency Overview

```text
Phase 1: Foundation
     │
     ▼
Phase 2: Identity (auth + guest sessions)
     │
     ▼
Phase 3: Core Learning Loop (topics + session state machine)
     │
     ▼
Phase 4: Research Workspace (guide, questions, notes, sources)
     │
     ▼
Phase 5: Presentation (recording, upload, submission)
     │
     ▼
Phase 6: Transcription (async job, transcript persistence)
     │
     ▼
Phase 7: Evaluation — non-RAG (claims, dimensions, findings, feedback UI)
     │
     ▼
Phase 8: RAG (knowledge base, embeddings, evidence-grounded verification)
     │
     ▼
Phase 9: Product Polish (dashboard, history, observability, hardening)
```

Phases 7 and 8 are split deliberately (unlike the journey doc's combined
"Evaluation" step) because the evaluation pipeline can and should be built
and tested with **stubbed/manual evidence first**, before the RAG
retrieval layer exists — this avoids a scenario where evaluation-pipeline
bugs and retrieval-quality problems are tangled together and hard to
debug independently.

---

## 3. Phase 1 — Foundation

**Goal:** a running, empty, correctly-structured monorepo. No product
features yet.

| # | Task | Definition of Done |
|---|---|---|
| 1.1 | Scaffold monorepo (`pnpm` workspaces + Turborepo) per `TAD.md` §4 | `pnpm install` and `turbo run build` succeed with empty `apps/web` and `apps/api` packages |
| 1.2 | Scaffold `apps/api` (NestJS) with the module skeleton from `TAD.md` §5 (empty modules, no logic) | `pnpm --filter api start:dev` boots; `GET /health` returns 200 |
| 1.3 | Scaffold `apps/web` (Next.js App Router) with the folder structure from `TAD.md` §7 | `pnpm --filter web dev` renders an empty placeholder page |
| 1.4 | Add `prisma/schema.prisma` exactly matching `schema.prisma.md` (no changes) | `prisma validate` passes; `prisma migrate dev` creates all tables against local Postgres |
| 1.5 | Docker Compose for local Postgres + Redis (`TAD.md` §14) | `docker compose up -d` brings up both; API can connect to both |
| 1.6 | `packages/config` — centralized env parsing/validation (Zod) per `rules-and-boundaries.md` §9 | Missing/invalid required env var fails app boot with a clear error, not a silent default |
| 1.7 | CI pipeline: lint, typecheck, build on push | A broken build fails CI; a clean build passes |
| 1.8 | Structured logging (`pino`/`nestjs-pino`) wired with `requestId` | Every request log line includes a `requestId`; visible in local dev output |

**Checkpoint:** `docker compose up -d && pnpm dev` brings up an empty but
correctly wired app; `GET /health`, `/health/live`, `/health/ready` all
return 200; CI is green.

---

## 4. Phase 2 — Identity

**Goal:** registration, login, and guest sessions work end-to-end, with no
product content yet attached.

| # | Task | Definition of Done |
|---|---|---|
| 2.1 | `auth` module: `POST /api/v1/auth/register`, `POST /api/v1/auth/login` | A user can register (password hashed via bcrypt) and log in; wrong password is rejected |
| 2.2 | JWT access + refresh tokens; `POST /api/v1/auth/refresh`, `POST /api/v1/auth/logout` | Access token expires on schedule; refresh token issues a new access token; logout invalidates the refresh token |
| 2.3 | `GET /api/v1/auth/me` | Returns the authenticated user's profile; 401 when unauthenticated |
| 2.4 | Auth guard + ownership guard scaffolding (`rules-and-boundaries.md` §9) | A protected route rejects an unauthenticated request; a resource-ownership check utility exists and is unit-tested, even with no resources to protect yet |
| 2.5 | Guest session identification (session/token-based, not guessable ID, per `rules-and-boundaries.md` §9) | A guest can be issued a session identifier without registering; the identifier can't be enumerated or guessed |
| 2.6 | `apps/web` auth flow: register/login forms, token storage, protected-route handling | A user can register and log in through the UI and reach an authenticated placeholder page |

**Checkpoint:** register → log in → hit `/auth/me` → log out, fully
working through both API and UI, with a guest identifier issuable
alongside it. No topics, sessions, or research content exist yet.

---

## 5. Phase 3 — Core Learning Loop

**Goal:** a user (guest or registered) can generate a topic and see a
`LearningSession` move through its state machine — no research content,
presentation, or evaluation yet.

| # | Task | Definition of Done |
|---|---|---|
| 3.1 | `topics` module: seed a small set of real Science & Technology `Topic` rows (title, category=`SCIENCE_AND_TECHNOLOGY`, difficulty, `estimatedResearchMinutes`) | At least 10–15 real topics exist in the dev DB, matching the SRS Appendix B example style |
| 3.2 | `GET /api/v1/topics/random` | Returns a random `ACTIVE` topic; excludes topics the authenticated user has recently completed (FR-TOP-04) |
| 3.3 | `GET /api/v1/topics/:topicId` | Returns full topic detail for the Topic Overview screen |
| 3.4 | `sessions` module: `LearningSession` creation tied to a topic + user/guest | `POST /api/v1/sessions` creates a session with `status = CREATED`, `userId` nullable for guests |
| 3.5 | Session state machine enforcement | Each `SessionStatus` transition (`CREATED → GUIDE_READY → RESEARCHING → READY_TO_PRESENT → PRESENTING → EVALUATING → COMPLETED`, plus `ABANDONED` from any state) is enforced in a domain service; an invalid transition returns `INVALID_SESSION_STATE` (TAD §29), never silently succeeds |
| 3.6 | `POST /api/v1/sessions/:sessionId/start`, `/abandon` | Both transitions work and are rejected when invalid |
| 3.7 | `apps/web`: Screens 1–3 (Landing, Topic Discovery, Topic Overview) wired to real endpoints | A user can land, generate a topic, and see the overview — no guide yet (guide is Phase 4) |

**Checkpoint:** a guest or registered user can go from the landing page to
a generated topic and a created `LearningSession`, with state-machine
violations correctly rejected. This is the first checkpoint demoable
start-to-finish through the UI.

---

## 6. Phase 4 — Research Workspace

**Goal:** the full research-guide-generation and research-workspace loop
works, ending at "ready to present" — still no presentation or evaluation.

| # | Task | Definition of Done |
|---|---|---|
| 4.1 | `ai/` module: `LLMProvider` interface + one concrete implementation, config-selected (TAD §9) | A domain service can call `LLMProvider.generateResearchGuide()` and get back a typed result; no vendor SDK import outside `ai/` |
| 4.2 | `research/guides`: guide generation → Zod schema validation → domain validation → persist (`rules-and-boundaries.md` §5.1) | `POST /api/v1/sessions/:sessionId/research-guide` produces a persisted `ResearchGuide` with `ResearchQuestion[]`; malformed LLM output is rejected/retried, never persisted raw |
| 4.3 | `GET /api/v1/sessions/:sessionId/research-guide` | Returns the guide with ordered questions |
| 4.4 | `research/questions`: `POST /api/v1/research-questions/:questionId/complete` | Marks a `ResearchQuestion.status = COMPLETED`; ownership-checked |
| 4.5 | `research/notes`: full CRUD (`notes` endpoints from TAD §28) | A user can create, read, update, delete their own notes; another user's notes are inaccessible (403/404) |
| 4.6 | `research/sources`: full CRUD + `NoteSource` association | A user can save a source (title, URL, author/org, `SourceType`) and link it to a note |
| 4.7 | Session transition: `RESEARCHING → READY_TO_PRESENT` | `POST /api/v1/sessions/:sessionId/ready-to-present` succeeds only when the session is in `RESEARCHING` |
| 4.8 | `apps/web`: Screens 4–6 (Research Guide, Research Workspace, Presentation Brief) | Fully wired: guide displays all 7 sections, workspace supports notes/sources CRUD, brief screen shows the hidden-materials warning per the design spec |

**Checkpoint:** a user can generate a topic, receive an AI-generated
research guide, add notes and sources, mark questions complete, and reach
"ready to present" — with **zero AI-assistance affordances present in the
workspace UI** (verify against `rules-and-boundaries.md` §2.1 explicitly
before calling this phase done).

---

## 7. Phase 5 — Presentation

**Goal:** a user can record and submit a presentation; research materials
are provably inaccessible during recording. No transcription or
evaluation processing yet — submission just gets the media into storage.

| # | Task | Definition of Done |
|---|---|---|
| 5.1 | Object storage abstraction (`StorageProvider`, S3-compatible) | A file can be uploaded and a signed URL retrieved through the abstraction, with no direct vendor SDK call outside the storage module |
| 5.2 | `presentations` module: `POST /api/v1/sessions/:sessionId/presentations`, `POST /:id/start` | Creates a `Presentation` with `status = CREATED`, transitions to `RECORDING` |
| 5.3 | `POST /api/v1/presentations/:id/upload` | Media uploads to object storage; `Presentation.mediaUrl`/`storageKey`/`mimeType`/`sizeBytes` populated; file-type and size validation enforced (`rules-and-boundaries.md` §9) |
| 5.4 | `POST /api/v1/presentations/:id/submit` | Transitions `Presentation.status → SUBMITTED`; session transitions `PRESENTING → EVALUATING` is **not** triggered yet here — that happens once transcription/evaluation actually starts in Phase 6/7, to keep this milestone's scope to submission only |
| 5.5 | `apps/web`: Screen 7 (Presentation Mode) | Microphone permission flow, recording indicator, timer, and — critically — **no code path that fetches or holds `Note`/`Source`/`ResearchGuide` data while this screen is mounted** (verify per `rules-and-boundaries.md` §2.2) |
| 5.6 | Permission-failure handling | Denied microphone access shows the clear recovery panel specified in `design-frontend-spec.md` Screen 7, not a generic error |

**Checkpoint:** a user can enter Presentation Mode, record, and submit —
with a network/component inspection confirming no research data is
fetched into that screen. This is a security-relevant checkpoint, not just
a functional one; don't skip verifying it.

---

## 8. Phase 6 — Transcription

**Goal:** submitted presentations get transcribed asynchronously.

| # | Task | Definition of Done |
|---|---|---|
| 6.1 | BullMQ setup: queue + worker process wired to Redis | A job can be enqueued and processed by a worker in local dev |
| 6.2 | `TranscriptionProvider` interface + concrete implementation | A media file can be transcribed via the abstraction, returning timestamped segments |
| 6.3 | `transcription` module: job triggered on `Presentation.submit` | Submitting a presentation enqueues a transcription job; the HTTP request returns immediately (TAD §8.2) — no synchronous `await` of the transcription call in the controller/service |
| 6.4 | Persist `Transcript` + `TranscriptSegment[]` | Segments preserve `sequenceNumber`, `startMs`, `endMs`, `text` per the schema |
| 6.5 | `Presentation.status → PROCESSING → COMPLETED`; failure path `→ FAILED` (retryable) | A forced transcription failure (e.g., corrupt test file) results in `FAILED`, not a stuck `PROCESSING` state or a silently-dropped job |
| 6.6 | `GET /api/v1/presentations/:id/transcript` | Returns the full transcript with segments |
| 6.7 | Correlated logging: `requestId` → `jobId` → transcription provider/version/latency (TAD §12) | A transcription job's full trace is visible in logs by `jobId` |

**Checkpoint:** submitting a presentation results in a persisted,
segmented transcript within a reasonable local-dev time, with a visible,
correlated log trail and a correct failure/retry path when forced to fail.

---

## 9. Phase 7 — Evaluation (non-RAG)

**Goal:** the full evaluation pipeline runs and produces a structured,
multi-dimensional report — using **stubbed or manually-seeded evidence**,
not real vector retrieval yet (that's Phase 8). This isolates pipeline
correctness from retrieval quality.

| # | Task | Definition of Done |
|---|---|---|
| 7.1 | `evaluation/claims`: `ClaimExtractionService` (`LLMProvider.extractClaims`) | Given a transcript, produces `Claim[]` linked to `TranscriptSegment`s, each schema-validated before persisting (§5.1) |
| 7.2 | `evaluation/evidence`: `EvidenceRetrievalService` — **stub implementation** returning evidence from directly-queried `Source`/`Note` text matches only (no embeddings yet) | Produces `Evidence` rows tagged `USER_RESEARCH`; `TRUSTED_REFERENCE` evidence is empty in this phase (expected — RAG isn't built yet) |
| 7.3 | `evaluation/claims`: `ClaimVerificationService` | Given claims + (possibly empty) evidence, produces `ClaimVerificationStatus` for each claim; **verify explicitly that `UNVERIFIABLE` is reachable** when evidence is empty — this is the expected common case in this phase, not a bug |
| 7.4 | `evaluation/pipeline`: `EvaluationGenerationService` | Produces `EvaluationDimension[]` (all 7 `EvaluationDimensionKey` values, always) and `EvaluationFinding[]`, linked to `Evidence` via `ClaimEvidence`/`FindingEvidence` |
| 7.5 | `evaluation/pipeline`: `EvaluationPersistenceService` | Persists `Evaluation` with `rubricVersion`, `promptVersion`, `modelProvider`, `modelVersion` populated on every record (§5.4) |
| 7.6 | Job orchestration: `submit → QUEUED → PROCESSING → COMPLETED`/`FAILED` | Each pipeline stage from 7.1–7.5 runs as part of one traceable job chain; a failure at any stage marks `Evaluation.status = FAILED` and is retryable via `POST /evaluations/:id/retry` |
| 7.7 | `GET /api/v1/presentations/:id/evaluations`, `/evaluation`, `GET /api/v1/evaluations/:id` | Returns evaluation(s) with dimensions and findings |
| 7.8 | Session transition: `EVALUATING → COMPLETED` on evaluation completion | Session status correctly reflects evaluation completion |
| 7.9 | `apps/web`: Screens 8–9 (Evaluation Processing, Evaluation Report) | Processing screen shows real per-stage status; report screen renders all 7 dimensions always, findings grouped by `FindingType`, per `design-frontend-spec.md` |

**Checkpoint:** full loop works end-to-end — topic → guide → research →
presentation → transcript → claims → (stubbed) evidence → verification →
evaluation report — with `UNVERIFIABLE` showing up honestly given the
stub's limited evidence. This is the most important checkpoint in the
whole plan: it proves the loop, even before retrieval quality is real.

---

## 10. Phase 8 — RAG

**Goal:** replace the Phase 7 evidence stub with real retrieval, and add
the trusted-reference knowledge base.

| # | Task | Definition of Done |
|---|---|---|
| 8.1 | Schema migration: add the `pgvector` extension and embedding column(s) per `TAD.md` §6.1 (this is the documented gap — implement it now, not before) | Migration applies cleanly; `KnowledgeChunk` (and any user-content chunk table, per the §6.1 decision made) has a vector column |
| 8.2 | `EmbeddingProvider` interface + concrete implementation | Text can be embedded through the abstraction |
| 8.3 | `knowledge` module: `KnowledgeDocument`/`KnowledgeChunk` ingestion pipeline (chunking + embedding) | A trusted reference document can be ingested and appears as searchable chunks |
| 8.4 | Seed an initial trusted-reference corpus for the seeded Science & Technology topics (8.3.1 in TAD's Open Product Decisions — resolve corpus source before this task) | Enough reference material exists to meaningfully verify claims for the seeded topics from Phase 3 |
| 8.5 | Replace the Phase 7.2 stub: real `EvidenceRetrievalService` using vector similarity search over learner `Source`/`Note` content and `KnowledgeChunk` | Retrieval returns ranked, relevant results for a representative claim; both `USER_RESEARCH` and `TRUSTED_REFERENCE` evidence are now populated |
| 8.6 | Re-run Phase 7's test suite against real retrieval | Existing pipeline tests still pass; add new tests specifically asserting retrieval relevance on a small fixed evaluation set |
| 8.7 | Update `TAD.md` §6.1 to remove the now-resolved gap note | Docs and code are back in sync per `rules-and-boundaries.md` §6 |

**Checkpoint:** the same end-to-end loop from Phase 7's checkpoint now
produces evaluations grounded in real trusted reference material, with
visibly better/more specific `SUPPORTED`/`CONTRADICTED` results than the
Phase 7 stub for claims where reference material exists.

---

## 11. Phase 9 — Product Polish

**Goal:** the MVP acceptance criteria (SRS §15, AC-01–AC-12) are fully
met, not just the core loop.

| # | Task | Definition of Done |
|---|---|---|
| 9.1 | `sessions`/`presentations`/`evaluations` history endpoints + `GET /api/v1/auth/me`-adjacent history queries | A registered user can retrieve all completed sessions, transcripts, and evaluations (FR-HIST-01/02) |
| 9.2 | `apps/web`: Screen 10 (Session Summary) — guest and registered variants | Guest sees the sign-up prompt; registered sees "Give Me Another Topic"/"View Dashboard," per the design spec |
| 9.3 | `apps/web`: Screen 11 (Registered Dashboard) | Shows topics researched/presented counts, recent evaluations, saved sources/notes — no stubbed "coming soon" cards for future-only features (`rules-and-boundaries.md` §2.5) |
| 9.4 | Guest-to-account conversion | A guest's session correctly attaches (`userId` set) on registration, per TAD §17/49; session data is preserved, not recreated |
| 9.5 | Rate limiting on auth and AI-triggering endpoints | Verified via test: repeated rapid requests are throttled |
| 9.6 | Full ownership/authorization audit across all resource endpoints | A written checklist confirming every `notes`/`sources`/`presentations`/`evaluations`/`sessions` endpoint enforces ownership, cross-checked against `rules-and-boundaries.md` §9 |
| 9.7 | Account/session deletion | A user can delete their saved research sessions and associated data (SRS §12) |
| 9.8 | Observability pass: confirm `requestId`/`jobId`/`evaluationId` correlation end-to-end (TAD §12) | A single evaluation's full trace — HTTP request through every pipeline stage — can be reconstructed from logs alone |
| 9.9 | E2E test: the full flow from SRS §42 (Register → Topic → Session → Guide → Research → Submit → Evaluate → View) | Passes reliably in CI |
| 9.10 | Full pass against SRS Acceptance Criteria AC-01 through AC-12 | Each criterion individually verified and checked off |

**Checkpoint (MVP complete):** every AC-01–AC-12 criterion in the SRS is
demonstrably met; the pre-merge checklist in `rules-and-boundaries.md`
§10 passes for the codebase as a whole, not just the most recent change.

---

## 12. Anti-Patterns to Watch For While Executing This Plan

- **Building Phase 8 (RAG) logic during Phase 4 or 7** because "we'll need
  it eventually." Don't — the stub in 7.2 is deliberate, so pipeline bugs
  and retrieval-quality issues never get debugged together.
- **Skipping the Phase 5.6 / Phase 7.9 UI verification steps** because the
  API works. The product's core trust claims (research materials hidden,
  evaluation is evidence-grounded) are partly UI guarantees — verify them
  in the UI, not just the API.
- **Marking a phase checkpoint done because "most of it works."** Every
  checkpoint above is written to be literally demoable. If it can't be
  demoed as described, the phase isn't done.
- **Silently expanding a milestone's scope** (e.g., adding a feature from
  Phase 9 while doing Phase 3 because it's a natural extension). Log it as
  a note for its actual phase and move on.
- **Treating `UNVERIFIABLE` results in Phase 7 as a bug to fix by making
  verification more lenient.** In Phase 7 specifically, most claims
  *should* come back `UNVERIFIABLE` — that's the stub working correctly,
  not a defect.
