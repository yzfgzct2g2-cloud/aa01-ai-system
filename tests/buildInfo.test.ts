import assert from "node:assert/strict";
import test from "node:test";

import { getBuildDate, getBuildTime, getBuildInfo } from "../src/utils/buildInfo.ts";
import { APP_VERSION, LAST_UPDATE } from "../src/config/version.ts";

test("版本資訊存在且與 APP_VERSION 一致", () => {
  const info = getBuildInfo();
  assert.equal(APP_VERSION, "1.6.4");
  assert.equal(LAST_UPDATE, "2026-07-22");
  assert.equal(info.version, APP_VERSION);
  assert.ok(info.version.length > 0);
});

test("日期格式正常（ROC 年/月/日）", () => {
  assert.equal(getBuildDate(new Date(2026, 5, 21, 9, 5)), "115/06/21");
  assert.match(getBuildDate(), /^\d{3}\/\d{2}\/\d{2}$/);
});

test("時間格式正常（HH:mm）", () => {
  assert.equal(getBuildTime(new Date(2026, 5, 21, 9, 5)), "09:05");
  assert.match(getBuildTime(), /^\d{2}:\d{2}$/);
});
