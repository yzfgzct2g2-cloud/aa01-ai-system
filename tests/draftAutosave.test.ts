import assert from "node:assert/strict";
import test from "node:test";

import {
  DraftSaveQueue,
  classifyFormChange,
} from "../src/persistence/draftAutosave.ts";
import { createLocalDraft } from "../src/persistence/draftModel.ts";
import type { LocalDraft } from "../src/persistence/draftModel.ts";
import type { AA01Form } from "../src/types.ts";

function makeDraft(caseName: string, revision = 1) {
  return {
    ...createLocalDraft({
      draftId: "draft-a",
      form: { caseName },
      currentStep: 0,
      currentSection: null,
      currentQuestion: null,
      progress: { answered: 0, total: 0, percent: 0 },
      now: "2026-07-21T12:00:00.000Z",
    }),
    revision,
  };
}

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason: Error) => void;
  const promise = new Promise<T>((onResolve, onReject) => {
    resolve = onResolve;
    reject = onReject;
  });
  return { promise, resolve, reject };
}

test("single、multi 與 number 評估答案要求立即保存", () => {
  assert.equal(classifyFormChange({}, {
    assessmentAnswers: { C1: { questionId: "C1", type: "single", value: "1" } },
  }), "immediate");
  assert.equal(classifyFormChange({}, {
    assessmentAnswers: { G6a: { questionId: "G6a", type: "multi", value: ["2"] } },
  }), "immediate");
  assert.equal(classifyFormChange({}, {
    assessmentAnswers: { H1c: { questionId: "H1c", type: "number", value: 0 } },
  }), "immediate");
});

test("text 評估答案與自由文字欄位採 debounce", () => {
  assert.equal(classifyFormChange({}, {
    assessmentAnswers: { G1a: { questionId: "G1a", type: "text", value: "說明" } },
  }), "debounced");
  assert.equal(classifyFormChange({}, { caseName: "王小明" }), "debounced");
  assert.equal(classifyFormChange({}, {
    caseProfile: { socialSupport: { otherSupport: "鄰里協助" } },
  }), "debounced");
  assert.equal(classifyFormChange(
    { services: [{ id: "service-a", quantity: "1" }] } as unknown as AA01Form,
    { services: [{ id: "service-a", quantity: "2" }] } as unknown as AA01Form
  ), "debounced");
});

test("日期、Step 1 選單與清除答案要求立即保存", () => {
  assert.equal(classifyFormChange({}, { assessmentDate: "2026-07-21" }), "immediate");
  assert.equal(classifyFormChange({}, { caseType: "新案" }), "immediate");
  assert.equal(classifyFormChange({}, { cmsLevel: "4" }), "immediate");
  assert.equal(classifyFormChange({}, { identityType: "class2" }), "immediate");
  assert.equal(classifyFormChange(
    { assessmentAnswers: { C1: { questionId: "C1", type: "single", value: "1" } } },
    { assessmentAnswers: {} }
  ), "immediate");
  assert.equal(classifyFormChange(
    { services: [{ id: "service-a", code: "BA01" }] } as unknown as AA01Form,
    { services: [{ id: "service-a", code: "BA02" }] } as unknown as AA01Form
  ), "immediate");
});

test("G H I category selection changes request an immediate save", () => {
  assert.equal(
    classifyFormChange(
      {},
      { assessmentCategorySelections: { G: ["pain"], H: ["environment"], I: ["none"] } }
    ),
    "immediate"
  );
});

test("debounce 期間只保存最後一份 snapshot", async () => {
  const persisted: string[] = [];
  const queue = new DraftSaveQueue(async (draft) => {
    persisted.push(draft.form.caseName ?? "");
    return draft;
  }, { debounceMs: 10 });

  queue.schedule(makeDraft("第一字"), "debounced");
  queue.schedule(makeDraft("完整文字"), "debounced");
  await new Promise((resolve) => setTimeout(resolve, 30));

  assert.deepEqual(persisted, ["完整文字"]);
});

test("flush 會在 debounce 到期前保存最新 snapshot", async () => {
  const persisted: string[] = [];
  const queue = new DraftSaveQueue(async (draft) => {
    persisted.push(draft.form.caseName ?? "");
    return draft;
  }, { debounceMs: 1000 });

  queue.schedule(makeDraft("待保存"), "debounced");
  await queue.flush();

  assert.deepEqual(persisted, ["待保存"]);
  assert.equal(queue.hasPending(), false);
});

test("序列化寫入確保較新 snapshot 最後保存", async () => {
  const firstWrite = deferred<LocalDraft>();
  const persisted: string[] = [];
  let attempts = 0;
  const queue = new DraftSaveQueue(async (draft) => {
    attempts += 1;
    persisted.push(draft.form.caseName ?? "");
    if (attempts === 1) return firstWrite.promise;
    return { ...draft, revision: draft.revision + 1 };
  });

  queue.schedule(makeDraft("舊"), "immediate");
  queue.schedule(makeDraft("新"), "immediate");
  firstWrite.resolve(makeDraft("舊", 2));
  await queue.flush();

  assert.deepEqual(persisted, ["舊", "新"]);
  assert.equal(queue.getLastSaved()?.form.caseName, "新");
});

test("成功 revision 會帶入下一個 pending snapshot", async () => {
  const firstWrite = deferred<LocalDraft>();
  const receivedRevisions: number[] = [];
  let attempts = 0;
  const queue = new DraftSaveQueue(async (draft) => {
    attempts += 1;
    receivedRevisions.push(draft.revision);
    if (attempts === 1) return firstWrite.promise;
    return { ...draft, revision: draft.revision + 1 };
  });

  queue.schedule(makeDraft("舊", 1), "immediate");
  queue.schedule(makeDraft("新", 1), "immediate");
  firstWrite.resolve(makeDraft("舊", 2));
  await queue.flush();

  assert.deepEqual(receivedRevisions, [1, 2]);
});

test("保存失敗保留最新 snapshot 並可使用相同 draftId 重試", async () => {
  const states: string[] = [];
  let shouldFail = true;
  const queue = new DraftSaveQueue(async (draft) => {
    if (shouldFail) throw new Error("quota");
    return { ...draft, revision: draft.revision + 1 };
  }, {
    onStateChange: (state) => states.push(state),
  });

  queue.schedule(makeDraft("最新資料"), "immediate");
  await assert.rejects(() => queue.flush(), /quota/);
  assert.equal(queue.hasPending(), true);
  assert.equal(states.at(-1), "error");

  shouldFail = false;
  const retried = await queue.retry();
  assert.equal(retried?.draftId, "draft-a");
  assert.equal(retried?.form.caseName, "最新資料");
  assert.equal(queue.hasPending(), false);
});
