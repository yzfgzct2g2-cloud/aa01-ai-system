import assert from "node:assert/strict";
import test from "node:test";

import { SERVICE_CATALOG } from "../src/data/serviceCatalog.ts";
import { getServiceGoalTemplate } from "../src/rules/serviceGoalLibrary.ts";

test("目錄內每個服務碼都有對應的服務目標模板（不得選得到卻找不到模板）", () => {
  const missing = [];
  for (const group of Object.values(SERVICE_CATALOG)) {
    for (const item of group.items) {
      if (!getServiceGoalTemplate(item.code)) missing.push(item.code);
    }
  }
  assert.deepEqual(missing, []);
});

test("服務碼與名稱皆非空", () => {
  for (const group of Object.values(SERVICE_CATALOG)) {
    for (const item of group.items) {
      assert.ok(item.code.length > 0, "code 不可為空");
      assert.ok(item.name.length > 0, `${item.code} name 不可為空`);
      assert.ok(item.category.length > 0, `${item.code} category 不可為空`);
    }
  }
});
