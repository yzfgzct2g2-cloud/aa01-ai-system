# AA01 Mobile Field Persistence

## Scope

This document records the approved design for Checkpoint 2 only: local draft
persistence and explicit draft recovery. It does not authorize the Step 3
mobile accordion redesign, Step 4 responsive redesign, PWA or service-worker
work, a backend, Supabase, cross-device sync, Orbikt changes, service-planning
changes, or AA01 output changes.

## Baseline

- The application keeps the full `AA01Form` and the current step only in
  `App.tsx` React state.
- No localStorage, sessionStorage, IndexedDB, persisted context, or router is
  currently present.
- Step 3 and Step 4 both consume the same `AA01Form`; `assessmentAnswers` and
  `caseProfile` feed the existing summary and AA01 generation paths directly.
- Step 3 already has section-level expansion state, but `currentSection` and
  `currentQuestion` are not currently owned by the app.
- The existing `jumpTo` metadata is not executed by the current Step 3 UI.
  Checkpoint 2 will not redesign or broaden that behavior.
- The pre-change baseline at commit `118e732893eef553bc2f6284cd9c6fd9d08217f2`
  is 52 passing tests, a passing lint run, and a passing production build.

## Selected Design

- Use the small `idb` wrapper over IndexedDB.
- Put all IndexedDB access behind one typed draft repository.
- Gate the form at application startup whenever any unfinished local draft
  exists.
- Keep the current `node:test` runner. Use `fake-indexeddb` for repository
  tests and a minimal JSDOM/TSX test setup for recovery-screen interaction
  tests.
- Connect only the Step 3 navigation state needed to restore the last section
  and question. Do not change its assessment content or accordion design.

Native IndexedDB was rejected because it would add transaction and migration
boilerplate without improving this checkpoint. localForage was rejected
because its broader abstraction makes the required schema and index behavior
less explicit.

## Data Model

The current schema version is `1`.

```ts
type DraftStatus = "draft" | "completed" | "discarded";

interface DraftProgress {
  answered: number;
  total: number;
  percent: number;
}

interface LocalDraft {
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
  schemaVersion: 1;
  createdAt: string;
  updatedAt: string;
  lastOpenedAt: string;
}

interface DraftSummary {
  draftId: string;
  caseId: string | null;
  displayName: string;
  currentStep: number;
  currentSection: SectionKey | null;
  progress: DraftProgress;
  status: DraftStatus;
  revision: number;
  schemaVersion: number;
  updatedAt: string;
}
```

`draftId` is the IndexedDB object-store key. `caseId` uses the existing
`caseNumber` when available, but is never used as the storage key because a
case can have more than one independently identifiable draft. `displayName`
uses `caseName`, then `caseNumber`, then the fixed label `未命名草稿`.

The object store is named `drafts`, uses `draftId` as `keyPath`, and has
indexes for `updatedAt` and `status`. Full assessment and case-profile data
exist only in the IndexedDB record. localStorage may contain only the last
draft ID and navigation hints; it must not contain `AA01Form` or assessment
answers.

## Repository Boundary

`DraftRepository.initialize(databaseName?: string)` is the only repository
initialization entry point. It opens the database and owns database creation,
the object store, indexes, database version upgrades, and record migration.
The optional database name lets each test use an isolated database without a
test-only production API. `App.tsx` and UI components never open or call
IndexedDB directly.

```ts
interface DraftRepository {
  saveDraft(draft: LocalDraft): Promise<LocalDraft>;
  loadDraft(draftId: string): Promise<LocalDraft>;
  listDrafts(): Promise<DraftSummary[]>;
  deleteDraft(draftId: string): Promise<void>;
  updateDraftMetadata(
    draftId: string,
    patch: Partial<Pick<LocalDraft,
      "currentStep" | "currentSection" | "currentQuestion" |
      "progress" | "status" | "updatedAt" | "lastOpenedAt"
    >>
  ): Promise<LocalDraft>;
  getMostRecentDraft(): Promise<DraftSummary | null>;
}
```

The production implementation is constructed only with:

```ts
const repository = await DraftRepository.initialize();
```

The first persisted version of a new draft has `revision: 1`. Every later
successful overwrite of that `draftId` increments the persisted revision by
exactly one inside the same read-write transaction. `saveDraft` returns the
successfully persisted draft so the session can carry its latest revision
into the next queued snapshot. A failed transaction does not increment the
in-memory or stored revision.

`listDrafts` returns `draft` status records sorted by `updatedAt` descending.
Listing reads only safe summary fields and does not rewrite stored records.
`loadDraft` validates and migrates the selected full record in memory.
`updateDraftMetadata` first loads a valid record and therefore cannot replace
an unreadable draft with a partial or blank record.

## Schema and Migration Behavior

- A record with schema version `1` is validated and returned without changing
  the stored value.
- A legacy record with a missing or lower version is copied in memory and
  normalized with safe defaults. Missing navigation fields become `null`,
  missing progress becomes `{ answered: 0, total: 0, percent: 0 }`, and missing
  display text is derived from the existing form. Missing `revision` becomes
  `1`, and the former `in-progress` status is normalized to `draft`.
- A record with a schema version newer than `1` raises an
  `UnsupportedDraftVersionError`.
- A malformed record that cannot safely identify both its draft and form
  raises a `DraftMigrationError`.
- Failed validation or migration never calls `put` or `delete`; the original
  IndexedDB record remains untouched.
- A successfully migrated in-memory draft is written as version `1` only
  after the user chooses it and a later legitimate save succeeds.

## Draft Lifecycle

### Creation

The blank form does not create a draft. On the first change that writes a
recoverable user value into the existing `AA01Form`, the session creates
exactly one ID with `crypto.randomUUID()`, stores only that ID as a local
navigation hint, and reuses it for all later saves. Qualifying controls are
radio, checkbox, select, date, number, text, textarea, and any other control
that formally writes user data into `AA01Form`.

Accordion expansion or collapse, step or tab navigation, scrolling, focus,
hover, other UI disclosure state, router initialization, refresh, component
remount, recovery-screen refresh, and draft-list refresh never create a draft.
Empty objects, empty arrays, empty strings, and navigation-only changes do not
qualify. After a draft already exists, clearing an answer is a real form change
and is saved to that same draft.

### Autosave Boundary

The session observes committed React state, not pre-update values. A pure
change classifier selects the save policy:

- Single-choice, multi-choice, number, date, boolean, clear-answer, and other
  structured changes request an immediate save.
- Free-text changes use a 500 ms trailing debounce.
- Step, section, and question changes flush pending form data first, then save
  the new navigation metadata using the same `draftId`.
- `visibilitychange`, `pagehide`, and hook cleanup request a best-effort flush;
  they are additional protection, not the sole persistence mechanism.

A single serialized save queue coalesces pending snapshots and never runs two
writes for one draft concurrently. If new state arrives during a write, the
queue writes the newest pending snapshot next. This prevents an older request
from completing after and overwriting newer state.

The status model is `idle`, `saving`, `saved`, `error`, or `unsaved`. A failed
write leaves the latest form in React state, reports the error, keeps the
snapshot pending, and exposes retry. The UI never reports a failed write as
saved.

## Startup and Recovery Gate

App startup has three explicit states: `checking`, `recovery`, and `ready`.
The normal form and all steps are rendered only in `ready`.

1. In `checking`, initialize the repository and query `draft` status summaries
   through it.
2. If none exist, enter `ready` with a blank form. Do not create a draft.
3. If one or more exist, enter `recovery`. Show the most recently updated
   draft first and do not initialize or render the form behind the gate.
4. A repository error stays outside the form and presents a retry action. It
   never falls through to a blank form that could later overwrite data.

The recovery card displays the identifying name, last saved time, current
step, current section, completion progress, and `資料已儲存在此裝置`.
It is mobile-first, uses touch-sized controls, no wide table, and no hover-only
interaction.

## Recovery Actions

### Continue

`loadDraft(draftId)` must succeed before application state changes. On success,
the app installs the stored `AA01Form`, step, section, and question in one
hydration transition, retains the existing `draftId`, updates `lastOpenedAt`,
and enters `ready`. Hydration is suppressed from autosave so initial values
cannot overwrite the loaded record.

When Step 3 becomes visible, it opens the restored section. After the section
and its existing conditional content render, it scrolls/focuses the restored
question if that question is visible. If it is not visible, the section still
opens and no answer is changed or cleared.

### Draft List

The list displays every unfinished local draft as stacked cards sorted by
`updatedAt` descending. Each card shows identifying text, progress, step,
section, status, and last update. Selecting a card calls the same continue
flow. Re-querying the list never creates or saves a draft.

### Discard

Discard is a low-emphasis danger action. Its first activation opens an inline
confirmation panel containing:

> 捨棄後，這份草稿將從此裝置刪除，且目前沒有雲端備份。

The destructive action is not initially focused and is not styled as the
primary action. Cancel returns to the unchanged recovery view. Confirm calls
`deleteDraft`; only a successfully completed transaction removes the card.
If deletion fails, the card remains and an error plus retry path is shown.

After a successful deletion, the gate shows the next most recent unfinished
draft. It enters a blank `ready` state only when no drafts remain.

## Failure Safety

- Load, list, migration, and delete failures never delete or rewrite the raw
  record.
- The gate remains active after startup or load failure; the normal form is
  not rendered.
- A failed continue action retains the selected card and shows an actionable
  error.
- A failed save keeps the newest in-memory snapshot and its original
  `draftId`; retry uses that same ID.
- No error path substitutes `{}` for a failed draft.
- Draft operations always address one explicit `draftId`; repository tests use
  two IDs to prove isolation.

## Step 3 Minimal Integration

Checkpoint 2 may change Step 3 only to:

- receive the restored `currentSection` and `currentQuestion`;
- report a section selection and the most recently interacted question back
  to the draft session;
- open the restored section and best-effort focus/scroll the visible restored
  question.

Checkpoint 2 will not change section defaults, question presentation,
selection controls, professional wording, assessment options, category
logic, conditional-answer cleanup, progress rules, or the Step 3 mobile
accordion design. Those changes remain outside this checkpoint.

## Test Strategy

The existing `node:test` runner remains authoritative. `fake-indexeddb`
provides a real IndexedDB-compatible transaction surface in Node. `tsx`
allows the runner to import TSX, and JSDOM supplies the minimal DOM needed for
recovery-gate interaction tests. The existing 52 tests remain unchanged and
must all pass.

The completed implementation adds 43 tests, for a verified total of 95:

- Data model and migration: 8 tests.
- Repository CRUD, ordering, recent lookup, and ID isolation: 8 tests.
- Save policy, debounce/flush, queue ordering, and failure retry: 8 tests.
- Recovery gate, list, continue/discard UI, action locking, and failure retention: 8 tests.
- Draft session startup, hydration, storage denial, save failure, ID reuse, and
  page-exit flush: 9 tests.
- Step 3 restored-question targeting: 2 tests.

Together they cover all 18 required scenarios: one- and multi-draft recovery,
newest-first ordering, continue hydration, step/section/question restoration,
answer/text/conditional-data preservation, no duplicate or blank overwrite,
inline discard confirmation and cancellation, delete/load failure retention,
draft isolation, and no form rendering before a recovery choice. Additional
tests cover older-schema defaults, future-schema rejection, serialized writes,
and no draft creation for an untouched form.

Checkpoint validation commands are:

```text
npm run lint
npm test
npm run build
```

`npm run build` includes TypeScript project checking through `tsc -b`.

## Implemented Files

Create:

- `src/persistence/draftModel.ts`
- `src/persistence/draftRepository.ts`
- `src/persistence/draftAutosave.ts`
- `src/hooks/useDraftSession.ts`
- `src/Components/DraftRecoveryGate.tsx`
- `src/Components/DraftRecoveryGate.css`
- `tests/draftModel.test.ts`
- `tests/draftRepository.test.ts`
- `tests/draftAutosave.test.ts`
- `tests/draftRecoveryGate.test.ts`
- `tests/draftSession.test.ts`
- `docs/superpowers/plans/2026-07-21-checkpoint-2-draft-persistence.md`

Modify:

- `package.json`
- `package-lock.json`
- `src/App.tsx`
- `src/Components/Step3Assessment.tsx`
- `src/Components/Step3Assessment.logic.ts`
- `tests/Step3Assessment.logic.test.ts`
- `docs/MOBILE-FIELD-PERSISTENCE.md`

No assessment data, generation rule, Step 4 component, PWA configuration, or
service-planning file is in the implemented change set.

## Verified Implementation Record

- Runtime dependency: `idb@8.0.3`.
- Test dependencies: `fake-indexeddb@6.2.5`, `tsx@4.23.1`, and
  `jsdom@29.1.1`.
- Automated validation: 95/95 tests, including all 52 baseline tests and 43
  Checkpoint 2 tests.
- Browser validation: the recovery gate was exercised at 360 px and 768 px;
  it had no horizontal overflow, the primary touch target exceeded 44 px,
  discard required the inline confirmation, and Continue restored Step 3,
  section C, question C1, its saved answer, and focus position.
- Browser console validation: zero application errors and zero warnings during
  create, reload, recovery, discard-cancel, Continue, and Step 3 restoration.

## Risks and Controls

- Browser private mode or storage quota can reject IndexedDB writes. The app
  retains in-memory data, shows `儲存失敗，正在重試`, and offers retry.
- `pagehide` does not guarantee completion of a new asynchronous transaction.
  Immediate saves and the 500 ms debounce are the primary protection.
- Restoring focus depends on the saved question remaining visible under the
  existing conditional category logic. Failure to focus never changes data.
- React Strict Mode can mount effects twice in development. Session identity
  is stored outside mount-only effects, repository reads are idempotent, and
  draft creation requires meaningful data plus a missing session ID.
- Unsupported future schemas remain recoverable only by a compatible newer
  application version; Checkpoint 2 preserves them and explains the error.

## Acceptance Boundary

Checkpoint 2 is complete only when the repository, save lifecycle, recovery
gate, list, inline discard confirmation, version handling, Step 3 navigation
restoration, and implemented tests pass without regressing the existing 52 tests.
Completion stops at this boundary and awaits explicit approval before any
Checkpoint 3 work.
