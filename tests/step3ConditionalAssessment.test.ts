import assert from "node:assert/strict";
import test from "node:test";

import type { AssessmentAnswer, AssessmentCategorySelections } from "../src/types.ts";
import {
  getEffectiveAssessmentAnswers,
  getEffectiveStep3QuestionIds,
  isPositiveMeasurement,
  isStep3QuestionEffective,
  shouldShowMemoryQuestions,
} from "../src/rules/step3ConditionalAssessment.ts";

function single(questionId: string, value: string | number): AssessmentAnswer {
  return { questionId, type: "single", value };
}

function multi(questionId: string, value: string[]): AssessmentAnswer {
  return { questionId, type: "multi", value };
}

test("D0 refusal hides exactly the D1 memory questions", () => {
  const d1QuestionIds = ["D1a", "D1b1", "D1b2", "D1b3"];

  assert.equal(shouldShowMemoryQuestions({ D0: single("D0", "3") }), false);
  assert.equal(shouldShowMemoryQuestions({ D0: single("D0", "1") }), true);
  assert.equal(shouldShowMemoryQuestions({}), true);

  for (const questionId of d1QuestionIds) {
    assert.equal(isStep3QuestionEffective(questionId, { D0: single("D0", "3") }), false);
  }
  assert.equal(isStep3QuestionEffective("D0", { D0: single("D0", "3") }), true);
  assert.equal(isStep3QuestionEffective("E1", { D0: single("D0", "3") }), true);
});

test("positive measurements require finite values greater than zero", () => {
  assert.equal(isPositiveMeasurement("165"), true);
  assert.equal(isPositiveMeasurement(60), true);

  for (const value of ["", "abc", 0, -1, null, undefined]) {
    assert.equal(isPositiveMeasurement(value), false);
  }
});

test("G H and I category membership honors saved, none, and inferred selections", () => {
  const cases: Array<{
    questionId: string;
    answers: Record<string, AssessmentAnswer>;
    selections?: AssessmentCategorySelections;
    effective: boolean;
  }> = [
    { questionId: "G2b", answers: { G2a: single("G2a", "2") }, selections: { G: ["skin"] }, effective: true },
    { questionId: "G2b", answers: { G2a: single("G2a", "2") }, selections: { G: ["pain"] }, effective: false },
    { questionId: "G2b", answers: { G2a: single("G2a", "2") }, selections: { G: ["none"] }, effective: false },
    { questionId: "G2b", answers: { G2a: single("G2a", "2") }, effective: true },
    { questionId: "H1e", answers: { H1e: single("H1e", "1") }, effective: true },
    { questionId: "H1e", answers: { H1e: single("H1e", "1") }, selections: { H: [] }, effective: false },
    { questionId: "I03b", answers: { I03b: single("I03b", "1") }, effective: true },
    { questionId: "I03b", answers: { I03b: single("I03b", "1") }, selections: { I: ["none"] }, effective: false },
  ];

  for (const { questionId, answers, selections, effective } of cases) {
    assert.equal(isStep3QuestionEffective(questionId, answers, selections), effective);
  }
});

test("G2 child questions require the abnormal skin code", () => {
  const childIds = ["G2b", "G2c", "G2d", "G2d-other", "G2d1", "G2d2", "G2d2-other"];
  for (const questionId of childIds) {
    assert.equal(isStep3QuestionEffective(questionId, { G2a: single("G2a", "1") }, { G: ["skin"] }), false);
    assert.equal(isStep3QuestionEffective(questionId, { G2a: single("G2a", "2") }, { G: ["skin"] }), true);
  }
});

test("G4 height and weight alternatives appear only when their direct measurement is invalid", () => {
  const heightAlternatives = ["G4b-arm-span", "G4b-half-arm-span", "G4b-knee-height", "G4b-converted-height"];
  const weightAlternatives = ["G4b-hip-circumference", "G4b-estimated-weight"];
  const cases: Array<{
    answers: Record<string, AssessmentAnswer>;
    heightEffective: boolean;
    weightEffective: boolean;
  }> = [
    { answers: { "G4b-height": single("G4b-height", 165), "G4b-weight": single("G4b-weight", "60") }, heightEffective: false, weightEffective: false },
    { answers: { "G4b-height": single("G4b-height", 165) }, heightEffective: false, weightEffective: true },
    { answers: { "G4b-weight": single("G4b-weight", 60) }, heightEffective: true, weightEffective: false },
    { answers: { "G4b-height": single("G4b-height", 0), "G4b-weight": single("G4b-weight", -1) }, heightEffective: true, weightEffective: true },
  ];

  for (const { answers, heightEffective, weightEffective } of cases) {
    for (const questionId of heightAlternatives) {
      assert.equal(isStep3QuestionEffective(questionId, answers, { G: ["nutrition"] }), heightEffective);
    }
    for (const questionId of weightAlternatives) {
      assert.equal(isStep3QuestionEffective(questionId, answers, { G: ["nutrition"] }), weightEffective);
    }
  }
});

test("G4d Other, G4e disease, and G5 dependencies use stable option codes", () => {
  for (const questionId of ["G4d1-other", "G4d2-other", "G4d3-other"]) {
    const parentId = questionId.replace("-other", "");
    assert.equal(isStep3QuestionEffective(questionId, { [parentId]: single(parentId, "3") }, { G: ["nutrition"] }), true);
    assert.equal(isStep3QuestionEffective(questionId, { [parentId]: single(parentId, "2") }, { G: ["nutrition"] }), false);
  }

  for (const questionId of ["G4e-diseases", "G4e-treatment", "G4e-medications"]) {
    assert.equal(isStep3QuestionEffective(questionId, { G4e: single("G4e", "2") }, { G: ["medical"] }), true);
    assert.equal(isStep3QuestionEffective(questionId, { G4e: single("G4e", "1") }, { G: ["medical"] }), false);
  }

  for (const [code, questionId] of [["08", "G4e-cancer-note"], ["21", "G4e-infection-note"], ["22", "G4e-rare-disease-note"], ["24", "G4e-other-note"]]) {
    assert.equal(isStep3QuestionEffective(questionId, { G4e: single("G4e", "2"), "G4e-diseases": multi("G4e-diseases", [code]) }, { G: ["medical"] }), true);
    assert.equal(isStep3QuestionEffective(questionId, { G4e: single("G4e", "2"), "G4e-diseases": multi("G4e-diseases", []) }, { G: ["medical"] }), false);
  }

  assert.equal(isStep3QuestionEffective("G5-items", { G5a: single("G5a", "2") }, { G: ["advanced"] }), true);
  assert.equal(isStep3QuestionEffective("G5-items", { G5a: single("G5a", "1") }, { G: ["advanced"] }), false);
  assert.equal(isStep3QuestionEffective("G4d-score", {}, { G: ["nutrition"] }), false);
});

test("effective question and answer helpers exclude inactive answers without mutating their input", () => {
  const source = {
    D0: single("D0", "3"),
    D1a: single("D1a", "1"),
    G2a: single("G2a", "1"),
    G2b: single("G2b", "2"),
    unrelated: single("unrelated", "1"),
  };
  const originalSnapshot = structuredClone(source);
  Object.freeze(source);

  const result = getEffectiveAssessmentAnswers(source, { G: ["skin"] });

  assert.equal(result.D1a, undefined);
  assert.equal(result.G2b, undefined);
  assert.deepEqual(source, originalSnapshot);
  assert.deepEqual(
    getEffectiveStep3QuestionIds(Object.keys(source), source, { G: ["skin"] }),
    ["D0", "G2a", "unrelated"]
  );
});

test("unmapped G H and I prefix IDs remain effective outside the Step 3 category definitions", () => {
  const source = {
    "General-note": single("General-note", "1"),
    "G99-legacy": single("G99-legacy", "1"),
    "H99-legacy": single("H99-legacy", "1"),
    "I99-legacy": single("I99-legacy", "1"),
  };
  const selections: AssessmentCategorySelections = { G: ["none"], H: ["none"], I: ["none"] };

  for (const questionId of Object.keys(source)) {
    assert.equal(isStep3QuestionEffective(questionId, source, selections), true);
  }
  assert.deepEqual(getEffectiveAssessmentAnswers(source, selections), source);
});
