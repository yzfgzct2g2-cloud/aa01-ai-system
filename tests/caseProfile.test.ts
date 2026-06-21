import assert from "node:assert/strict";
import test from "node:test";

import {
  formatFamilyProfile,
  formatEconomicProfile,
  formatSocialSupportProfile,
  formatEnvironmentProfile,
} from "../src/types/caseProfile.ts";

test("空 Profile 顯示待補充", () => {
  assert.equal(formatFamilyProfile(undefined), "待補充");
  assert.equal(formatEconomicProfile({}), "待補充");
  assert.equal(formatSocialSupportProfile({}), "待補充");
  assert.equal(formatEnvironmentProfile({}), "待補充");
});

test("家庭功能概況可組出文字", () => {
  const text = formatFamilyProfile({
    maritalStatus: "已婚",
    coResidents: ["配偶", "子女"],
    primaryCaregiver: "配偶",
    caregiverBurden: "中度",
  });
  assert.match(text, /婚姻狀況：已婚/);
  assert.match(text, /同住者：配偶、子女/);
  assert.match(text, /主要照顧者：配偶/);
  assert.match(text, /照顧者負荷：中度/);
  assert.ok(text.endsWith("。"));
});

test("經濟與環境概況可組出文字", () => {
  assert.match(
    formatEconomicProfile({ welfareCategory: "中低收入戶", incomeSource: ["退休金"] }),
    /福利身份：中低收入戶；收入來源：退休金。/
  );
  assert.match(
    formatEnvironmentProfile({ housingType: "自宅", elevator: "無", assistiveDevices: ["輪椅"] }),
    /居住型態：自宅.*電梯：無.*現有輔具：輪椅/
  );
});
