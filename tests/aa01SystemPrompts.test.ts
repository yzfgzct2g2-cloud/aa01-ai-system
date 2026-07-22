import assert from "node:assert/strict";
import test from "node:test";

import { buildAA01Draft } from "../src/rules/aa01Generator.ts";

test("category UI persistence does not change AA01 output", () => {
  const assessmentAnswers = {
    I01b: { questionId: "I01b", type: "single" as const, value: "2" },
  };
  const withoutUiState = buildAA01Draft({ assessmentAnswers });
  const withUiState = buildAA01Draft({
    assessmentAnswers,
    assessmentCategorySelections: { I: ["I01", "none"] },
  });

  assert.equal(withUiState, withoutUiState);
});

test("canonical and recognized legacy identity values use category labels in AA01 output", () => {
  const expected = new Map([
    ["class1", "第一類"],
    ["class2", "第二類"],
    ["class3", "第三類"],
    ["低收入戶", "第一類"],
    ["中低收入戶", "第二類"],
    ["一般戶", "第三類"],
  ]);

  for (const [identityType, label] of expected) {
    const draft = buildAA01Draft({ identityType });
    assert.match(draft, new RegExp(`身分別：${label}`), identityType);
    assert.doesNotMatch(draft, /身分別：class[123]/, identityType);
  }
});

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

test("AA01 正文不再含系統版本與產生日期時間", () => {
  const draft = buildAA01Draft({});
  assert.doesNotMatch(draft, /系統版本/);
  assert.doesNotMatch(draft, /產生日期/);
  assert.doesNotMatch(draft, /產生時間/);
});

test("AA01 開頭含案件基本資料，缺資料顯示待補充", () => {
  const draft = buildAA01Draft({
    caseNumber: "A123",
    caseName: "王小明",
    cmsLevel: "4",
    caseProfile: { family: { primaryCaregiver: "配偶" } },
  });
  assert.match(draft, /案件基本資料/);
  assert.match(draft, /案號：A123/);
  assert.match(draft, /個案姓名：王小明/);
  assert.match(draft, /CMS等級：4/);
  assert.match(draft, /主要照顧者：配偶/);
  assert.match(draft, /評估日期：待補充/);
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
