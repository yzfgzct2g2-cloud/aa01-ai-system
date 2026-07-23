# Phase 4-2 Step 3 Conditional Assessment Workflow Design

## Scope

Phase 4-2 changes only the conditional display and user-triggered navigation
inside Step 3. It covers D0, selected G category panels, G2, G4, G5, and the
existing H1b question. It does not change Step 1, Step 4, Step 5 behavior,
assessment scoring rules, the IndexedDB schema, or any later Checkpoint 4
phase.

The baseline is `bda6d4c4571d834502b370825e7f4ae351fda64e` on `main`, version
`1.6.6`, with 179 passing tests. The pre-existing unstaged `package.json`
change from `vite` to `vite --host` is outside this phase and must remain
unstaged and uncommitted.

## Existing Flow and Root Cause

`App.tsx` owns one `AA01Form`. Step 3 writes answers into
`assessmentAnswers` and G/H/I category choices into
`assessmentCategorySelections`. The existing draft session saves and restores
that complete form, so Phase 4-2 needs no new persistence field, repository,
schema version, or migration.

The current Step 3 category helper selects questions by category prefix, but
it does not apply the parent-child rules within a selected category. The
component consequently renders dependent questions unconditionally. Separately,
the assessment summary, care-problem matrix, and AA01 generator consume every
stored answer. Hiding a control in JSX alone would therefore allow an answer
that is currently invalid to continue influencing summaries and output.

The current recovery-position effect also performs global DOM lookup and
automatically scrolls and focuses during restoration. That is incompatible
with the Phase 4-2 rule that scroll and focus occur only after a user's direct
action.

## Approaches Considered

### 1. UI-only conditional rendering

Add conditionals in `Step3Assessment.tsx` and leave downstream consumers
unchanged. This is the smallest visual patch, but it fails the output
requirements because hidden answers would still affect the summary, problem
matrix, and generated AA01.

### 2. Delete or normalize answers when a parent condition changes

Remove child answers when the user selects refusal, normal, none, or a
different category. This simplifies downstream output but violates the
explicit requirement to preserve hidden answers and restore them when the
condition becomes active again.

### 3. Shared conditional rules plus an effective-answer view

Keep the original form and draft untouched. Use pure rules to determine which
question IDs are currently active, render only those questions, and derive a
shallow effective-answer record for summaries and output. This is the selected
design because it provides one business-rule source while retaining all
historic answers in storage.

## Selected Architecture

### Shared pure rules

Create `src/rules/step3ConditionalAssessment.ts` as the UI-independent source
of truth. `Step3Assessment.logic.ts` may compose or re-export these rules for
the component, but output modules must import the domain rules directly rather
than import from a React component layer.

The rules consume only answer records, category selections, stable question
IDs, and stable option codes. They do not access the DOM, React state,
IndexedDB, viewport information, or mutate any input.

The module provides focused predicates and two composed operations:

- `isStep3QuestionEffective(questionId, answers, categorySelections)`
- `getEffectiveStep3QuestionIds(questionIds, answers, categorySelections)`
- `getEffectiveAssessmentAnswers(answers, categorySelections)`

The first two drive Step 3 rendering and progress. The last returns a new
record containing references to only currently effective answers. It never
deletes or edits the source record.

Top-level G/H/I category membership continues to use the existing centralized
category definitions. New parent-child dependencies use explicit question-ID
sets and stable option codes, not label comparisons or broad prefix guesses.
Both the UI and effective-answer view call the same predicates.

### Downstream consumers

`buildAssessmentSummary`, `buildCareProblems`, and AA01 generation receive the
effective-answer view. Step 5 may still render its existing summary UI, but it
must not see answers hidden by current Step 3 conditions. No output format is
otherwise redesigned.

`G4d-score` is always ineffective. A historic value remains in the form and
draft, but it is neither rendered nor included in numeric summaries or the
explicit AA01 score line.

## Condition Matrix

### D0

The existing stable code `"3"` means refusal. Only that code collapses D1a,
D1b1, D1b2, and D1b3 for this phase. D0 itself remains visible and its stored
selected option continues to describe refusal.

Changing away from `"3"` makes the same stored child answers visible again.
While refused, those answers are excluded from progress, summaries, care
problems, and AA01 output. No answer is reset.

### G selected-category panels

The confirmed model is selection-driven expansion:

- checked category: its panel exists and is expanded;
- unchecked category: its panel is absent/collapsed;
- no independent nested accordion state or toggle exists;
- category recovery directly renders the selected panels without motion or
  focus.

Each selected G category is rendered as a labelled panel containing its active
questions. The panel state cannot diverge from
`assessmentCategorySelections.G`.

On a user-originated unchecked-to-checked transition, the component records
one pending interaction, renders the new panel, scrolls that panel with
`scrollIntoView({ behavior: "smooth", block: "nearest" })`, and focuses its
first enabled operable control. Unchecking only removes the panel and keeps
its answers.

### G2 abnormal skin questions

G2a code `"1"` is normal and code `"2"` is abnormal. When normal, the explicit
dependent set is inactive:

- `G2b`
- `G2c`
- `G2d`
- `G2d-other`
- `G2d1`
- `G2d2`
- `G2d2-other`

When abnormal, these questions return to the normal category flow with their
existing answers. No label text is used as a condition.

### G4 height, weight, and alternatives

A measurement is valid only when its runtime value is a finite number greater
than zero, or a non-empty numeric string that converts to a finite number
greater than zero. Empty, nullish, non-numeric, zero, and negative values are
invalid. No medical upper or lower limit is added.

The explicit height-alternative set is:

- `G4b-arm-span`
- `G4b-half-arm-span`
- `G4b-knee-height`
- `G4b-converted-height`

The explicit weight-alternative set is:

- `G4b-hip-circumference`
- `G4b-estimated-weight`

When both direct height and direct weight are valid, both alternative sets are
inactive. If one direct measurement is missing or invalid, only the
corresponding alternative set remains active. The existing amputation fields
and converted-weight field are not reclassified by this phase because they
represent an existing adjustment flow rather than an absence-measurement
substitute.

### G4d other fields and score

G4d1, G4d2, and G4d3 use existing code `"3"` for Other. Each field has its own
explicit dependency:

- `G4d1-other` depends on G4d1 code `"3"`;
- `G4d2-other` depends on G4d2 code `"3"`;
- `G4d3-other` depends on G4d3 code `"3"`.

A user selection of Other renders and focuses only that field. Each field has
its own React ref. Changing away hides it without clearing its text. Recovery
may render it but never focuses it.

`G4d-score` is always hidden and output-inactive while historic data remains
compatible.

### G4e disease fields

G4e code `"2"` enables the existing `G4e-diseases`, `G4e-treatment`, and
`G4e-medications` questions; code `"1"` makes those answers inactive and
continues to G4f. Fixed disease choices do not require redundant text.

Only these stable disease codes enable supplemental name fields:

- `"08"` enables `G4e-cancer-note`;
- `"21"` enables `G4e-infection-note`;
- `"22"` enables `G4e-rare-disease-note`;
- `"24"` enables `G4e-other-note`.

Each supplemental field is independently inactive when its code is not
selected. On a direct user selection that reveals one or more supplemental
fields, only the first newly revealed field receives focus. Stored text
survives deactivation and is absent from the effective-answer view.

The existing disease, treatment, and medication option data and codes are not
renamed or migrated.

### G5

G5a code `"1"` means none and code `"2"` means present. `G5-items` is active
only for code `"2"`.

A direct user change to `"2"` scrolls the newly rendered question using the
same nearest-block behavior and focuses its first checkbox. Changing to
`"1"` hides the list while preserving it in the draft. Recovery renders an
active list without scroll or focus.

### H1b

H1b already exists as a multi-answer question with stable codes `"01"` through
`"11"`. Phase 4-2 does not add a new data field. It preserves the exact order
and changes only the eleventh display label from
`其他（包含看護）：` to `其他（包含看護）`.

The existing `H1b-other` field is not expanded into a new workflow in this
phase. The 11 checkboxes use the existing multi-answer update path, autosave,
and recovery behavior. Every label remains associated with its checkbox,
wraps naturally on narrow screens, and has a minimum 44-pixel touch target.
Missing or empty H1b data is treated as no selections and never changes the
draft schema.

H1b follows the existing H summary/output scope. This phase neither creates a
new output section nor changes its formatting.

## React Scroll and Focus Lifecycle

No scroll/focus state is persisted. The component owns:

- panel and control refs keyed by stable question/category IDs;
- a single pending user-action ref describing the next scroll/focus target.

Event handlers set the pending action only when a direct user operation makes
a previously hidden target active. A layout effect runs after that render,
validates the current target, consumes the pending action exactly once, then
performs the requested scroll and/or focus. A later render cannot repeat it.
Only one pending target exists, so multiple panels cannot compete for scroll.

Refs are passed to the actual first operable input through component props or
callback refs. Product code does not use `document.querySelector`,
`document.getElementById`, fixed-pixel scrolling, resize listeners, or
`setTimeout`. The existing recovery auto-scroll/focus effect is removed;
recovery still restores the saved section/question metadata without moving
the viewport or focus. CSS `scroll-margin-top` handles sticky UI clearance.

Failure to find a target or focus it is a safe no-op.

## Persistence and Compatibility

- No `AA01Form`, `LocalDraft`, IndexedDB, schema-version, or migration change.
- Category selections and answers continue through the existing autosave
  classifier and draft session.
- Conditional rendering never calls an answer setter.
- Hidden answers remain byte-for-byte in the source form and draft.
- Old drafts with missing, nullish, empty, or previously hidden values load
  safely.
- Recovery itself does not create a user-action flag and therefore cannot
  scroll or focus.
- Output filtering operates on a derived record and never writes it back.

## Testing Strategy

Pure node tests cover every condition predicate, stable code, explicit
dependency set, numeric validity edge, input non-mutation, and effective
answer filtering.

JSDOM/React tests cover immediate G expansion without a second toggle,
unchecking with answer preservation, one-shot user scroll/focus, no recovery
scroll/focus, G4d and G4e field focus, G5 behavior, H1b order/multiplicity,
labels, autosave, recovery, and old drafts.

Generator and summary regression tests prove that inactive D, G2, G4
alternatives, G4d other/score, G4e notes, and G5 answers are excluded while
the stored form remains intact. Navigation tests retain Step 3 to Step 4 and
Step 5 flows.

Browser validation covers 1366x768 and touch emulation at 320x568, 360x800,
390x844, 412x915, and 768x1024, including horizontal overflow, 44-pixel H1b
targets, refresh/recovery, Step 8 generation and clipboard, and zero uncaught
console errors. LAN HTTP is exercised with the existing local development
configuration; touch emulation is not reported as real-device testing.

Completion requires all existing 179 tests plus new focused tests, lint,
production build/typecheck, and `git diff --check`. The version becomes
`1.7.0` with date `2026-07-22`. The final committed history for this phase
contains the exact message `feat: improve conditional assessment workflow`
and excludes the existing `package.json` change.

## Scope Guard

This design does not introduce a UI framework, second persistence system,
schema migration, viewport JavaScript, medical calculation, assessment rule
change, Step 1 edit, Step 4 edit, Step 5 redesign, or unrelated refactor. Work
stops after Phase 4-2 is verified, committed, pushed to `origin/main`, and
reported.
