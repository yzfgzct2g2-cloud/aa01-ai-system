import assert from "node:assert/strict";
import test from "node:test";

import { applyParsedAssessment } from "../src/rules/applyParsedAssessment.ts";
import type { ParsedAssessmentAnswer } from "../src/rules/pdfAssessmentParser.ts";
import type { AssessmentAnswer } from "../src/types.ts";

function parsed(
  questionId: string,
  detectedCode: ParsedAssessmentAnswer["detectedCode"]
): ParsedAssessmentAnswer {
  return { questionId, detectedCode, confidence: "high", sourceText: "" };
}

test("套用有效單選題並寫入 selectedOptions", () => {
  const result = applyParsedAssessment({}, [parsed("C1", "1")]);
  assert.deepEqual(result.applied, ["C1"]);
  assert.equal(result.assessmentAnswers.C1.value, "1");
  assert.equal(result.assessmentAnswers.C1.type, "single");
  assert.equal(result.assessmentAnswers.C1.selectedOptions?.[0]?.code, "1");
});

test("多選題只保留題庫存在的選項", () => {
  const result = applyParsedAssessment({}, [parsed("G6a", ["2", "3", "99"])]);
  assert.deepEqual(result.assessmentAnswers.G6a.value, ["2", "3"]);
});

test("不覆蓋既有人工答案，列入 conflicts", () => {
  const existing: Record<string, AssessmentAnswer> = {
    C1: { questionId: "C1", type: "single", value: "2" },
  };
  const result = applyParsedAssessment(existing, [parsed("C1", "1")]);
  assert.deepEqual(result.applied, []);
  assert.equal(result.conflicts.length, 1);
  assert.equal(result.conflicts[0].questionId, "C1");
  assert.equal(result.assessmentAnswers.C1.value, "2"); // unchanged
});

test("題號不存在於題庫則跳過", () => {
  const result = applyParsedAssessment({}, [parsed("Z9", "1")]);
  assert.deepEqual(result.applied, []);
  assert.equal(result.skipped[0]?.questionId, "Z9");
  assert.equal(result.assessmentAnswers.Z9, undefined);
});

test("選項不存在於題庫則跳過", () => {
  const result = applyParsedAssessment({}, [parsed("C1", "9")]);
  assert.deepEqual(result.applied, []);
  assert.equal(result.skipped.length, 1);
  assert.equal(result.assessmentAnswers.C1, undefined);
});

test("空值既有答案不算衝突，可正常套用", () => {
  const existing: Record<string, AssessmentAnswer> = {
    C1: { questionId: "C1", type: "single", value: "" },
  };
  const result = applyParsedAssessment(existing, [parsed("C1", "1")]);
  assert.deepEqual(result.applied, ["C1"]);
  assert.equal(result.assessmentAnswers.C1.value, "1");
});
