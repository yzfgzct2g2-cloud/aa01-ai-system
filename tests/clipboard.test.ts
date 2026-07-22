import assert from "node:assert/strict";
import { registerHooks } from "node:module";
import test from "node:test";

import { JSDOM } from "jsdom";
import * as React from "react";
import { act, createElement } from "react";
import { createRoot } from "react-dom/client";

registerHooks({
  load(url, context, nextLoad) {
    if (url.endsWith(".css")) {
      return {
        format: "module",
        source: "export default {};",
        shortCircuit: true,
      };
    }
    return nextLoad(url, context);
  },
});

Object.assign(globalThis, { React });

const { Step5Output } = await import("../src/Components/Step5Output.tsx");

type CopyText = (text: string) => Promise<void>;

let copyText: CopyText | undefined;
try {
  ({ copyText } = await import("../src/utils/clipboard.ts"));
} catch {
  copyText = undefined;
}

function clipboardHelper() {
  assert.equal(typeof copyText, "function", "copyText helper must exist");
  return copyText;
}

async function withBrowserApis(
  options: {
    writeText?: (text: string) => Promise<void>;
    execCommand?: (command: string, selectedText: string) => boolean;
  },
  run: (dom: JSDOM) => Promise<void>
) {
  const dom = new JSDOM("<!doctype html><html><body></body></html>");
  const navigatorDescriptor = Object.getOwnPropertyDescriptor(globalThis, "navigator");
  const documentDescriptor = Object.getOwnPropertyDescriptor(globalThis, "document");
  const windowDescriptor = Object.getOwnPropertyDescriptor(globalThis, "window");
  const htmlElementDescriptor = Object.getOwnPropertyDescriptor(globalThis, "HTMLElement");
  const eventDescriptor = Object.getOwnPropertyDescriptor(globalThis, "Event");
  const mouseEventDescriptor = Object.getOwnPropertyDescriptor(globalThis, "MouseEvent");
  const actDescriptor = Object.getOwnPropertyDescriptor(globalThis, "IS_REACT_ACT_ENVIRONMENT");

  if (options.writeText) {
    Object.defineProperty(dom.window.navigator, "clipboard", {
      configurable: true,
      value: { writeText: options.writeText },
    });
  }
  Object.defineProperty(dom.window.document, "execCommand", {
    configurable: true,
    value: (command: string) => {
      const selectedText = dom.window.document.querySelector<HTMLTextAreaElement>("textarea")?.value ?? "";
      return options.execCommand?.(command, selectedText) ?? false;
    },
  });
  Object.defineProperty(globalThis, "navigator", {
    configurable: true,
    value: dom.window.navigator,
  });
  Object.defineProperty(globalThis, "document", {
    configurable: true,
    value: dom.window.document,
  });
  Object.assign(globalThis, {
    window: dom.window,
    HTMLElement: dom.window.HTMLElement,
    Event: dom.window.Event,
    MouseEvent: dom.window.MouseEvent,
    IS_REACT_ACT_ENVIRONMENT: true,
  });

  try {
    await run(dom);
  } finally {
    if (navigatorDescriptor) Object.defineProperty(globalThis, "navigator", navigatorDescriptor);
    else delete (globalThis as { navigator?: Navigator }).navigator;
    if (documentDescriptor) Object.defineProperty(globalThis, "document", documentDescriptor);
    else delete (globalThis as { document?: Document }).document;
    if (windowDescriptor) Object.defineProperty(globalThis, "window", windowDescriptor);
    else delete (globalThis as { window?: Window }).window;
    if (htmlElementDescriptor) Object.defineProperty(globalThis, "HTMLElement", htmlElementDescriptor);
    else delete (globalThis as { HTMLElement?: typeof HTMLElement }).HTMLElement;
    if (eventDescriptor) Object.defineProperty(globalThis, "Event", eventDescriptor);
    else delete (globalThis as { Event?: typeof Event }).Event;
    if (mouseEventDescriptor) Object.defineProperty(globalThis, "MouseEvent", mouseEventDescriptor);
    else delete (globalThis as { MouseEvent?: typeof MouseEvent }).MouseEvent;
    if (actDescriptor) Object.defineProperty(globalThis, "IS_REACT_ACT_ENVIRONMENT", actDescriptor);
    else delete (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT;
    dom.window.close();
  }
}

async function renderOutput(dom: JSDOM) {
  const container = dom.window.document.createElement("div");
  dom.window.document.body.appendChild(container);
  const root = createRoot(container);
  await act(async () => {
    root.render(createElement(Step5Output, { form: {} }));
  });

  const button = [...container.querySelectorAll("button")]
    .find((item) => item.textContent?.includes("複製AA01草稿"));
  assert.ok(button);

  return {
    container,
    clickCopy: async () => {
      await act(async () => {
        button.dispatchEvent(new dom.window.MouseEvent("click", { bubbles: true }));
        await Promise.resolve();
        await Promise.resolve();
      });
    },
    cleanup: async () => {
      await act(async () => root.unmount());
      container.remove();
    },
  };
}

test("uses navigator.clipboard and copies the exact content when available", async () => {
  const writes: string[] = [];
  let fallbackCalls = 0;
  await withBrowserApis({
    writeText: async (text) => { writes.push(text); },
    execCommand: () => { fallbackCalls += 1; return true; },
  }, async () => {
    await clipboardHelper()("第一行\n第二行：AA01");
  });

  assert.deepEqual(writes, ["第一行\n第二行：AA01"]);
  assert.equal(fallbackCalls, 0);
});

test("uses the textarea fallback when navigator.clipboard is unavailable", async () => {
  const copied: string[] = [];
  await withBrowserApis({
    execCommand: (command, text) => {
      assert.equal(command, "copy");
      copied.push(text);
      return true;
    },
  }, async () => {
    await clipboardHelper()("LAN HTTP 完整草稿");
  });

  assert.deepEqual(copied, ["LAN HTTP 完整草稿"]);
});

test("falls back when navigator.clipboard rejects", async () => {
  const copied: string[] = [];
  await withBrowserApis({
    writeText: async () => { throw new Error("permission denied"); },
    execCommand: (_command, text) => { copied.push(text); return true; },
  }, async () => {
    await clipboardHelper()("fallback after rejection");
  });

  assert.deepEqual(copied, ["fallback after rejection"]);
});

test("fallback preserves whitespace, punctuation, and line breaks exactly", async () => {
  const content = "案件基本資料\n\n一、個案現況：\n- 待補充 / 100%";
  let copied = "";
  await withBrowserApis({
    execCommand: (_command, text) => { copied = text; return true; },
  }, async () => {
    await clipboardHelper()(content);
  });

  assert.equal(copied, content);
});

test("removes the temporary textarea after a successful fallback", async () => {
  await withBrowserApis({ execCommand: () => true }, async (dom) => {
    await clipboardHelper()("temporary");
    assert.equal(dom.window.document.querySelector("textarea"), null);
  });
});

test("reports failure and removes the textarea when execCommand returns false", async () => {
  await withBrowserApis({ execCommand: () => false }, async (dom) => {
    await assert.rejects(
      clipboardHelper()("cannot copy"),
      /無法複製|copy/i
    );
    assert.equal(dom.window.document.querySelector("textarea"), null);
  });
});

test("reports failure and removes the textarea when execCommand throws", async () => {
  await withBrowserApis({
    execCommand: () => { throw new Error("blocked"); },
  }, async (dom) => {
    await assert.rejects(
      clipboardHelper()("cannot copy"),
      /無法複製|copy/i
    );
    assert.equal(dom.window.document.querySelector("textarea"), null);
  });
});

test("Step 8 shows success feedback and copies the unchanged AA01 draft", async () => {
  let copied = "";
  await withBrowserApis({
    execCommand: (_command, text) => { copied = text; return true; },
  }, async (dom) => {
    const view = await renderOutput(dom);
    const output = view.container.querySelector<HTMLTextAreaElement>("textarea");
    assert.ok(output);
    const before = output.value;

    await view.clickCopy();

    assert.equal(copied, before);
    assert.equal(output.value, before);
    assert.match(view.container.querySelector("[role='status']")?.textContent ?? "", /已複製/);
    await view.cleanup();
  });
});

test("Step 8 shows failure feedback and keeps the draft when all copy methods fail", async () => {
  await withBrowserApis({ execCommand: () => false }, async (dom) => {
    const view = await renderOutput(dom);
    const output = view.container.querySelector<HTMLTextAreaElement>("textarea");
    assert.ok(output);
    const before = output.value;

    await view.clickCopy();

    assert.equal(output.value, before);
    assert.match(
      view.container.querySelector("[role='status']")?.textContent ?? "",
      /複製失敗|手動選取/
    );
    await view.cleanup();
  });
});
