export interface PdfTextItemLike {
  str?: string;
}

export interface PdfPageTextLike {
  items: PdfTextItemLike[];
}

/** Join pdf.js page text-content into a single plain-text string (one line per page). */
export function joinPageText(pages: PdfPageTextLike[]): string {
  return pages
    .map((page) =>
      page.items
        .map((item) => item.str ?? "")
        .join(" ")
        .replace(/\s+/g, " ")
        .trim()
    )
    .filter(Boolean)
    .join("\n")
    .trim();
}
