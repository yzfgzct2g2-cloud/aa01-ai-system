import assert from "node:assert/strict";
import test from "node:test";

import {
  conditionalCategories,
  getRestoredQuestionId,
  getSectionProgress,
  getVisibleQuestionIds,
  inferSelectedCategories,
  resolveCategorySelections,
  updateCategorySelection,
} from "../src/Components/Step3Assessment.logic.ts";

test("component logic continues to re-export the shared category definitions", () => {
  assert.equal(conditionalCategories.G.find((category) => category.key === "skin")?.label.length > 0, true);
});

test("G category recovery prefers the explicit saved selection", () => {
  assert.deepEqual(
    resolveCategorySelections("G", { G: ["nutrition"] }, ["G1a"]),
    ["nutrition"]
  );
});

test("H category recovery prefers the explicit saved selection", () => {
  assert.deepEqual(
    resolveCategorySelections("H", { H: ["environment"] }, ["H1a"]),
    ["environment"]
  );
});

test("I category recovery prefers the explicit saved selection", () => {
  assert.deepEqual(
    resolveCategorySelections("I", { I: ["I01"] }, ["I03b"]),
    ["I01"]
  );
});

test("an explicit none category survives recovery even when hidden answers remain", () => {
  assert.deepEqual(
    resolveCategorySelections("I", { I: ["I01", "none"] }, ["I01a", "I01b"]),
    ["I01", "none"]
  );
});

test("an explicit empty category selection is not replaced by inferred answers", () => {
  assert.deepEqual(
    resolveCategorySelections("G", { G: [] }, ["G1a"]),
    []
  );
});

test("legacy drafts without category state still infer categories from answers", () => {
  assert.deepEqual(
    resolveCategorySelections("H", undefined, ["H1e1"]),
    ["environment"]
  );
  assert.deepEqual(
    resolveCategorySelections("I", { G: ["pain"] }, ["I03b"]),
    ["I03"]
  );
});

test("the latest category toggle is stored without deleting other section state", () => {
  const first = updateCategorySelection(
    { G: ["pain"], H: ["living"] },
    "I",
    "I01",
    true,
    []
  );
  const latest = updateCategorySelection(first, "I", "I01", false, []);

  assert.deepEqual(latest, {
    G: ["pain"],
    H: ["living"],
    I: [],
  });
});

test("category updates retain inferred legacy selections on the first explicit change", () => {
  assert.deepEqual(
    updateCategorySelection(undefined, "G", "nutrition", true, ["G1a"]),
    { G: ["pain", "nutrition"] }
  );
});

test("恢復導覽只接受目前題組中仍可見的題目", () => {
  assert.equal(getRestoredQuestionId("H1e1", ["H1e", "H1e1"]), "H1e1");
  assert.equal(getRestoredQuestionId("H2a", ["H1e", "H1e1"]), null);
});

test("缺少題目位置時不嘗試聚焦", () => {
  assert.equal(getRestoredQuestionId(null, ["C1"]), null);
});

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
