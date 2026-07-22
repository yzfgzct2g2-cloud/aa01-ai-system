# AA01 Checkpoint 3 — Mobile Assessment UI Audit

## Audit scope

This is an audit-only record for the current Step 3 assessment experience. The
audit did not modify production code, assessment wording, branching rules,
draft persistence, Step 4, generated AA01 output, or infrastructure. Its purpose
is to establish a small, evidence-based implementation scope for a later
Checkpoint 3 specification.

- Audit date: 2026-07-22 (Asia/Taipei)
- Repository: `C:\Users\USER\Documents\aa01-ai-system`
- Branch: `main`
- Baseline commit: `cbd558613cc8850d6c58d96ccbc96139b414beda`
- Application version: `1.6.1`
- Audit data: synthetic test case only; no real client data was used

## Baseline and repository state

At the start of the audit, `main` matched `origin/main`. The only working-tree
change was a pre-existing edit to `package.json`:

```diff
-    "dev": "vite",
+    "dev": "vite --host",
```

This edit is useful for LAN testing, but it predates this audit. It was preserved
unchanged and is not part of the audit commit. No other pre-existing change was
found.

Baseline validation:

- Typecheck: PASS through `tsc -b` in the production build
- Lint: PASS
- Tests: PASS, 107/107
- Build: PASS

## Test approach and environments

The audit combined source/CSS inspection with real Chromium interaction. Browser
dimensions were set with the browser viewport API, not page zoom. The mobile
session used touch emulation (`navigator.maxTouchPoints = 1`) and the application
was opened over the LAN HTTP URL. A continuous mobile assessment session lasted
approximately 14 minutes.

- Desktop: Chromium at 1366 × 768 and 1920 × 1080
- Mobile: Chromium touch emulation at 320 × 568, 360 × 800, 390 × 844, and
  412 × 915
- Tablet: Chromium at 768 × 1024, 820 × 1180, and 1024 × 768
- Landscape touch: Chromium touch emulation at 844 × 390
- LAN HTTP: `http://10.101.1.14:5174/aa01-ai-system/`; loaded and exercised
  successfully with `isSecureContext === false`
- Real physical device: not independently operated during this audit. The
  supplied baseline states that prior real-device verification passed; this
  audit does not restate that as new physical-device evidence.

The interaction path covered entering Step 3, expanding sections, selecting
single- and multi-choice values, entering short text, long text, and numbers,
using conditional categories, changing sections and steps, reloading, continuing
from the recovery gate, switching browser tabs, and discarding test drafts. Step
3 contains no radio control; an adjacent Step 4 radio was exercised only to
confirm the shared persistence baseline and does not authorize a Step 4 change.

## Viewport results

No tested viewport had document/body horizontal overflow. On narrow viewports,
the global eight-step navigator scrolls inside its own container. The 800 px
breakpoint stacks the Step 3 sidebar above the questions; at 820 px and wider,
the sidebar/content grid remains intact.

| Viewport | Layout | Body overflow | Step navigator | Observed minimum controls |
| --- | --- | --- | --- | --- |
| 320 × 568 | Stacked | None | 989 px content in 318 px scroll area | Step 41 px; section 59 px; select 43 px |
| 360 × 800 | Stacked | None | 989 px content in 358 px scroll area | Step 41 px; section 59 px; select 43 px |
| 390 × 844 | Stacked | None | 989 px content in 389 px scroll area | Step 41 px; section 59 px; select 43 px |
| 412 × 915 | Stacked | None | 989 px content in 410 px scroll area | Step 41 px; section 59 px; select 43 px |
| 768 × 1024 | Stacked | None | 989 px content in 766 px scroll area | Step 41 px; section 59 px; select 43 px |
| 820 × 1180 | 220 px sidebar + 574 px content | None | Internal overflow only | Controls usable |
| 1024 × 768 | 220 px sidebar + 778 px content | None | Fits viewport | Controls usable |
| 1366 × 768 | 220 px sidebar + 880 px content | None | Fits 1124 px container | Step 44 px; select 46 px |
| 1920 × 1080 | Centered max-width desktop | None | Fits container | Controls usable |
| 844 × 390 | 220 px sidebar + 598 px content | None | Fits viewport | Touch interaction usable |

Evidence location: measurements were taken from the rendered DOM during this
audit. Temporary screenshots and Playwright session files were used for review
but are intentionally not retained in the repository. Reproducible source
locations are cited with each finding below.

## Current strengths

- Step 3 already uses a section accordion and keeps only one section open; a
  structural rewrite is not justified by the evidence.
- All required phone, tablet, and desktop viewports remain inside the document
  width. Text wraps and remains readable.
- Section buttons are large touch targets (about 59 px high), conditional
  category rows are about 45 px high, and labels are clickable.
- Textareas are full-width with a useful minimum height. Native select, checkbox,
  number, text, and textarea controls all accepted touch/keyboard input.
- Section controls expose `aria-expanded` and `aria-controls`; the global stepper
  exposes `aria-current="step"`.
- Progress uses text and percentage, not color alone.
- Autosave retained actual assessment answers, supplemental text, multi-choice
  data, current step, current section, and current question. Reload recovery
  reopened section I, restored question I01b, scrolled to it, and focused it.
- A 14-minute mobile/LAN session produced no observed black screen, console
  error, data-loss event, or perceptible save lag.

## Findings

### P0 — blocks use or risks immediate data loss

None found.

### P1 — material task, comprehension, or recovery failure

#### P1-1 Conditional category choice is not persisted

`selectedCategories` is component-local state in
`src/Components/Step3Assessment.tsx` (initialization around lines 203–208 and
toggle logic around lines 292–299). On mount it is inferred from saved answer IDs
by `inferSelectedCategories` in `src/Components/Step3Assessment.logic.ts` rather
than restored as the user's explicit choice.

Browser reproduction:

1. Save answers in the I section under the wandering category.
2. Select the I-section “none” category. The questions become hidden and the
   section appears complete.
3. Reload and choose Continue in the recovery gate.
4. The “none” choice is gone; the wandering category is inferred from the saved
   answers, and its questions reappear.

The saved answers were not deleted or overwritten. The defect is that the user's
explicit category state, visible question set, section completion meaning, and
recovery location change after reload. A future fix should persist this UI state
in a backward-compatible, non-output portion of the existing form/session data,
continue to derive it from answers only for older drafts, and leave the
IndexedDB repository, draft ID, schema version, and autosave architecture
unchanged.

#### P1-2 Footer navigation is too small for reliable touch

At 320 px, the bottom “Previous” and “Next” buttons measured approximately
55 × 24 px. `src/App.tsx` around lines 158–164 gives the wrapper a utility-like
class but the repository has no matching rule that supplies button sizing. The
buttons are especially difficult to acquire after traversing a long section.

A future fix should add a scoped footer class with at least a 44 px target height,
adequate horizontal padding, and preserved desktop placement. It should not
change step navigation behavior.

#### P1-3 Long selected values cannot be verified on a phone

At 320 px, the G4c native select was approximately 239 px wide while its selected
label required about 1429 px. After selection, only the beginning of the
paragraph-scale option remains visible, so the user cannot reliably verify the
chosen detailed answer without reopening the picker.

A future fix should keep the native select and show the full selected label or a
short contextual readback directly below long selects on narrow screens. It
must not rewrite the input system or change answer values.

### P2 — beneficial local usability or accessibility correction

#### P2-1 Long conditional sections lose orientation and save visibility

With only three G categories enabled, the rendered 320 px page was approximately
7826 px high. The mobile breakpoint removes the sticky sidebar and the autosave
status remains near the top, so neither section position nor save confirmation
is visible deep in the form. No lag or lost save was observed. A later spec may
consider a small sticky mobile context/status row, but only after checking that
it does not reduce the already limited landscape height.

#### P2-2 Several secondary targets are just below 44 px

Standard checkbox option rows were often about 39 px high; stepper buttons were
about 41 px and selects about 43 px at narrow/tablet widths. The whole checkbox
label is clickable and longer labels naturally grow, reducing practical risk.
A future local CSS adjustment may raise minimum heights to 44 px.

#### P2-3 Section and checkbox-group semantics can be clearer

The active Step 3 section is communicated visually but does not expose
`aria-current`. Checkbox groups use individually associated clickable labels but
do not have a group-level `fieldset`/`legend` or equivalent accessible name.
These can be corrected locally without changing assessment content.

#### P2-4 Recovery focus and discard-dialog focus need explicit treatment

Recovery correctly scrolls to and focuses a question wrapper with
`tabIndex={-1}` (`src/Components/Step3Assessment.tsx`, around lines 264–278), but
the wrapper has no dedicated focus indicator. The discard confirmation uses
`role="alertdialog"` (`src/Components/DraftRecoveryGate.tsx`, around line 89),
but focus remained on the document body when it opened. The discard flow itself
still required two actions and retained/deleted data correctly. These are
accessibility improvements; any future dialog change must preserve the low-
emphasis destructive action and existing failure behavior.

#### P2-5 Conditional branching behavior needs separate product review

Selecting a broad conditional category exposes all questions with the relevant
prefix, including some “other” fields, and existing `jumpTo` metadata is not
executed by the renderer. This contributes to long sections, but changing it
could alter assessment meaning. It is explicitly excluded from the recommended
Checkpoint 3 implementation unless product owners separately approve revised
branching rules and regression expectations.

### P3 — cosmetic only

- At phone widths, the two-column section navigator leaves section I alone in
  the final row. This does not block navigation and should not drive a redesign.
- The horizontal stepper does not explicitly label that more steps are available
  by scrolling. Existing clipping provides some visual cue; address only if it
  can be done without new interaction complexity.

## Persistence integration results

- Autosave: PASS. IndexedDB inspection during the long session showed one draft
  with the same `draftId`, current step/section/question, 46 assessment answers,
  number values, long text, and multi-choice arrays. No duplicate draft was
  created by section changes, step changes, reload, or component remount.
- Refresh recovery: PASS for persisted form data and navigation. The recovery
  gate appeared before the form, Continue restored Step 3/section I/question
  I01b, and the original answers remained. P1-1 is the exception for component-
  local conditional category selection.
- Navigation recovery: PASS. Step 3 → Step 4 → Step 3 restored the open section
  and active question. Reload recovery also returned to that location.
- Discard: PASS. The inline second confirmation was required. The final test
  draft was removed only after confirmation; IndexedDB draft count was verified
  as zero and the application returned to blank Step 1.
- Error handling: existing automated tests passed. Destructive repository
  failures were not injected in the interactive browser audit; no runtime error
  was observed.

## Accessibility findings

- Positive: section headers expose expanded state and relationships, labels are
  clickable, native controls remain keyboard-operable, the global current step
  is announced, and progress has a textual equivalent.
- Needs correction: active section semantics, checkbox-group naming, a visible
  focus treatment for the restored question, and initial focus management for
  the discard alert dialog (P2-3 and P2-4).
- Touch sizing: the main section controls pass; footer buttons and several
  secondary controls need the sizing changes described in P1-2 and P2-2.
- The audit does not claim full WCAG conformance; it is a focused mobile
  usability and interaction review.

## Unverified items

- Direct use on a physical iOS or Android device during this audit
- OS-level app switching, device lock/unlock, virtual-keyboard viewport changes,
  and iOS/Android native picker rendering
- Screen-reader output with VoiceOver or TalkBack
- Injected IndexedDB quota, transaction, load, or delete failures in the browser
- Network interruption is not relevant to local draft writes, but browser
  storage eviction/private-mode differences were not reproduced

These gaps do not block a focused specification for the confirmed P1 issues,
but physical-device and assistive-technology checks should be part of the later
implementation acceptance pass.

## Options considered

### Option A — no change

Not recommended. The layout is structurally sound, but P1-1 changes the user's
visible assessment state after recovery, P1-2 impairs primary navigation touch
use, and P1-3 prevents reliable confirmation of detailed selections.

### Option B — local corrections

Recommended. Correct the three P1 findings and a small set of adjacent P2
touch/accessibility issues using scoped state, component, and CSS changes. Keep
the existing accordion, native inputs, draft repository, autosave lifecycle,
desktop layout, assessment wording, and output logic.

### Option C — structural Step 3 redesign

Not recommended. No P0 was found, all required viewports avoid document
overflow, and the existing accordion supports the task. A large rewrite would
add regression risk without evidence of proportional benefit.

## Recommended implementation scope

Proceed to a specification for Option B only:

1. Persist explicit G/H/I conditional category selections in backward-compatible
   non-output form/session state. Older drafts fall back to current answer-based
   inference. Do not clear hidden answers or change category/branching rules.
2. Give footer Previous/Next buttons at least 44 px touch height with scoped,
   responsive styling.
3. Add a narrow-screen full-label readback for selected paragraph-scale options
   while retaining native selects and stored answer values.
4. If kept small, raise checkbox/step/select minimum targets to 44 px and add
   active-section/group/focus semantics described in P2-2 through P2-4.

Do not add a new Step 3 architecture, global responsive framework, new input
system, animation, or complete case-management surface. Do not implement
`jumpTo`/branching behavior under this scope.

## Files likely to modify in a future implementation

- `src/App.tsx` — scoped footer styling hook and, only if required by the approved
  state design, Step 3 state wiring
- `src/types.ts` — optional non-output UI state only if the specification selects
  the form-persisted approach
- `src/Components/Step3Assessment.tsx` — category-state hydration/reporting,
  selected-value readback, and local accessibility semantics
- `src/Components/Step3Assessment.css` — touch sizes and narrow-screen readback
- `src/Components/Step3Assessment.logic.ts` — backward-compatible category
  normalization only if necessary
- `tests/Step3Assessment.logic.test.ts` and focused component/session tests —
  confirmed recovery and no-overwrite cases

The exact state owner must be fixed by the Checkpoint 3 specification before
implementation. The design must avoid a second persistence path.

## Files that must not be modified under the recommended scope

- `src/persistence/draftModel.ts`
- `src/persistence/draftRepository.ts`
- `src/persistence/draftAutosave.ts`
- Step 4 and service-planning components
- Assessment data/options and professional wording sources
- AA01 generation/output code
- Version configuration
- PWA, Service Worker, Supabase, backend, or cross-device-sync files
- `package.json` and `package-lock.json`, unless a later approved spec identifies
  a strictly necessary test dependency

## Estimated regression tests

Estimated 10–12 focused additions/updates:

- Explicit conditional category choice persists through autosave/reload
- “None” selection persists and does not delete hidden answers
- Older drafts without new optional UI state retain current inference behavior
- Current step, section, question, text, multi-choice, and number recovery remain
  unchanged
- Step/section/remount/recovery do not create a new `draftId`
- Long selected values receive a readable mobile readback without changing value
- Footer and adjusted option controls meet the approved minimum target size
- Active section, grouped checkboxes, restored focus, and dialog focus expose the
  approved semantics
- Required phone/tablet/desktop viewport matrix retains no body overflow
- Desktop Step 3 layout and existing 107 tests remain unchanged

## Scope confirmation

- Audit document only: yes
- Production code changed: no
- Step 3 or Step 4 implemented: no
- Draft schema/repository/autosave changed: no
- Assessment wording, branching rules, service planning, or AA01 output changed:
  no
- PWA, Service Worker, Supabase, backend, or cross-device sync added: no
- Checkpoint 3 implementation started: no

## Audit result

**READY FOR SPEC — Option B (local corrections).**

The confirmed P1 issues are reproducible and bounded. No P0 or evidence requiring
a structural Step 3 rewrite was found. Physical-device and assistive-technology
acceptance should be included in the later implementation plan, not treated as
permission to broaden this audit-only change.
