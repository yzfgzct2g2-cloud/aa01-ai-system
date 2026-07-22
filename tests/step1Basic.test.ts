import assert from "node:assert/strict";
import { registerHooks } from "node:module";
import test from "node:test";

import { JSDOM } from "jsdom";
import * as React from "react";
import { act, createElement, useState } from "react";
import { createRoot } from "react-dom/client";
import { renderToStaticMarkup } from "react-dom/server";

import type { AA01Form } from "../src/types.ts";

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

const { Step1Basic } = await import("../src/Components/Step1Basic.tsx");

function staticView(form: AA01Form, onSetForm: (form: AA01Form) => void = () => undefined) {
  const markup = renderToStaticMarkup(createElement(Step1Basic, {
    form,
    setForm: onSetForm,
  }));
  const dom = new JSDOM(markup);
  return dom.window.document;
}

function values(control: HTMLSelectElement): string[] {
  return [...control.options].map((option) => option.value);
}

test("Step 1 renders a native date and only the approved CMS and identity options", () => {
  const document = staticView({});
  const date = document.querySelector<HTMLInputElement>('input[name="assessmentDate"]');
  const cms = document.querySelector<HTMLSelectElement>('select[name="cmsLevel"]');
  const identity = document.querySelector<HTMLSelectElement>('select[name="identityType"]');

  assert.equal(date?.type, "date");
  assert.equal(date?.value, "");
  assert.deepEqual(values(cms!), ["", "2", "3", "4", "5", "6", "7", "8"]);
  assert.deepEqual([...cms!.options].map((option) => option.textContent), [
    "請選擇", "2級", "3級", "4級", "5級", "6級", "7級", "8級",
  ]);
  assert.deepEqual(values(identity!), ["", "class1", "class2", "class3"]);
  assert.deepEqual([...identity!.options].map((option) => option.textContent), [
    "請選擇", "第一類", "第二類", "第三類",
  ]);
});

test("safe legacy values display canonically without writing during render", () => {
  let writes = 0;
  const form: AA01Form = {
    assessmentDate: "2026/7/2",
    cmsLevel: "CMS第四級",
    identityType: "低收入戶",
  };
  const before = structuredClone(form);
  const document = staticView(form, () => { writes += 1; });

  assert.equal(document.querySelector<HTMLInputElement>('input[name="assessmentDate"]')?.value, "2026-07-02");
  assert.equal(document.querySelector<HTMLSelectElement>('select[name="cmsLevel"]')?.value, "4");
  assert.equal(document.querySelector<HTMLSelectElement>('select[name="identityType"]')?.value, "class1");
  assert.equal(document.querySelector(".basic-data-legacy-warning"), null);
  assert.equal(writes, 0);
  assert.deepEqual(form, before);
});

test("unknown legacy data remains untouched and shows its exact value", () => {
  let writes = 0;
  const form = {
    assessmentDate: "七月二日",
    cmsLevel: "CMS 9級",
    identityType: "榮民",
  };
  const before = structuredClone(form);
  const document = staticView(form, () => { writes += 1; });

  assert.equal(document.querySelector<HTMLInputElement>('input[name="assessmentDate"]')?.value, "");
  assert.equal(document.querySelector<HTMLSelectElement>('select[name="cmsLevel"]')?.value, "");
  assert.equal(document.querySelector<HTMLSelectElement>('select[name="identityType"]')?.value, "");
  const warningNodes = [...document.querySelectorAll(".basic-data-legacy-warning")];
  const warnings = warningNodes
    .map((warning) => warning.textContent?.replace(/\s+/g, " ").trim());
  assert.deepEqual(warnings, [
    "偵測到舊資料：七月二日請重新選擇",
    "偵測到舊資料：CMS 9級請重新選擇",
    "偵測到舊資料：榮民請重新選擇",
  ]);
  assert.equal(warningNodes.every((warning) => warning.querySelector("br")), true);
  assert.equal(writes, 0);
  assert.deepEqual(form, before);
});

test("choosing a valid value replaces only that legacy field and removes its warning", async () => {
  const dom = new JSDOM("<!doctype html><html><body><div id='root'></div></body></html>");
  Object.assign(globalThis, {
    window: dom.window,
    document: dom.window.document,
    HTMLElement: dom.window.HTMLElement,
    Event: dom.window.Event,
    React,
    IS_REACT_ACT_ENVIRONMENT: true,
  });
  const initial: AA01Form = {
    caseName: "保留個案",
    assessmentDate: "2026-07-22",
    cmsLevel: "4",
    identityType: "未知身分",
    assessmentAnswers: {
      C1: { questionId: "C1", type: "single", value: "1" },
    },
  };
  let latest = initial;

  function Harness() {
    const [form, setForm] = useState(initial);
    latest = form;
    return createElement(Step1Basic, { form, setForm });
  }

  const root = createRoot(dom.window.document.getElementById("root")!);
  await act(async () => root.render(createElement(Harness)));
  const select = dom.window.document.querySelector<HTMLSelectElement>('select[name="identityType"]')!;
  assert.match(dom.window.document.body.textContent ?? "", /偵測到舊資料：未知身分/);

  await act(async () => {
    select.value = "class2";
    select.dispatchEvent(new dom.window.Event("change", { bubbles: true }));
  });

  assert.equal(latest.identityType, "class2");
  assert.equal(latest.caseName, "保留個案");
  assert.equal(latest.assessmentDate, "2026-07-22");
  assert.equal(latest.cmsLevel, "4");
  assert.equal(latest.assessmentAnswers?.C1.value, "1");
  assert.doesNotMatch(dom.window.document.body.textContent ?? "", /偵測到舊資料：未知身分/);

  await act(async () => root.unmount());
  dom.window.close();
});

test("malformed runtime legacy values do not crash Step 1", () => {
  const malformed = {
    assessmentDate: { unexpected: true },
    cmsLevel: ["4"],
    identityType: 3,
  } as unknown as AA01Form;

  assert.doesNotThrow(() => staticView(malformed));
});
