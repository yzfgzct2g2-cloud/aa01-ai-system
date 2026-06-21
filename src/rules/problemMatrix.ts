import type { AssessmentAnswer } from "../types";

export interface CareProblem {
  id: string;
  title: string;
  description: string;
  sourceQuestionIds: string[];
  severity?: "low" | "medium" | "high";
}

function getCodes(answer?: AssessmentAnswer): string[] {
  if (!answer) return [];
  if (typeof answer.value === "string") return answer.value ? [answer.value] : [];
  if (Array.isArray(answer.value)) return answer.value;
  return [];
}

function collectQuestionIds(
  assessmentAnswers: Record<string, AssessmentAnswer>,
  questionIds: string[],
  isProblemCode: (codes: string[]) => boolean
) {
  return questionIds.filter((questionId) => {
    const codes = getCodes(assessmentAnswers[questionId]);
    return codes.length > 0 && isProblemCode(codes);
  });
}

export function buildCareProblems(
  assessmentAnswers: Record<string, AssessmentAnswer>
): CareProblem[] {
  const problems: CareProblem[] = [];
  const adlQuestionIds = Array.from({ length: 10 }, (_, index) => `E${index + 1}`);
  const iadlQuestionIds = Array.from({ length: 8 }, (_, index) => `F${index + 1}`);
  const adlSources = collectQuestionIds(
    assessmentAnswers,
    adlQuestionIds,
    (codes) => codes.some((code) => code !== "1")
  );
  const iadlSources = collectQuestionIds(
    assessmentAnswers,
    iadlQuestionIds,
    (codes) => codes.some((code) => code !== "1")
  );

  if (adlSources.length) {
    problems.push({
      id: "adl-assistance",
      title: "日常生活活動需協助",
      description: "個案於部分日常生活活動需他人協助，需評估居家服務支持。",
      sourceQuestionIds: adlSources,
      severity: "medium",
    });
  }

  if (iadlSources.length) {
    problems.push({
      id: "iadl-assistance",
      title: "工具性日常生活活動需協助",
      description: "個案於工具性日常生活活動需他人協助，需評估家務、備餐、外出或財務等支持需求。",
      sourceQuestionIds: iadlSources,
      severity: "medium",
    });
  }

  const painSources = collectQuestionIds(
    assessmentAnswers,
    ["G1", "G1a"],
    (codes) => codes.some((code) => code !== "1" && code !== "7")
  );
  if (painSources.length) {
    problems.push({
      id: "pain-care",
      title: "疼痛影響生活功能",
      description: "個案有疼痛狀況，需評估疼痛對活動、休息及照顧安排之影響。",
      sourceQuestionIds: painSources,
      severity: "medium",
    });
  }

  const skinSources = collectQuestionIds(
    assessmentAnswers,
    ["G2a", "G2c", "G2d"],
    (codes) => codes.some((code) => code !== "1")
  ).filter((questionId) => questionId !== "G2c" && questionId !== "G2d");
  const skinMultiSources = ["G2c", "G2d"].filter(
    (questionId) => getCodes(assessmentAnswers[questionId]).length > 0
  );
  const allSkinSources = [...skinSources, ...skinMultiSources];
  if (allSkinSources.length) {
    problems.push({
      id: "skin-care",
      title: "皮膚完整性或傷口照護需求",
      description: "個案有皮膚異常或傷口風險，需評估清潔、翻身、壓傷預防及傷口照護需求。",
      sourceQuestionIds: allSkinSources,
      severity: "high",
    });
  }

  const swallowingSources = collectQuestionIds(
    assessmentAnswers,
    ["G6a", "G6b"],
    (codes) => codes.some((code) => code !== "1")
  );
  if (swallowingSources.length) {
    problems.push({
      id: "swallowing-risk",
      title: "吞嚥或進食安全風險",
      description: "個案有吞嚥困難或進食安全疑慮，需評估進食方式、照顧技巧與專業介入需求。",
      sourceQuestionIds: swallowingSources,
      severity: "high",
    });
  }

  const environmentSources = collectQuestionIds(
    assessmentAnswers,
    ["H1e"],
    (codes) => codes.some((code) => code !== "1" && code !== "8")
  );
  if (environmentSources.length) {
    problems.push({
      id: "environment-risk",
      title: "居家環境安全風險",
      description: "個案居住環境可能影響移動、如廁、沐浴或外出安全，需評估環境改善與輔具需求。",
      sourceQuestionIds: environmentSources,
      severity: "high",
    });
  }

  const behaviorQuestionIds = Object.keys(assessmentAnswers).filter((questionId) =>
    /^I(?:0[1-9]|1[0-4])[ab]$/.test(questionId)
  );
  const behaviorSources = collectQuestionIds(
    assessmentAnswers,
    behaviorQuestionIds,
    (codes) => codes.some((code) => code !== "1")
  );
  if (behaviorSources.length) {
    problems.push({
      id: "behavior-risk",
      title: "情緒或行為照顧風險",
      description: "個案有情緒或行為問題，需評估照顧者負荷、安全維護及照顧技巧需求。",
      sourceQuestionIds: behaviorSources,
      severity: "high",
    });
  }

  return problems;
}
