import { assessmentOptions } from "../data/assessmentOptions.ts";
import type { AssessmentQuestion } from "../types";

export interface ParsedAssessmentAnswer {
  questionId: string;
  detectedCode: string | string[] | number | "";
  confidence: "high" | "medium" | "low";
  sourceText: string;
  warning?: string;
}

export interface PdfParseResult {
  parsedAnswers: ParsedAssessmentAnswer[];
  unresolvedItems: string[];
  rawTextPreview: string;
}

const PREVIEW_LENGTH = 1000;

/* Box glyphs that may appear before an option code in extracted PDF text. */
const MARKER_CLASS = "■□☑☐☒✓✔▓▉●⦿◼○▢";
/* Glyphs that mean the option IS selected. Empty boxes (□ ☐ ○ ▢) are not here. */
const CHECKED_MARKERS = new Set(["■", "☑", "☒", "✓", "✔", "▓", "▉", "●", "⦿", "◼"]);

/* A question id at the very start of a line: C1, C1a, D1b1, E11, F8, G6a, H1e, I00 … */
const QUESTION_ID_AT_START = /^([A-I][0-9]{1,2}[a-z]?[0-9]?)\b/;
/* Optional marker + a 1-2 digit code, followed by a separator. */
const CODE_PATTERN = new RegExp(
  `^[\\s.、:：]*([${MARKER_CLASS}]?)\\s*(\\d{1,2})(?=[.、)）。\\s]|$)`
);

const questionMap = new Map<string, AssessmentQuestion>(
  assessmentOptions.map((question) => [question.id, question])
);

function validCodes(question: AssessmentQuestion): Set<string> {
  return new Set((question.options ?? []).map((option) => option.code));
}

interface Accumulator {
  id: string;
  question: AssessmentQuestion;
  codes: string[];
  confidence: "high" | "medium" | "low";
  warning?: string;
  sourceLines: string[];
}

/**
 * Parse plain text extracted from a 照顧管理評估量表 PDF into tentative
 * assessment answers. It never infers an answer: a code is only recorded when
 * it is explicitly present in the text and is a real option of a real question.
 * Anything ambiguous is reported in `unresolvedItems` for manual confirmation.
 */
export function parseAssessmentText(rawText: string): PdfParseResult {
  const text = rawText ?? "";
  const rawTextPreview = text.slice(0, PREVIEW_LENGTH);
  const parsedAnswers: ParsedAssessmentAnswer[] = [];
  const unresolvedItems: string[] = [];

  if (!text.trim()) {
    return { parsedAnswers, unresolvedItems, rawTextPreview };
  }

  let current: Accumulator | null = null;

  const flush = () => {
    if (!current) return;
    const { id, question, codes, confidence, warning, sourceLines } = current;
    const sourceText = sourceLines.join(" ").replace(/\s+/g, " ").trim().slice(0, 200);

    if (codes.length > 0) {
      parsedAnswers.push({
        questionId: id,
        detectedCode: question.type === "multi" ? codes : codes[0],
        confidence,
        sourceText,
        ...(warning ? { warning } : {}),
      });
    } else {
      unresolvedItems.push(`${id}（未偵測到勾選選項，待人工確認）`);
    }
    current = null;
  };

  const recordCode = (line: string, inline: boolean) => {
    if (!current) return;
    const codes = validCodes(current.question);
    if (codes.size === 0) return; // number / text question — no option to match

    const match = line.match(CODE_PATTERN);
    if (!match) return;

    const marker = match[1];
    const code = match[2];
    if (!codes.has(code)) return;

    const checked = CHECKED_MARKERS.has(marker);
    // In a block (option lines after the question) only a checked box counts.
    // On the question line itself ("C1 1 清醒") an inline code is the answer.
    if (!inline && !checked) return;

    if (checked) current.confidence = "high";

    if (current.codes.includes(code)) return;

    if (current.question.type !== "multi" && current.codes.length >= 1) {
      current.warning = "偵測到多個勾選，請人工確認";
      return;
    }
    current.codes.push(code);
  };

  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line) continue;

    const idMatch = line.match(QUESTION_ID_AT_START);
    const candidate = idMatch?.[1];

    if (candidate && questionMap.has(candidate)) {
      flush();
      current = {
        id: candidate,
        question: questionMap.get(candidate)!,
        codes: [],
        confidence: "medium",
        sourceLines: [line],
      };
      recordCode(line.slice(idMatch![0].length), true);
      continue;
    }

    if (current) {
      current.sourceLines.push(line);
      recordCode(line, false);
    }
  }
  flush();

  return { parsedAnswers, unresolvedItems, rawTextPreview };
}
