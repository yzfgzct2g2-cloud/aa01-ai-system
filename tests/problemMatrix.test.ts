import assert from "node:assert/strict";
import test from "node:test";

import { buildCareProblems } from "../src/rules/problemMatrix.ts";
import type { AssessmentAnswer } from "../src/types.ts";

function single(questionId: string, code: string): AssessmentAnswer {
  return { questionId, type: "single", value: code };
}

function multi(questionId: string, codes: string[]): AssessmentAnswer {
  return { questionId, type: "multi", value: codes };
}

test("未填評估答案時不產生問題提示", () => {
  assert.deepEqual(buildCareProblems({}), []);
});

test("ADL 與 IADL 非 code 1 答案各產生一項協助需求", () => {
  const problems = buildCareProblems({
    E1: single("E1", "2"),
    E2: single("E2", "3"),
    E11: single("E11", "2"),
    F1: single("F1", "1"),
    F3: single("F3", "2"),
  });

  assert.deepEqual(
    problems.map(({ id, sourceQuestionIds }) => ({ id, sourceQuestionIds })),
    [
      { id: "adl-assistance", sourceQuestionIds: ["E1", "E2"] },
      { id: "iadl-assistance", sourceQuestionIds: ["F3"] },
    ]
  );
});

test("疼痛 code 2-6 產生提示，code 1 與 7 不產生", () => {
  assert.equal(buildCareProblems({ G1a: single("G1a", "2") })[0]?.id, "pain-care");
  assert.deepEqual(buildCareProblems({ G1a: single("G1a", "1") }), []);
  assert.deepEqual(buildCareProblems({ G1a: single("G1a", "7") }), []);
});

test("皮膚、吞嚥與環境只依已填異常選項產生提示", () => {
  const problems = buildCareProblems({
    G2a: single("G2a", "2"),
    G2c: multi("G2c", ["4"]),
    G6a: multi("G6a", ["2"]),
    G6b: single("G6b", "2"),
    H1e: multi("H1e", ["3"]),
  });

  assert.deepEqual(
    problems.map(({ id, sourceQuestionIds, severity }) => ({ id, sourceQuestionIds, severity })),
    [
      { id: "skin-care", sourceQuestionIds: ["G2a", "G2c"], severity: "high" },
      { id: "swallowing-risk", sourceQuestionIds: ["G6a", "G6b"], severity: "high" },
      { id: "environment-risk", sourceQuestionIds: ["H1e"], severity: "high" },
    ]
  );

  assert.deepEqual(buildCareProblems({
    G2a: single("G2a", "1"),
    G6a: multi("G6a", ["1"]),
    G6b: single("G6b", "1"),
    H1e: multi("H1e", ["1", "8"]),
  }), []);
});

test("行為發生或頻率非從未發生時產生單一風險提示", () => {
  const problems = buildCareProblems({
    I01a: single("I01a", "2"),
    I11b: single("I11b", "3"),
    I14a: single("I14a", "1"),
  });

  assert.deepEqual(
    problems.map(({ id, sourceQuestionIds }) => ({ id, sourceQuestionIds })),
    [{ id: "behavior-risk", sourceQuestionIds: ["I01a", "I11b"] }]
  );
});
