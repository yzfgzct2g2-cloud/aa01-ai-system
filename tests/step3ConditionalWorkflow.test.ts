import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { registerHooks } from "node:module";
import test, { afterEach } from "node:test";

import { JSDOM } from "jsdom";
import * as React from "react";
import { act, createElement, useState } from "react";
import { createRoot } from "react-dom/client";

import { conditionalCategories } from "../src/Components/Step3Assessment.logic.ts";
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
const componentSource = readFileSync(
  new URL("../src/Components/Step3Assessment.tsx", import.meta.url),
  "utf8"
);

let activeCleanup: (() => Promise<void>) | null = null;

afterEach(async () => {
  await activeCleanup?.();
  activeCleanup = null;
});

function question(id: string) {
  const result = assessmentOptions.find((item) => item.id === id);
  assert.ok(result, `找不到評估題目：${id}`);
  return result;
}

function single(questionId: string, value: string | number): AssessmentAnswer {
  return { questionId, type: "single", value };
}

async function renderAssessment(options: {
  answers?: Record<string, AssessmentAnswer>;
  categorySelections?: AssessmentCategorySelections;
  currentSection?: SectionKey;
  currentQuestion?: string | null;
} = {}) {
  const dom = new JSDOM("<!doctype html><html><body><div id='root'></div></body></html>");
  const scrollCalls: ScrollIntoViewOptions[] = [];
  const scrollTargets: string[] = [];
  const focusCalls: string[] = [];
  const animationFrames = new Map<number, FrameRequestCallback>();
  let nextAnimationFrameId = 1;
  const globalKeys = [
    "window",
    "document",
    "HTMLElement",
    "Event",
    "MouseEvent",
    "requestAnimationFrame",
    "cancelAnimationFrame",
    "React",
    "IS_REACT_ACT_ENVIRONMENT",
  ] as const;
  const originalGlobals = new Map(
    globalKeys.map((key) => [key, Object.getOwnPropertyDescriptor(globalThis, key)])
  );
  const elementPrototype = dom.window.HTMLElement.prototype;
  const originalScrollIntoView = Object.getOwnPropertyDescriptor(
    elementPrototype,
    "scrollIntoView"
  );
  const originalFocus = elementPrototype.focus;
  const originalAttachEvent = Object.getOwnPropertyDescriptor(
    elementPrototype,
    "attachEvent"
  );
  const originalDetachEvent = Object.getOwnPropertyDescriptor(
    elementPrototype,
    "detachEvent"
  );

  elementPrototype.scrollIntoView = function scrollIntoView(
    scrollOptions?: boolean | ScrollIntoViewOptions
  ) {
    if (typeof scrollOptions === "object") {
      scrollCalls.push(scrollOptions);
      scrollTargets.push(this.tagName);
    }
  };
  elementPrototype.focus = function focus(options?: FocusOptions) {
    focusCalls.push(this.tagName);
    originalFocus.call(this, options);
  };
  Object.defineProperties(elementPrototype, {
    attachEvent: {
      configurable: true,
      value: () => {},
    },
    detachEvent: {
      configurable: true,
      value: () => {},
    },
  });
  Object.assign(globalThis, {
    window: dom.window,
    document: dom.window.document,
    HTMLElement: dom.window.HTMLElement,
    Event: dom.window.Event,
    MouseEvent: dom.window.MouseEvent,
    requestAnimationFrame: (callback: FrameRequestCallback) => {
      const id = nextAnimationFrameId;
      nextAnimationFrameId += 1;
      animationFrames.set(id, callback);
      return id;
    },
    cancelAnimationFrame: (handle: number) => {
      animationFrames.delete(handle);
    },
    React,
    IS_REACT_ACT_ENVIRONMENT: true,
  });

  let latestAnswers = options.answers ?? {};
  let latestCategorySelections = options.categorySelections ?? {};
  let renderVersion = 0;
  const container = dom.window.document.getElementById("root")!;
  const root = createRoot(container);

  function Harness({ version: _version }: { version: number }) {
    const [answers, setAnswers] = useState(options.answers ?? {});
    const [categorySelections, setCategorySelections] = useState(
      options.categorySelections ?? {}
    );
    latestAnswers = answers;
    latestCategorySelections = categorySelections;

    return createElement(Step3Assessment, {
      assessmentAnswers: answers,
      setAssessmentAnswers: setAnswers,
      categorySelections,
      setCategorySelections,
      currentSection: options.currentSection ?? "G",
      currentQuestion: options.currentQuestion ?? null,
    });
  }

  const render = async () => {
    await act(async () => {
      root.render(createElement(Harness, { version: renderVersion }));
    });
  };
  await render();

  const flushReact = async () => {
    await act(async () => {
      await Promise.resolve();
    });
  };

  const flushAnimationFrames = async () => {
    const currentFrame = [...animationFrames.entries()];
    for (const [id] of currentFrame) animationFrames.delete(id);
    await act(async () => {
      for (const [, callback] of currentFrame) callback(0);
      await Promise.resolve();
    });
  };

  const questionBlock = (id: string) =>
    container.querySelector<HTMLElement>(`#assessment-question-${id}`);

  const control = (id: string) => {
    const result = questionBlock(id)?.querySelector<HTMLElement>(
      "select, textarea, input[type='number'], input[type='checkbox']"
    );
    assert.ok(result, `找不到題目控制項：${id}`);
    return result;
  };

  const choose = async (id: string, value: string) => {
    await act(async () => {
      const selected = control(id) as HTMLSelectElement;
      selected.value = value;
      selected.dispatchEvent(new dom.window.Event("change", { bubbles: true }));
    });
  };

  const enterNumber = async (id: string, value: string) => {
    await act(async () => {
      const input = control(id) as HTMLInputElement;
      input.value = value;
      input.dispatchEvent(new dom.window.Event("change", { bubbles: true }));
    });
  };

  const toggleCategory = async (section: "G" | "H" | "I", key: string) => {
    const labelText = conditionalCategories[section].find((category) => category.key === key)?.label;
    assert.ok(labelText, `找不到類別定義：${section}/${key}`);
    const label = [...container.querySelectorAll<HTMLLabelElement>(".assessment-category")]
      .find((item) => item.textContent?.trim() === labelText);
    assert.ok(label, `找不到類別控制項：${section}/${key}`);
    await act(async () => {
      label.querySelector<HTMLInputElement>("input")?.click();
    });
  };

  const toggleMulti = async (id: string, code: string) => {
    const label = [...(questionBlock(id)?.querySelectorAll<HTMLLabelElement>("label") ?? [])]
      .find((item) => item.textContent?.trim().startsWith(`${code}.`));
    assert.ok(label, `找不到複選選項：${id}/${code}`);
    await act(async () => {
      label.querySelector<HTMLInputElement>("input")?.click();
    });
  };

  let cleanedUp = false;
  const cleanup = async () => {
    if (cleanedUp) return;
    cleanedUp = true;
    animationFrames.clear();
    await act(async () => root.unmount());
    container.remove();
    dom.window.document.body.replaceChildren();
    scrollCalls.length = 0;
    scrollTargets.length = 0;
    focusCalls.length = 0;
    if (originalScrollIntoView) {
      Object.defineProperty(
        elementPrototype,
        "scrollIntoView",
        originalScrollIntoView
      );
    } else {
      delete (elementPrototype as typeof elementPrototype & {
        scrollIntoView?: typeof elementPrototype.scrollIntoView;
      }).scrollIntoView;
    }
    elementPrototype.focus = originalFocus;
    if (originalAttachEvent) {
      Object.defineProperty(elementPrototype, "attachEvent", originalAttachEvent);
    } else {
      delete (elementPrototype as typeof elementPrototype & {
        attachEvent?: () => void;
      }).attachEvent;
    }
    if (originalDetachEvent) {
      Object.defineProperty(elementPrototype, "detachEvent", originalDetachEvent);
    } else {
      delete (elementPrototype as typeof elementPrototype & {
        detachEvent?: () => void;
      }).detachEvent;
    }
    for (const key of globalKeys) {
      const descriptor = originalGlobals.get(key);
      if (descriptor) Object.defineProperty(globalThis, key, descriptor);
      else delete (globalThis as Record<string, unknown>)[key];
    }
    dom.window.close();
    if (activeCleanup === cleanup) activeCleanup = null;
  };
  activeCleanup = cleanup;

  return {
    container,
    dom,
    scrollCalls,
    scrollTargets,
    focusCalls,
    flushReact,
    flushAnimationFrames,
    questionBlock,
    control,
    choose,
    enterNumber,
    toggleCategory,
    toggleMulti,
    answers: () => latestAnswers,
    categorySelections: () => latestCategorySelections,
    rerender: async () => {
      renderVersion += 1;
      await render();
    },
    cleanup,
  };
}

test("D0 refusal hides D1 and restoring eligibility preserves its answer", async () => {
  const d1Answer = single("D1a", "1");
  const view = await renderAssessment({
    answers: { D0: single("D0", "3"), D1a: d1Answer },
    currentSection: "D",
  });

  assert.equal(view.questionBlock("D1a"), null);
  await view.choose("D0", "1");
  assert.ok(view.questionBlock("D1a"));
  assert.deepEqual(view.answers().D1a, d1Answer);
  await view.cleanup();
});

test("G selections render labelled panels without nested accordions and preserve hidden answers", async () => {
  const saved = single("G1a", "2");
  const view = await renderAssessment({
    answers: { G1a: saved },
    categorySelections: { G: [] },
  });

  await view.toggleCategory("G", "pain");
  const panel = view.container.querySelector<HTMLElement>(
    '#assessment-panel-G[role="region"][aria-labelledby="assessment-section-G-title"]'
  );
  assert.ok(panel);
  assert.ok(panel.querySelector("#assessment-question-G1-source"));
  assert.equal(panel.querySelector("button"), null);
  assert.deepEqual(view.categorySelections().G, ["pain"]);

  await view.toggleCategory("G", "pain");
  assert.equal(panel.querySelector("#assessment-question-G1-source"), null);
  assert.deepEqual(view.answers().G1a, saved);
  await view.cleanup();
});

test("recovered G panels do not move focus or the viewport", async () => {
  const view = await renderAssessment({
    answers: { G1a: single("G1a", "2") },
    categorySelections: { G: ["pain"] },
    currentQuestion: "G1a",
  });

  const panel = view.container.querySelector<HTMLElement>(
    '#assessment-panel-G[role="region"][aria-labelledby="assessment-section-G-title"]'
  );
  assert.ok(panel);
  assert.ok(panel.querySelector("#assessment-question-G1-source"));
  assert.equal(view.scrollCalls.length, 0);
  assert.equal(view.dom.window.document.activeElement, view.dom.window.document.body);
  await view.cleanup();
});

test("G effective questions follow the shared conditional rules", async () => {
  const view = await renderAssessment({
    categorySelections: { G: ["skin", "nutrition", "medical", "advanced"] },
  });

  assert.ok(view.questionBlock("G2a"));
  assert.equal(view.questionBlock("G2b"), null);
  await view.choose("G2a", "2");
  assert.ok(view.questionBlock("G2b"));

  assert.ok(view.questionBlock("G4b-arm-span"));
  assert.ok(view.questionBlock("G4b-hip-circumference"));
  await view.enterNumber("G4b-height", "165");
  await view.enterNumber("G4b-weight", "60");
  assert.equal(view.questionBlock("G4b-arm-span"), null);
  assert.equal(view.questionBlock("G4b-hip-circumference"), null);

  for (const id of ["G4d1", "G4d2", "G4d3"]) {
    assert.equal(view.questionBlock(`${id}-other`), null);
    await view.choose(id, "3");
    assert.ok(view.questionBlock(`${id}-other`));
  }
  assert.equal(view.questionBlock("G4d-score"), null);

  assert.equal(view.questionBlock("G4e-diseases"), null);
  await view.choose("G4e", "2");
  for (const id of ["G4e-diseases", "G4e-treatment", "G4e-medications"]) {
    assert.ok(view.questionBlock(id));
  }
  for (const [code, id] of [
    ["08", "G4e-cancer-note"],
    ["21", "G4e-infection-note"],
    ["22", "G4e-rare-disease-note"],
    ["24", "G4e-other-note"],
  ]) {
    assert.equal(view.questionBlock(id), null);
    await view.toggleMulti("G4e-diseases", code);
    assert.ok(view.questionBlock(id));
  }

  assert.equal(view.questionBlock("G5-items"), null);
  await view.choose("G5a", "2");
  assert.ok(view.questionBlock("G5-items"));
  await view.cleanup();
});

test("a direct G category check scrolls and focuses exactly once", async () => {
  const view = await renderAssessment({ categorySelections: { G: [] } });

  await view.toggleCategory("G", "pain");
  await view.flushReact();
  const firstControl = view.control("G1-source");
  await view.flushAnimationFrames();
  assert.deepEqual(view.scrollCalls, [{ behavior: "smooth", block: "nearest" }]);
  assert.deepEqual(view.focusCalls, ["SELECT"]);
  assert.equal(view.dom.window.document.activeElement, firstControl);

  await view.flushAnimationFrames();
  assert.equal(view.scrollCalls.length, 1);
  assert.equal(view.focusCalls.length, 1);
  assert.equal(view.dom.window.document.activeElement, firstControl);
  await view.cleanup();
});

test("direct G4d and G4e reveals focus their new control without scrolling", async () => {
  const view = await renderAssessment({
    categorySelections: { G: ["nutrition", "medical"] },
  });

  assert.equal(view.questionBlock("G4d1-other"), null);
  await view.choose("G4d1", "3");
  await view.flushReact();
  const g4dOther = view.control("G4d1-other");
  await view.flushAnimationFrames();
  assert.equal(view.dom.window.document.activeElement, g4dOther);
  assert.equal(view.scrollCalls.length, 0);
  assert.deepEqual(view.focusCalls, ["TEXTAREA"]);
  await view.flushAnimationFrames();
  assert.equal(view.focusCalls.length, 1);
  assert.equal(view.scrollCalls.length, 0);

  assert.equal(view.questionBlock("G4e-diseases"), null);
  await view.choose("G4e", "2");
  await view.flushReact();
  assert.ok(view.questionBlock("G4e-diseases"));
  assert.equal(view.questionBlock("G4e-cancer-note"), null);
  await view.toggleMulti("G4e-diseases", "08");
  await view.flushReact();
  const cancerNote = view.control("G4e-cancer-note");
  await view.flushAnimationFrames();
  assert.equal(view.dom.window.document.activeElement, cancerNote);
  assert.equal(view.scrollCalls.length, 0);
  assert.deepEqual(view.focusCalls, ["TEXTAREA", "TEXTAREA"]);
  await view.flushAnimationFrames();
  assert.equal(view.focusCalls.length, 2);
  assert.equal(view.scrollCalls.length, 0);
  await view.cleanup();
});

test("direct G5 yes scrolls and focuses the first newly rendered checkbox once", async () => {
  const view = await renderAssessment({
    categorySelections: { G: ["advanced"] },
  });

  await view.choose("G5a", "2");
  await view.flushReact();
  const firstCheckbox = view.control("G5-items");
  await view.flushAnimationFrames();
  assert.deepEqual(view.scrollCalls, [{ behavior: "smooth", block: "nearest" }]);
  assert.deepEqual(view.scrollTargets, ["INPUT"]);
  assert.deepEqual(view.focusCalls, ["INPUT"]);
  assert.equal(view.dom.window.document.activeElement, firstCheckbox);

  await view.flushAnimationFrames();
  assert.equal(view.scrollCalls.length, 1);
  assert.equal(view.scrollTargets.length, 1);
  assert.equal(view.focusCalls.length, 1);
  assert.equal(view.dom.window.document.activeElement, firstCheckbox);
  await view.cleanup();
});

test("Step 3 interaction code does not use global DOM lookup, timers, or viewport JavaScript", () => {
  assert.doesNotMatch(componentSource, /document\.(?:querySelector|getElementById)/);
  assert.doesNotMatch(componentSource, /setTimeout/);
  assert.doesNotMatch(componentSource, /window\.innerWidth|addEventListener\(["']resize/);
});
