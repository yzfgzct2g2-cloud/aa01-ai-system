# Checkpoint 2 Draft Persistence Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add reliable offline-first IndexedDB draft persistence, an explicit startup recovery gate, safe draft recovery/deletion, and the minimum Step 3 navigation restoration required by the approved Checkpoint 2 specification.

**Architecture:** `DraftRepository.initialize()` is the only IndexedDB initialization/access boundary and persists versioned `LocalDraft` records keyed by `draftId`. A serialized autosave queue observes committed `AA01Form` changes, while a React session hook gates application startup and coordinates recovery without allowing blank state to overwrite stored drafts. UI components receive only typed repository/session callbacks and never access IndexedDB.

**Tech Stack:** React 19, TypeScript 6, Vite 8, `idb@8.0.3`, Node `node:test`, `fake-indexeddb@6.2.5`, `tsx@4.23.1`, and `jsdom@29.1.1`.

## Global Constraints

- Implement Checkpoint 2 only; do not begin Checkpoint 3.
- Do not change assessment wording, assessment options, summary generation, case-profile generation, service planning, or AA01 output.
- Do not add PWA, Service Worker, backend, Supabase, cross-device sync, or Orbikt work.
- Create a draft only after a control formally writes recoverable user data to `AA01Form`; navigation and UI disclosure state alone never create a draft.
- `DraftStatus` is exactly `"draft" | "completed" | "discarded"`.
- A new draft starts at `revision: 1`; each later successful overwrite increments revision exactly once.
- `schemaVersion` is `1`; incompatible or failed migration preserves the original stored record.
- Structured input saves immediately; free text uses a 500 ms trailing debounce.
- Step changes flush pending data before saving navigation metadata; `pagehide` and `visibilitychange` perform best-effort flushes.
- The recovery choice must complete before the normal form or Step 3 can render.
- Use the existing `node:test` runner and retain all 52 baseline tests.
- Add at least 24 new tests.
- The user requires one final commit. Do not create intermediate task commits; amend the unpublished specification commit at the final verified step.

---

### Task 1: Dependencies and Versioned Draft Model

**Files:**
- Modify: `package.json`
- Modify: `package-lock.json`
- Create: `src/persistence/draftModel.ts`
- Create: `tests/draftModel.test.ts`

**Interfaces:**
- Consumes: `AA01Form` from `src/types.ts` and `SectionKey` from `src/Components/Step3Assessment.logic.ts`.
- Produces: `DraftStatus`, `DraftProgress`, `LocalDraft`, `DraftSummary`, `DRAFT_SCHEMA_VERSION`, `hasRecoverableUserInput`, `createLocalDraft`, `migrateDraft`, and `toDraftSummary`.

- [ ] **Step 1: Install exact approved dependencies**

Run:

```text
npm install idb@8.0.3
npm install --save-dev fake-indexeddb@6.2.5 tsx@4.23.1 jsdom@29.1.1
```

Then change the test script to:

```json
"test": "node --import tsx --test"
```

Expected: lockfile records only these Checkpoint 2 dependencies and their transitive packages.

- [ ] **Step 2: Write failing draft-model tests**

Create `tests/draftModel.test.ts` with focused tests equivalent to:

```ts
import assert from "node:assert/strict";
import test from "node:test";
import {
  DRAFT_SCHEMA_VERSION,
  UnsupportedDraftVersionError,
  createLocalDraft,
  hasRecoverableUserInput,
  migrateDraft,
} from "../src/persistence/draftModel.ts";

test("空白表單與導覽操作不構成可還原輸入", () => {
  assert.equal(hasRecoverableUserInput({}), false);
});

test("正式寫入 AA01Form 的欄位會建立可還原輸入", () => {
  assert.equal(hasRecoverableUserInput({ caseName: "王小明" }), true);
  assert.equal(hasRecoverableUserInput({ assessmentAnswers: {
    C1: { questionId: "C1", type: "single", value: "1" },
  } }), true);
});

test("新草稿使用 schema 1、draft 狀態與 revision 1", () => {
  const draft = createLocalDraft({
    draftId: "draft-a",
    form: { caseName: "王小明" },
    currentStep: 2,
    currentSection: "C",
    currentQuestion: "C1",
    progress: { answered: 1, total: 10, percent: 10 },
    now: "2026-07-21T12:00:00.000Z",
  });
  assert.equal(draft.schemaVersion, DRAFT_SCHEMA_VERSION);
  assert.equal(draft.status, "draft");
  assert.equal(draft.revision, 1);
});

test("舊草稿補上安全預設值且保留完整表單", () => {
  const migrated = migrateDraft({
    draftId: "legacy",
    form: { assessmentAnswers: {
      H1e1: { questionId: "H1e1", type: "multi", value: ["01"] },
    } },
    status: "in-progress",
    createdAt: "2026-07-20T00:00:00.000Z",
    updatedAt: "2026-07-20T00:00:00.000Z",
  });
  assert.equal(migrated.status, "draft");
  assert.equal(migrated.revision, 1);
  assert.deepEqual(migrated.form.assessmentAnswers?.H1e1.value, ["01"]);
});

test("較新 schema 拒絕載入但不改寫輸入物件", () => {
  const raw = { draftId: "future", form: {}, schemaVersion: 2 };
  assert.throws(() => migrateDraft(raw), UnsupportedDraftVersionError);
  assert.equal(raw.schemaVersion, 2);
});
```

Add separate assertions for display-name fallback, missing navigation defaults,
missing progress defaults, and malformed records.

- [ ] **Step 3: Run the model test and verify RED**

Run:

```text
node --import tsx --test tests/draftModel.test.ts
```

Expected: FAIL because `src/persistence/draftModel.ts` does not exist.

- [ ] **Step 4: Implement the minimal draft model**

Implement these exact public shapes in `src/persistence/draftModel.ts`:

```ts
export const DRAFT_SCHEMA_VERSION = 1 as const;
export const DRAFT_STATUSES = ["draft", "completed", "discarded"] as const;
export type DraftStatus = (typeof DRAFT_STATUSES)[number];

export interface DraftProgress {
  answered: number;
  total: number;
  percent: number;
}

export interface LocalDraft {
  draftId: string;
  caseId: string | null;
  displayName: string;
  form: AA01Form;
  currentStep: number;
  currentSection: SectionKey | null;
  currentQuestion: string | null;
  progress: DraftProgress;
  status: DraftStatus;
  revision: number;
  schemaVersion: typeof DRAFT_SCHEMA_VERSION;
  createdAt: string;
  updatedAt: string;
  lastOpenedAt: string;
}

export type DraftSummary = Omit<LocalDraft, "form" | "currentQuestion" | "createdAt" | "lastOpenedAt">;

export class UnsupportedDraftVersionError extends Error {}
export class DraftMigrationError extends Error {}

export function hasRecoverableUserInput(form: AA01Form): boolean;
export function createLocalDraft(input: {
  draftId: string;
  form: AA01Form;
  currentStep: number;
  currentSection: SectionKey | null;
  currentQuestion: string | null;
  progress: DraftProgress;
  now?: string;
}): LocalDraft;
export function migrateDraft(raw: unknown): LocalDraft;
export function toDraftSummary(draft: LocalDraft): DraftSummary;
```

`hasRecoverableUserInput` recursively treats non-empty strings, finite numbers,
booleans, non-empty arrays, and nested objects containing one of those values as
recoverable. It returns false for `undefined`, `null`, empty strings, empty
arrays, and empty objects. `migrateDraft` maps legacy `in-progress` to `draft`,
never mutates `raw`, and rejects future versions before applying defaults.

- [ ] **Step 5: Run focused and full tests and verify GREEN**

Run:

```text
node --import tsx --test tests/draftModel.test.ts
npm test
```

Expected: all new model tests and the original 52 tests pass.

---

### Task 2: IndexedDB Repository with Atomic Revision Handling

**Files:**
- Create: `src/persistence/draftRepository.ts`
- Create: `tests/draftRepository.test.ts`

**Interfaces:**
- Consumes: `LocalDraft`, `DraftSummary`, and `migrateDraft` from `draftModel.ts`; `openDB`, `IDBPDatabase`, and `DBSchema` from `idb`.
- Produces: `DraftRepository.initialize()`, `saveDraft`, `loadDraft`, `listDrafts`, `deleteDraft`, `updateDraftMetadata`, and `getMostRecentDraft`.

- [ ] **Step 1: Write failing repository tests with isolated fake databases**

Create `tests/draftRepository.test.ts`, import `fake-indexeddb/auto` before the
repository, and use a unique name per test:

```ts
import "fake-indexeddb/auto";
import assert from "node:assert/strict";
import test from "node:test";
import { DraftRepository } from "../src/persistence/draftRepository.ts";
import { createLocalDraft } from "../src/persistence/draftModel.ts";

const dbName = () => `aa01-test-${crypto.randomUUID()}`;

test("initialize 建立資料庫並可保存及載入 revision 1 草稿", async () => {
  const repository = await DraftRepository.initialize(dbName());
  const draft = createLocalDraft({
    draftId: "a", form: { caseName: "甲" }, currentStep: 0,
    currentSection: null, currentQuestion: null,
    progress: { answered: 0, total: 0, percent: 0 },
  });
  const saved = await repository.saveDraft(draft);
  assert.equal(saved.revision, 1);
  assert.deepEqual(await repository.loadDraft("a"), saved);
});

test("同一 draftId 每次成功覆寫只增加一次 revision", async () => {
  const repository = await DraftRepository.initialize(dbName());
  const first = await repository.saveDraft(createLocalDraft({
    draftId: "a", form: { caseName: "甲" }, currentStep: 0,
    currentSection: null, currentQuestion: null,
    progress: { answered: 0, total: 0, percent: 0 },
  }));
  const second = await repository.saveDraft({ ...first, form: { caseName: "乙" } });
  assert.equal(second.revision, 2);
});
```

Add separate tests for newest-first draft-only listing, most-recent lookup,
metadata updates preserving form data, physical deletion, two-ID isolation,
future-schema load failure preserving raw data, and failed delete/load behavior.

- [ ] **Step 2: Run repository tests and verify RED**

Run:

```text
node --import tsx --test tests/draftRepository.test.ts
```

Expected: FAIL because `DraftRepository` is not implemented.

- [ ] **Step 3: Implement the repository as the only IndexedDB entry point**

Implement a class with a private constructor:

```ts
export class DraftRepository {
  private constructor(private readonly database: IDBPDatabase<DraftDatabase>) {}

  static async initialize(databaseName = "aa01-local-drafts") {
    const database = await openDB<DraftDatabase>(databaseName, 1, {
      upgrade(db) {
        if (!db.objectStoreNames.contains("drafts")) {
          const store = db.createObjectStore("drafts", { keyPath: "draftId" });
          store.createIndex("updatedAt", "updatedAt");
          store.createIndex("status", "status");
        }
      },
    });
    return new DraftRepository(database);
  }

  async saveDraft(draft: LocalDraft): Promise<LocalDraft>;
  async loadDraft(draftId: string): Promise<LocalDraft>;
  async listDrafts(): Promise<DraftSummary[]>;
  async deleteDraft(draftId: string): Promise<void>;
  async updateDraftMetadata(draftId: string, patch: DraftMetadataPatch): Promise<LocalDraft>;
  async getMostRecentDraft(): Promise<DraftSummary | null>;
}
```

`saveDraft` uses one read-write transaction: read the existing record, set
revision to `1` for a new key or `existing.revision + 1` for an overwrite, put
the complete record, await both `put` and `tx.done`, then return that exact
persisted value. All other data operations go through this class.

- [ ] **Step 4: Run focused and full tests and verify GREEN**

Run:

```text
node --import tsx --test tests/draftRepository.test.ts
npm test
```

Expected: repository tests and all prior tests pass with zero failures.

---

### Task 3: Serialized Autosave Queue and Save Policy

**Files:**
- Create: `src/persistence/draftAutosave.ts`
- Create: `tests/draftAutosave.test.ts`

**Interfaces:**
- Consumes: `AA01Form`, `LocalDraft`, and a save function `(draft) => Promise<LocalDraft>`.
- Produces: `classifyFormChange`, `DraftSaveQueue`, `DraftSaveState`, `schedule`, `flush`, and `retry`.

- [ ] **Step 1: Write failing save-policy and queue tests**

Create `tests/draftAutosave.test.ts` with at least these behaviors:

```ts
test("single 與 multi 評估答案要求立即保存", () => {
  assert.equal(classifyFormChange({}, {
    assessmentAnswers: { C1: { questionId: "C1", type: "single", value: "1" } },
  }), "immediate");
});

test("text 評估答案採 500ms debounce", () => {
  assert.equal(classifyFormChange({}, {
    assessmentAnswers: { G1a: { questionId: "G1a", type: "text", value: "說明" } },
  }), "debounced");
});

test("較舊寫入不會晚完成後覆蓋較新 snapshot", async () => {
  const persisted: string[] = [];
  const queue = new DraftSaveQueue(async (draft) => {
    persisted.push(draft.form.caseName ?? "");
    return { ...draft, revision: draft.revision + 1 };
  }, { debounceMs: 5 });
  queue.schedule(makeDraft("舊"), "immediate");
  queue.schedule(makeDraft("新"), "immediate");
  await queue.flush();
  assert.equal(persisted.at(-1), "新");
});
```

Add separate tests for debounce coalescing, explicit flush, failure retaining
the newest pending snapshot, retry, and successful revision propagation.

- [ ] **Step 2: Run autosave tests and verify RED**

Run:

```text
node --import tsx --test tests/draftAutosave.test.ts
```

Expected: FAIL because the autosave module does not exist.

- [ ] **Step 3: Implement the save classifier and serialized queue**

Implement:

```ts
export type SaveMode = "immediate" | "debounced";
export type DraftSaveState = "idle" | "unsaved" | "saving" | "saved" | "error";

export function classifyFormChange(previous: AA01Form, next: AA01Form): SaveMode;

export class DraftSaveQueue {
  constructor(
    save: (draft: LocalDraft) => Promise<LocalDraft>,
    options?: {
      debounceMs?: number;
      onStateChange?: (state: DraftSaveState, saved?: LocalDraft, error?: Error) => void;
    }
  );
  schedule(draft: LocalDraft, mode: SaveMode): void;
  flush(): Promise<LocalDraft | null>;
  retry(): Promise<LocalDraft | null>;
  hasPending(): boolean;
}
```

The queue keeps one latest pending snapshot, distinguishes a debounce-pending
snapshot from a ready snapshot, and permits only one drain at a time. A failed
write restores the newest snapshot to pending state and reports `error` without
changing its revision.

- [ ] **Step 4: Run focused and full tests and verify GREEN**

Run:

```text
node --import tsx --test tests/draftAutosave.test.ts
npm test
```

Expected: autosave tests and all prior tests pass.

---

### Task 4: Recovery Gate and Draft List UI

**Files:**
- Create: `src/Components/DraftRecoveryGate.tsx`
- Create: `src/Components/DraftRecoveryGate.css`
- Create: `tests/draftRecoveryGate.test.ts`

**Interfaces:**
- Consumes: `DraftSummary` plus callbacks `onContinue`, `onRefresh`, and `onDelete`.
- Produces: a mobile-first recovery gate that owns only featured/list/confirm presentation state.

- [ ] **Step 1: Write failing DOM interaction tests**

Create a JSDOM harness that installs `window`, `document`, `HTMLElement`, and
`Event` on `globalThis`, mounts with `createRoot`, and uses React `act`.
Tests must verify:

```ts
test("一筆草稿顯示恢復畫面且繼續為主要操作", async () => { /* assert text/buttons */ });
test("多筆草稿先顯示最近更新的一筆", async () => { /* newest summary */ });
test("查看草稿清單依 updatedAt 由新到舊", async () => { /* card order */ });
test("選定草稿才呼叫 onContinue", async () => { /* exact draftId */ });
test("第一次捨棄只顯示頁內確認且不刪除", async () => { /* no delete */ });
test("取消捨棄保留草稿", async () => { /* card remains */ });
test("刪除失敗保留草稿並顯示錯誤", async () => { /* rejection */ });
```

The test for the warning text must assert the exact approved sentence.

- [ ] **Step 2: Run recovery-gate tests and verify RED**

Run:

```text
node --import tsx --test tests/draftRecoveryGate.test.ts
```

Expected: FAIL because the recovery gate component does not exist.

- [ ] **Step 3: Implement the minimal recovery component and styles**

Use this public prop boundary:

```ts
interface DraftRecoveryGateProps {
  drafts: DraftSummary[];
  loading?: boolean;
  error?: string | null;
  onContinue: (draftId: string) => Promise<void>;
  onRefresh: () => Promise<void>;
  onDelete: (draftId: string) => Promise<void>;
}
```

The component sorts a copied array by `updatedAt` descending, initially shows
the first card, and renders stacked cards in list mode. `繼續填寫` is primary,
`查看草稿清單` secondary, and `捨棄草稿` a low-emphasis danger link/button.
The inline confirmation contains exactly:

```text
捨棄後，這份草稿將從此裝置刪除，且目前沒有雲端備份。
```

Use at least 44 px control height, one-column mobile layout, no tables, no
hover dependency, and `aria-live` for errors.

- [ ] **Step 4: Run focused and full tests and verify GREEN**

Run:

```text
node --import tsx --test tests/draftRecoveryGate.test.ts
npm test
```

Expected: recovery UI tests and all prior tests pass.

---

### Task 5: Draft Session Hook, Startup Gate, and Step 3 Navigation Restore

**Files:**
- Create: `src/hooks/useDraftSession.ts`
- Create: `tests/draftSession.test.ts`
- Modify: `src/App.tsx`
- Modify: `src/Components/Step3Assessment.tsx`

**Interfaces:**
- Consumes: `DraftRepository.initialize`, `DraftSaveQueue`, current `AA01Form`, step, section, question, and hydration callback.
- Produces: startup state, summaries, save state/time, recovery actions, navigation setters, flush, and retry.

- [ ] **Step 1: Write failing session lifecycle tests**

Test the hook through a small JSDOM harness with an injected repository
initializer. Cover at least:

```ts
test("啟動查到草稿時維持 recovery 且不呼叫空白表單 hydration", async () => {});
test("continue 完整恢復 form、step、section、question 與原 draftId", async () => {});
test("載入失敗保留 recovery gate 且不 hydration", async () => {});
test("未有正式 AA01Form 輸入時 step/section/focus 不建立 draft", async () => {});
test("首次正式輸入建立一次 ID，後續 remount 與 step 變更沿用", async () => {});
test("不同 draftId 的 continue 不會互相覆蓋", async () => {});
test("pagehide 與 step 切換呼叫 flush", async () => {});
```

Use in-memory fake repository objects only for lifecycle failure injection;
repository correctness remains covered by real fake-indexeddb tests.

- [ ] **Step 2: Run session tests and verify RED**

Run:

```text
node --import tsx --test tests/draftSession.test.ts
```

Expected: FAIL because `useDraftSession` does not exist.

- [ ] **Step 3: Implement `useDraftSession`**

Expose:

```ts
interface DraftHydration {
  form: AA01Form;
  currentStep: number;
  currentSection: SectionKey | null;
  currentQuestion: string | null;
}

interface UseDraftSessionResult {
  startupState: "checking" | "recovery" | "ready" | "error";
  drafts: DraftSummary[];
  startupError: string | null;
  saveState: DraftSaveState;
  lastSavedAt: string | null;
  setCurrentSection: (section: SectionKey | null) => void;
  setCurrentQuestion: (questionId: string | null) => void;
  continueDraft: (draftId: string) => Promise<void>;
  deleteDraft: (draftId: string) => Promise<void>;
  refreshDrafts: () => Promise<void>;
  retrySave: () => Promise<void>;
  flush: () => Promise<void>;
}
```

The hook accepts an optional `initializeRepository` dependency, defaulting to
`DraftRepository.initialize`, and an `onHydrate` callback. It persists only the
last draft ID plus step/section/question hints in localStorage. It suppresses
autosave during hydration, observes committed form state, creates an ID only
when `hasRecoverableUserInput(form)` first becomes true, and registers
`visibilitychange`/`pagehide` flush listeners with cleanup.

- [ ] **Step 4: Integrate the startup gate in `App.tsx`**

Keep the existing shared `form` data shape. Add controlled section/question
state, initialize the draft session, and render in this order:

```tsx
if (startupState === "checking") return <main>正在檢查此裝置上的草稿…</main>;
if (startupState === "error") return <main>{/* error and retry only */}</main>;
if (startupState === "recovery") {
  return <DraftRecoveryGate drafts={drafts} onContinue={continueDraft}
    onRefresh={refreshDrafts} onDelete={deleteDraft} />;
}
return <main>{/* existing app and steps */}</main>;
```

Normal steps must not be present in the DOM before `ready`. Preserve the
existing `AA01Form` instance on continue and do not call `setForm({})` as an
error fallback.

- [ ] **Step 5: Add only the approved Step 3 navigation props**

Extend `Step3AssessmentProps` with:

```ts
currentSection?: SectionKey | null;
currentQuestion?: string | null;
onSectionChange?: (section: SectionKey | null) => void;
onQuestionChange?: (questionId: string) => void;
onProgressChange?: (progress: DraftProgress) => void;
```

Preserve the existing default open section when no restored section exists.
Report section changes from current handlers, report a question on focus or
answer interaction, add a stable DOM ID per question, and use one effect to
best-effort focus/scroll the restored visible question. Do not change question
controls, categories, wording, conditional behavior, or CSS layout.

- [ ] **Step 6: Run focused, full, lint, and build checks**

Run:

```text
node --import tsx --test tests/draftSession.test.ts tests/draftRecoveryGate.test.ts
npm test
npm run lint
npm run build
```

Expected: at least 76 total tests, zero failures, lint exit 0, and build exit 0.

---

### Task 6: Documentation, Security Review, Single Commit, and Push

**Files:**
- Modify: `docs/MOBILE-FIELD-PERSISTENCE.md`
- Create: `docs/superpowers/plans/2026-07-21-checkpoint-2-draft-persistence.md`
- Review: every file changed since `118e732893eef553bc2f6284cd9c6fd9d08217f2`

**Interfaces:**
- Consumes: verified implementation behavior and test evidence.
- Produces: final Checkpoint 2 documentation, one commit relative to baseline, and a push to the existing repository strategy.

- [ ] **Step 1: Update the implementation record**

In `docs/MOBILE-FIELD-PERSISTENCE.md`, retain the approved design and append
only verified implementation facts: exact dependency versions, final file
layout, autosave behavior, recovery behavior, tests, and known limitations.
Do not add future architecture planning.

- [ ] **Step 2: Run fresh completion verification**

Run exactly:

```text
npx tsc -b
npm run lint
npm test
npm run build
git diff --check
git status --short
git diff 118e732893eef553bc2f6284cd9c6fd9d08217f2
```

Confirm no PDF, `.local-reference`, personal data, secret, unrelated file,
PWA, backend, Supabase, Orbikt, service-planning, or AA01 output change exists.

- [ ] **Step 3: Create the required single commit**

Because the approved spec commit is local and unpublished, stage the complete
Checkpoint 2 change and amend it so the repository has exactly one commit after
the baseline:

```text
git add package.json package-lock.json src tests docs
git commit --amend -m "feat: add offline-first draft persistence"
git rev-list --count 118e732893eef553bc2f6284cd9c6fd9d08217f2..HEAD
```

Expected: commit count is `1`.

- [ ] **Step 4: Verify the committed tree and push without force**

Run the full verification commands again from the committed tree, then:

```text
git push origin main
```

If the push fails, keep the local commit unchanged, stop, and report the exact
failure. Never force push.

- [ ] **Step 5: Stop at Checkpoint 2**

Report using the user's `Checkpoint 2 Implementation Report` format. Do not
start Checkpoint 3 or propose implementation of PWA, backend, Supabase, or UI
accordion work.
