import assert from "node:assert/strict";
import test from "node:test";

import {
  getServiceGoalTemplate,
  buildServiceGoals,
} from "../src/rules/serviceGoalLibrary.ts";

test("可取得 BA13 模板", () => {
  const template = getServiceGoalTemplate("BA13");
  assert.ok(template);
  assert.equal(template?.serviceCode, "BA13");
  assert.ok(template?.approvalText.length);
});

test("可取得 DA01 模板", () => {
  const template = getServiceGoalTemplate("DA01");
  assert.ok(template);
  assert.equal(template?.category, "transportation");
});

test("輔具碼以前綴對應，OT01 對應營養餐飲", () => {
  assert.equal(getServiceGoalTemplate("EA01")?.serviceCode, "EA");
  assert.equal(getServiceGoalTemplate("EB03")?.serviceCode, "EB");
  assert.equal(getServiceGoalTemplate("OT01")?.serviceCode, "Meal Service");
});

test("buildServiceGoals 可產生短中長期目標", () => {
  const result = buildServiceGoals(["BA13"]);
  assert.ok(result.shortTermGoals.length > 0);
  assert.ok(result.midTermGoals.length > 0);
  assert.ok(result.longTermGoals.length > 0);
  assert.equal(result.approvals[0].serviceCode, "BA13");
});

test("未知服務碼進 missingCodes", () => {
  const result = buildServiceGoals(["ZZ99"]);
  assert.deepEqual(result.missingCodes, ["ZZ99"]);
  assert.equal(result.shortTermGoals.length, 0);
});

test("重複服務碼不產生重複目標", () => {
  const result = buildServiceGoals(["BA13", "BA13", "BA13"]);
  assert.equal(result.approvals.length, 1);
  assert.equal(result.shortTermGoals.length, 1);
});

test("空輸入與空字串不會 throw", () => {
  assert.doesNotThrow(() => buildServiceGoals([]));
  assert.doesNotThrow(() => buildServiceGoals(["", "BA13"]));
  const result = buildServiceGoals(["", "BA13"]);
  assert.equal(result.approvals.length, 1);
});
