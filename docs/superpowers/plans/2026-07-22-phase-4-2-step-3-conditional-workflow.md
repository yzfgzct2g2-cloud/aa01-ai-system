# Phase 4-2 Step 3 Conditional Assessment Workflow Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make Step 3 conditional questions, user-triggered navigation, summaries, and AA01 output obey one shared set of rules while preserving every hidden draft answer.

**Architecture:** A UI-independent rules module derives active question IDs and an effective-answer view without mutating the saved form. Step 3 renders those active IDs and uses component-owned refs plus a one-shot user-action ref for scroll/focus; summary, care-problem, and AA01 consumers use the same effective-answer view.

**Tech Stack:** React 19, TypeScript 6, native form controls, node:test, JSDOM, existing IndexedDB/idb draft persistence, Vite 8.

## Global Constraints

- Work on the explicitly authorized `main` branch from baseline `bda6d4c4571d834502b370825e7f4ae351fda64e`.
- Implement Phase 4-2 only; do not start Phase 4-3.
- G category selection is the panel expansion state; add no second accordion state.
- Recovery renders selected content but never triggers scroll or focus.
- Keep hidden answers in `AA01Form`, drafts, and IndexedDB; filter only derived UI/output views.
- Do not change `AA01Form`, `LocalDraft`, IndexedDB schema version, migration, repository, or autosave architecture.
- Use stable option codes and explicit dependent question-ID sets for new conditional rules.
- Product scroll/focus code uses React refs and one user-action flag; no global DOM lookup, viewport state, resize listener, fixed-pixel scroll, or `setTimeout`.
- `G4d-score` remains loadable but is permanently absent from UI, progress, summaries, and AA01 output.
- Keep H1b codes `"01"` through `"11"` and exact approved option order.
- Set version to `1.7.0` and update date to `2026-07-22`.
- Preserve the pre-existing unstaged `package.json` `vite --host` change and never stage it.
- Final history must contain one Phase 4-2 commit with exact message `feat: improve conditional assessment workflow`; amend the temporary design commit rather than creating another final commit.

---

### Task 1: Baseline evidence and pure conditional rules

**Files:**
- Create: `src/rules/step3ConditionalAssessment.ts`
- Create: `tests/step3ConditionalAssessment.test.ts`
- Modify: `src/Components/Step3Assessment.logic.ts`
- Modify: `tests/Step3Assessment.logic.test.ts`

**Interfaces:**
- Consumes: `Record<string, AssessmentAnswer>`, optional `AssessmentCategorySelections`, stable question IDs, and stable option codes.
- Produces:

```ts
export function isPositiveMeasurement(value: unknown): boolean;
export function shouldShowMemoryQuestions(
  answers: Record<string, AssessmentAnswer>
): boolean;
export function isStep3QuestionEffective(
  questionId: string,
  answers: Record<string, AssessmentAnswer>,
  categorySelections?: AssessmentCategorySelections
): boolean;
export function getEffectiveStep3QuestionIds(
  questionIds: string[],
  answers: Record<string, AssessmentAnswer>,
  categorySelections?: AssessmentCategorySelections
): string[];
export function getEffectiveAssessmentAnswers(
  answers: Record<string, AssessmentAnswer>,
  categorySelections?: AssessmentCategorySelections
): Record<string, AssessmentAnswer>;
```

- `Step3Assessment.logic.ts` re-exports shared category definitions and selection helpers so existing component/test imports remain compatible.

- [ ] **Step 1: Record baseline verification before production changes**

Run:

```powershell
npm test
git status --short
git log -1 --oneline
```

Expected: 179 tests pass; HEAD is the temporary design commit whose parent is the required baseline; only `package.json` is dirty.

- [ ] **Step 2: Write failing pure-rule tests**

Create table-driven tests that use real `AssessmentAnswer` objects and assert:

```ts
assert.equal(shouldShowMemoryQuestions({
  D0: single("D0", "3"),
}), false);
assert.equal(shouldShowMemoryQuestions({
  D0: single("D0", "1"),
}), true);

assert.equal(isPositiveMeasurement("165"), true);
assert.equal(isPositiveMeasurement(60), true);
for (const value of ["", "abc", 0, -1, null, undefined]) {
  assert.equal(isPositiveMeasurement(value), false);
}

assert.equal(isStep3QuestionEffective("G2b", {
  G2a: single("G2a", "1"),
}, { G: ["skin"] }), false);
assert.equal(isStep3QuestionEffective("G2b", {
  G2a: single("G2a", "2"),
}, { G: ["skin"] }), true);

assert.equal(isStep3QuestionEffective("G4d-score", {}, {
  G: ["nutrition"],
}), false);
```

Cover the exact D1 set; height and weight alternative sets; three G4d Other
fields with code `"3"`; G4e code `"2"` plus disease-note mappings
`08/21/22/24`; G5-items code `"2"`; selected, unselected, none, and legacy
inferred G/H/I categories; nullish/empty data; and old drafts without category
state.

For effective-answer filtering, freeze the input object, call the helper, and
assert both conditions:

```ts
assert.equal(result.G2b, undefined);
assert.deepEqual(source, originalSnapshot);
```

- [ ] **Step 3: Run focused tests and verify RED**

Run:

```powershell
node --import tsx --test tests/step3ConditionalAssessment.test.ts tests/Step3Assessment.logic.test.ts
```

Expected: fail because the shared rules module and composed effective-answer helpers do not exist.

- [ ] **Step 4: Implement the smallest shared rule module**

Move the existing `conditionalCategories`, prefix membership utility,
`inferSelectedCategories`, and `resolveCategorySelections` into the new rules
module and re-export them from component logic. Preserve existing public
behavior.

Use small stable-value helpers:

```ts
function selectedCodes(answer?: AssessmentAnswer): string[] {
  if (!answer) return [];
  if (Array.isArray(answer.value)) return answer.value;
  return typeof answer.value === "string" && answer.value ? [answer.value] : [];
}

function isSelected(
  answers: Record<string, AssessmentAnswer>,
  questionId: string,
  code: string
) {
  return selectedCodes(answers[questionId]).includes(code);
}
```

Define explicit constant sets for D1, G2 abnormal, height alternatives, weight
alternatives, G4d Other mappings, G4e supplemental mappings, and G5-items.
Compose category membership first, then parent-child rules, and always return
false for `G4d-score`.

Implement filtering without mutation:

```ts
return Object.fromEntries(
  Object.entries(answers).filter(([questionId]) =>
    isStep3QuestionEffective(questionId, answers, categorySelections)
  )
);
```

Non-Step-3 IDs remain effective unchanged.

- [ ] **Step 5: Run focused tests and verify GREEN**

Run the same two-file test command. Expected: zero failures and no warnings.

- [ ] **Step 6: Review the Task 1 diff**

Confirm the module contains no React/DOM/IndexedDB import, every new dependency
uses stable codes, the input mutation test passes, and `package.json` remains
unstaged.

### Task 2: Step 3 conditional rendering and one-shot React refs

**Files:**
- Modify: `src/Components/Step3Assessment.tsx`
- Modify: `src/Components/Step3Assessment.logic.ts`
- Modify: `tests/step3SelectedValue.test.ts`
- Create: `tests/step3ConditionalWorkflow.test.ts`

**Interfaces:**
- Consumes: `getEffectiveStep3QuestionIds`, category definitions, current answers, and category selections.
- Produces:

```ts
type PendingInteraction =
  | {
      scrollTarget: string | null;
      focusQuestion: string | null;
    }
  | null;

interface QuestionBlockProps {
  controlRef?: (element: HTMLElement | null) => void;
  onUserAnswerChange?: (
    questionId: string,
    nextAnswer: AssessmentAnswer
  ) => void;
}
```

- [ ] **Step 1: Write failing component tests for visibility and G panels**

Extend the JSDOM harness so callers can supply `currentQuestion`, capture
category selections, stub `HTMLElement.prototype.scrollIntoView`, and inspect
`document.activeElement`.

Assert:

- D0 code `"3"` omits D1 questions, changing to `"1"` restores the same answer.
- G category checkbox immediately creates a labelled category panel with its
  first question; there is no nested accordion button.
- unchecking removes that panel without changing `assessmentAnswers`.
- recovered selected G panels render without calling scroll or focus.
- G2, G4 alternatives, three G4d Other fields, G4e disease/note fields,
  G5-items, and G4d-score follow the pure rules.

Use question IDs or accessible labels for assertions, not localized substring
guesses.

- [ ] **Step 2: Write failing interaction tests for one-shot scroll/focus**

For a direct G category check, assert exactly one call:

```ts
assert.deepEqual(scrollCalls, [{
  behavior: "smooth",
  block: "nearest",
}]);
assert.equal(document.activeElement, firstControl);
```

Assert direct G4d Other and G4e supplemental reveals focus their own newly
rendered controls without scrolling. Assert direct G5 `"2"` scrolls and
focuses the first G5 checkbox. Rerender with the same props and assert call
counts do not increase.

Also source-scan product code and reject:

```ts
/document\.(?:querySelector|getElementById)/
/setTimeout/
/window\.innerWidth|addEventListener\(["']resize/
```

- [ ] **Step 3: Run component tests and verify RED**

Run:

```powershell
node --import tsx --test tests/step3ConditionalWorkflow.test.ts tests/step3SelectedValue.test.ts
```

Expected: conditional and interaction assertions fail against the current flat rendering and recovery DOM lookup.

- [ ] **Step 4: Make QuestionBlock expose its first operable control**

Add a callback ref prop. Attach it to the select, textarea, number input, or
only the first checkbox in a multi group:

```tsx
ref={index === 0 ? controlRef : undefined}
```

Call `onUserAnswerChange(question.id, nextAnswer)` inside `saveAnswer` before
the existing immutable state update. Do not change the stored answer shape.

- [ ] **Step 5: Render effective questions and selection-driven G panels**

Apply `getEffectiveStep3QuestionIds` before progress calculation and rendering.
For G only, map selected non-none category definitions to labelled panels and
render that category's active questions inside its panel. Do not create an
accordion state or nested toggle.

H and I retain their existing category UI structure but use the same effective
ID list. D uses the same composed rule so refused D1 questions disappear and
stop counting toward progress.

- [ ] **Step 6: Replace recovery DOM lookup with refs and a user-action gate**

Keep:

```ts
const categoryPanelRefs = useRef<Record<string, HTMLElement | null>>({});
const questionControlRefs = useRef<Record<string, HTMLElement | null>>({});
const pendingInteractionRef = useRef<PendingInteraction>(null);
```

Category and answer event handlers set the pending record only when a direct
action reveals a target. A `useLayoutEffect` consumes it after the render:

```ts
const pending = pendingInteractionRef.current;
if (!pending) return;
pendingInteractionRef.current = null;
if (pending.scrollTarget) {
  targetRefs.current[pending.scrollTarget]?.scrollIntoView({
    behavior: "smooth",
    block: "nearest",
  });
}
questionControlRefs.current[pending.focusQuestion ?? ""]?.focus();
```

Remove the existing recovery `document.getElementById` effect. Preserve
`currentSection` and `currentQuestion` metadata callbacks, but do not use them
to move focus or viewport during mount/recovery.

- [ ] **Step 7: Run component tests and verify GREEN**

Run the same two-file command. Expected: zero failures, no React act warnings,
and scroll/focus call counts remain stable after rerender.

- [ ] **Step 8: Run Task 1 and Task 2 tests together**

Run:

```powershell
node --import tsx --test tests/step3ConditionalAssessment.test.ts tests/Step3Assessment.logic.test.ts tests/step3ConditionalWorkflow.test.ts tests/step3SelectedValue.test.ts
```

Expected: all focused Step 3 rules and UI tests pass together.

### Task 3: Summary, care-problem, and AA01 effective-answer integration

**Files:**
- Modify: `src/rules/assessmentSummary.ts`
- Modify: `src/rules/problemMatrix.ts`
- Modify: `src/rules/aa01Generator.ts`
- Modify: `src/Components/Step5SummaryReview.tsx`
- Modify: `tests/assessmentSummary.test.ts`
- Modify: `tests/problemMatrix.test.ts`
- Modify: `tests/aa01SystemPrompts.test.ts`
- Create: `tests/step3ConditionalOutput.test.ts`

**Interfaces:**
- Consumes: raw answers and optional `AssessmentCategorySelections`.
- Produces compatible optional parameters:

```ts
export function buildAssessmentSummary(
  assessmentAnswers: Record<string, AssessmentAnswer>,
  categorySelections?: AssessmentCategorySelections
): AssessmentSummary;

export function buildCareProblems(
  assessmentAnswers: Record<string, AssessmentAnswer>,
  categorySelections?: AssessmentCategorySelections
): CareProblem[];
```

- [ ] **Step 1: Write failing output tests**

Build forms that deliberately retain now-hidden child answers. For each rule,
assert the raw form still contains the answer while summary and AA01 omit its
unique text:

- D0 refusal with D1 text/summary.
- G2a normal with abnormal skin answers and a skin care-problem trigger.
- complete height/weight with alternative measurements.
- G4d parent not Other with Other text.
- historic `G4d-score`.
- G4e without the relevant disease code and old supplemental text.
- G5a none with selected G5 items.
- unselected/none G/H/I category with retained answers.

Then activate each parent condition and assert the preserved child answer
returns to the summary/output.

- [ ] **Step 2: Run output tests and verify RED**

Run:

```powershell
node --import tsx --test tests/step3ConditionalOutput.test.ts tests/assessmentSummary.test.ts tests/problemMatrix.test.ts tests/aa01SystemPrompts.test.ts
```

Expected: failures show hidden answers and the historic SOF score still leaking into output.

- [ ] **Step 3: Filter summaries and care problems at their boundaries**

At the start of `buildAssessmentSummary` and `buildCareProblems`, derive:

```ts
const effectiveAnswers = getEffectiveAssessmentAnswers(
  assessmentAnswers,
  categorySelections
);
```

Use only `effectiveAnswers` below that boundary. Existing one-argument callers
remain valid.

In Step 5, pass `form.assessmentCategorySelections` to both functions so the
screen uses the same top-level category truth as Step 3.

- [ ] **Step 4: Filter both AA01 generation paths**

Pass `form.assessmentCategorySelections` into summary construction in both
`generateProblemAnalysis` and `buildAA01Draft`. Make the H/I fallback collector
consume the derived effective record rather than raw `form.assessmentAnswers`.
Pass category selections into care-problem construction.

Remove the explicit `G4d-score` lookup and SOF output block entirely:

```ts
const healthSummary = [...assessmentSummary.healthSummary];
```

Do not add a replacement calculation.

- [ ] **Step 5: Run output tests and verify GREEN**

Run the same four-file command. Expected: zero failures, hidden content absent,
reactivated content present, and source forms unchanged.

- [ ] **Step 6: Run all Task 1–3 focused tests**

Run:

```powershell
node --import tsx --test tests/step3ConditionalAssessment.test.ts tests/Step3Assessment.logic.test.ts tests/step3ConditionalWorkflow.test.ts tests/step3SelectedValue.test.ts tests/step3ConditionalOutput.test.ts tests/assessmentSummary.test.ts tests/problemMatrix.test.ts tests/aa01SystemPrompts.test.ts
```

Expected: all focused rules, component, summary, problem, and generator tests pass.

### Task 4: H1b, touch layout, persistence regression, and version

**Files:**
- Modify: `src/data/assessmentOptions.ts`
- Modify: `src/Components/Step3Assessment.css`
- Modify: `src/config/version.ts`
- Modify: `tests/assessmentOptions.test.ts`
- Modify: `tests/draftAutosave.test.ts`
- Modify: `tests/draftSession.test.ts`
- Modify: `tests/step3ConditionalWorkflow.test.ts`

**Interfaces:**
- Consumes: existing H1b question ID and multi-answer update path.
- Produces: 11 exact H1b labels/codes, minimum 44-pixel H1b label targets, safe missing/empty recovery, and version `1.7.0`.

- [ ] **Step 1: Write failing H1b data, UI, and compatibility assertions**

Assert H1b option codes and exact labels:

```ts
assert.deepEqual(h1b.options?.map(({ code }) => code), [
  "01", "02", "03", "04", "05", "06",
  "07", "08", "09", "10", "11",
]);
assert.equal(h1b.options?.[10]?.label, "其他（包含看護）");
```

Render H1b, click two labels, uncheck one, and assert the other code remains.
Recover two codes and assert both boxes are checked. Render with no H1b answer
and assert no crash and zero checked boxes.

Source/CSS assertions require an H1b-specific or shared option rule with
`min-height: 44px`, natural wrapping, `overflow-wrap`, and no fixed width that
can overflow 320px.

Add persistence regression assertions that an H1b multi-answer change is an
immediate assessment save and a recovered schema-1 form retains the same
codes. Do not modify production persistence code unless a failing test proves
the existing path is insufficient. Pass a form with missing H1b and another
with an empty H1b array through the AA01 generator and assert both complete
without throwing.

- [ ] **Step 2: Run H1b/persistence tests and verify RED**

Run:

```powershell
node --import tsx --test tests/assessmentOptions.test.ts tests/step3ConditionalWorkflow.test.ts tests/draftAutosave.test.ts tests/draftSession.test.ts
```

Expected: at minimum the exact eleventh label and 44-pixel target assertions fail.

- [ ] **Step 3: Apply minimal H1b and CSS changes**

Remove only the trailing full-width colon from option 11. Keep the 11 stable
codes and the existing `H1b-other` field unchanged.

Add the narrow-safe touch rule without introducing horizontal dimensions:

```css
.assessment-option {
  box-sizing: border-box;
  min-height: 44px;
  overflow-wrap: anywhere;
}
```

Do not add a select, custom checkbox framework, or new form field.

- [ ] **Step 4: Update version constants**

Set:

```ts
export const APP_VERSION = "1.7.0";
export const LAST_UPDATE = "2026-07-22";
```

Do not change historical documents.

- [ ] **Step 5: Run H1b/persistence tests and verify GREEN**

Run the same four-file command. Expected: all pass with unchanged draft schema
and existing immediate assessment autosave.

### Task 5: Full verification, browser validation, single commit, and push

**Files:**
- Review: all Phase 4-2 source, tests, spec, plan, and version files.
- Exclude: `package.json`.

**Interfaces:**
- Consumes: the complete Phase 4-2 working tree.
- Produces: one verified Phase 4-2 commit pushed to `origin/main`.

- [ ] **Step 1: Run fresh automated verification**

Run separately:

```powershell
npm test
npm run lint
npm run build
git diff --check
```

Expected: all tests pass with zero failures, lint exits 0, TypeScript/Vite build
exits 0, and diff check reports no errors. Record the final test count.

- [ ] **Step 2: Inspect scope, privacy, and dirty-file isolation**

Run:

```powershell
git status --short
git diff --stat HEAD^
git diff HEAD^ -- src tests docs
git diff -- package.json
git diff --cached
```

Confirm no Step 1 or Step 4 source, schema, migration, persistence repository,
real case data, secret, unrelated formatting, or `package.json` is staged.

- [ ] **Step 3: Validate browser workflows**

Start the already configured LAN server without editing package configuration.
Use browser touch emulation at 320x568, 360x800, 390x844, 412x915, and
768x1024, plus desktop 1366x768.

At each relevant size, verify no horizontal overflow and exercise G expansion,
one-shot scroll/focus, H1b wrapping, and navigation. Across the validation
session exercise D0, G2, G4 alternatives, G4d Other, G4e names, G5, autosave,
refresh/recovery, Step 3 to Step 4, Step 3 to Step 5, Step 8 generation and
clipboard, and zero uncaught console errors. Record LAN HTTP separately and
report real-device testing as not performed.

- [ ] **Step 4: Re-run automated verification after browser testing**

Run the same four commands from Step 1 again. No success claim or commit is
allowed without this fresh output.

- [ ] **Step 5: Stage explicit Phase 4-2 paths and amend the design commit**

Use explicit `git add -- <path>` arguments for every intended file. Do not use
`git add .` or stage `package.json`.

Verify the index with:

```powershell
git diff --cached --check
git diff --cached --stat
git status --short
```

Amend the temporary design commit:

```powershell
git commit --amend -m "feat: improve conditional assessment workflow"
```

Expected: one commit exists after baseline, with the exact required message;
`package.json` remains unstaged.

- [ ] **Step 6: Verify the committed result and push**

Run:

```powershell
git log --oneline bda6d4c..HEAD
npm test
npm run lint
npm run build
git diff --check
git status --short
git push origin main
git status --short --branch
```

Require one post-baseline commit, fresh zero-failure verification, a successful
non-force push to `origin/main`, and only the pre-existing `package.json`
working-tree change. Then produce the required Phase 4-2 Report and stop.
