import assert from "node:assert/strict";
import test from "node:test";

import { assessmentOptions } from "../src/data/assessmentOptions.ts";
import { classifyFormChange } from "../src/persistence/draftAutosave.ts";
import {
  buildAA01Draft,
  generateProblemAnalysis,
} from "../src/rules/aa01Generator.ts";
import type {
  AA01Form,
  AssessmentAnswer,
  AssessmentOption,
} from "../src/types.ts";

function option(code: string, summary: string): AssessmentOption {
  return {
    code,
    label: summary,
    summary,
  };
}

function single(
  questionId: string,
  value: string,
  summary?: string
): AssessmentAnswer {
  return {
    questionId,
    type: "single",
    value,
    selectedOptions: summary ? [option(value, summary)] : [],
  };
}

function multi(
  questionId: string,
  value: string[],
  summary?: string
): AssessmentAnswer {
  return {
    questionId,
    type: "multi",
    value,
    selectedOptions: summary ? [option(value[0] ?? "", summary)] : [],
  };
}

function text(questionId: string, value: string): AssessmentAnswer {
  return {
    questionId,
    type: "text",
    value,
    text: value,
  };
}

test("H1b has exactly eleven options and the final label has no full-width colon", () => {
  const h1b = assessmentOptions.find((question) => question.id === "H1b");

  assert.ok(h1b);
  assert.equal(h1b.options?.length, 11);
  assert.equal(h1b.options?.at(-1)?.label, "其他（包含看護）");
  assert.equal(h1b.options?.at(-1)?.summary, "與個案同住者：其他（包含看護）。");
});

test("G4d-score is absent from the assessment catalog", () => {
  assert.equal(
    assessmentOptions.some((question) => question.id === "G4d-score"),
    false
  );
});

test("Generator emits only effective conditional assessment answers", () => {
  const hiddenMarkers = [
    "HIDDEN_D0_MEMORY",
    "HIDDEN_G2_SKIN",
    "HIDDEN_G4_HEIGHT_ALTERNATIVE",
    "HIDDEN_G4D_OTHER",
    "HIDDEN_G4E_DISEASE_NOTE",
    "HIDDEN_G5_ITEMS",
  ];
  const form: AA01Form = {
    assessmentCategorySelections: {
      G: ["skin", "nutrition", "medical", "advanced"],
      H: ["household"],
    },
    assessmentAnswers: {
      C1: text("C1", "VISIBLE_COMMUNICATION"),
      D0: single("D0", "3"),
      D1a: text("D1a", hiddenMarkers[0]),
      G2a: single("G2a", "1"),
      G2b: text("G2b", hiddenMarkers[1]),
      "G4b-height": {
        questionId: "G4b-height",
        type: "number",
        value: 165,
      },
      "G4b-arm-span": text("G4b-arm-span", hiddenMarkers[2]),
      G4d1: single("G4d1", "2"),
      "G4d1-other": text("G4d1-other", hiddenMarkers[3]),
      "G4d-score": {
        questionId: "G4d-score",
        type: "number",
        value: 99,
      },
      G4e: single("G4e", "2"),
      "G4e-diseases": multi("G4e-diseases", []),
      "G4e-cancer-note": text("G4e-cancer-note", hiddenMarkers[4]),
      G5a: single("G5a", "1"),
      "G5-items": multi("G5-items", ["01"], hiddenMarkers[5]),
      H1b: multi("H1b", []),
    },
  };

  const draft = buildAA01Draft(form);

  assert.match(draft, /VISIBLE_COMMUNICATION/);
  for (const marker of hiddenMarkers) {
    assert.doesNotMatch(draft, new RegExp(marker));
  }
  assert.doesNotMatch(draft, /SOF衰弱評估分數：99分/);
  assert.deepEqual(generateProblemAnalysis(form).care, []);
});

test("H1b multi-select changes autosave immediately and empty legacy values do not crash Generator", () => {
  const h1bAnswer = multi("H1b", ["01", "11"]);

  assert.equal(
    classifyFormChange(
      {},
      { assessmentAnswers: { H1b: h1bAnswer } }
    ),
    "immediate"
  );
  assert.doesNotThrow(() =>
    buildAA01Draft({
      assessmentCategorySelections: { H: ["household"] },
      assessmentAnswers: { H1b: multi("H1b", []) },
    })
  );
  assert.doesNotThrow(() => buildAA01Draft({ assessmentAnswers: {} }));
});
