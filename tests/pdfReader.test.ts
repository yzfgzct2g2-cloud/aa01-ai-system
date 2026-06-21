import assert from "node:assert/strict";
import test from "node:test";

// extractTextFromPdf runs pdf.js in the browser (Vite worker). The text
// extraction/join logic is unit-tested here via the pure helper it uses.
import { joinPageText } from "../src/rules/pdfTextJoin.ts";

test("PDF 可成功讀出文字（合併頁面文字）", () => {
  const text = joinPageText([
    { items: [{ str: "C1" }, { str: "1" }, { str: "清醒" }] },
    { items: [{ str: "E1" }, { str: "2" }] },
  ]);
  assert.equal(text, "C1 1 清醒\nE1 2");
});

test("空白頁與缺字串不會 crash", () => {
  const text = joinPageText([{ items: [] }, { items: [{}, { str: "F1" }] }]);
  assert.equal(text, "F1");
});

test("無頁面回傳空字串", () => {
  assert.equal(joinPageText([]), "");
});
