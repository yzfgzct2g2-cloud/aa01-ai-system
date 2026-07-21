import assert from "node:assert/strict";
import test from "node:test";

import {
  DRAFT_SCHEMA_VERSION,
  DraftMigrationError,
  UnsupportedDraftVersionError,
  createLocalDraft,
  hasRecoverableUserInput,
  migrateDraft,
  toDraftSummary,
} from "../src/persistence/draftModel.ts";

const NOW = "2026-07-21T12:00:00.000Z";

test("空白表單與空集合不構成可還原輸入", () => {
  assert.equal(hasRecoverableUserInput({}), false);
  assert.equal(hasRecoverableUserInput({ assessmentAnswers: {} }), false);
  assert.equal(hasRecoverableUserInput({ caseProfile: { family: { coResidents: [] } } }), false);
});

test("正式寫入 AA01Form 的欄位構成可還原輸入", () => {
  assert.equal(hasRecoverableUserInput({ caseName: "王小明" }), true);
  assert.equal(hasRecoverableUserInput({ assessmentDate: "2026-07-21" }), true);
  assert.equal(hasRecoverableUserInput({ assessmentAnswers: {
    C1: { questionId: "C1", type: "single", value: "1" },
  } }), true);
});

test("新草稿使用 schema 1、draft 狀態與 revision 1", () => {
  const draft = createLocalDraft({
    draftId: "draft-a",
    form: { caseName: "王小明", caseNumber: "AA-01" },
    currentStep: 2,
    currentSection: "C",
    currentQuestion: "C1",
    progress: { answered: 1, total: 10, percent: 10 },
    now: NOW,
  });

  assert.equal(draft.schemaVersion, DRAFT_SCHEMA_VERSION);
  assert.equal(draft.status, "draft");
  assert.equal(draft.revision, 1);
  assert.equal(draft.caseId, "AA-01");
  assert.equal(draft.displayName, "王小明");
  assert.equal(draft.createdAt, NOW);
  assert.equal(draft.updatedAt, NOW);
  assert.equal(draft.lastOpenedAt, NOW);
});

test("草稿顯示名稱依序回退至案號與未命名草稿", () => {
  const base = {
    draftId: "draft-a",
    currentStep: 0,
    currentSection: null,
    currentQuestion: null,
    progress: { answered: 0, total: 0, percent: 0 },
    now: NOW,
  } as const;

  assert.equal(createLocalDraft({ ...base, form: { caseNumber: "AA-02" } }).displayName, "AA-02");
  assert.equal(createLocalDraft({ ...base, form: {} }).displayName, "未命名草稿");
});

test("舊草稿補上安全預設值且保留完整表單", () => {
  const migrated = migrateDraft({
    draftId: "legacy",
    form: { assessmentAnswers: {
      H1e1: { questionId: "H1e1", type: "multi", value: ["01"] },
      H1e1Other: { questionId: "H1e1Other", type: "text", value: "浴室" },
    } },
    status: "in-progress",
    createdAt: "2026-07-20T00:00:00.000Z",
    updatedAt: "2026-07-20T01:00:00.000Z",
  });

  assert.equal(migrated.status, "draft");
  assert.equal(migrated.revision, 1);
  assert.equal(migrated.schemaVersion, 1);
  assert.equal(migrated.currentSection, null);
  assert.equal(migrated.currentQuestion, null);
  assert.deepEqual(migrated.progress, { answered: 0, total: 0, percent: 0 });
  assert.deepEqual(migrated.form.assessmentAnswers?.H1e1.value, ["01"]);
  assert.equal(migrated.form.assessmentAnswers?.H1e1Other.value, "浴室");
});

test("較新 schema 拒絕載入且不改寫輸入物件", () => {
  const raw = { draftId: "future", form: {}, schemaVersion: 2 };

  assert.throws(() => migrateDraft(raw), UnsupportedDraftVersionError);
  assert.equal(raw.schemaVersion, 2);
});

test("缺少 draftId 或 form 的資料拒絕遷移", () => {
  assert.throws(() => migrateDraft({ form: {} }), DraftMigrationError);
  assert.throws(() => migrateDraft({ draftId: "broken" }), DraftMigrationError);
});

test("DraftSummary 不包含完整表單與題目游標", () => {
  const summary = toDraftSummary(createLocalDraft({
    draftId: "draft-a",
    form: { caseName: "王小明" },
    currentStep: 2,
    currentSection: "C",
    currentQuestion: "C1",
    progress: { answered: 1, total: 10, percent: 10 },
    now: NOW,
  }));

  assert.equal("form" in summary, false);
  assert.equal("currentQuestion" in summary, false);
  assert.equal(summary.revision, 1);
});
