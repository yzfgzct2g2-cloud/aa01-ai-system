import assert from "node:assert/strict";
import test from "node:test";

import { buildAA01Draft } from "../src/rules/aa01Generator.ts";

test("AA01 正文不得出現系統提示／提醒等字樣", () => {
  const draft = buildAA01Draft({
    assessmentAnswers: {
      E1: { questionId: "E1", type: "single", value: "2" },
    },
    services: [
      {
        id: "1",
        serviceKind: "一般服務",
        group: "G",
        code: "GA09",
        name: "居家喘息服務",
        unit: "組",
        quantity: "10",
        frequency: "",
        providerName: "",
        providerStatus: "",
      },
    ],
  });

  assert.doesNotMatch(draft, /系統提醒/);
  assert.doesNotMatch(draft, /系統輔助提示/);
  assert.doesNotMatch(draft, /找不到模板/);
  assert.doesNotMatch(draft, /缺少模板/);
  assert.doesNotMatch(draft, /TODO|Warning/);
});

test("AA01 標頭含系統版本與產生資訊", () => {
  const draft = buildAA01Draft({});
  assert.match(draft, /AA01 AI照顧計畫系統/);
  assert.match(draft, /系統版本：v/);
  assert.match(draft, /產生日期：/);
});

test("Case Profile 有資料時帶入家庭/經濟/社會支持/環境段落", () => {
  const draft = buildAA01Draft({
    caseProfile: {
      family: { maritalStatus: "已婚", primaryCaregiver: "配偶" },
      economic: { welfareCategory: "中低收入戶" },
      socialSupport: { relativesSupport: "普通" },
      environment: { housingType: "自宅", elevator: "無" },
    },
  });

  assert.match(draft, /\(二\)\t家庭功能概況：.*婚姻狀況：已婚/);
  assert.match(draft, /\(三\)\t經濟概況：.*福利身份：中低收入戶/);
  assert.match(draft, /\(四\)\t社會支持概況：.*親屬支持：普通/);
  assert.match(draft, /\(五\)\t輔具及居家環境概況：.*居住型態：自宅/);
});

test("Case Profile 無資料時顯示待補充", () => {
  const draft = buildAA01Draft({});
  assert.match(draft, /\(二\)\t家庭功能概況：待補充/);
  assert.match(draft, /\(三\)\t經濟概況：待補充/);
  assert.match(draft, /\(四\)\t社會支持概況：待補充/);
  assert.match(draft, /\(五\)\t輔具及居家環境概況：待補充/);
});
