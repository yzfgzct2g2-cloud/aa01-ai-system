import type { AssessmentAnswer } from "../types";

export interface AssessmentSummary {
  communicationSummary: string[];
  memorySummary: string[];
  adlSummary: string[];
  iadlSummary: string[];
  healthSummary: string[];
  numericAnswers: Record<string, number>;
}

type SummaryListKey = Exclude<keyof AssessmentSummary, "numericAnswers">;

const summaryKeyByPrefix: Record<string, SummaryListKey> = {
  C: "communicationSummary",
  D: "memorySummary",
  E: "adlSummary",
  F: "iadlSummary",
  G: "healthSummary",
};

function getTextSummaries(answer: AssessmentAnswer): string[] {
  if (answer.type === "single") {
    const summary = answer.selectedOptions?.[0]?.summary;
    return summary ? [summary] : [];
  }

  if (answer.type === "multi") {
    return (answer.selectedOptions ?? [])
      .map((option) => option.summary)
      .filter((summary) => summary !== "");
  }

  if (answer.type === "text") {
    const text =
      answer.text ??
      (typeof answer.value === "string" ? answer.value : "");

    return text === "" ? [] : [text];
  }

  return [];
}

export function buildAssessmentSummary(
  assessmentAnswers: Record<string, AssessmentAnswer>
): AssessmentSummary {
  const result: AssessmentSummary = {
    communicationSummary: [],
    memorySummary: [],
    adlSummary: [],
    iadlSummary: [],
    healthSummary: [],
    numericAnswers: {},
  };

  Object.values(assessmentAnswers).forEach((answer) => {
    const summaryKey = summaryKeyByPrefix[answer.questionId.charAt(0)];

    if (!summaryKey) {
      return;
    }

    if (answer.type === "number") {
      if (typeof answer.value === "number") {
        result.numericAnswers[answer.questionId] = answer.value;
      }

      return;
    }

    result[summaryKey].push(...getTextSummaries(answer));
  });

  return result;
}