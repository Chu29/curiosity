# Rules and Boundaries Document
## Science & Technology Learning Platform — MVP

**Status:** Binding constraints for any AI agent (or human) working on this codebase
**Companion docs:** `PRD.md`, `science_technology_learning_platform_srs.md`, `schema.prisma.md`, `TAD.md`, `design-frontend-spec.md`

> This document exists to be followed literally, not interpreted loosely.
> Where it conflicts with a suggestion made elsewhere in a conversation, a
> ticket, or an ambiguous prompt, **this document wins** unless a human
> explicitly overrides a specific rule in writing and explains why. An AI
> agent that finds itself rationalizing a way around a rule here should
> stop and ask, not proceed.

---

## 1. Purpose

Four things go wrong when an AI agent works on a real codebase without
explicit boundaries: it invents features that weren't asked for, it
"fixes" architecture it doesn't have context for, it produces confident
output where it should say "I don't know," and it silently drifts from
established decisions over a long session. This document is the
countermeasure — a fixed reference an agent (or a new contributor) should
re-read before touching product logic, the data model, or the evaluation
pipeline.

---

## 2. Product Boundaries (do not cross, do not soften)

These come directly from `PRD.md` §3 and the SRS. They are not
implementation details — they are the product's identity. Any change to
them is a product decision, not a coding decision, and must not be made by
an agent unilaterally.

### 2.1 Hard rule: AI does not do the learner's research

The following are **permanently out of scope**, not "not yet built."
Do not implement them even if a ticket, prompt, or partial spec seems to
ask for something adjacent to them. If a request would require one of
these, stop and flag the conflict instead of finding a workaround.

- An AI chat/assistant interface anywhere in the research workspace
- Automatic web search or browsing performed on the learner's behalf
- AI summarization of a learner's saved sources
- AI-generated or AI-rewritten learner notes
- AI-generated presentations or presentation scripts
- Live AI coaching or hinting while the user is presenting
- Any endpoint, tool, or UI affordance that answers a `ResearchQuestion`
  directly rather than pointing the learner toward the information

### 2.2 Hard rule: the research/presentation boundary is real, not visual

`Presentation Mode` (Screen 7) must have **no code path** that can read
`Note`, `Source`, or `ResearchGuide` content into the presentation client
while recording is active. This is not just a UI hiding rule — do not
implement it as "hide the sidebar." The presentation client should not
fetch or hold that data in memory during a recording session at all.

### 2.3 Hard rule: user research is evidence, not fact

Per SRS BR-06 / FR-EVAL-04: a learner's `Note` or `Source` must never be
treated as ground truth by the evaluation pipeline. Concretely:

- `Evidence.sourceType = USER_RESEARCH` and `Evidence.sourceType =
  TRUSTED_REFERENCE` must always be visibly distinguished wherever
  `Evidence` is surfaced (API response, UI, logs) — never merge them into
  an undifferentiated "evidence" list.
- `ClaimVerificationService` must not mark a claim `SUPPORTED` on the
  strength of `USER_RESEARCH` evidence alone if it contradicts available
  `TRUSTED_REFERENCE` evidence. If only `USER_RESEARCH` evidence exists
  and no `TRUSTED_REFERENCE` evidence was retrievable, the correct status
  is `UNVERIFIABLE`, not `SUPPORTED` — see §5.

### 2.4 Hard rule: MVP topic scope is Science & Technology only

Do not add other `TopicCategory` values, generalize the topic taxonomy, or
build UI/API surface for multi-domain selection "for future-proofing."
`TopicCategory` currently has exactly one member
(`SCIENCE_AND_TECHNOLOGY`) — extending the enum is a product decision
(see PRD §11 Future Considerations), not something to pre-build.

### 2.5 Full out-of-scope list

Do not build, stub, or scaffold any of the following for MVP (PRD §8, SRS
§16): topic categories beyond Science & Technology; collaborative/group
research; social feeds or public profiles; leaderboards, badges, or
competitive rankings; a knowledge graph; adaptive/personalized curriculum
generation; human expert grading; mobile-native apps. If asked to build
toward one of these, implement nothing and surface the conflict instead —
see §7.

---

## 3. Architectural Boundaries

From `TAD.md`. These exist so the codebase stays navigable as it grows —
violating them creates the kind of tangled logic that makes future changes
unsafe.

### 3.1 Layering is mandatory

```text
Controller → Application Service → Domain Logic → Repository → Prisma → PostgreSQL
```

- **Controllers contain no business logic.** A controller parses/validates
  the request (via DTO), calls exactly one service method, and shapes the
  response. If a controller method has an `if` statement deciding business
  behavior (not request shape), that logic belongs in a service.
- **Repositories are the only layer that imports `PrismaService` directly.**
  No service, controller, or job processor should call `this.prisma.*`
  directly — go through the module's repository.
- **No cross-domain reach-through.** A service in `research/` must not
  import another domain's repository directly (e.g., `research/` reaching
  into `evaluation/`'s repository). Cross-domain data needs go through the
  other domain's service, or an explicitly designed shared interface.

### 3.2 Provider abstraction is mandatory — no direct vendor SDK calls outside `ai/`

Every LLM, embedding, or transcription call goes through `LLMProvider`,
`EmbeddingProvider`, or `TranscriptionProvider` (TAD §9). Do not:

- `import` an AI vendor SDK (OpenAI, Anthropic, Google, etc.) in any file
  outside `apps/api/src/ai/`
- Hardcode a model name, prompt string, or vendor-specific parameter in a
  domain service — these belong behind the provider interface and its
  configuration
- Add a new AI capability by calling a vendor SDK ad hoc "just for this one
  feature" — extend the relevant provider interface instead

### 3.3 No monolithic pipeline functions

The evaluation pipeline is explicitly modular (TAD §8.4):
`TranscriptService → ClaimExtractionService → EvidenceRetrievalService →
ClaimVerificationService → EvaluationGenerationService →
EvaluationPersistenceService`. Do not collapse these into a single
`evaluatePresentation()` function, even for a "quick MVP version." Each
stage must remain independently callable and independently testable.

### 3.4 The Prisma schema is the baseline, not a draft

`schema.prisma.md` is the agreed domain model. Do not:

- Rename an existing model, field, or enum value to "improve" naming
- Add a new relation or field to solve an immediate problem without
  checking whether it duplicates something that already exists (e.g., do
  not add a new `embedding` field to `Source` without first checking §6.1
  of `TAD.md`, which already documents this exact gap and the intended fix)
- Remove or restructure an existing model

If a schema change is genuinely required, follow §6 (Change Protocol)
before writing the migration.

### 3.5 Async boundaries are mandatory

Anything that calls an AI provider or processes media (transcription,
claim extraction, evidence retrieval, claim verification, evaluation
generation) runs as a BullMQ job, never inline in an HTTP request handler.
An HTTP endpoint that triggers one of these must enqueue a job and return
immediately (TAD §8.2) — it must not `await` the AI pipeline directly.

### 3.6 Dependency versions are pinned, not "latest"

Per `TAD.md` §3 and the user's own stated workflow preference: pin exact
patch versions in `package.json` and the lockfile. Do not run an
unscoped `npm/pnpm update` or bump a major version of a core dependency
(NestJS, Prisma, Next.js, React) without it being an explicit, separate,
reviewed change — never as a side effect of an unrelated feature.

---

## 4. Code Generation Rules

- **Never invent an API endpoint, DTO field, or model relation that isn't
  in `schema.prisma.md` or the SRS/TAD.** If the current task needs data
  that doesn't exist yet, say so and propose the addition — don't add it
  silently and continue.
- **Never fabricate a third-party API's behavior.** If a task requires
  calling an external service (a transcription API, an embedding
  provider, a research-platform integration) and the exact
  request/response shape isn't already established in this codebase or
  its docs, verify it (documentation, existing usage) before writing code
  against an assumed shape.
- **Never write a migration that silently drops or renames data-bearing
  columns.** Flag destructive migrations explicitly and require
  confirmation before applying them outside a fresh local dev database.
- **Match the existing module shape exactly** (TAD §5): every domain
  module gets `*.controller.ts`, `*.service.ts`, `*.repository.ts`,
  `*.module.ts`, `dto/`. Don't introduce a different internal structure
  for a new module "because it's simpler here."
- **Do not add a new domain module without adding it to `AppModule` and
  keeping the module list in `TAD.md` in sync** — the two must not drift.
- **Do not write comments that describe what a future version might do.**
  Comment what the code does now. Speculative "TODO: eventually we could
  add multi-domain support" comments encourage exactly the scope creep
  §2 forbids.

---

## 5. Rules to Prevent Hallucination in AI-Generated Product Output

These apply to the **application's own AI pipeline** (research guide
generation, claim extraction, evidence retrieval, verification,
evaluation) — not to an AI coding agent, but to the product the coding
agent is building. Code implementing these stages must enforce the rules
below; get them wrong and the product's own core promise (evidence-grounded
feedback) breaks.

### 5.1 Never blindly persist LLM output

Every LLM call whose output enters the database goes through this
sequence, with no step skipped (TAD §7.3):

```text
LLM response (raw)
  → Schema validation (Zod) — reject/retry on malformed output
  → Domain validation (business rules)
  → Persist
```

A research guide, a claim list, or an evaluation is never written to the
database directly from a raw LLM response string.

### 5.2 Verification states must include "I don't know"

`ClaimVerificationStatus` has four values for a reason:
`SUPPORTED | PARTIALLY_SUPPORTED | CONTRADICTED | UNVERIFIABLE`. Code
(and prompts) must never force a claim into `SUPPORTED` or `CONTRADICTED`
when the retrieved evidence is insufficient or ambiguous — the correct
output in that case is `UNVERIFIABLE`. A `ClaimVerificationService` that
never produces `UNVERIFIABLE` in practice is a sign the prompt or logic is
overconfident and needs to be fixed, not a sign the pipeline is working
well.

### 5.3 Never fabricate a citation

An `Evidence.sourceReference` must always trace back to a real
`KnowledgeChunk`, `Source`, or `Note` record that was actually retrieved —
never a source the LLM asserts exists but that wasn't part of the
retrieval result set. If the evaluation-generation step produces a
citation-shaped string that doesn't match anything in the retrieved
evidence set, that output is invalid and must be rejected/retried, not
persisted.

### 5.4 Version everything that affects an evaluation

Every `Evaluation` record persists `rubricVersion`, `promptVersion`,
`modelProvider`, `modelVersion` (already in the schema). Never change a
prompt template or rubric definition in place without bumping its version
identifier — this is what makes a six-month-old evaluation explainable
later (TAD §16).

### 5.5 Distinguish "the learner said" from "the evidence shows"

Any evaluation output (UI copy, API response, generated feedback text)
must keep these three things separately labeled, never merged into one
voice: what the learner claimed, what the learner's own research
(`USER_RESEARCH` evidence) supports, and what trusted reference material
(`TRUSTED_REFERENCE` evidence) supports. This mirrors SRS FR-EVAL-04 and
is a direct anti-hallucination measure — collapsing these into a single
"here's what's true" narrative is exactly the failure mode this
architecture exists to prevent.

---

## 6. Change Protocol — When a Rule or the Baseline Seems Wrong

Sometimes a rule above will appear to block a reasonable-looking change.
The response is never to quietly route around it. Instead:

1. **State the conflict explicitly.** Name the rule, the specific change
   being considered, and why the rule seems to block it.
2. **Explain the trade-off** of changing the rule/baseline versus working
   within it, per `TAD.md` §54 item 13 ("When suggesting architectural
   changes, explain the trade-off and impact on the existing design").
3. **Do not implement the change until a human confirms it.** This applies
   to schema changes, product-boundary changes (§2), and architectural
   pattern changes (§3) — not to routine implementation details like
   variable naming or file organization within an established module.
4. **Update the relevant doc in the same change** (`schema.prisma.md`,
   `TAD.md`, `PRD.md`, or this document) once a change is confirmed, so the
   docs and the code never silently diverge.

---

## 7. When Uncertain, Stop and Ask — Do Not Assume

An agent should escalate rather than guess when:

- A task seems to require crossing one of the §2 product boundaries
- A task requires a schema change not already documented in `TAD.md` §6.1
- A requested feature isn't covered by the SRS, PRD, or TAD, and its scope
  is genuinely ambiguous
- Two source documents appear to disagree (e.g., the journey doc describes
  UI behavior the SRS doesn't mention) — flag the discrepancy rather than
  picking one silently
- An external API's behavior needed for correctness can't be confirmed

"Making a reasonable-sounding assumption and continuing" is the specific
failure mode this document exists to prevent. State the assumption you
*would* make and why, then wait, rather than building on top of it.

---

## 8. Error Handling Requirements

Every stage of the async pipeline (TAD §7.2, §8) must handle failure
explicitly — a silent catch-and-continue is never acceptable given how
much downstream logic depends on each stage's output.

| Stage | On failure |
|---|---|
| Transcription | `Presentation.status = FAILED`; job retryable (TAD §19); no partial/garbled transcript is persisted as if complete |
| Claim extraction | If schema validation fails on the LLM output, retry with backoff up to a fixed limit, then mark the evaluation `FAILED` — never persist partially-parsed claims |
| Evidence retrieval | An empty result set is valid and must propagate as "no evidence found" (→ contributes to `UNVERIFIABLE`), not as a thrown error that aborts the whole evaluation |
| Claim verification | A provider timeout/error marks the affected claim's verification as failed-to-verify (surfaced distinctly from `UNVERIFIABLE`, which is a legitimate evidentiary outcome, not a system failure) and the job is retryable |
| Evaluation generation | `Evaluation.status = FAILED`, retryable via `POST /evaluations/:id/retry`; the previous failed attempt is not deleted — evaluations are append-only history, per §5.4 |
| Any external provider (LLM/embedding/transcription) call | Wrapped, logged with `requestId`/`jobId`/`evaluationId` (TAD §12), never allowed to throw an unhandled exception into a job processor |

General rule: **failure states are data, not exceptions to hide.** A
`FAILED` status with a retry path is always preferable to swallowing an
error and returning a plausible-looking but wrong result.

---

## 9. Security and Data-Access Rules (non-negotiable)

- A user must never be able to read another user's `Note`, `Source`,
  `Presentation`, `Evaluation`, or `LearningSession` — every repository
  method that fetches one of these must filter or check ownership; there
  is no "trusted internal call" exception.
- Guest sessions are identified by session/token, not by a guessable ID —
  do not implement guest access control as "no `userId` means public."
- No secret (`LLM_API_KEY`, `EMBEDDING_API_KEY`, `TRANSCRIPTION_API_KEY`,
  storage credentials, JWT secrets) is ever logged, returned in an API
  response, or committed to source control, including in test fixtures or
  example `.env` files (real placeholder values only).
- Presentation media and transcripts are private by default (SRS §12) —
  never default a new storage bucket, endpoint, or share feature to public
  access "to make testing easier."

---

## 10. Pre-Merge Checklist for AI-Generated Code

Before considering a change complete, verify:

- [ ] No product boundary in §2 was crossed
- [ ] No architectural rule in §3 was violated (layering, provider
      abstraction, module shape, pinned versions)
- [ ] Any AI-pipeline code follows §5 (validated before persisting,
      `UNVERIFIABLE` is a real reachable outcome, no fabricated citations,
      versioned rubric/prompt)
- [ ] Every new failure mode is handled per §8, not left to throw
      unhandled
- [ ] No ownership/access-control gap per §9
- [ ] If any baseline doc (`schema.prisma.md`, `TAD.md`, `PRD.md`, SRS) was
      touched, it was a deliberate, explained, confirmed change — not a
      silent edit
- [ ] Nothing was built toward the §2.5 out-of-scope list
