import "fake-indexeddb/auto";

import assert from "node:assert/strict";
import test from "node:test";
import { openDB } from "idb";

import {
  UnsupportedDraftVersionError,
  createLocalDraft,
} from "../src/persistence/draftModel.ts";
import { DraftRepository } from "../src/persistence/draftRepository.ts";

const NOW = "2026-07-21T12:00:00.000Z";

function databaseName() {
  return `aa01-test-${crypto.randomUUID()}`;
}

function makeDraft(
  draftId: string,
  displayName: string,
  updatedAt = NOW
) {
  return createLocalDraft({
    draftId,
    form: { caseName: displayName },
    currentStep: 2,
    currentSection: "C",
    currentQuestion: "C1",
    progress: { answered: 1, total: 10, percent: 10 },
    now: updatedAt,
  });
}

test("initialize 建立資料庫並可保存及載入 revision 1 草稿", async () => {
  const repository = await DraftRepository.initialize(databaseName());
  const saved = await repository.saveDraft(makeDraft("a", "甲"));

  assert.equal(saved.revision, 1);
  assert.deepEqual(await repository.loadDraft("a"), saved);
});

test("同一 draftId 每次成功覆寫只增加一次 revision", async () => {
  const repository = await DraftRepository.initialize(databaseName());
  const first = await repository.saveDraft(makeDraft("a", "甲"));
  const second = await repository.saveDraft({
    ...first,
    displayName: "乙",
    form: { caseName: "乙" },
    updatedAt: "2026-07-21T13:00:00.000Z",
  });

  assert.equal(first.revision, 1);
  assert.equal(second.revision, 2);
  assert.equal((await repository.loadDraft("a")).displayName, "乙");
});

test("不同 draftId 的資料不互相覆蓋", async () => {
  const repository = await DraftRepository.initialize(databaseName());
  await repository.saveDraft(makeDraft("a", "甲"));
  await repository.saveDraft(makeDraft("b", "乙"));

  assert.equal((await repository.loadDraft("a")).displayName, "甲");
  assert.equal((await repository.loadDraft("b")).displayName, "乙");
});

test("listDrafts 只列 draft 並依 updatedAt 由新到舊", async () => {
  const repository = await DraftRepository.initialize(databaseName());
  await repository.saveDraft(makeDraft("old", "較舊", "2026-07-20T12:00:00.000Z"));
  await repository.saveDraft(makeDraft("new", "較新", "2026-07-21T12:00:00.000Z"));
  await repository.saveDraft({ ...makeDraft("done", "完成"), status: "completed" });

  assert.deepEqual(
    (await repository.listDrafts()).map((draft) => draft.draftId),
    ["new", "old"]
  );
});

test("getMostRecentDraft 回傳最近更新的一筆", async () => {
  const repository = await DraftRepository.initialize(databaseName());
  await repository.saveDraft(makeDraft("old", "較舊", "2026-07-20T12:00:00.000Z"));
  await repository.saveDraft(makeDraft("new", "較新", "2026-07-21T12:00:00.000Z"));

  assert.equal((await repository.getMostRecentDraft())?.draftId, "new");
});

test("updateDraftMetadata 保留完整表單並更新導覽位置", async () => {
  const repository = await DraftRepository.initialize(databaseName());
  const saved = await repository.saveDraft(makeDraft("a", "甲"));
  const updated = await repository.updateDraftMetadata("a", {
    currentStep: 3,
    currentSection: "H",
    currentQuestion: "H1e1",
    lastOpenedAt: "2026-07-21T13:00:00.000Z",
    updatedAt: "2026-07-21T13:00:00.000Z",
  });

  assert.deepEqual(updated.form, saved.form);
  assert.equal(updated.currentStep, 3);
  assert.equal(updated.currentSection, "H");
  assert.equal(updated.currentQuestion, "H1e1");
  assert.equal(updated.revision, 2);
});

test("deleteDraft 只刪除指定草稿", async () => {
  const repository = await DraftRepository.initialize(databaseName());
  await repository.saveDraft(makeDraft("a", "甲"));
  await repository.saveDraft(makeDraft("b", "乙"));
  await repository.deleteDraft("a");

  await assert.rejects(() => repository.loadDraft("a"), /找不到草稿/);
  assert.equal((await repository.loadDraft("b")).displayName, "乙");
});

test("較新 schema 載入失敗時保留原始 IndexedDB 紀錄", async () => {
  const name = databaseName();
  const repository = await DraftRepository.initialize(name);
  const database = await openDB(name, 1);
  const raw = {
    ...makeDraft("future", "未來版本"),
    schemaVersion: 2,
    revision: 9,
  };
  await database.put("drafts", raw);

  await assert.rejects(
    () => repository.loadDraft("future"),
    UnsupportedDraftVersionError
  );
  assert.deepEqual(await database.get("drafts", "future"), raw);
});
