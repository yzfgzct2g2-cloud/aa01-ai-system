import assert from "node:assert/strict";
import test from "node:test";

import { JSDOM } from "jsdom";
import * as React from "react";
import { act, createElement } from "react";
import { createRoot } from "react-dom/client";

import { DraftRecoveryGate } from "../src/Components/DraftRecoveryGate.tsx";
import type { DraftSummary } from "../src/persistence/draftModel.ts";

function summary(
  draftId: string,
  displayName: string,
  updatedAt: string
): DraftSummary {
  return {
    draftId,
    caseId: null,
    displayName,
    currentStep: 2,
    currentSection: "H",
    progress: { answered: 4, total: 10, percent: 40 },
    status: "draft",
    revision: 1,
    schemaVersion: 1,
    updatedAt,
  };
}

async function renderGate(options: {
  drafts?: DraftSummary[];
  onContinue?: (draftId: string) => Promise<void>;
  onDelete?: (draftId: string) => Promise<void>;
}) {
  const dom = new JSDOM("<!doctype html><html><body><div id='root'></div></body></html>");
  Object.assign(globalThis, {
    window: dom.window,
    document: dom.window.document,
    HTMLElement: dom.window.HTMLElement,
    Event: dom.window.Event,
    MouseEvent: dom.window.MouseEvent,
    React,
    IS_REACT_ACT_ENVIRONMENT: true,
  });
  const container = dom.window.document.getElementById("root")!;
  const root = createRoot(container);
  await act(async () => {
    root.render(createElement(DraftRecoveryGate, {
      drafts: options.drafts ?? [],
      onContinue: options.onContinue ?? (async () => undefined),
      onDelete: options.onDelete ?? (async () => undefined),
      onRefresh: async () => undefined,
    }));
  });

  const button = (label: string) => {
    const result = [...container.querySelectorAll("button")]
      .find((item) => item.textContent?.trim() === label);
    assert.ok(result, `找不到按鈕：${label}`);
    return result;
  };
  const click = async (label: string) => {
    await act(async () => {
      button(label).dispatchEvent(new dom.window.MouseEvent("click", { bubbles: true }));
      await Promise.resolve();
    });
  };

  return {
    container,
    click,
    cleanup: async () => {
      await act(async () => root.unmount());
      dom.window.close();
    },
  };
}

const newer = summary("new", "最近草稿", "2026-07-21T12:00:00.000Z");
const older = summary("old", "較舊草稿", "2026-07-20T12:00:00.000Z");

test("一筆未完成草稿顯示恢復畫面且不顯示一般表單", async () => {
  const view = await renderGate({ drafts: [newer] });
  assert.match(view.container.textContent ?? "", /找到未完成的本機草稿/);
  assert.match(view.container.textContent ?? "", /最近草稿/);
  assert.match(view.container.textContent ?? "", /資料已儲存在此裝置/);
  assert.equal(view.container.querySelector("[data-recovery-primary]")?.textContent, "繼續填寫");
  await view.cleanup();
});

test("多筆草稿先顯示 updatedAt 最新的一筆", async () => {
  const view = await renderGate({ drafts: [older, newer] });
  const featured = view.container.querySelector("[data-featured-draft]");
  assert.match(featured?.textContent ?? "", /最近草稿/);
  assert.doesNotMatch(featured?.textContent ?? "", /較舊草稿/);
  await view.cleanup();
});

test("草稿清單依 updatedAt 由新到舊排序", async () => {
  const lexicallyLaterButOlder = summary(
    "offset-old",
    "時區較舊草稿",
    "2026-07-21T01:00:00+09:00"
  );
  const chronologicallyNewer = summary(
    "utc-new",
    "實際較新草稿",
    "2026-07-20T18:00:00Z"
  );
  const view = await renderGate({ drafts: [lexicallyLaterButOlder, chronologicallyNewer] });
  await view.click("查看草稿清單");
  const cards = [...view.container.querySelectorAll("[data-draft-card]")];
  assert.equal(cards[0]?.getAttribute("data-draft-id"), "utc-new");
  assert.equal(cards[1]?.getAttribute("data-draft-id"), "offset-old");
  await view.cleanup();
});

test("使用者選定草稿後才載入該 draftId", async () => {
  const continued: string[] = [];
  const view = await renderGate({
    drafts: [newer],
    onContinue: async (draftId) => { continued.push(draftId); },
  });
  assert.deepEqual(continued, []);
  await view.click("繼續填寫");
  assert.deepEqual(continued, ["new"]);
  await view.cleanup();
});

test("草稿操作進行中會鎖定其他草稿避免並行載入", async () => {
  const continued: string[] = [];
  let release!: () => void;
  const pending = new Promise<void>((resolve) => { release = resolve; });
  const view = await renderGate({
    drafts: [older, newer],
    onContinue: async (draftId) => {
      continued.push(draftId);
      await pending;
    },
  });
  await view.click("查看草稿清單");
  const cards = [...view.container.querySelectorAll<HTMLElement>("[data-draft-card]")];
  const firstContinue = cards[0]?.querySelector<HTMLButtonElement>("[data-recovery-primary], .draft-button--primary");
  const secondContinue = cards[1]?.querySelector<HTMLButtonElement>(".draft-button--primary");
  assert.ok(firstContinue);
  assert.ok(secondContinue);

  await act(async () => {
    firstContinue.dispatchEvent(new window.MouseEvent("click", { bubbles: true }));
    await Promise.resolve();
  });
  assert.equal(secondContinue.disabled, true);
  await act(async () => {
    secondContinue.dispatchEvent(new window.MouseEvent("click", { bubbles: true }));
    await Promise.resolve();
  });
  assert.deepEqual(continued, ["new"]);

  release();
  await act(async () => { await pending; });
  await view.cleanup();
});

test("第一次捨棄只顯示頁內二次確認", async () => {
  const deleted: string[] = [];
  const view = await renderGate({
    drafts: [newer],
    onDelete: async (draftId) => { deleted.push(draftId); },
  });
  await view.click("捨棄草稿");
  assert.deepEqual(deleted, []);
  assert.match(
    view.container.textContent ?? "",
    /捨棄後，這份草稿將從此裝置刪除，且目前沒有雲端備份。/
  );
  await view.cleanup();
});

test("取消捨棄後草稿仍存在", async () => {
  const view = await renderGate({ drafts: [newer] });
  await view.click("捨棄草稿");
  await view.click("取消");
  assert.match(view.container.textContent ?? "", /最近草稿/);
  assert.doesNotMatch(view.container.textContent ?? "", /目前沒有雲端備份/);
  await view.cleanup();
});

test("刪除失敗時保留草稿並顯示錯誤", async () => {
  const view = await renderGate({
    drafts: [newer],
    onDelete: async () => { throw new Error("刪除交易失敗"); },
  });
  await view.click("捨棄草稿");
  await view.click("確認捨棄");
  assert.match(view.container.textContent ?? "", /刪除交易失敗/);
  assert.match(view.container.textContent ?? "", /最近草稿/);
  await view.cleanup();
});
