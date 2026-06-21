import { readFileSync, writeFileSync } from "node:fs";

const { region1, region2 } = JSON.parse(readFileSync("scripts/catalog.json", "utf8"));

// Names split across columns/pages in the PDF, recovered from the same source.
const NAME_OVERRIDES = {
  FA33: "居家無障礙修繕-改善高低差(高度超過三十公分)(單處)",
  EG04: "輪椅座墊-B款（連通管型氣囊氣墊座-橡膠材質）",
};

const num = (s) => Number(String(s).replace(/,/g, ""));
const cleanNum = (s) => /^\d{1,3}(,\d{3})*$/.test(s) && num(s) >= 100;

function r1Price(give, remote) {
  const g = num(give);
  const r = num(remote);
  if (!g || !r) return undefined;
  // 原民/離島價約為一般價的 1.1–1.3 倍；用區間過濾誤抓的內文數字。
  if (g >= 10 && r > g && r <= g * 1.4) return `${give}（原民/離島 ${remote}）`;
  return undefined;
}
function efPrice(pt, rent, buy) {
  if (pt === "限租賃") return cleanNum(rent) ? `租賃 ${rent}` : undefined;
  if (pt === "限購置") return cleanNum(buy) ? `購置 ${buy}` : undefined;
  const parts = [];
  if (cleanNum(rent)) parts.push(`租賃 ${rent}`);
  if (cleanNum(buy)) parts.push(`購置 ${buy}`);
  return parts.length ? parts.join("／") : undefined;
}

const catalog = {
  B: { title: "B碼｜照顧及專業服務", items: [] },
  C: { title: "C碼｜專業服務", items: [] },
  D: { title: "D碼｜交通接送服務", items: [] },
  E: { title: "E碼｜輔具購買或租賃服務", items: [] },
  F: { title: "F碼｜居家無障礙環境改善服務", items: [] },
  G: { title: "G碼｜喘息服務", items: [] },
  SC: { title: "SC碼｜短照服務", items: [] },
  OT: { title: "OT碼｜宜蘭縣特有服務", items: [] },
};

const groupOf = (code) => {
  const p = code.match(/^[A-Z]+/)[0];
  if (["BA", "BB", "BC", "BD"].includes(p)) return "B";
  if (p === "DA") return "D";
  if (p === "GA") return "G";
  if (["EA", "EB", "EC", "ED", "EG", "EH"].includes(p)) return "E";
  if (p === "FA" || p === "FB") return "F";
  return null;
};
const categoryOf = (code, g) => {
  if (g === "B") return code.startsWith("BA") ? "home-care" : "day-care";
  if (g === "C") return "professional";
  if (g === "D") return "transportation";
  if (g === "E") return "assistive-device";
  if (g === "F") return "home-modification";
  if (g === "G" || g === "SC") return "respite";
  if (g === "OT") return "meal";
  return "other";
};
const unitOf = (code, g) => {
  if (g === "D") return "趟";
  if (g === "E" || g === "F") return "項";
  if (g === "OT") return "餐";
  if (code === "GA05" || code === "SC05") return "天";
  if (code === "GA07" || code === "SC07") return "小時";
  return "次";
};

for (const r of region1) {
  const g = groupOf(r.code);
  catalog[g].items.push({
    code: r.code,
    name: r.name,
    category: categoryOf(r.code, g),
    unit: unitOf(r.code, g),
    price: r1Price(r.price, r.priceRemote),
  });
}
for (const r of region2) {
  const g = groupOf(r.code);
  catalog[g].items.push({
    code: r.code,
    name: NAME_OVERRIDES[r.code] ?? r.name,
    category: categoryOf(r.code, g),
    unit: unitOf(r.code, g),
    purchaseType: r.purchaseType,
    price: efPrice(r.purchaseType, r.priceRent, r.priceBuy),
  });
}

// C / SC / OT are NOT in this PDF — keep existing verified entries.
catalog.C.items = [
  ["CA07", "IADLs復能、ADLs復能照護"],
  ["CA08", "個別化服務計畫（ISP）擬定與執行"],
  ["CB01a", "營養照護"],
  ["CB02", "進食與吞嚥照護"],
  ["CB03", "困擾行為照護"],
  ["CB04", "臥床或長期活動受限照護"],
  ["CC01", "居家環境安全或無障礙空間規劃"],
  ["CD02", "居家護理指導與諮詢"],
].map(([code, name]) => ({ code, name, category: "professional", unit: "次" }));

catalog.SC.items = [
  ["SC03", "日間照顧中心短照服務（全日）"],
  ["SC04", "日間照顧中心短照服務（半日）"],
  ["SC05", "機構住宿式短照服務"],
  ["SC06", "小規模多機能服務夜間短照"],
  ["SC07", "巷弄長照站短照服務"],
  ["SC09", "居家短照服務"],
].map(([code, name]) => ({ code, name, category: "respite", unit: unitOf(code, "SC") }));

catalog.OT.items = [
  { code: "OT01", name: "營養餐飲服務", category: "meal", unit: "餐" },
];

const lit = (s) => JSON.stringify(s);
const itemLine = (it) => {
  const parts = [`code: ${lit(it.code)}`, `name: ${lit(it.name)}`, `category: ${lit(it.category)}`, `unit: ${lit(it.unit)}`];
  if (it.purchaseType) parts.push(`purchaseType: ${lit(it.purchaseType)}`);
  if (it.price) parts.push(`price: ${lit(it.price)}`);
  return `      { ${parts.join(", ")} },`;
};

let out = `export type ServiceGroupKey = "B" | "C" | "D" | "E" | "F" | "G" | "SC" | "OT";

export type PurchaseType = "限購置" | "可租賃可購置" | "限租賃" | "";

export interface ServiceItem {
  code: string;
  name: string;
  /** template category used by the service goal library */
  category: string;
  unit: string;
  /** 給（支）付價格參考；輔具/無障礙為購置或租賃上限。實際依核定為準。 */
  price?: string;
  purchaseType?: PurchaseType;
}

export interface ServiceGroup {
  title: string;
  items: ServiceItem[];
}

// Service codes extracted from the official 修正長期照顧服務申請及給付辦法
// 附表四（照顧組合表）. C / SC / OT are not in that附表 and are retained from
// prior data — see knowledge/01-official/SERVICE_CATALOG_EXTRACTION_REPORT.md.
export const SERVICE_CATALOG: Record<ServiceGroupKey, ServiceGroup> = {
`;
for (const key of Object.keys(catalog)) {
  out += `  ${key}: {\n    title: ${lit(catalog[key].title)},\n    items: [\n`;
  out += catalog[key].items.map(itemLine).join("\n") + "\n";
  out += `    ],\n  },\n\n`;
}
out = out.replace(/\n\n$/, "\n");
out += `};

export const GENERAL_SERVICE_GROUPS: ServiceGroupKey[] = ["B", "C", "D", "G", "SC", "OT"];
export const EQUIPMENT_SERVICE_GROUPS: ServiceGroupKey[] = ["E", "F"];

export function filterEquipmentItems(items: ServiceItem[], useType: "購置" | "租賃" | "皆可") {
  if (useType === "購置") {
    return items.filter(
      (item) => item.purchaseType === "限購置" || item.purchaseType === "可租賃可購置"
    );
  }

  if (useType === "租賃") {
    return items.filter(
      (item) => item.purchaseType === "限租賃" || item.purchaseType === "可租賃可購置"
    );
  }

  return items;
}
`;

writeFileSync("src/data/serviceCatalog.ts", out);
const counts = Object.fromEntries(Object.entries(catalog).map(([k, v]) => [k, v.items.length]));
console.log("counts", counts);
console.log("total", Object.values(catalog).reduce((a, v) => a + v.items.length, 0));
