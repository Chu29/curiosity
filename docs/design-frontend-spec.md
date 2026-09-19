# Design & Frontend Specification
## Science & Technology Learning Platform — MVP

**Status:** Design baseline for implementation
**Source:** `science_technology_learning_platform_mvp_user_journey.docx` (11-screen MVP journey, Guest vs. Registered matrix, state model)
**Companion docs:** `PRD.md`, `science_technology_learning_platform_srs.md`, `schema.prisma.md`, `TAD.md`

> This spec turns "make it look nice" into exact values. Every screen
> section below maps directly to a numbered screen in the user-journey
> document — same names, same purpose statements, same content — so design
> and product stay in lockstep. Don't rename or reorder screens without
> updating the journey doc first.

---

## 1. Design Brief Interpretation

**Subject:** a platform where curiosity becomes disciplined, evidence-checked
work — closer to a field research notebook than a chat app or a SaaS
dashboard. The journey doc's own closing line is the brief: *"less like an
AI tutor and more like a personal curiosity gym: it creates the challenge,
gives the user a disciplined method for investigating it, gets out of the
way while the user learns, and then becomes a rigorous audience."*

That gives three concrete design mandates:

1. **Feel like a research instrument, not a chatbot.** No conversational
   bubbles, no assistant avatar, no "typing…" affordances anywhere in the
   research workspace — the SRS and journey doc are explicit that this is
   not an AI chat product (FR-RES-07, §7 AI Responsibilities table).
2. **The research/present boundary must be visually absolute.** Presentation
   Mode (Screen 7) hides the workspace entirely — this should read as a
   genuinely different visual mode (a "stage"), not a modal over the same
   screen.
3. **Evidence and verification states are first-class visual objects**, not
   incidental colors — they map directly to the schema's
   `ClaimVerificationStatus` and `EvaluationDimensionKey` enums, so the
   color coding defined here is functional, not decorative.

### 1.1 Design plan (token summary)

- **Color:** a graph-paper light theme (cool paper, ink navy) with a single
  warm accent reserved for evidence/highlighting, plus a small fixed set of
  verification-state colors. No terracotta-on-cream, no near-black neon
  theme, no rounded SaaS-card kit.
- **Type:** the IBM Plex family throughout — Serif for headlines (editorial,
  legible, faintly technical), Sans for UI/body, Mono used narrowly for
  literal data (timestamps, durations, confidence percentages) — never for
  decorative labels.
- **Layout:** a fixed-width **margin rail** down the left edge carries the
  session's step progress (this content really is a sequence — Discover →
  Guide → Research → Present → Evaluate — so a numbered rail is earned, not
  a default). Main content sits in a single notebook-page column, left
  aligned, capped at a comfortable reading width.
- **Principle:** the interface should look like it belongs to the learner,
  not to the AI. AI-authored content (guides, evaluations) is visually
  distinct — set in the margin rail's accent — from user-authored content
  (notes, sources), which sits in plain ink on paper.

### 1.2 Self-review against generic-AI-design defaults

- Not warm-cream-plus-terracotta (§ traits 1): base is a cool blue-gray
  paper (`#EFF2F6`), not `#F4F1EA`, and the accent is amber/evidence-tape,
  not `#D97757`.
- Not near-black-plus-neon (trait 2): no dark theme by default.
- Not broadsheet/hairline-newspaper (trait 3): the margin rail and card
  system are structural, not columned prose.
- Not the SaaS rounded-card kit (trait 4): radii are small and used only on
  interactive controls; separation is done with 1px rules, not drop
  shadows.
- No template chrome (trait 5): no ALL-CAPS eyebrows, no middot-joined
  meta strings, no monospace-as-decoration, no arrow-suffixed buttons.

---

## 2. Design Tokens

### 2.1 Color

| Token | Hex | Use |
|---|---|---|
| `color-paper` | `#EFF2F6` | App background — cool graph-paper tone |
| `color-paper-raised` | `#FFFFFF` | Cards, the research workspace panel, modals |
| `color-ink` | `#16213E` | Primary text, headlines, icons |
| `color-ink-soft` | `#42506B` | Secondary text, captions, placeholder text |
| `color-rule` | `#C9D2DE` | Hairline borders, dividers, the graph-paper grid |
| `color-rule-strong` | `#9AA8BC` | Input borders, focus-adjacent structural lines |
| `color-accent` (Evidence Amber) | `#D8A438` | The one warm accent: primary CTAs, active rail step, highlighted evidence excerpts |
| `color-accent-ink` | `#4A3410` | Text set on top of `color-accent` fills |
| `color-supported` | `#3E8E63` | `ClaimVerificationStatus.SUPPORTED` |
| `color-partial` | `#C98A2E` | `ClaimVerificationStatus.PARTIALLY_SUPPORTED` (deliberately distinct from `color-accent` — see §2.1.1) |
| `color-contradicted` | `#B85C38` | `ClaimVerificationStatus.CONTRADICTED` |
| `color-unverifiable` | `#6B7A8F` | `ClaimVerificationStatus.UNVERIFIABLE` |
| `color-danger` | `#B0362A` | Destructive actions, recording errors, permission failures |
| `color-focus` | `#2B5FB8` | Keyboard focus ring only — never used decoratively |

#### 2.1.1 Verification-state color rule

`color-partial` and `color-accent` are close in hue on purpose (both sit in
the amber family — "evidence," full stop, is an amber concept in this
system) but must differ by at least this contrast/lightness delta so they
are never confused:

- `color-accent` `#D8A438` — L≈68%
- `color-partial` `#C98A2E` — L≈56%

Never use `color-accent` to represent `PARTIALLY_SUPPORTED`, and never use
`color-partial` for a primary CTA. Pair every verification color with its
text label (`Supported`, `Partially supported`, `Contradicted`,
`Unverifiable`) — color is never the sole indicator (NFR-10, SRS §13).

### 2.2 Typography

| Role | Family | Weight(s) | Notes |
|---|---|---|---|
| Display / H1 | IBM Plex Serif | 600 | Screen titles ("Topic Overview," topic titles) |
| H2 / H3 | IBM Plex Serif | 500 | Section headers within a screen |
| UI / Body | IBM Plex Sans | 400, 500, 600 | All interface text, buttons, nav, form labels |
| Data / Mono | IBM Plex Mono | 400 | Timestamps, elapsed-time counter, confidence %, duration estimates — literal measured values only |

Type scale (base 16px, ~1.25 modular ratio, per Elements of Typographic
Style guidance — deliberate weights over decorative sizing):

| Token | Size / Line-height | Use |
|---|---|---|
| `type-display` | 40px / 48px | Landing hero headline only |
| `type-h1` | 32px / 40px | Screen title |
| `type-h2` | 24px / 32px | Section header |
| `type-h3` | 20px / 28px | Card/subsection header |
| `type-body-lg` | 18px / 28px | Research guide objective, evaluation summary |
| `type-body` | 16px / 26px | Default body text |
| `type-body-sm` | 14px / 22px | Captions, helper text, metadata |
| `type-micro` | 12px / 16px | Timestamps, badges (set in Mono where the value is numeric) |

Line length: cap the reading column at **68–72 characters** (≈640px at
`type-body`). Serif headline blocks may run slightly wider than body copy,
per typographic convention, but never past the column width defined in §3.

Avoid: accenting a single word in a headline with italics/color; ALL-CAPS
labels; decorative eyebrow labels above headers. Section identity comes
from the margin rail (§3.1) and spacing, not typographic tricks.

### 2.3 Spacing scale

Base unit 4px. Use only these steps — no arbitrary values:

```
4   8   12   16   24   32   48   64   96
```

- `4–8`: micro spacing inside a control (icon-to-label, badge padding)
- `12–16`: internal card/component padding
- `24–32`: spacing between related elements within a section
- `48–64`: spacing between distinct sections on a screen
- `96`: top padding under the margin rail header, landing-page section breaks

### 2.4 Radius, borders, elevation

- **Radius:** `4px` on interactive controls (buttons, inputs, badges,
  toggle chips). `0px` everywhere else — cards, panels, and the workspace
  frame are square-cornered, consistent with the notebook/instrument
  concept. Never use a large "SaaS card" radius (12px+).
- **Borders over shadows.** Default separation is a `1px solid color-rule`
  border. Use elevation (a single soft shadow, `0 2px 8px rgba(22,33,62,0.08)`)
  only for genuinely floating elements: the Presentation Mode timer chip,
  toasts, and modals. Never stack a border and a shadow on the same edge.
- **The graph-paper grid:** the app background (`color-paper`) carries a
  faint 24px-repeating grid at 4% ink opacity, visible only on the Landing,
  Topic Overview, and Research Guide screens (the "instrument" screens) —
  not inside the workspace or Presentation Mode, where it would add visual
  noise to dense content.

### 2.5 Motion

One orchestrated moment per transition, never per-element:

- **Guide reveal (Screen 3→4):** the research guide's seven sections
  unfurl as a single 240ms sequence (not per-card fade-ins) when the user
  taps "Start Research."
- **Entering Presentation Mode (Screen 6→7):** the workspace chrome
  visually "closes" — a 200ms wipe to the stage layout — reinforcing that
  research materials are now genuinely inaccessible, not just scrolled
  away.
- **Verification reveal (Screen 8→9):** claim badges resolve from a neutral
  "checking" state to their final color one at a time, in transcript order,
  reflecting that verification is a real process, not an instant score.
- Standard hover/press states use a 100ms opacity/background transition
  only. No scale transforms, no card lift-on-hover.
- Respect `prefers-reduced-motion`: all of the above degrade to an instant
  state change.

---

## 3. Layout System

### 3.1 The margin rail

A fixed 88px-wide left rail, present on every authenticated screen from
Topic Overview through Evaluation Report (Screens 3–9). It renders the
session's state model as a vertical stepped sequence — a legitimate use of
numbered markers because the content *is* a sequence (SRS §6, State Model):

```
DISCOVERED → GUIDE_STARTED → RESEARCHING → RESEARCH_COMPLETE →
PRESENTING → EVALUATING → EVALUATED → SAVED
```

Rail spec:
- Background `color-ink` (the one place ink is used as a fill, not text).
- Each step: a 24×24 circle, `color-rule` outline when upcoming, filled
  `color-accent` when active, filled `color-supported` (checkmark) when
  complete.
- Step label in `type-micro`, IBM Plex Sans, set in `color-paper` at 70%
  opacity for upcoming steps, 100% for active/complete.
- On mobile (< 768px), the rail collapses to a horizontal progress bar
  pinned under the top nav (see §3.3).

### 3.2 Content column

- Max width **680px**, left-aligned within the remaining space after the
  rail (never centered — centering would fight the rail's left-anchored
  structure).
- Screen title (`type-h1`, Serif) sits at the top with `96px` top padding
  (desktop) / `48px` (mobile).
- Sections within a screen separate with `48px` vertical spacing and a
  full-width `1px color-rule` divider.

### 3.3 Breakpoints

| Breakpoint | Width | Rail behavior | Column |
|---|---|---|---|
| Desktop | ≥ 1200px | Fixed 88px vertical rail | 680px, left-aligned with 120px left gutter |
| Tablet | 768–1199px | Fixed 64px vertical rail (labels hidden, icons only, tap for tooltip) | 680px or `100% - 64px`, whichever is smaller |
| Mobile | < 768px | Horizontal progress bar under top nav, 4px `color-rule` track / `color-accent` fill | Full width minus 16px gutters |

### 3.4 Wireframe legend

ASCII wireframes below use:

```
[Rail]     the margin rail (desktop/tablet only)
=====      section divider (1px color-rule)
[Button]   primary/secondary action
(badge)    a status/verification badge
```

---

## 4. Components

### 4.1 Buttons

| Variant | Fill | Text | Border | Use |
|---|---|---|---|---|
| Primary | `color-accent` | `color-accent-ink`, 600 weight | none | One per screen max: "Give Me a Topic," "Start Research," "Start Presentation" |
| Secondary | `color-paper-raised` | `color-ink`, 500 weight | `1px color-rule-strong` | "Sign Up / Log In," "Save Source," navigation |
| Destructive | `color-paper-raised` | `color-danger`, 500 weight | `1px color-danger` | Delete note/source, abandon session |
| Text | transparent | `color-ink-soft`, 500 weight, underline on hover | none | Tertiary actions ("Skip for now") |

All buttons: `12px 20px` padding, `4px` radius, `type-body` text, active
verb labels per §copy rules in §7 ("Save note," not "Submit").

### 4.2 Verification badge

Used everywhere a `Claim` or `EvaluationFinding` needs a status:

```
┌─────────────────────────┐
│ ● Supported              │   filled dot in color-supported,
└─────────────────────────┘   text color-ink, background color-paper-raised,
                               1px border in the matching state color at 30% opacity
```

Four states, using the colors from §2.1: Supported / Partially supported /
Contradicted / Unverifiable. `type-body-sm`, `8px 12px` padding, `4px`
radius. The dot is never the only signal — label text is always present.

### 4.3 Evidence card

Used in the Evaluation Report (Screen 9) to show the reference behind a
finding:

```
┌───────────────────────────────────────────┐
│ (● Contradicted)                            │
│ "Claim text from the transcript, quoted"    │
│ ─────────────────────────────────────────  │
│ Evidence: [excerpt from source/reference]   │
│ Source: NASA — Trusted reference             │
└───────────────────────────────────────────┘
```

- Background `color-paper-raised`, `1px color-rule` border, `0px` radius,
  `24px` padding.
- Claim text in `type-body`, quoted with a left `3px` rule in the state
  color (not quotation marks — the rule reads as "this is exactly what was
  said," consistent with claim/evidence traceability).
- Evidence excerpt in `type-body-sm`, `color-ink-soft`, background tinted
  1% toward the state color to visually group it with the badge above.

### 4.4 Source card (Research Workspace)

```
┌───────────────────────────────────────────┐
│ Title                          [ARTICLE]    │
│ author-organization.com                     │
│ ─────────────────────────────────────────  │
│ 2 notes linked                    [Edit] [×]│
└───────────────────────────────────────────┘
```

- `[ARTICLE]` is a small source-type tag — `type-micro`, `color-ink-soft`
  on `color-paper`, `4px` radius, not a colored badge (source type isn't a
  verification signal, so it must not borrow verification colors).
- Domain shown instead of full URL for scannability; full URL on hover/tap.

### 4.5 Recording indicator (Presentation Mode)

- A single persistent chip, top-right of the stage: `● REC` — but rendered
  in sentence case per copy rules: `● Recording`. Dot pulses (opacity
  60–100%, 1.2s loop) — this is the one exception to "no per-element
  looping motion," because a recording indicator that doesn't pulse reads
  as broken, not calm.
- Timer beside it in `type-h3`, IBM Plex **Mono** (a literal measured
  value — the one sanctioned decorative-adjacent mono use, because it's
  actually data).

### 4.6 Form fields

- Label `type-body-sm`, 500 weight, `color-ink`, `4px` below to input.
- Input: `1px color-rule-strong` border, `4px` radius, `12px 16px`
  padding, `type-body`. Focus: border becomes `color-focus`, `2px`, plus a
  `2px` outer glow at 20% opacity — visible keyboard focus is mandatory
  (accessibility floor).
- Error: border `color-danger`, helper text below in `color-danger`,
  `type-body-sm`, prefixed with a plain-language statement of what's wrong
  ("Enter a valid URL"), never just a red border.

---

## 5. Screen-by-Screen Specifications

Each screen below corresponds 1:1 to the journey document's screen list.
Content (labels, copy, sections) is taken directly from that document —
this section adds layout, components, and token application; it does not
add or remove functional content.

### Screen 1 — Landing Page

**Purpose:** explain the product in seconds, get the user to their first topic with minimal friction.

```
┌─────────────────────────────────────────────────────────┐
│  [Logo]                                    [Sign Up/Log In]│ ← Secondary button, top-right
│                                                             │
│         Turn curiosity into knowledge by                   │ ← type-display, Serif, color-ink
│         researching and teaching what you learn.           │
│                                                             │
│         Science & Technology                               │ ← type-body-lg, color-ink-soft
│                                                             │
│              [ Give Me a Topic ]                            │ ← Primary button, large (16px 32px)
│                                                             │
│         Research → Present → Evaluate                      │ ← optional loop explainer, type-body-sm,
│                                                             │   three plain labels separated by arrows,
│                                                             │   NOT badges — this is the one place a
│                                                             │   left-to-right arrow motif is earned,
│                                                             │   since it literally is the three-step loop
└─────────────────────────────────────────────────────────┘
```

- No margin rail on this screen (pre-session) — full-width centered-column
  hero instead, the one screen where center alignment is correct because
  there is no rail to anchor against.
- Graph-paper grid background at full opacity (this is the "characteristic
  first thing" per the hero principle — the grid *is* the field-notebook
  motif, shown before any content explains it).
- Guest behavior: "Give Me a Topic" requires no auth; tapping it proceeds
  directly to Screen 2.

### Screen 2 — Topic Discovery

**Purpose:** generate an interesting topic; keep randomness useful, not arbitrary.

```
[Rail]   Discover a topic
         ─────────────────────────────
         [ ⟳ Surprise Me ]              ← Primary button, large, centered in column

         Optional filters
         Difficulty:  ( Beginner ) ( Intermediate ) ( Advanced )
         Research time: ( Short ) ( Medium ) ( Deep )
```

- Filter chips: unselected = `color-paper-raised` bg, `1px color-rule`
  border; selected = `color-accent` bg, `color-accent-ink` text. These are
  optional and collapsed under a "Refine (optional)" text-button by
  default — the one-click random path stays primary, per the journey
  doc's explicit MVP instruction.
- Signed-in users: topics excluded from "recently completed" are not shown
  to the user as a list — this is backend filtering, not a UI element.

### Screen 3 — Topic Overview

**Purpose:** establish the mission without teaching the answer.

```
[Rail]   [Topic Title]                              type-h1, Serif
         Science & Technology › [Subcategory]        type-body-sm, color-ink-soft
         Difficulty: Intermediate · ~45 min research  type-body-sm
         ─────────────────────────────────────────
         [Short neutral description of the assignment]  type-body-lg
         [What the user is expected to accomplish]       type-body

              [ Start Research ]                     ← Primary button
```

- No card/box framing on the description — it reads as a page of the
  notebook, not a UI panel, reinforcing "this is a mission brief, not an
  AI-generated article."
- Explicit constraint carried into design: no "Read full explanation" or
  "Learn more" expansion — there is no more content to reveal here by
  design.

### Screen 4 — Research Guide

**Purpose:** give the user a structured method for the research.

Seven sections, each a full-width block separated by `1px color-rule`
dividers, `48px` spacing:

```
[Rail]   Research Guide                              type-h1

         1. Research Objective                        type-h2
            [objective text]                          type-body-lg

         2. Research Questions                         type-h2
            ☐ Question one
            ☐ Question two                            ← checkbox list, checked state
            ☐ Question three                             fills box with color-accent
                                                          (this list is functionally
                                                          identical to the workspace
                                                          checklist — same component)

         3. Concepts to Understand                      type-h2
            [Concept] [Concept] [Concept]              ← plain tag chips, color-ink-soft
                                                          on color-paper-raised, no accent
                                                          color (not a status signal)

         4. Suggested Source Types                       type-h2
            Academic papers · University resources · ...

         5. Suggested Research Platforms                 type-h2
            Google Scholar ↗   arXiv ↗   NASA ↗   ...   ← external-link icon, opens new tab

         6. Research Checklist                            type-h2
            [completion criteria list]

         7. Presentation Requirements                     type-h2
            Time limit: [x] min · Must cover: [areas]

              [ Start Research ]
```

- This whole guide is AI-generated content — per §1's "AI content is
  visually distinct" principle, the guide's section numbers (1–7) render
  in `color-accent`, while all user-authored content elsewhere (notes,
  sources) never uses numbered sections in accent color. This is the
  visual signal that separates "the platform's assignment" from "the
  learner's work," reinforced consistently through every remaining screen.

### Screen 5 — Research Workspace

**Purpose:** organize independent research without becoming an AI research assistant.

```
[Rail]   Research Workspace              Progress: 3/7 questions   ← type-body-sm, color-ink-soft
         ─────────────────────────────────────────
         ┌─ Questions ──────┐  ┌─ Notes ────────────────┐
         │ ☑ Question one    │  │ [rich text note editor]  │
         │ ☑ Question two    │  │                          │
         │ ☐ Question three  │  │                          │
         └───────────────────┘  └──────────────────────────┘

         Sources                                    [ + Add Source ]
         ┌──────────────┐ ┌──────────────┐ ┌──────────────┐
         │ Source card   │ │ Source card   │ │ Source card   │  ← §4.4 component
         └──────────────┘ └──────────────┘ └──────────────┘
```

- Two-column layout on desktop (questions/checklist left, ~280px;
  notes editor right, flexible); stacks vertically on tablet/mobile.
  Sources grid below, 3-up desktop / 2-up tablet / 1-up mobile, using the
  spacing scale's `16px` gutter.
- **Explicitly absent from this screen, by design:** any chat input, "Ask
  AI" button, summarize action, or AI-authored text anywhere in the notes
  editor or source cards. This is the one screen in the product where
  `color-accent` (the "AI-authored" signal) must never appear on user
  content — everything here is plain ink on paper, deliberately, to keep
  the visual language honest about whose work this is.
- Research timer: not present in MVP layout (optional/future per journey
  doc) — leave the space where it would go (top-right of the workspace
  header) unoccupied rather than reserving a placeholder.

### Screen 6 — Research Completion / Presentation Brief

**Purpose:** transition from research to active recall.

```
[Rail]   Ready to Present?                            type-h1
         ─────────────────────────────────────────
         Presentation time limit: [x] min             type-body
         You should cover: [areas]                    type-body

         ⚠ Your notes and sources will be hidden       ← callout, color-partial border,
           during Presentation Mode.                     not color-danger (this is expected
                                                           behavior, not an error)

         Review your checklist                          type-h3
         [read-only checklist from Screen 5]

              [ Start Presentation ]
```

- The hidden-materials warning uses `color-partial` (amber-adjacent, not
  red) specifically because this is a designed constraint the user should
  expect, not a failure state — reserving `color-danger` exclusively for
  actual errors keeps that color meaningful.

### Screen 7 — Presentation Mode

**Purpose:** capture the user's independent explanation. This is the "stage" — the one screen that should not resemble any other screen in the product.

```
                    ┌───────────────────────────┐
                    │        ● Recording          │  ← §4.5 component, top-right
                    │                              │
                    │         00:03:42             │  ← type-h3, Mono, centered
                    │                              │
                    │   [waveform / mic indicator]  │
                    │                              │
                    │                              │
                    │      [ End Presentation ]     │  ← Destructive-styled but labeled
                    │                              │     plainly, bottom-center
                    └───────────────────────────┘
```

- **No margin rail, no top nav, no visible chrome at all** other than the
  recording indicator, timer, and end button. Background switches to
  `color-ink` full-bleed (the only full-screen dark surface in the
  product) — this is the visual "wipe" from §2.5, and it is the strongest
  possible signal that research materials are genuinely unavailable, not
  just off-screen.
- Timer and recording indicator in `color-paper` / `color-accent` for
  contrast against the dark stage.
- Microphone-permission failure: replaces the stage content with a plain
  `color-danger`-bordered panel stating what happened and a single "Try
  Again" secondary button — no auto-retry, no silent fallback.
- Optional follow-up Q&A (2–3 questions): rendered as a continuation of
  the same dark stage, one question at a time, same recording chrome —
  not a return to the light "workspace" visual mode, since the user is
  still presenting.

### Screen 8 — Evaluation Processing

**Purpose:** show that analysis is happening; this is a system-status screen, not a form.

```
[Rail]   Evaluating your presentation…                type-h1
         ─────────────────────────────────────────
         ✓ Transcript generated                        ← checklist, matches SRS pipeline
         ✓ Claims extracted                                stages exactly (Transcription →
         ● Retrieving evidence                             Claim Extraction → Evidence
         ○ Verifying claims                                 Retrieval → Claim Verification →
         ○ Generating feedback                              Evaluation Generation)
```

- Each pipeline stage from TAD §8 Core Application Flow is shown as its
  own step — complete (✓, `color-supported`), active (●, `color-accent`,
  pulsing per §4.5's exception), pending (○, `color-rule`). This makes the
  evidence-grounded process visible rather than a spinner, which matters
  given SRS §8.4's requirement that evaluation reliability be
  demonstrable, not just asserted.

### Screen 9 — Evaluation Report

**Purpose:** turn the presentation into actionable feedback.

```
[Rail]   Evaluation Report                             type-h1
         [Topic title] · Presented [duration]           type-body-sm, Mono for duration
         ─────────────────────────────────────────
         Overall summary                                type-h2
         [narrative summary — never a single bare score]

         Accuracy        (● Supported ×4  ● Partial ×1  ● Contradicted ×1)
         Understanding   [score bar + summary]
         Coverage        [score bar + summary]
         Reasoning       [score bar + summary]
         Structure       [score bar + summary]
         Communication   [score bar + summary]
         Evidence Use    [score bar + summary]
         ─────────────────────────────────────────
         Findings                                       type-h2
         [Evidence card] [Evidence card] [Evidence card]  ← §4.3, one per significant finding
```

- The seven dimensions match `EvaluationDimensionKey` exactly — render in
  that fixed order, always all seven, even if a dimension's summary is
  short, per FR-EVAL-05's "or explicitly explains unavailable dimensions."
- Score bars (if scoring is enabled per the SRS's open decision, §18):
  render as a simple filled track (`color-rule` background,
  `color-accent`-family fill sized to the `EvidenceQuality` behind it, not
  the raw score alone) with the narrative summary directly beside it —
  never a bare number with no adjacent explanation (SRS FR-EVAL-08).
- Findings are grouped by `FindingType` (Strength first, then Correction,
  Missed Concept, Shallow Explanation, Reasoning Gap, Evidence Gap) so the
  user sees what went well before what needs work.

### Screen 10 — Knowledge / Session Summary

**Purpose:** close the loop.

```
[Rail]   Session Complete                              type-h1
         ─────────────────────────────────────────
         [Topic] · Completed [date]                    type-body-sm
         Key strengths: [...]                           type-body
         Areas to revisit: [...]                        type-body
         Suggested next action: [...]                   type-body

         (Guest)  Create an account to save this session
                  [ Sign Up ]  [ Continue without saving ]

         (Registered)  [ Give Me Another Topic ]  [ View Dashboard ]
```

- Guest variant: the sign-up prompt uses Primary-button styling for "Sign
  Up" and Text-button styling for "Continue without saving" — registration
  is encouraged, never blocking (SRS BR-09, FR-AUTH-04).

### Screen 11 — Registered User Dashboard

**Purpose:** the persistent learning layer.

```
[Top nav: Logo]                              [Give Me a Topic] [Account]

Knowledge History                                        type-h1
─────────────────────────────────────────
Topics researched: N    Topics presented: N

Recent evaluations
┌──────────────┐ ┌──────────────┐ ┌──────────────┐
│ Topic card     │ │ Topic card     │ │ Topic card     │
│ ●●●●○ dims     │ │ ●●●●● dims     │ │ ●●○○○ dims     │  ← mini dimension-completion
└──────────────┘ └──────────────┘ └──────────────┘           dots, not full badges

Saved sources & notes                              [View all]
```

- This is the one screen with a horizontal top nav instead of the margin
  rail (there's no single active session to show progress for) — Primary
  "Give Me a Topic" CTA lives in the nav here, consistent placement with
  Screen 1.
- Future-ready areas (knowledge graph, topic trails, spaced review,
  subcategory progress, recommendations) are **not stubbed out in the
  UI** — no grayed-out "coming soon" cards. Per §16's MVP-scope
  discipline, unbuilt features get no visual placeholder.

---

## 6. Guest vs. Registered Visual Differences

Per the journey doc's matrix (§5), the *screens* are identical for guests
and registered users — only specific elements change:

| Element | Guest | Registered |
|---|---|---|
| Top-right of Landing/nav | "Sign Up / Log In" secondary button | Account menu (avatar-less, name-initial circle in `color-ink`) |
| Screen 5 workspace header | small "Session is temporary" text-badge, `color-ink-soft`, no accent color (informational, not a warning) | none |
| Screen 10 | Sign-up prompt block (above) | "Give Me Another Topic" / "View Dashboard" buttons |
| Margin rail persistence | rail resets if the browser session ends | rail state is restored on return, matching SRS FR-AUTH-05 |

No separate "guest theme" — same tokens, same components, minimal
conditional content only where the matrix requires it.

---

## 7. Copy Rules for This Product

Applied consistently across every screen above:

- Buttons name the action taken, in the interface's own words: "Start
  Research," "Save note," "End Presentation" — never "Submit" or "OK."
  A button's label matches the confirmation it produces (e.g., a save
  action that then shows "Saved," not "Success").
- No first-person AI voice ("I've generated your guide"). The guide,
  evaluation, and feedback are presented as the product's output, in
  plain third-person or direct address to the user ("Your evaluation is
  ready"), never as a chat message from an assistant persona.
- Errors state what happened and how to recover, without apologizing:
  "Microphone access was denied. Enable it in your browser settings to
  record." — not "Oops! Something went wrong."
- Empty states are invitations, not apologies: an empty Sources panel
  reads "No sources saved yet — add your first one," not "You haven't
  added anything."
- No filler adjectives on AI-generated content ("comprehensive,"
  "detailed," "powerful"). Describe what a section *is* ("Research
  objective"), not how good it is.

---

## 8. Accessibility Floor (applies to every screen above)

- Visible keyboard focus (`color-focus` ring, §4.6) on every interactive
  element, including rail steps, filter chips, and badges where they're
  interactive (e.g., an evidence card's expand control).
- Color is never the sole indicator: every verification badge, rail step,
  and score bar pairs its color with text or an icon shape.
- Minimum contrast: `color-ink` on `color-paper`/`color-paper-raised`
  exceeds WCAG AA for body text; verification colors (§2.1) are checked
  against `color-paper-raised` backgrounds specifically, since that's
  where badges render.
- Recording state (Screen 7) has both a visual pulse and a persistent text
  label ("Recording") — never relies on the pulse alone.
- `prefers-reduced-motion` disables all transitions listed in §2.5 in
  favor of instant state changes.
- Microphone permission failure (Screen 7) provides a clear, actionable
  recovery path, per SRS NFR-10 and journey doc Screen 7 spec — never a
  silent failure or a generic error screen.
