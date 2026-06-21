import * as pdfjsLib from "pdfjs-dist";
import workerUrl from "pdfjs-dist/build/pdf.worker.min.mjs?url";
import { joinPageText } from "./pdfTextJoin";
import type { PdfPageTextLike } from "./pdfTextJoin";

pdfjsLib.GlobalWorkerOptions.workerSrc = workerUrl;

/**
 * Extract selectable text from a text-based PDF using pdf.js. This does NOT
 * perform OCR — scanned/image-only PDFs will return little or no text.
 */
export async function extractTextFromPdf(file: File): Promise<string> {
  const data = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data }).promise;

  const pages: PdfPageTextLike[] = [];
  for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
    const page = await pdf.getPage(pageNumber);
    const content = await page.getTextContent();
    pages.push({
      items: content.items.map((item) => ({
        str: (item as { str?: string }).str,
      })),
    });
  }

  return joinPageText(pages);
}
