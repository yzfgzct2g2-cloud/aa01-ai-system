import { getDocument } from "pdfjs-dist/legacy/build/pdf.mjs";
import { readFileSync } from "node:fs";

const path = process.argv[2];
const data = new Uint8Array(readFileSync(path));
const pdf = await getDocument({ data, useSystemFonts: true }).promise;
console.error(`PAGES=${pdf.numPages}`);
for (let i = 1; i <= pdf.numPages; i++) {
  const page = await pdf.getPage(i);
  const content = await page.getTextContent();
  const text = content.items.map((it) => (it.str ?? "")).join(" ");
  console.log(`\n===== PAGE ${i} =====`);
  console.log(text);
}
