import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const appSource = readFileSync(new URL("../src/App.tsx", import.meta.url), "utf8");
const commonCss = readFileSync(
  new URL("../src/Components/common/common.css", import.meta.url),
  "utf8"
);

function cssRule(selector: string) {
  const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return commonCss.match(new RegExp(`${escaped}\\s*\\{([^}]*)\\}`, "s"))?.[1] ?? "";
}

test("footer navigation uses a dedicated scoped container class", () => {
  assert.match(appSource, /className="app-footer-navigation"/);
});

test("previous remains a native button with a stable scoped class and accessible text", () => {
  assert.match(
    appSource,
    /<button\s+className="app-footer-navigation__button"[\s\S]*?>\s*上一步\s*<\/button>/
  );
});

test("next remains a native button with a stable scoped class and accessible text", () => {
  assert.match(
    appSource,
    /<button\s+className="app-footer-navigation__button"[\s\S]*?>\s*下一步\s*<\/button>/
  );
});

test("step boundary disabled behavior is unchanged", () => {
  assert.match(appSource, /disabled=\{step === 0\}/);
  assert.match(appSource, /disabled=\{step === steps\.length - 1\}/);
});

test("previous and next keep the existing step navigation handlers", () => {
  assert.match(appSource, /changeStep\(step - 1\)/);
  assert.match(appSource, /changeStep\(step \+ 1\)/);
});

test("footer buttons have an actual minimum height of 44 CSS pixels", () => {
  assert.match(cssRule(".app-footer-navigation__button"), /min-height:\s*44px/);
});

test("footer buttons use visible padding instead of a pseudo-element hit area", () => {
  assert.match(cssRule(".app-footer-navigation__button"), /padding:\s*8px 16px/);
  assert.equal(commonCss.includes(".app-footer-navigation__button::"), false);
});

test("footer button sizing uses the app font and border-box dimensions", () => {
  const rule = cssRule(".app-footer-navigation__button");
  assert.match(rule, /box-sizing:\s*border-box/);
  assert.match(rule, /font:\s*inherit/);
  assert.match(rule, /line-height:\s*1\.25/);
});

test("footer buttons have an explicit keyboard focus indicator", () => {
  const rule = cssRule(".app-footer-navigation__button:focus-visible");
  assert.match(rule, /outline:/);
  assert.match(rule, /outline-offset:/);
});

test("disabled footer buttons retain a non-interactive cursor", () => {
  assert.match(cssRule(".app-footer-navigation__button:disabled"), /cursor:\s*not-allowed/);
});

test("footer keeps its existing placement and does not force wide mobile buttons", () => {
  const button = cssRule(".app-footer-navigation__button");
  const spacing = cssRule(
    ".app-footer-navigation__button + .app-footer-navigation__button"
  );

  assert.equal(cssRule(".app-footer-navigation"), "");
  assert.doesNotMatch(button, /position:\s*(?:fixed|sticky|absolute)/);
  assert.doesNotMatch(button, /min-width:\s*(?:100%|\d{3,}px)/);
  assert.match(spacing, /margin-left:\s*8px/);
});
