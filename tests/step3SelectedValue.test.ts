import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { registerHooks } from "node:module";
import test from "node:test";

import { JSDOM } from "jsdom";
import * as React from "react";
import { act, createElement, useState } from "react";
import { createRoot } from "react-dom/client";

import * as step3Logic from "../src/Components/Step3Assessment.logic.ts";
import { assessmentOptions } from "../src/data/assessmentOptions.ts";
import type {
  AssessmentAnswer,
  AssessmentCategorySelections,
} from "../src/types.ts";
import type { SectionKey } from "../src/Components/Step3Assessment.logic.ts";

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

const { Step3Assessment } = await import("../src/Components/Step3Assessment.tsx");

type SelectedOptionLabelResolver = (
  options: { code: string; label: string }[] | undefined,
  value: string
) => string | null;

const getSelectedOptionLabel = (
  step3Logic as unknown as { getSelectedOptionLabel?: SelectedOptionLabelResolver }
).getSelectedOptionLabel;

const cssSource = readFileSync(
  new URL("../src/Components/Step3Assessment.css", import.meta.url),
  "utf8"
);
const componentSource = readFileSync(
  new URL("../src/Components/Step3Assessment.tsx", import.meta.url),
  "utf8"
);

function question(id: string) {
  const result = assessmentOptions.find((item) => item.id === id);
  assert.ok(result, `找不到評估題目：${id}`);
  return result;
}

function optionDisplay(questionId: string, code: string) {
  const selected = question(questionId).options?.find((option) => option.code === code);
  assert.ok(selected, `找不到選項：${questionId}/${code}`);
  return `${selected.code}. ${selected.label}`;
}

async function renderAssessment(options: {
  answers?: Record<string, AssessmentAnswer>;
  categorySelections?: AssessmentCategorySelections;
  currentSection?: SectionKey;
  currentQuestion?: string | null;
} = {}) {
  const dom = new JSDOM("<!doctype html><html><body><div id='root'></div></body></html>");
  dom.window.HTMLElement.prototype.scrollIntoView = () => {};
  Object.assign(globalThis, {
    window: dom.window,
    document: dom.window.document,
    HTMLElement: dom.window.HTMLElement,
    Event: dom.window.Event,
    MouseEvent: dom.window.MouseEvent,
    React,
    IS_REACT_ACT_ENVIRONMENT: true,
  });

  let latestAnswers = options.answers ?? {};
  const container = dom.window.document.getElementById("root")!;
  const root = createRoot(container);

  function Harness() {
    const [answers, setAnswers] = useState(options.answers ?? {});
    const [categorySelections, setCategorySelections] = useState(
      options.categorySelections ?? {}
    );
    latestAnswers = answers;

    return createElement(Step3Assessment, {
      assessmentAnswers: answers,
      setAssessmentAnswers: setAnswers,
      categorySelections,
      setCategorySelections,
      currentSection: options.currentSection ?? "C",
      currentQuestion: options.currentQuestion ?? null,
    });
  }

  await act(async () => {
    root.render(createElement(Harness));
  });

  const select = (title: string) => {
    const result = container.querySelector<HTMLSelectElement>(`select[aria-label="${title}"]`);
    assert.ok(result, `找不到 select：${title}`);
    return result;
  };

  const choose = async (title: string, value: string) => {
    await act(async () => {
      const control = select(title);
      control.value = value;
      control.dispatchEvent(new dom.window.Event("change", { bubbles: true }));
    });
  };

  const toggleCategory = async (label: string) => {
    const categoryLabel = [...container.querySelectorAll<HTMLLabelElement>(".assessment-category")]
      .find((item) => item.textContent?.trim() === label);
    assert.ok(categoryLabel, `找不到條件類別：${label}`);
    await act(async () => {
      categoryLabel.querySelector<HTMLInputElement>("input")?.click();
    });
  };

  return {
    container,
    select,
    choose,
    toggleCategory,
    answers: () => latestAnswers,
    cleanup: async () => {
      await act(async () => root.unmount());
      dom.window.close();
    },
  };
}

test("selected option helper returns the complete displayed label and rejects empty values", () => {
  assert.equal(typeof getSelectedOptionLabel, "function");
  const c2 = question("C2");
  assert.equal(getSelectedOptionLabel?.(c2.options, ""), null);
  assert.equal(getSelectedOptionLabel?.(c2.options, "missing"), null);
  assert.equal(getSelectedOptionLabel?.(c2.options, "5"), optionDisplay("C2", "5"));
});

test("empty value and placeholder do not render summaries or aria-describedby", async () => {
  const view = await renderAssessment();
  const control = view.select(question("C2").title);

  assert.equal(control.value, "");
  assert.equal(control.getAttribute("aria-describedby"), null);
  assert.equal(view.container.querySelector(".assessment-selected-value"), null);
  assert.equal(view.container.querySelector(".assessment-selected-value__sr"), null);
  assert.doesNotMatch(view.container.textContent ?? "", /目前選擇：請選擇/);
  await view.cleanup();
});

test("selected value renders the complete option label instead of the internal value", async () => {
  const view = await renderAssessment({
    answers: { C2: { questionId: "C2", type: "single", value: "5" } },
  });
  const expected = `目前選擇：${optionDisplay("C2", "5")}`;
  const control = view.select(question("C2").title);
  const descriptionId = control.getAttribute("aria-describedby");
  const description = descriptionId ? view.container.querySelector(`#${descriptionId}`) : null;
  const visual = view.container.querySelector(".assessment-selected-value");

  assert.ok(descriptionId);
  assert.equal(description?.textContent, expected);
  assert.equal(visual?.textContent, expected);
  assert.equal(visual?.getAttribute("aria-hidden"), "true");
  assert.notEqual(visual?.textContent, "5");
  await view.cleanup();
});

test("changing a native select updates the summary immediately", async () => {
  const view = await renderAssessment({
    answers: { C2: { questionId: "C2", type: "single", value: "1" } },
  });
  assert.match(
    view.container.querySelector(".assessment-selected-value")?.textContent ?? "",
    new RegExp(optionDisplay("C2", "1"))
  );

  await view.choose(question("C2").title, "5");

  assert.equal(
    view.container.querySelector(".assessment-selected-value")?.textContent,
    `目前選擇：${optionDisplay("C2", "5")}`
  );
  assert.equal(view.answers().C2?.value, "5");
  await view.cleanup();
});

test("recovered answers render summaries without relying on selectedOptions", async () => {
  const view = await renderAssessment({
    answers: { C3: { questionId: "C3", type: "single", value: "3" } },
  });

  assert.equal(
    view.container.querySelector(".assessment-selected-value")?.textContent,
    `目前選擇：${optionDisplay("C3", "3")}`
  );
  await view.cleanup();
});

test("a disabled selected native control retains both summaries", async () => {
  const view = await renderAssessment({
    answers: { C1: { questionId: "C1", type: "single", value: "1" } },
  });
  const control = view.select(question("C1").title);
  control.disabled = true;

  assert.equal(control.disabled, true);
  assert.ok(control.getAttribute("aria-describedby"));
  assert.equal(view.container.querySelectorAll(".assessment-selected-value").length, 1);
  assert.equal(view.container.querySelectorAll(".assessment-selected-value__sr").length, 1);
  await view.cleanup();
});

test("multiple selected controls use unique description and visual summary ids", async () => {
  const view = await renderAssessment({
    answers: {
      C1: { questionId: "C1", type: "single", value: "1" },
      C2: { questionId: "C2", type: "single", value: "2" },
    },
  });
  const controls = [view.select(question("C1").title), view.select(question("C2").title)];
  const descriptionIds = controls.map((control) => control.getAttribute("aria-describedby"));
  const visualIds = [...view.container.querySelectorAll<HTMLElement>(".assessment-selected-value")]
    .map((item) => item.id);

  assert.equal(new Set(descriptionIds).size, 2);
  assert.equal(new Set(visualIds).size, 2);
  descriptionIds.forEach((id) => assert.ok(id && view.container.querySelector(`#${id}`)));
  assert.equal(view.container.querySelectorAll("[id='']").length, 0);
  await view.cleanup();
});

test("hiding a conditional question removes its summaries but preserves its answer", async () => {
  const answer: AssessmentAnswer = { questionId: "G4c", type: "single", value: "1" };
  const view = await renderAssessment({
    answers: { G4c: answer },
    categorySelections: { G: ["nutrition"] },
    currentSection: "G",
  });
  assert.match(
    view.container.querySelector(".assessment-selected-value")?.textContent ?? "",
    new RegExp(optionDisplay("G4c", "1"))
  );

  await view.toggleCategory("無特殊複雜照護需求");

  assert.equal(view.container.querySelector(".assessment-selected-value"), null);
  assert.deepEqual(view.answers().G4c, answer);

  await view.toggleCategory("無特殊複雜照護需求");
  assert.match(
    view.container.querySelector(".assessment-selected-value")?.textContent ?? "",
    new RegExp(optionDisplay("G4c", "1"))
  );
  await view.cleanup();
});

test("CSS shows the visual summary through 800px and removes it from desktop layout", () => {
  assert.match(
    cssSource,
    /\.assessment-selected-value\s*\{[^}]*display:\s*none;[^}]*\}/s
  );
  assert.match(
    cssSource,
    /@media\s*\(max-width:\s*800px\)[\s\S]*?\.assessment-selected-value\s*\{[^}]*display:\s*block;[^}]*\}/
  );
  assert.doesNotMatch(cssSource, /\.assessment-selected-value\s*\{[^}]*text-overflow:\s*ellipsis/s);
  assert.match(cssSource, /\.assessment-selected-value\s*\{[^}]*overflow-wrap:/s);
  assert.doesNotMatch(
    cssSource,
    /\.assessment-selected-value\s*\{[^}]*\n\s*(?:height|min-height|max-height)\s*:/s
  );
});

test("responsive summary uses CSS only and the assistive description is never display none", () => {
  assert.doesNotMatch(componentSource, /window\.innerWidth|addEventListener\(["']resize/);
  assert.match(
    cssSource,
    /\.assessment-selected-value__sr\s*\{[^}]*position:\s*absolute;[^}]*\}/s
  );
  assert.doesNotMatch(
    cssSource,
    /\.assessment-selected-value__sr\s*\{[^}]*display:\s*none/s
  );
});
