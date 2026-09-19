# Product Requirements Document (PRD)
## Science & Technology Learning Platform — MVP

**Status:** Product Requirements Baseline
**Companion docs:** `science_technology_learning_platform_srs.md` (detailed functional/non-functional requirements), `schema.prisma.md` (domain model), `TAD.md` (technical architecture)

> This PRD sits above the SRS: it explains *what* the product is and *why*,
> at a level a designer, engineer, or new stakeholder can read in five
> minutes. The SRS is the authoritative source for individual requirement
> IDs (FR-\*, NFR-\*, BR-\*) — where this document and the SRS overlap, the
> SRS wins on detail; this document should not be read as loosening or
> reinterpreting anything it specifies.

---

## 1. Product Summary

**One-sentence definition:** A research-first learning platform that gives
people interesting Science & Technology topics to independently
investigate, then evaluates how well they understand and explain those
topics using evidence-backed AI.

The platform gives a learner a topic. The learner researches it
independently using external resources. They present what they learned in
their own words. The platform transcribes the presentation and evaluates it
against trusted reference material and the learner's own research — with
concrete, evidence-linked feedback, not just a score.

---

## 2. Problem Statement

People who enjoy learning about unfamiliar subjects online tend to consume
passively: they read a summary, watch a video, or ask an AI assistant to
explain something, and walk away with a feeling of understanding that
often doesn't hold up under scrutiny. There is little structure,
accountability, or verification in casual self-directed learning — and
increasingly, AI tools make it easy to *feel* informed without doing the
work of research, synthesis, or explanation.

There is no simple, low-friction product that:

- gives someone a structured research assignment on a topic they didn't choose,
- requires them to go find and evaluate real sources on their own,
- makes them explain what they learned out loud, unaided, and
- gives them honest, evidence-grounded feedback on whether they actually understood it.

This is the gap the platform fills.

---

## 3. Product Philosophy (non-negotiable)

**AI structures the learning activity and evaluates the result. AI does not
do the learning for the user.**

During the research phase, the platform must not behave like a general
AI assistant, chatbot, or search/summarization tool. The learner searches,
reads, and synthesizes on their own. AI's role is bounded to two moments:

1. **Before research** — generating a structured research guide (objectives, questions, source guidance, presentation requirements) that tells the learner *what to investigate*, never *the answer*.
2. **After the presentation** — transcribing, extracting claims, retrieving evidence, verifying claims, and generating evidence-grounded evaluation and feedback.

Any feature proposal that blurs this boundary (an AI research chatbot,
AI-written notes, AI-generated presentations, AI summarizing a learner's
sources for them) is out of scope by design, not by oversight — see §7 and
SRS §3.2/§16.

---

## 4. Target Users

| User | Description | What they need from the product |
|---|---|---|
| **Guest User** | Curious visitor, not ready to commit to an account | Can discover a topic, get a research guide, research, present, and receive feedback with zero signup friction |
| **Registered User** | Someone using the platform repeatedly to build a skill/habit | Everything a guest can do, plus persistent history: saved sessions, notes, sources, presentations, and evaluations they can revisit |
| **System Administrator** (internal) | Operates the platform | Manages topic data, source guidance, safety controls, and operational configuration |
| **AI/RAG Services** (system actor, not a person) | Generates guides, evaluates presentations | Needs approved context (topic, research guide, transcript, learner research, trusted reference material) to do both jobs reliably |

The MVP is intentionally aimed at self-directed learners motivated by
curiosity and skill-building (research literacy, explanation ability,
critical thinking) — not at classrooms, institutions, or teams. Those are
explicitly future considerations (§8, SRS §17), not MVP audiences.

---

## 5. Goals and Success Criteria

### 5.1 Product goals

- Make starting to learn an unfamiliar Science & Technology topic effortless.
- Encourage independent research over passive AI consumption.
- Build the learner's research and presentation skills through repeated practice.
- Give a repeatable, honest way to demonstrate understanding.
- Provide useful, evidence-grounded feedback — not a black-box score.
- Build a persistent record of what the learner has actually learned.

### 5.2 MVP success criteria

- A first-time visitor can reach a generated topic without signing up.
- A learner can tell what they're expected to research without being handed the answer.
- A learner can save and organize multiple sources and notes.
- A learner can present without seeing their research notes during the presentation.
- The system transcribes presentations with quality sufficient for evaluation.
- Evaluation surfaces concrete strengths, weaknesses, and factual issues with supporting evidence.
- A registered user can return later and retrieve completed sessions.

(These mirror SRS §5.2 and are restated here because they are the bar the
whole MVP is measured against, not a detail buried in a requirements table.)

---

## 6. The Core Loop

```text
DISCOVER  →  RESEARCH  →  UNDERSTAND  →  PRESENT  →  EVALUATE  →  LEARN
```

Concretely:

```text
Random Topic
     ↓
Research Guide (AI-generated: objectives, questions, source guidance)
     ↓
Independent Research (learner-driven: notes + sources, no AI assistance)
     ↓
Presentation (recorded, research workspace hidden)
     ↓
Transcription
     ↓
Claim Extraction → Evidence Retrieval → Claim Verification
     ↓
Evaluation (multi-dimensional, evidence-linked)
     ↓
Feedback → Improved Understanding
```

This loop is the product. Any feature that doesn't strengthen a step in
this loop is secondary for the MVP (SRS §16, Context Prompt §44).

---

## 7. Core Features (MVP Scope)

| Area | In scope for MVP |
|---|---|
| **Topic discovery** | Science & Technology topics only; one-action random/surprise generator; topic metadata (difficulty, estimated research time); topic overview that frames the assignment without giving the answer |
| **Research guide** | AI-generated objectives, structured research questions, concept checklist, suggested source types/platforms, presentation requirements — never direct answers |
| **Research workspace** | Notes (create/edit/delete), sources (title, URL, author/org, source type), note↔source association, progress tracking on research questions, persistence for registered users |
| **Presentation** | Separate presentation mode with research materials hidden; audio/video capture; transcription; elapsed-time display; optional AI-generated follow-up Q&A; submit for evaluation |
| **Evaluation & feedback** | Multi-dimensional evaluation (accuracy, understanding, coverage, reasoning, structure, communication, evidence use); evidence-grounded factual corrections; distinguishes learner claims from reference evidence; actionable feedback, not just a score |
| **History** | Saved sessions, transcripts, and evaluations for registered users; basic knowledge-history dashboard |
| **Accounts** | Guest access to the full core loop; registration/login for persistence; guest session attaches to a new account on registration |

Full functional detail (priorities, acceptance conditions) lives in SRS §7–§8; this table is the feature-level summary, not a replacement for it.

---

## 8. Explicitly Out of Scope for MVP

- Any AI research assistant/chatbot behavior during research (search, summarize, or answer on the learner's behalf)
- AI-generated notes or AI-generated presentations
- Live AI coaching while presenting
- Topic categories beyond Science & Technology (history, politics, economics, philosophy, etc.)
- Collaborative/group research, social profiles, public sharing
- Leaderboards, badges, or extensive gamification
- Full adaptive curriculum or knowledge-graph personalization
- Human expert grading
- Mobile-native applications

These are deferred deliberately so the first release proves the core loop
before the product broadens (SRS §16, §17).

---

## 9. Key Constraints and Business Rules

- MVP topic scope is Science & Technology only (BR-01).
- Default discovery is random/surprise topic generation, constrained by quality, difficulty, effort, and (where available) user history (BR-02, BR-03).
- Research guidance structures investigation but must never answer the research questions (BR-04).
- Learners are expected to do substantive research using external resources (BR-05).
- Notes and sources are learner-generated and are never automatically treated as verified fact (BR-06).
- Presentation Mode hides the research workspace (BR-07).
- Evaluation must be evidence-grounded wherever factual claims are assessed (BR-08).
- Account creation is required for persistent history, not for the core experience (BR-09).
- Learning value is prioritized over gamification or social engagement (BR-10).

(Full list: SRS §11.)

---

## 10. Risks

| Risk | Why it matters | Mitigation direction |
|---|---|---|
| **AI evaluation reliability** | An LLM can produce a convincing but wrong evaluation | Evidence-backed evaluation, claim-level verification, explicit uncertainty (`UNVERIFIABLE`), versioned rubrics/prompts |
| **RAG retrieval quality** | Bad retrieval → bad evaluation | Source/document metadata, deliberate chunking strategy, evidence references shown to the learner |
| **Transcription errors** | A mis-transcription can become an incorrect evaluation | Timestamps/segments preserved, original media retained where policy allows, future transcript-correction capability |
| **AI cost** | Evaluation may require several AI calls per submission | Async processing, provider/model abstraction, smaller models for simpler sub-tasks |
| **Scope creep toward "AI does the learning"** | The product's differentiator is that it *doesn't* — this is easy to erode feature-by-feature | Treat §3/§7/§8 as hard boundaries; any feature request that crosses them needs an explicit, named product-philosophy decision, not a quiet addition |

---

## 11. Future Considerations (explicitly not MVP)

- Expansion beyond Science & Technology into history, politics, economics, philosophy, etc.
- Topic trails connecting prerequisite/follow-up concepts
- Using presentation history to surface recurring knowledge gaps
- Optional challenge modes (explain-to-a-beginner, adversarial follow-up questions)
- Richer source verification/citation management
- Slide or visual presentation uploads
- Comparative progress across repeated presentations of related topics
- Spaced review driven by demonstrated understanding rather than topic completion

(Full list: SRS §17.)

---

## 12. Open Product Decisions

These should be resolved before deep implementation on the affected areas,
per SRS §18 — they don't invalidate anything above, they're unresolved
details within it:

- Presentation modality: audio-only, or audio + camera/video?
- Presentation duration: fixed per topic, a recommended range, or user-selectable?
- Follow-up Q&A: ship in MVP, or immediately after core evaluation is proven?
- Source content for evaluation: full retrieved content, metadata only, or a mix?
- Trusted reference corpus: which sources/datasets are acceptable for Science & Technology factual evaluation?
- Scoring: numeric, qualitative levels, or both?
- Guest session persistence window: how long should an unauthenticated session remain available?
- Topic curation: how much human curation alongside AI-generated topics?
- Research timer: is time-on-task worth tracking in MVP?
- Media retention: keep raw recordings, or only transcripts once evaluation completes?

---

## 13. How This PRD Should Be Used

1. Use this document to settle *what the product is for* before debating implementation details.
2. Defer to the SRS for specific, testable functional/non-functional requirements and acceptance criteria.
3. Defer to the Prisma schema and TAD for how the product is actually built.
4. Any proposed feature should be checked against §3 (philosophy), §7/§8 (scope), and §9 (business rules) before it's accepted — not added because it seems useful in isolation.
