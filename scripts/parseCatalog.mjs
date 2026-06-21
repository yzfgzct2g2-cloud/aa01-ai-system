import { readFileSync, writeFileSync } from "node:fs";

const raw = readFileSync("scripts/giving.txt", "utf8");
const text = raw.replace(/===== PAGE \d+ =====/g, " ").replace(/\s+/g, " ");

const ef = text.indexOf("改善服務 通則"); // start of 輔具/無障礙 table
const ei = text.indexOf("智慧科技輔具", ef); // start of 附表四之一 (after E/F)
const region1 = text.slice(0, ef); // B/C/D/G
const region2 = text.slice(ef, ei === -1 ? text.length : ei); // E/F
console.error(`ef=${ef} ei=${ei} len=${text.length}`);

const ANY_CODE = /\b(AA|BA|BB|BC|BD|CA|CB|CC|CD|DA|GA|SC|EA|EB|EC|ED|EG|EH|FA|FB|OT)\d+[a-z]?\d?\b/g;

function stripCodes(s) {
  return s.replace(ANY_CODE, " ");
}
function numbers(s) {
  return stripCodes(s).match(/\d{1,3}(?:,\d{3})*(?!\d)|不適用/g) || [];
}

// ---- Region 1: 照顧/專業/交通/喘息 (一、內容 … 給付價 原民價) ----
function parseRegion1() {
  const rows = [];
  const wanted = /^(BA|BB|BC|BD|DA|GA)\d/;
  const codeRe = new RegExp(ANY_CODE.source, "g");
  const toks = [];
  let m;
  while ((m = codeRe.exec(region1)) !== null) toks.push({ code: m[0], i: m.index, e: m.index + m[0].length });

  const starts = [];
  for (const t of toks) {
    if (!wanted.test(t.code)) continue;
    const after = region1.slice(t.e, t.e + 90);
    const mm = after.match(/^\s*([一-鿿（）()－—\-／/、·A-Za-z ]{2,45}?)\s*一\s*、/);
    if (!mm) continue;
    starts.push({ ...t, name: mm[1].replace(/\s+/g, "").replace(/[－—]/g, "-") });
  }
  for (let k = 0; k < starts.length; k++) {
    const s = starts[k];
    const stop = k + 1 < starts.length ? starts[k + 1].i : region1.length;
    const block = region1.slice(s.e, stop);
    const nums = numbers(block).filter((n) => n !== "不適用");
    const pair = nums.slice(-2);
    rows.push({ code: s.code, name: s.name, price: pair[0] ?? "", priceRemote: pair[1] ?? "" });
  }
  return rows;
}

// ---- Region 2: 輔具/無障礙 (name 給付方式 … 租賃價 購置價 年限) ----
function parseRegion2() {
  const rows = [];
  const wanted = /^(EA|EB|EC|ED|EG|EH|FA|FB)\d/;
  const codeRe = new RegExp(ANY_CODE.source, "g");
  const toks = [];
  let m;
  while ((m = codeRe.exec(region2)) !== null) toks.push({ code: m[0], i: m.index, e: m.index + m[0].length });

  const starts = [];
  for (const t of toks) {
    if (!wanted.test(t.code)) continue;
    const after = region2.slice(t.e, t.e + 80);
    const mm = after.match(
      /^\s*([一-鿿（）()－—\-／/、·A-Za-z0-9 ]{2,45}?)\s*(限\s*購\s*置|可\s*租\s*賃\s*可\s*購\s*置|限\s*租\s*賃)/
    );
    if (!mm) continue;
    starts.push({
      ...t,
      name: mm[1].replace(/\s+/g, "").replace(/[－—]/g, "-"),
      purchaseType: mm[2].replace(/\s+/g, ""),
    });
  }
  for (let k = 0; k < starts.length; k++) {
    const s = starts[k];
    const stop = k + 1 < starts.length ? starts[k + 1].i : region2.length;
    const block = region2.slice(s.e, stop);
    const vals = numbers(block).slice(-3); // 租賃 購置 年限
    rows.push({
      code: s.code,
      name: s.name,
      purchaseType: s.purchaseType,
      priceRent: vals[0] ?? "",
      priceBuy: vals[1] ?? "",
      years: vals[2] ?? "",
    });
  }
  return rows;
}

const r1 = parseRegion1();
const r2 = parseRegion2();
writeFileSync("scripts/catalog.json", JSON.stringify({ region1: r1, region2: r2 }, null, 2));

const show = (rows) => rows.forEach((r) => console.log(JSON.stringify(r)));
console.log("=== REGION 1 (B/D/G) ===");
show(r1);
console.log("\n=== REGION 2 (E/F) ===");
show(r2);
