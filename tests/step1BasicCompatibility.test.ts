import assert from "node:assert/strict";
import test from "node:test";

import {
  resolveLegacyAssessmentDate,
  resolveLegacyCmsLevel,
  resolveLegacyIdentityType,
} from "../src/Components/Step1Basic.logic.ts";
import {
  IDENTITY_OPTIONS,
  formatIdentityType,
} from "../src/data/identityOptions.ts";

test("valid ISO assessment dates remain canonical", () => {
  assert.deepEqual(resolveLegacyAssessmentDate("2026-07-22"), {
    normalizedValue: "2026-07-22",
    originalValue: "2026-07-22",
    isValid: true,
    isLegacy: false,
    needsUserSelection: false,
  });
});

test("safe Gregorian and ROC assessment dates map to YYYY-MM-DD", () => {
  assert.equal(resolveLegacyAssessmentDate("2026/7/2").normalizedValue, "2026-07-02");
  assert.equal(resolveLegacyAssessmentDate("2026-07-22T12:30:00.000Z").normalizedValue, "2026-07-22");
  assert.equal(resolveLegacyAssessmentDate("民國115年7月22日").normalizedValue, "2026-07-22");
  assert.equal(resolveLegacyAssessmentDate("民國115/7/2").normalizedValue, "2026-07-02");
  assert.equal(resolveLegacyAssessmentDate("115年7月22日").normalizedValue, "2026-07-22");
});

test("ambiguous or invalid assessment dates are not guessed", () => {
  for (const value of ["今天", "七月二日", "2025-02-29", "2026/13/2", "民國115年2月30日"]) {
    const result = resolveLegacyAssessmentDate(value);
    assert.equal(result.normalizedValue, "", value);
    assert.equal(result.originalValue, value);
    assert.equal(result.isValid, false);
    assert.equal(result.needsUserSelection, true);
  }
});

test("a valid legacy Date object maps without mutating the object", () => {
  const value = new Date("2026-07-22T00:00:00.000Z");
  const before = value.getTime();
  const result = resolveLegacyAssessmentDate(value);

  assert.equal(result.normalizedValue, "2026-07-22");
  assert.equal(result.isLegacy, true);
  assert.equal(value.getTime(), before);
});

test("CMS safe aliases map to stable values 2 through 8", () => {
  assert.equal(resolveLegacyCmsLevel("4").normalizedValue, "4");
  assert.equal(resolveLegacyCmsLevel(4).normalizedValue, "4");
  assert.equal(resolveLegacyCmsLevel("4級").normalizedValue, "4");
  assert.equal(resolveLegacyCmsLevel("CMS 4級").normalizedValue, "4");
  assert.equal(resolveLegacyCmsLevel("CMS第四級").normalizedValue, "4");
  assert.equal(resolveLegacyCmsLevel("第四級").normalizedValue, "4");
});

test("CMS values outside 2 through 8 remain unresolved", () => {
  for (const value of ["1", "1級", "CMS第九級", "9", "其他", "第十級"]) {
    const result = resolveLegacyCmsLevel(value);
    assert.equal(result.normalizedValue, "", value);
    assert.equal(result.originalValue, value);
    assert.equal(result.needsUserSelection, true);
  }
});

test("identity options expose one shared canonical mapping", () => {
  assert.deepEqual(IDENTITY_OPTIONS, [
    { value: "class1", label: "第一類" },
    { value: "class2", label: "第二類" },
    { value: "class3", label: "第三類" },
  ]);
  assert.equal(formatIdentityType("class1"), "第一類");
  assert.equal(formatIdentityType("class2"), "第二類");
  assert.equal(formatIdentityType("class3"), "第三類");
});

test("approved legacy identity labels map to class1 class2 and class3", () => {
  for (const value of ["第一類", "第一類／低收", "第一類/低收", "低收入戶", "低收"]) {
    assert.equal(resolveLegacyIdentityType(value).normalizedValue, "class1", value);
  }
  for (const value of ["第二類", "第二類／中低收", "第二類/中低收", "中低收入戶", "中低收"]) {
    assert.equal(resolveLegacyIdentityType(value).normalizedValue, "class2", value);
  }
  for (const value of ["第三類", "第三類／一般戶", "第三類/一般戶", "一般戶"]) {
    assert.equal(resolveLegacyIdentityType(value).normalizedValue, "class3", value);
  }
});

test("unknown identity text is preserved and never guessed", () => {
  const result = resolveLegacyIdentityType("榮民");
  assert.deepEqual(result, {
    normalizedValue: "",
    originalValue: "榮民",
    isValid: false,
    isLegacy: true,
    needsUserSelection: true,
  });
  assert.equal(formatIdentityType("榮民"), "榮民");
});

test("empty compatibility values remain empty without a warning", () => {
  for (const resolver of [
    resolveLegacyAssessmentDate,
    resolveLegacyCmsLevel,
    resolveLegacyIdentityType,
  ]) {
    assert.deepEqual(resolver(undefined), {
      normalizedValue: "",
      originalValue: "",
      isValid: true,
      isLegacy: false,
      needsUserSelection: false,
    });
  }
});
