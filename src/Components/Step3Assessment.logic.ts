import type {
  AssessmentAnswer,
  AssessmentCategorySelections,
  AssessmentConditionalSection,
  AssessmentOption,
} from "../types";
import {
  conditionalCategories as sharedConditionalCategories,
  inferSelectedCategories as sharedInferSelectedCategories,
  matchesQuestionPrefix,
  resolveCategorySelections as sharedResolveCategorySelections,
} from "../rules/step3ConditionalAssessment";
export type { CategoryDefinition } from "../rules/step3ConditionalAssessment";

export type SectionKey = "C" | "D" | "E" | "F" | "G" | "H" | "I";
export const conditionalCategories = sharedConditionalCategories;
export const inferSelectedCategories = sharedInferSelectedCategories;
export const resolveCategorySelections = sharedResolveCategorySelections;
export type SectionStatus = "未填寫" | "部分完成" | "已完成";

function isConditionalSection(section: SectionKey): section is "G" | "H" | "I" {
  return section === "G" || section === "H" || section === "I";
}

export function getVisibleQuestionIds(
  section: SectionKey,
  selectedCategories: string[],
  allQuestionIds: string[]
) {
  if (!isConditionalSection(section)) return allQuestionIds;

  const categories = conditionalCategories[section];
  if (selectedCategories.some((key) => categories.find((category) => category.key === key)?.isNone)) {
    return [];
  }

  const prefixes = categories
    .filter((category) => selectedCategories.includes(category.key))
    .flatMap((category) => category.questionPrefixes);

  return allQuestionIds.filter((questionId) =>
    prefixes.some((prefix) => matchesQuestionPrefix(questionId, prefix))
  );
}

export function updateCategorySelection(
  currentSelections: AssessmentCategorySelections | undefined,
  section: AssessmentConditionalSection,
  key: string,
  checked: boolean,
  answeredQuestionIds: string[]
): AssessmentCategorySelections {
  const current = resolveCategorySelections(section, currentSelections, answeredQuestionIds);
  const next = checked
    ? [...new Set([...current, key])]
    : current.filter((categoryKey) => categoryKey !== key);

  return {
    ...currentSelections,
    [section]: next,
  };
}

export function getRestoredQuestionId(
  currentQuestion: string | null,
  visibleQuestionIds: string[]
) {
  return currentQuestion && visibleQuestionIds.includes(currentQuestion)
    ? currentQuestion
    : null;
}

export function getSelectedOptionLabel(
  options: AssessmentOption[] | undefined,
  value: string
) {
  if (!value) return null;
  const selectedOption = options?.find((option) => option.code === value);
  return selectedOption ? `${selectedOption.code}. ${selectedOption.label}` : null;
}

export function hasAnswer(answer?: AssessmentAnswer) {
  if (!answer) return false;
  if (Array.isArray(answer.value)) return answer.value.length > 0;
  if (typeof answer.value === "string") return answer.value.trim().length > 0;
  return typeof answer.value === "number" && Number.isFinite(answer.value);
}

export function getSectionProgress(
  questionIds: string[],
  answers: Record<string, AssessmentAnswer>,
  categorySelected?: boolean
) {
  const answeredQuestions = questionIds.filter((id) => hasAnswer(answers[id])).length;
  const answered = answeredQuestions + (categorySelected ? 1 : 0);
  const total = questionIds.length + (categorySelected === undefined ? 0 : 1);
  const status: SectionStatus = answered === 0
    ? "未填寫"
    : answered === total
      ? "已完成"
      : "部分完成";

  return { answered, total, status };
}
