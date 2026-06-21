import assert from "node:assert/strict";
import test from "node:test";

import { parseAssessmentText } from "../src/rules/pdfAssessmentParser.ts";
import { assessmentOptions } from "../src/data/assessmentOptions.ts";

const validQuestionIds = new Set(assessmentOptions.map((q) => q.id));

test("rawTextPreview 只截取前 1000 字", () => {
  const longText = "字".repeat(1500);
  const result = parseAssessmentText(longText);
  assert.equal(result.rawTextPreview.length, 1000);
  assert.equal(result.rawTextPreview, longText.slice(0, 1000));
});

test("空字串不會 crash，回傳空結果", () => {
  const result = parseAssessmentText("");
  assert.deepEqual(result.parsedAnswers, []);
  assert.deepEqual(result.unresolvedItems, []);
  assert.equal(result.rawTextPreview, "");
});

test("可辨識單行題目：C1 1 清醒", () => {
  const result = parseAssessmentText("C1 1 清醒");
  assert.deepEqual(
    result.parsedAnswers.map(({ questionId, detectedCode }) => ({ questionId, detectedCode })),
    [{ questionId: "C1", detectedCode: "1" }]
  );
});

test("可辨識區塊題目：勾選的選項才採計", () => {
  const result = parseAssessmentText(
    ["C2.個案視力：", "□1.適當", "■2.輕度障礙", "□3.中度障礙"].join("\n")
  );
  const c2 = result.parsedAnswers.find((a) => a.questionId === "C2");
  assert.equal(c2?.detectedCode, "2");
  assert.equal(c2?.confidence, "high");
});

test("多選題（G6a）可累積多個勾選選項", () => {
  const result = parseAssessmentText(
    ["G6a 吞嚥困難情形", "■2.抱怨吞嚥困難", "■3.出現咳嗽或嗆咳", "□1.無吞嚥困難"].join("\n")
  );
  const g6a = result.parsedAnswers.find((a) => a.questionId === "G6a");
  assert.deepEqual(g6a?.detectedCode, ["2", "3"]);
});

test("題號存在但無法判斷勾選，列入 unresolvedItems", () => {
  const result = parseAssessmentText(
    ["C5.個案理解能力：", "□1.良好", "□2.僅可理解簡單的句子"].join("\n")
  );
  assert.equal(result.parsedAnswers.length, 0);
  assert.ok(result.unresolvedItems.some((item) => item.startsWith("C5")));
});

test("不會產生 assessmentOptions 不存在的 questionId", () => {
  const result = parseAssessmentText(["Z9 1 假題目", "C99 1 不存在", "C1 1 清醒"].join("\n"));
  assert.ok(result.parsedAnswers.every((a) => validQuestionIds.has(a.questionId)));
  assert.ok(!result.parsedAnswers.some((a) => a.questionId === "Z9" || a.questionId === "C99"));
});
