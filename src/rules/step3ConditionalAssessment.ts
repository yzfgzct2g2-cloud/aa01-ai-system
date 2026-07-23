import type {
  AssessmentAnswer,
  AssessmentCategorySelections,
  AssessmentConditionalSection,
} from "../types";

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

const D1_QUESTION_IDS = new Set(["D1a", "D1b1", "D1b2", "D1b3"]);
const G2_ABNORMAL_QUESTION_IDS = new Set(["G2b", "G2c", "G2d", "G2d-other", "G2d1", "G2d2", "G2d2-other"]);
const HEIGHT_ALTERNATIVE_IDS = new Set(["G4b-arm-span", "G4b-half-arm-span", "G4b-knee-height", "G4b-converted-height"]);
const WEIGHT_ALTERNATIVE_IDS = new Set(["G4b-hip-circumference", "G4b-estimated-weight"]);
const G4D_OTHER_PARENT_CODES: Record<string, string> = {
  "G4d1-other": "G4d1",
  "G4d2-other": "G4d2",
  "G4d3-other": "G4d3",
};
const G4E_SUPPLEMENTAL_CODES: Record<string, string> = {
  "G4e-cancer-note": "08",
  "G4e-infection-note": "21",
  "G4e-rare-disease-note": "22",
  "G4e-other-note": "24",
};
const G4E_DETAILS_IDS = new Set(["G4e-diseases", "G4e-treatment", "G4e-medications"]);
const G5_ITEMS_ID = "G5-items";

export function matchesQuestionPrefix(questionId: string, prefix: string) {
  return questionId === prefix || questionId.startsWith(`${prefix}-`) || questionId.startsWith(prefix);
}

export function inferSelectedCategories(section: "G" | "H" | "I", answeredQuestionIds: string[]) {
  return conditionalCategories[section]
    .filter((category) => !category.isNone && category.questionPrefixes.some((prefix) =>
      answeredQuestionIds.some((questionId) => matchesQuestionPrefix(questionId, prefix))
    ))
    .map((category) => category.key);
}

export function resolveCategorySelections(
  section: AssessmentConditionalSection,
  savedSelections: AssessmentCategorySelections | undefined,
  answeredQuestionIds: string[]
) {
  const saved = savedSelections?.[section];
  if (!Array.isArray(saved)) return inferSelectedCategories(section, answeredQuestionIds);

  const validKeys = new Set(conditionalCategories[section].map((category) => category.key));
  return [...new Set(saved.filter((key) => validKeys.has(key)))];
}

function selectedCodes(answer?: AssessmentAnswer): string[] {
  if (!answer) return [];
  if (Array.isArray(answer.value)) return answer.value;
  return typeof answer.value === "string" && answer.value ? [answer.value] : [];
}

function isSelected(answers: Record<string, AssessmentAnswer>, questionId: string, code: string) {
  return selectedCodes(answers[questionId]).includes(code);
}

function isConditionalSection(questionId: string): questionId is `${AssessmentConditionalSection}${string}` {
  return questionId.startsWith("G") || questionId.startsWith("H") || questionId.startsWith("I");
}

function isCategoryEffective(
  questionId: string,
  answers: Record<string, AssessmentAnswer>,
  categorySelections: AssessmentCategorySelections | undefined
) {
  if (!isConditionalSection(questionId)) return true;

  const section = questionId[0] as AssessmentConditionalSection;
  const selectedCategories = resolveCategorySelections(section, categorySelections, Object.keys(answers));
  const categories = conditionalCategories[section];
  if (selectedCategories.some((key) => categories.find((category) => category.key === key)?.isNone)) return false;

  return categories
    .filter((category) => selectedCategories.includes(category.key))
    .some((category) => category.questionPrefixes.some((prefix) => matchesQuestionPrefix(questionId, prefix)));
}

export function isPositiveMeasurement(value: unknown): boolean {
  if (typeof value === "number") return Number.isFinite(value) && value > 0;
  return typeof value === "string" && value.trim() !== "" && Number.isFinite(Number(value)) && Number(value) > 0;
}

export function shouldShowMemoryQuestions(answers: Record<string, AssessmentAnswer>): boolean {
  return !isSelected(answers, "D0", "3");
}

export function isStep3QuestionEffective(
  questionId: string,
  answers: Record<string, AssessmentAnswer>,
  categorySelections?: AssessmentCategorySelections
): boolean {
  if (questionId === "G4d-score") return false;
  if (D1_QUESTION_IDS.has(questionId) && !shouldShowMemoryQuestions(answers)) return false;
  if (!isCategoryEffective(questionId, answers, categorySelections)) return false;
  if (G2_ABNORMAL_QUESTION_IDS.has(questionId) && !isSelected(answers, "G2a", "2")) return false;
  if (HEIGHT_ALTERNATIVE_IDS.has(questionId) && isPositiveMeasurement(answers["G4b-height"]?.value)) return false;
  if (WEIGHT_ALTERNATIVE_IDS.has(questionId) && isPositiveMeasurement(answers["G4b-weight"]?.value)) return false;
  if (questionId in G4D_OTHER_PARENT_CODES && !isSelected(answers, G4D_OTHER_PARENT_CODES[questionId], "3")) return false;
  if (G4E_DETAILS_IDS.has(questionId) && !isSelected(answers, "G4e", "2")) return false;
  if (questionId in G4E_SUPPLEMENTAL_CODES) {
    return isSelected(answers, "G4e", "2") && isSelected(answers, "G4e-diseases", G4E_SUPPLEMENTAL_CODES[questionId]);
  }
  if (questionId === G5_ITEMS_ID && !isSelected(answers, "G5a", "2")) return false;
  return true;
}

export function getEffectiveStep3QuestionIds(
  questionIds: string[],
  answers: Record<string, AssessmentAnswer>,
  categorySelections?: AssessmentCategorySelections
): string[] {
  return questionIds.filter((questionId) => isStep3QuestionEffective(questionId, answers, categorySelections));
}

export function getEffectiveAssessmentAnswers(
  answers: Record<string, AssessmentAnswer>,
  categorySelections?: AssessmentCategorySelections
): Record<string, AssessmentAnswer> {
  return Object.fromEntries(
    Object.entries(answers).filter(([questionId]) => isStep3QuestionEffective(questionId, answers, categorySelections))
  );
}
