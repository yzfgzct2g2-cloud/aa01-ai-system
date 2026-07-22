# Phase 4-1 Step 1 Basic Data Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the three Step 1 free-text fields with compatible native controls while preserving old drafts and canonicalizing identity output.

**Architecture:** Pure compatibility helpers derive safe control values without changing `AA01Form`; the UI writes canonical values only after user interaction. A shared identity option module supplies both Step 1 and AA01 output now and Step 4 later, while the existing draft repository and autosave lifecycle remain unchanged.

**Tech Stack:** React 19, TypeScript 6, native HTML date/select controls, node:test, JSDOM, existing IndexedDB draft persistence.

## Global Constraints

- Implement Phase 4-1 only and stop after its report.
- Keep IndexedDB `schemaVersion` at `1`; add no persistence system or migration write.
- Store new assessment dates as `YYYY-MM-DD`, CMS as `"2"`–`"8"`, and identity as `class1`–`class3`.
- Do not guess, clear, or overwrite unknown legacy values during render or recovery.
- Do not modify Step 3 or Step 4.
- Preserve and do not stage the pre-existing `package.json` `vite --host` change.
- Produce exactly one commit: `feat: improve step 1 basic data inputs`.

---

### Task 1: Pure compatibility and identity boundaries

**Files:**
- Create: `src/data/identityOptions.ts`
- Create: `src/Components/Step1Basic.logic.ts`
- Create: `tests/step1BasicCompatibility.test.ts`

**Interfaces:**
- Consumes: historic runtime values typed as `unknown`.
- Produces: `IDENTITY_OPTIONS`, `IdentityTypeValue`, `formatIdentityType`, and three pure `resolveLegacy*` functions returning `LegacyFieldResolution`.

- [ ] **Step 1: Write resolver tests before production code**

Cover canonical ISO and slash/ROC dates, invalid and ambiguous dates, CMS
Arabic/Chinese variants and 2–8 boundaries, all approved identity aliases,
unknown strings, empty values, `Date` runtime values, and input non-mutation.
Assertions must verify both `normalizedValue` and `needsUserSelection`.

- [ ] **Step 2: Run the focused test and verify RED**

Run: `node --import tsx --test tests/step1BasicCompatibility.test.ts`

Expected: FAIL because the new modules do not exist.

- [ ] **Step 3: Implement the smallest pure modules**

Define:

```ts
export interface LegacyFieldResolution {
  normalizedValue: string;
  originalValue: string;
  isValid: boolean;
  isLegacy: boolean;
  needsUserSelection: boolean;
}

export function resolveLegacyAssessmentDate(value: unknown): LegacyFieldResolution;
export function resolveLegacyCmsLevel(value: unknown): LegacyFieldResolution;
export function resolveLegacyIdentityType(value: unknown): LegacyFieldResolution;
```

Use explicit regular expressions and calendar validation, not free-form
`Date.parse`. Return new objects and never alter the supplied value.

- [ ] **Step 4: Run the focused test and verify GREEN**

Run: `node --import tsx --test tests/step1BasicCompatibility.test.ts`

Expected: all compatibility tests pass.

### Task 2: Controlled Step 1 native controls and legacy warnings

**Files:**
- Modify: `src/Components/Step1Basic.tsx`
- Create: `tests/step1Basic.test.ts`

**Interfaces:**
- Consumes: the three resolver results and `IDENTITY_OPTIONS`.
- Produces: controlled native date/CMS/identity controls and non-mutating legacy warnings.

- [ ] **Step 1: Write render and interaction tests before UI code**

Use server rendering for markup/options and JSDOM for interaction. Assert:

```ts
assert.equal(dateInput.type, "date");
assert.deepEqual(cmsValues, ["", "2", "3", "4", "5", "6", "7", "8"]);
assert.deepEqual(identityValues, ["", "class1", "class2", "class3"]);
```

Also assert recognized legacy values display canonically without calling
`setForm`, unknown values display their exact warning, selecting a valid value
replaces only its field and removes the warning after rerender, and later form
data remains unchanged.

- [ ] **Step 2: Run the focused UI test and verify RED**

Run: `node --import tsx --test tests/step1Basic.test.ts`

Expected: FAIL because Step 1 still renders three unrestricted text inputs.

- [ ] **Step 3: Implement the minimal controlled UI**

Resolve each field once per render. Bind `value` to `normalizedValue`; bind
`onChange` to the existing immutable top-level update. Render the two-line
warning only when `needsUserSelection` is true. Add stable labels/testable
names without adding custom controls or viewport logic.

- [ ] **Step 4: Run the focused UI test and verify GREEN**

Run: `node --import tsx --test tests/step1Basic.test.ts`

Expected: all Step 1 UI tests pass without React controlled-input warnings.

### Task 3: Autosave, recovery, output, and version

**Files:**
- Modify: `src/rules/aa01Generator.ts`
- Modify: `src/persistence/draftAutosave.ts`
- Modify: `src/config/version.ts`
- Modify: `tests/aa01SystemPrompts.test.ts`
- Modify: `tests/draftAutosave.test.ts`
- Modify: `tests/draftModel.test.ts`
- Modify: `tests/draftSession.test.ts`

**Interfaces:**
- Consumes: `formatIdentityType` and the unchanged `AA01Form`/draft session.
- Produces: human-readable identity output, version `1.6.6`, and regression evidence for persistence compatibility.

- [ ] **Step 1: Add failing integration assertions**

Assert `class1`, `class2`, and `class3` output only their Chinese labels;
recognized legacy aliases output the same labels; CMS and identity select
changes are immediate; a schema-1 old form is cloned without normalization;
recovery hydrates the exact legacy form, and any existing `lastOpenedAt`
metadata save keeps the three original legacy field values unchanged.

- [ ] **Step 2: Run affected tests and verify RED**

Run: `node --import tsx --test tests/aa01SystemPrompts.test.ts tests/draftAutosave.test.ts tests/draftModel.test.ts tests/draftSession.test.ts`

Expected: output tests fail because canonical identity keys are currently
printed directly; persistence tests that describe existing behavior pass.

- [ ] **Step 3: Apply the minimal output and version changes**

Wrap only `form.identityType` with `formatIdentityType` in the existing AA01
basic-data line. Remove `cmsLevel` and `identityType` from
`FREE_TEXT_TOP_LEVEL`, leaving text fields debounced. Set `APP_VERSION` to
`1.6.6` and keep `LAST_UPDATE` at `2026-07-22`. Do not modify draft schemas or
hydration code.

- [ ] **Step 4: Run affected tests and verify GREEN**

Run the same four-file command and expect zero failures.

### Task 4: Full verification, browser checks, single commit, and push

**Files:**
- Review: every Phase 4-1 path above and `src/config/version.ts`
- Exclude: `package.json`

**Interfaces:**
- Consumes: the complete Phase 4-1 working tree.
- Produces: one verified commit pushed to `origin/main`.

- [ ] **Step 1: Run fresh automated verification**

Run, separately, `npm test`, `npm run lint`, `npm run build`, and
`git diff --check`. Require zero failures/errors.

- [ ] **Step 2: Verify scope and dirty-file isolation**

Run `git status --short`, `git diff --stat`, `git diff -- src tests docs`, and
`git diff -- package.json`. Confirm the package change is still the sole
pre-existing excluded change and no Step 3/Step 4 source changed.

- [ ] **Step 3: Validate real browser behavior**

Start the existing Vite app without editing package configuration. Check Step
1 at 1366×768 and the required mobile sizes, including legacy warnings,
date/select interaction, refresh/recovery, and absence of console errors.

- [ ] **Step 4: Update the version-only expected test if required and rerun all verification**

Any test fixture that reads `APP_VERSION` must derive it from the config. Run
all commands from Step 1 again after the final edit.

- [ ] **Step 5: Stage only Phase 4-1 files and create one commit**

Use explicit paths; never use `git add .`. Commit with exactly:

```text
feat: improve step 1 basic data inputs
```

Confirm `package.json` remains unstaged before and after the commit.

- [ ] **Step 6: Verify the committed tree and push**

Run the full automated verification once more, then `git push origin main`.
Report the final commit, test count, browser evidence, push result, and dirty
`package.json`; stop before Phase 4-2.
