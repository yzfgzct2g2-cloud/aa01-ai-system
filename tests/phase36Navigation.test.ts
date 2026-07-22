import assert from "node:assert/strict";
import { registerHooks } from "node:module";
import test from "node:test";

import * as React from "react";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";

import type { AA01Form, PlannedService } from "../src/types.ts";

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

const { Step4CaseProfile } = await import("../src/Components/Step4CaseProfile.tsx");
const { Step4Services } = await import("../src/Components/Step4Services.tsx");
const { Step5SummaryReview } = await import("../src/Components/Step5SummaryReview.tsx");

function withoutRandomUuid<T>(run: () => T): T {
  const descriptor = Object.getOwnPropertyDescriptor(globalThis, "crypto");
  Object.defineProperty(globalThis, "crypto", {
    configurable: true,
    value: {
      getRandomValues: <V extends ArrayBufferView | null>(array: V) => array,
    },
  });

  try {
    return run();
  } finally {
    if (descriptor) Object.defineProperty(globalThis, "crypto", descriptor);
    else delete (globalThis as { crypto?: Crypto }).crypto;
  }
}

function renderCaseProfile(form: AA01Form) {
  return renderToStaticMarkup(createElement(Step4CaseProfile, {
    form,
    setForm: () => undefined,
  }));
}

function renderServices(form: AA01Form) {
  return renderToStaticMarkup(createElement(Step4Services, {
    form,
    setForm: () => undefined,
  }));
}

function completeService(): PlannedService {
  return {
    id: "existing-service",
    serviceKind: "一般服務",
    group: "B",
    code: "",
    name: "",
    unit: "",
    quantity: "",
    frequency: "",
    providerName: "",
    providerStatus: "",
    equipmentUseType: "租借",
    purchaseType: "",
  };
}

test("empty data renders Step 4 without crashing", () => {
  assert.doesNotThrow(() => renderCaseProfile({}));
});

test("legacy data renders Step 4 without category UI state", () => {
  const legacyForm: AA01Form = {
    assessmentAnswers: {
      C1: { questionId: "C1", type: "single", value: "1" },
    },
  };
  assert.doesNotThrow(() => renderCaseProfile(legacyForm));
});

test("an empty assessmentCategorySelections object renders Step 4", () => {
  assert.doesNotThrow(() =>
    renderCaseProfile({ assessmentCategorySelections: {} })
  );
});

test("complete data renders Step 4 without changing form data", () => {
  const form: AA01Form = {
    caseName: "測試個案",
    assessmentCategorySelections: { G: ["none"] },
    caseProfile: {
      family: { maritalStatus: "已婚", coResidents: ["配偶"] },
    },
  };
  const before = structuredClone(form);
  assert.doesNotThrow(() => renderCaseProfile(form));
  assert.deepEqual(form, before);
});

test("empty data renders Step 5 when randomUUID is unavailable", () => {
  assert.doesNotThrow(() => withoutRandomUuid(() => renderServices({})));
});

test("an empty service list renders Step 5 when randomUUID is unavailable", () => {
  assert.doesNotThrow(() => withoutRandomUuid(() => renderServices({ services: [] })));
});

test("legacy data without assessmentCategorySelections renders Step 5", () => {
  const legacyForm: AA01Form = {
    assessmentAnswers: {
      C1: { questionId: "C1", type: "single", value: "1" },
    },
  };
  assert.doesNotThrow(() => withoutRandomUuid(() => renderServices(legacyForm)));
});

test("complete service data renders Step 5 without randomUUID or data changes", () => {
  const form: AA01Form = {
    assessmentCategorySelections: {},
    services: [completeService()],
  };
  const before = structuredClone(form);
  assert.doesNotThrow(() => withoutRandomUuid(() => renderServices(form)));
  assert.deepEqual(form, before);
});

test("rendering an empty Step 5 does not write fallback data into the form", () => {
  const form: AA01Form = {};
  let writes = 0;

  withoutRandomUuid(() => {
    renderToStaticMarkup(createElement(Step4Services, {
      form,
      setForm: () => { writes += 1; },
    }));
  });

  assert.equal(writes, 0);
  assert.deepEqual(form, {});
});

test("empty data renders the following summary step without crashing", () => {
  assert.doesNotThrow(() =>
    renderToStaticMarkup(createElement(Step5SummaryReview, { form: {} }))
  );
});
