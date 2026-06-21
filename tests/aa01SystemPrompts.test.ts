import assert from "node:assert/strict";
import test from "node:test";

import { buildAA01Draft } from "../src/rules/aa01Generator.ts";

test("AA01 草稿列出系統照顧問題與服務需求提示", () => {
  const draft = buildAA01Draft({
    assessmentAnswers: {
      E1: { questionId: "E1", type: "single", value: "2" },
    },
  });

  assert.match(draft, /系統輔助提示（需個管確認）/);
  assert.match(draft, /不代表自動核定服務/);
  assert.match(draft, /日常生活活動需協助/);
  assert.match(draft, /BA02 基本日常照顧/);
});

test("沒有矩陣結果時 AA01 草稿顯示無系統提示", () => {
  const draft = buildAA01Draft({});

  assert.match(draft, /（一）\t照顧問題提示：\n無系統提示。/);
  assert.match(draft, /（二）\t服務需求提示：\n無系統提示。/);
});
