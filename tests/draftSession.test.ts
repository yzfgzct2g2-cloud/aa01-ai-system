import assert from "node:assert/strict";
import test from "node:test";

import { JSDOM } from "jsdom";
import * as React from "react";
import { act, createElement } from "react";
import { createRoot } from "react-dom/client";

import { useDraftSession } from "../src/hooks/useDraftSession.ts";
import type {
  DraftHydration,
  DraftRepositoryContract,
  UseDraftSessionOptions,
  UseDraftSessionResult,
} from "../src/hooks/useDraftSession.ts";
import {
  createLocalDraft,
  toDraftSummary,
} from "../src/persistence/draftModel.ts";
import type { DraftMetadataPatch } from "../src/persistence/draftRepository.ts";
import type { LocalDraft } from "../src/persistence/draftModel.ts";

function makeDraft(draftId = "saved-draft") {
  return createLocalDraft({
    draftId,
    form: {
      caseName: "王小明",
      assessmentAnswers: {
        C1: { questionId: "C1", type: "single", value: "1" },
        H1e1: { questionId: "H1e1", type: "multi", value: ["01", "03"] },
        H1e1Other: {
          questionId: "H1e1Other",
          type: "text",
          value: "浴室門檻",
          text: "浴室門檻",
        },
      },
    },
    currentStep: 2,
    currentSection: "H",
    currentQuestion: "H1e1Other",
    progress: { answered: 3, total: 10, percent: 30 },
    now: "2026-07-21T12:00:00.000Z",
  });
}

class MemoryStorage {
  private readonly values = new Map<string, string>();
  getItem(key: string) { return this.values.get(key) ?? null; }
  setItem(key: string, value: string) { this.values.set(key, value); }
  removeItem(key: string) { this.values.delete(key); }
}

class MemoryRepository implements DraftRepositoryContract {
  readonly records = new Map<string, LocalDraft>();
  readonly saveCalls: LocalDraft[] = [];
  loadError: Error | null = null;
  saveError: Error | null = null;

  constructor(drafts: LocalDraft[] = []) {
    drafts.forEach((draft) => this.records.set(draft.draftId, structuredClone(draft)));
  }

  async saveDraft(draft: LocalDraft) {
    if (this.saveError) throw this.saveError;
    const existing = this.records.get(draft.draftId);
    const saved = {
      ...structuredClone(draft),
      revision: existing ? existing.revision + 1 : 1,
    };
    this.records.set(saved.draftId, saved);
    this.saveCalls.push(saved);
    return saved;
  }

  async loadDraft(draftId: string) {
    if (this.loadError) throw this.loadError;
    const draft = this.records.get(draftId);
    if (!draft) throw new Error("找不到草稿");
    return structuredClone(draft);
  }

  async listDrafts() {
    return [...this.records.values()]
      .filter((draft) => draft.status === "draft")
      .map(toDraftSummary)
      .sort((left, right) => right.updatedAt.localeCompare(left.updatedAt));
  }

  async deleteDraft(draftId: string) {
    this.records.delete(draftId);
  }

  async updateDraftMetadata(draftId: string, patch: DraftMetadataPatch) {
    return this.saveDraft({ ...(await this.loadDraft(draftId)), ...patch });
  }

  async getMostRecentDraft() {
    return (await this.listDrafts())[0] ?? null;
  }
}

async function settle() {
  await new Promise((resolve) => setTimeout(resolve, 0));
  await Promise.resolve();
}

async function mountSession(options: {
  repository: MemoryRepository;
  form?: UseDraftSessionOptions["form"];
  currentStep?: number;
  currentSection?: UseDraftSessionOptions["currentSection"];
  currentQuestion?: string | null;
  onHydrate?: (value: DraftHydration) => void;
  storage?: UseDraftSessionOptions["storage"];
}) {
  const dom = new JSDOM("<!doctype html><html><body><div id='root'></div></body></html>", {
    url: "https://example.test/aa01-ai-system/",
  });
  Object.assign(globalThis, {
    window: dom.window,
    document: dom.window.document,
    HTMLElement: dom.window.HTMLElement,
    Event: dom.window.Event,
    React,
    IS_REACT_ACT_ENVIRONMENT: true,
  });
  const storage = new MemoryStorage();
  const hydrated: DraftHydration[] = [];
  let currentOptions: UseDraftSessionOptions = {
    form: options.form ?? {},
    currentStep: options.currentStep ?? 0,
    currentSection: options.currentSection ?? null,
    currentQuestion: options.currentQuestion ?? null,
    progress: { answered: 0, total: 0, percent: 0 },
    onHydrate: options.onHydrate ?? ((value) => hydrated.push(value)),
    initializeRepository: async () => options.repository,
    createDraftId: () => "generated-draft",
    storage: options.storage ?? storage,
  };
  let latest!: UseDraftSessionResult;

  function Harness(props: UseDraftSessionOptions) {
    latest = useDraftSession(props);
    return null;
  }

  const root = createRoot(dom.window.document.getElementById("root")!);
  const render = async () => {
    await act(async () => {
      root.render(createElement(Harness, currentOptions));
      await settle();
    });
  };
  await render();
  await act(settle);

  return {
    hydrated,
    result: () => latest,
    rerender: async (patch: Partial<UseDraftSessionOptions>) => {
      currentOptions = { ...currentOptions, ...patch };
      await render();
      await act(settle);
    },
    cleanup: async () => {
      await act(async () => root.unmount());
      dom.window.close();
    },
  };
}

test("啟動查到草稿時維持 recovery 且不 hydration 空白表單", async () => {
  const session = await mountSession({ repository: new MemoryRepository([makeDraft()]) });
  assert.equal(session.result().startupState, "recovery");
  assert.equal(session.result().drafts.length, 1);
  assert.deepEqual(session.hydrated, []);
  await session.cleanup();
});

test("continue 完整恢復 form、step、section、question 與原 draftId", async () => {
  const draft = makeDraft();
  const session = await mountSession({ repository: new MemoryRepository([draft]) });
  await act(async () => session.result().continueDraft(draft.draftId));

  assert.equal(session.result().startupState, "ready");
  assert.equal(session.result().activeDraftId, draft.draftId);
  assert.equal(session.hydrated[0]?.currentStep, 2);
  assert.equal(session.hydrated[0]?.currentSection, "H");
  assert.equal(session.hydrated[0]?.currentQuestion, "H1e1Other");
  assert.deepEqual(session.hydrated[0]?.form.assessmentAnswers, draft.form.assessmentAnswers);
  await session.cleanup();
});

test("草稿載入失敗時保留 recovery 且不 hydration", async () => {
  const repository = new MemoryRepository([makeDraft()]);
  repository.loadError = new Error("讀取失敗");
  const session = await mountSession({ repository });

  let loadError: unknown;
  await act(async () => {
    try {
      await session.result().continueDraft("saved-draft");
    } catch (reason) {
      loadError = reason;
    }
  });
  assert.match(String(loadError), /讀取失敗/);
  assert.equal(session.result().startupState, "recovery");
  assert.deepEqual(session.hydrated, []);
  assert.equal(repository.records.has("saved-draft"), true);
  await session.cleanup();
});

test("Step、Section 與 Focus 變更不會建立空草稿", async () => {
  const repository = new MemoryRepository();
  const session = await mountSession({ repository });
  await session.rerender({ currentStep: 2, currentSection: "C", currentQuestion: "C1" });
  await act(async () => {
    await session.result().flush();
  });

  assert.equal(repository.saveCalls.length, 0);
  assert.equal(session.result().activeDraftId, null);
  await session.cleanup();
});

test("首次正式輸入只建立一個 draftId 且 Step 切換沿用", async () => {
  const repository = new MemoryRepository();
  const session = await mountSession({ repository });
  await session.rerender({ form: { caseName: "王小明" } });
  await act(async () => {
    await session.result().flush();
  });
  await session.rerender({ currentStep: 1 });
  await act(async () => {
    await session.result().flush();
  });

  assert.ok(repository.saveCalls.length >= 2);
  assert.deepEqual(new Set(repository.saveCalls.map((draft) => draft.draftId)), new Set(["generated-draft"]));
  assert.equal(session.result().activeDraftId, "generated-draft");
  await session.cleanup();
});

test("重新掛載時偵測既有草稿且不建立重複 draftId", async () => {
  const repository = new MemoryRepository();
  const first = await mountSession({ repository });
  await first.rerender({ form: { caseName: "王小明" } });
  await act(async () => {
    await first.result().flush();
  });
  await first.cleanup();
  const savesBeforeRemount = repository.saveCalls.length;

  const second = await mountSession({ repository });
  assert.equal(second.result().startupState, "recovery");
  assert.equal(repository.saveCalls.length, savesBeforeRemount);
  assert.equal(repository.records.size, 1);
  await second.cleanup();
});

test("pagehide 會在 500ms debounce 前 flush 最新文字", async () => {
  const repository = new MemoryRepository();
  const session = await mountSession({ repository });
  await session.rerender({ form: { caseName: "尚未到 debounce" } });
  await act(async () => {
    window.dispatchEvent(new Event("pagehide"));
    await settle();
  });

  assert.equal(repository.saveCalls.at(-1)?.form.caseName, "尚未到 debounce");
  await session.cleanup();
});

test("localStorage 拒絕寫入時仍會保存 IndexedDB 草稿", async () => {
  const repository = new MemoryRepository();
  const throwingStorage = {
    getItem: () => { throw new Error("storage denied"); },
    setItem: () => { throw new Error("storage denied"); },
    removeItem: () => { throw new Error("storage denied"); },
  };
  const session = await mountSession({ repository, storage: throwingStorage });
  await session.rerender({ form: { caseName: "王小明" } });
  await act(async () => {
    await session.result().flush();
  });

  assert.equal(repository.records.get("generated-draft")?.form.caseName, "王小明");
  await session.cleanup();
});

test("flush 與 retry 儲存失敗時更新錯誤狀態但不向 UI 丟出 rejection", async () => {
  const repository = new MemoryRepository();
  repository.saveError = new Error("quota");
  const session = await mountSession({ repository });
  await session.rerender({ form: { caseName: "王小明" } });

  await act(async () => {
    await assert.doesNotReject(() => session.result().flush());
    await assert.doesNotReject(() => session.result().retrySave());
  });
  assert.equal(session.result().saveState, "error");
  assert.match(session.result().saveError ?? "", /quota/);
  await session.cleanup();
});
