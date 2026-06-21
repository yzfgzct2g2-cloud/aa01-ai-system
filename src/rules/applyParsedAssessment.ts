import { assessmentOptions } from "../data/assessmentOptions.ts";
import type { AssessmentAnswer, AssessmentQuestion } from "../types";
import type { ParsedAssessmentAnswer } from "./pdfAssessmentParser.ts";

export interface ApplyConflict {
  questionId: string;
  existingValue: AssessmentAnswer["value"];
  incomingCode: ParsedAssessmentAnswer["detectedCode"];
}

export interface ApplySkip {
  questionId: string;
  reason: string;
}

export interface ApplyResult {
  assessmentAnswers: Record<string, AssessmentAnswer>;
  applied: string[];
  conflicts: ApplyConflict[];
  skipped: ApplySkip[];
}

const questionMap = new Map<string, AssessmentQuestion>(
  assessmentOptions.map((question) => [question.id, question])
);

/** A stored answer counts as a real (human) answer only when it holds a value. */
export function hasAnswerValue(answer: AssessmentAnswer | undefined): boolean {
  if (!answer) return false;
  const value = answer.value;
  if (value === "" || value === undefined || value === null) return false;
  if (Array.isArray(value)) return value.length > 0;
  return true;
}

function buildAnswer(
  question: AssessmentQuestion,
  parsed: ParsedAssessmentAnswer
): { answer?: AssessmentAnswer; reason?: string } {
  const codeToOption = new Map(
    (question.options ?? []).map((option) => [option.code, option])
  );

  if (question.type === "single") {
    const raw = Array.isArray(parsed.detectedCode)
      ? parsed.detectedCode[0]
      : parsed.detectedCode;
    const code = raw === "" || raw === undefined ? "" : String(raw);
    const option = codeToOption.get(code);
    if (!option) return { reason: "選項不存在於題庫，未套用" };
    return {
      answer: {
        questionId: question.id,
        type: "single",
        value: code,
        selectedOptions: [option],
      },
    };
  }

  if (question.type === "multi") {
    const codes = Array.isArray(parsed.detectedCode)
      ? parsed.detectedCode.map(String)
      : parsed.detectedCode === ""
        ? []
        : [String(parsed.detectedCode)];
    const validOptions = codes
      .map((code) => codeToOption.get(code))
      .filter((option): option is NonNullable<typeof option> => Boolean(option));
    if (validOptions.length === 0) return { reason: "選項不存在於題庫，未套用" };
    return {
      answer: {
        questionId: question.id,
        type: "multi",
        value: validOptions.map((option) => option.code),
        selectedOptions: validOptions,
      },
    };
  }

  // number / text are not auto-applied in this phase; they need manual entry.
  return { reason: "此題型尚不支援自動套用，請人工填寫" };
}

/**
 * Apply the parsed answers the care manager has confirmed (the `selected` list)
 * onto the existing assessmentAnswers. It never infers values: an answer is
 * applied only when its question and option exist in assessmentOptions, and it
 * never overwrites an existing human answer (those become `conflicts`).
 */
export function applyParsedAssessment(
  existing: Record<string, AssessmentAnswer>,
  selected: ParsedAssessmentAnswer[]
): ApplyResult {
  const assessmentAnswers: Record<string, AssessmentAnswer> = { ...existing };
  const applied: string[] = [];
  const conflicts: ApplyConflict[] = [];
  const skipped: ApplySkip[] = [];

  for (const parsed of selected) {
    const question = questionMap.get(parsed.questionId);
    if (!question) {
      skipped.push({ questionId: parsed.questionId, reason: "題號不存在於題庫" });
      continue;
    }

    if (hasAnswerValue(existing[parsed.questionId])) {
      conflicts.push({
        questionId: parsed.questionId,
        existingValue: existing[parsed.questionId].value,
        incomingCode: parsed.detectedCode,
      });
      continue;
    }

    const { answer, reason } = buildAnswer(question, parsed);
    if (!answer) {
      skipped.push({ questionId: parsed.questionId, reason: reason ?? "無法對應" });
      continue;
    }

    assessmentAnswers[parsed.questionId] = answer;
    applied.push(parsed.questionId);
  }

  return { assessmentAnswers, applied, conflicts, skipped };
}
