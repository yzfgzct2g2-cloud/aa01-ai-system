import assert from "node:assert/strict";
import test from "node:test";

import { buildServiceSuggestions } from "../src/rules/serviceSuggestion.ts";
import type { CareProblem } from "../src/rules/problemMatrix.ts";

function problem(id: string): CareProblem {
  return { id, title: id, description: id, sourceQuestionIds: [] };
}

test("依照七種照顧問題產生指定服務碼且不自動核定", () => {
  const suggestions = buildServiceSuggestions([
    problem("adl-assistance"),
    problem("iadl-assistance"),
    problem("pain-care"),
    problem("skin-care"),
    problem("swallowing-risk"),
    problem("environment-risk"),
    problem("behavior-risk"),
  ]);

  const codesByProblem = Object.groupBy(
    suggestions,
    (suggestion) => suggestion.problemId
  );

  assert.deepEqual(codesByProblem["adl-assistance"]?.map((item) => item.serviceCode), [
    "BA02", "BA07", "BA11",
  ]);
  assert.deepEqual(codesByProblem["iadl-assistance"]?.map((item) => item.serviceCode), [
    "BA15-1", "BA15-2", "BA16-1",
  ]);
  assert.deepEqual(codesByProblem["pain-care"]?.map((item) => item.serviceCode), [
    "BA11", "BA13",
  ]);
  assert.deepEqual(codesByProblem["skin-care"]?.map((item) => item.serviceCode), [
    "BA02", "BA07",
  ]);
  assert.deepEqual(codesByProblem["swallowing-risk"]?.map((item) => item.serviceCode), ["BA04"]);
  assert.deepEqual(codesByProblem["environment-risk"]?.map((item) => item.serviceCode), [
    "BA12", "EA/EB",
  ]);
  assert.deepEqual(codesByProblem["behavior-risk"]?.map((item) => item.serviceCode), [
    "BA18", "BA20",
  ]);
});

test("皮膚、吞嚥及行為提示帶入指定注意事項", () => {
  const suggestions = buildServiceSuggestions([
    problem("skin-care"),
    problem("swallowing-risk"),
    problem("behavior-risk"),
  ]);

  assert.equal(
    suggestions.find((item) => item.problemId === "skin-care")?.caution,
    "傷口護理或醫療處置需另評估專業服務或醫療資源。"
  );
  assert.equal(
    suggestions.find((item) => item.problemId === "swallowing-risk")?.caution,
    "吞嚥訓練需另評估專業服務。"
  );
  assert.equal(
    suggestions.find((item) => item.problemId === "behavior-risk")?.caution,
    "若有自傷、自殺或明顯危及安全情形，需依規定通報或轉介專業資源。"
  );
});

test("未知問題不產生服務提示", () => {
  assert.deepEqual(buildServiceSuggestions([problem("unknown")]), []);
});
