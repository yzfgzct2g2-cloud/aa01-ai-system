import type { CareProblem } from "./problemMatrix";

export interface ServiceSuggestion {
  id: string;
  problemId: string;
  serviceCode: string;
  serviceName: string;
  reason: string;
  caution?: string;
}

interface SuggestionRule {
  services: Array<{ code: string; name: string }>;
  reason: string;
  caution?: string;
}

const suggestionRules: Record<string, SuggestionRule> = {
  "adl-assistance": {
    services: [
      { code: "BA02", name: "基本日常照顧" },
      { code: "BA07", name: "協助沐浴及洗頭" },
      { code: "BA11", name: "肢體關節活動" },
    ],
    reason: "依實際 ADL 失能項目評估是否需要身體照顧服務。",
  },
  "iadl-assistance": {
    services: [
      { code: "BA15-1", name: "備餐" },
      { code: "BA15-2", name: "家務協助" },
      { code: "BA16-1", name: "代購或代領或代送服務" },
    ],
    reason: "依 IADL 失能項目評估是否需要家務、備餐或代辦服務。",
  },
  "pain-care": {
    services: [
      { code: "BA11", name: "肢體關節活動" },
      { code: "BA13", name: "陪同外出" },
    ],
    reason: "若疼痛影響活動或外出，需評估活動維持及陪同外出需求。",
  },
  "skin-care": {
    services: [
      { code: "BA02", name: "基本日常照顧" },
      { code: "BA07", name: "協助沐浴及洗頭" },
    ],
    reason: "需評估清潔、皮膚照護與壓傷預防需求。",
    caution: "傷口護理或醫療處置需另評估專業服務或醫療資源。",
  },
  "swallowing-risk": {
    services: [{ code: "BA04", name: "協助進食或管灌餵食" }],
    reason: "若有吞嚥或進食安全問題，需評估進食照顧方式。",
    caution: "吞嚥訓練需另評估專業服務。",
  },
  "environment-risk": {
    services: [
      { code: "BA12", name: "協助上下樓梯" },
      { code: "EA/EB", name: "輔具或居家無障礙相關服務" },
    ],
    reason: "需評估輔具、居家環境改善及上下樓協助需求。",
  },
  "behavior-risk": {
    services: [
      { code: "BA18", name: "安全看視" },
      { code: "BA20", name: "陪伴服務" },
    ],
    reason: "若有情緒或行為照顧風險，需評估安全看視、陪伴與照顧者支持需求。",
    caution: "若有自傷、自殺或明顯危及安全情形，需依規定通報或轉介專業資源。",
  },
};

function makeSuggestionId(problemId: string, serviceCode: string) {
  return `${problemId}-${serviceCode.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;
}

export function buildServiceSuggestions(
  problems: CareProblem[]
): ServiceSuggestion[] {
  return problems.flatMap((problem) => {
    const rule = suggestionRules[problem.id];
    if (!rule) return [];

    return rule.services.map((service) => ({
      id: makeSuggestionId(problem.id, service.code),
      problemId: problem.id,
      serviceCode: service.code,
      serviceName: service.name,
      reason: rule.reason,
      ...(rule.caution ? { caution: rule.caution } : {}),
    }));
  });
}
