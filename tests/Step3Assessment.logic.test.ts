import assert from "node:assert/strict";
import test from "node:test";

import {
  getSectionProgress,
  getVisibleQuestionIds,
  inferSelectedCategories,
} from "../src/Components/Step3Assessment.logic.ts";

const gIds = [
  "G1-source",
  "G1a",
  "G1b",
  "G2a",
  "G2d-other",
  "G4b-height",
  "G4d-score",
  "G8e",
];

test("G 區只顯示已勾選問題類別的題組", () => {
  assert.deepEqual(
    getVisibleQuestionIds("G", ["pain"], gIds),
    ["G1-source", "G1a", "G1b"]
  );
  assert.deepEqual(
    getVisibleQuestionIds("G", ["nutrition"], gIds),
    ["G4b-height", "G4d-score"]
  );
});

test("G 區選擇無特殊需求時隱藏全部細項", () => {
  assert.deepEqual(
    getVisibleQuestionIds("G", ["pain", "none"], gIds),
    []
  );
});

test("H 區環境風險會展開 H1e 題組", () => {
  const ids = ["H1a", "H1e", "H1e-other", "H1e1", "H2a"];

  assert.deepEqual(
    getVisibleQuestionIds("H", ["environment"], ids),
    ["H1e", "H1e-other", "H1e1"]
  );
});

test("I 區遊走只展開 I01 發生與頻率題", () => {
  const ids = ["I00", "I01a", "I01b", "I02a", "I02b"];

  assert.deepEqual(
    getVisibleQuestionIds("I", ["I01"], ids),
    ["I01a", "I01b"]
  );
});

test("既有答案可還原所屬問題類別", () => {
  assert.deepEqual(
    inferSelectedCategories("G", ["G2d1", "G8c1"]),
    ["skin", "safety"]
  );
  assert.deepEqual(
    inferSelectedCategories("I", ["I03b"]),
    ["I03"]
  );
});

test("條件區完成率只計算已顯示題目並包含類別選擇", () => {
  const progress = getSectionProgress(
    ["G1a", "G1b"],
    {
      G1a: { questionId: "G1a", type: "single", value: "1" },
    },
    true
  );

  assert.deepEqual(progress, {
    answered: 2,
    total: 3,
    status: "部分完成",
  });
});

test("無問題選項可直接完成條件區", () => {
  assert.deepEqual(getSectionProgress([], {}, true), {
    answered: 1,
    total: 1,
    status: "已完成",
  });
});

test("尚未選擇問題類別時仍列入整體完成率", () => {
  assert.deepEqual(getSectionProgress([], {}, false), {
    answered: 0,
    total: 1,
    status: "未填寫",
  });
});
