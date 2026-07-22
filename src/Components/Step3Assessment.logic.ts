import type {
  AssessmentAnswer,
  AssessmentCategorySelections,
  AssessmentConditionalSection,
  AssessmentOption,
} from "../types";

export type SectionKey = "C" | "D" | "E" | "F" | "G" | "H" | "I";
export type SectionStatus = "未填寫" | "部分完成" | "已完成";

export interface CategoryDefinition {
  key: string;
  label: string;
  questionPrefixes: string[];
  isNone?: boolean;
}

export const conditionalCategories: Record<"G" | "H" | "I", CategoryDefinition[]> = {
  G: [
    { key: "pain", label: "疼痛", questionPrefixes: ["G1"] },
    { key: "skin", label: "皮膚問題或傷口", questionPrefixes: ["G2"] },
    { key: "joint", label: "關節活動受限", questionPrefixes: ["G3"] },
    { key: "nutrition", label: "營養或體重問題", questionPrefixes: ["G4a", "G4b", "G4c", "G4d"] },
    { key: "medical", label: "疾病史或醫療協助", questionPrefixes: ["G4e", "G4f"] },
    { key: "advanced", label: "進階照顧", questionPrefixes: ["G5"] },
    { key: "swallowing", label: "吞嚥問題", questionPrefixes: ["G6"] },
    { key: "dementia", label: "失智照顧技巧", questionPrefixes: ["G7"] },
    { key: "safety", label: "跌倒或安全風險", questionPrefixes: ["G8"] },
    { key: "none", label: "無特殊複雜照護需求", questionPrefixes: [], isNone: true },
  ],
  H: [
    { key: "living", label: "居住狀況需記錄", questionPrefixes: ["H1a", "H1c", "H1d"] },
    { key: "household", label: "同住者需記錄", questionPrefixes: ["H1b"] },
    { key: "environment", label: "居家環境有障礙或安全風險", questionPrefixes: ["H1e"] },
    { key: "participation", label: "社會參與或親友互動不足", questionPrefixes: ["H2a", "H2b"] },
    { key: "intervention", label: "需要服務介入協助社會參與", questionPrefixes: ["H2c"] },
    { key: "none", label: "無居家環境或社會參與問題", questionPrefixes: [], isNone: true },
  ],
  I: [
    { key: "I01", label: "遊走", questionPrefixes: ["I01"] },
    { key: "I02", label: "日夜顛倒或作息混亂", questionPrefixes: ["I02"] },
    { key: "I03", label: "語言攻擊", questionPrefixes: ["I03"] },
    { key: "I04", label: "肢體攻擊", questionPrefixes: ["I04"] },
    { key: "I05", label: "干擾行為", questionPrefixes: ["I05"] },
    { key: "I06", label: "抗拒照顧", questionPrefixes: ["I06"] },
    { key: "I07", label: "妄想", questionPrefixes: ["I07"] },
    { key: "I08", label: "幻覺", questionPrefixes: ["I08"] },
    { key: "I09", label: "恐懼或焦慮", questionPrefixes: ["I09"] },
    { key: "I10", label: "憂鬱及負性症狀", questionPrefixes: ["I10"] },
    { key: "I11", label: "自傷或自殺風險", questionPrefixes: ["I11"] },
    { key: "I12", label: "重複行為", questionPrefixes: ["I12"] },
    { key: "I13", label: "對物品攻擊", questionPrefixes: ["I13"] },
    { key: "I14", label: "其他不適當或不潔行為", questionPrefixes: ["I14"] },
    { key: "none", label: "無情緒或行為問題", questionPrefixes: [], isNone: true },
  ],
};

function isConditionalSection(section: SectionKey): section is "G" | "H" | "I" {
  return section === "G" || section === "H" || section === "I";
}

function matchesPrefix(questionId: string, prefix: string) {
  return questionId === prefix || questionId.startsWith(`${prefix}-`) || questionId.startsWith(prefix);
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
    prefixes.some((prefix) => matchesPrefix(questionId, prefix))
  );
}

export function inferSelectedCategories(section: "G" | "H" | "I", answeredQuestionIds: string[]) {
  return conditionalCategories[section]
    .filter(
      (category) =>
        !category.isNone &&
        category.questionPrefixes.some((prefix) =>
          answeredQuestionIds.some((questionId) => matchesPrefix(questionId, prefix))
        )
    )
    .map((category) => category.key);
}

export function resolveCategorySelections(
  section: AssessmentConditionalSection,
  savedSelections: AssessmentCategorySelections | undefined,
  answeredQuestionIds: string[]
) {
  const saved = savedSelections?.[section];
  if (!Array.isArray(saved)) {
    return inferSelectedCategories(section, answeredQuestionIds);
  }

  const validKeys = new Set(conditionalCategories[section].map((category) => category.key));
  return [...new Set(saved.filter((key) => validKeys.has(key)))];
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
