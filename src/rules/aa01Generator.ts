import type { AA01Form, PlannedService } from "../types";
import { buildAssessmentSummary } from "./assessmentSummary.ts";
import { buildCareProblems } from "./problemMatrix.ts";
import { buildServiceSuggestions } from "./serviceSuggestion.ts";
import { buildServiceGoals, getServiceGoalTemplate } from "./serviceGoalLibrary.ts";
import { APP_VERSION } from "../config/version.ts";
import { getBuildInfo } from "../utils/buildInfo.ts";

function nlJoin(items: string[]) {
  return items.join("\n");
}

const missingAssessmentText =
  "尚未輸入相關評估資料，待個管確認後補充。";

function uniqueTexts(items: string[]) {
  return [...new Set(items.filter(Boolean))];
}

function trimTrailingPunctuation(text: string) {
  return text.trim().replace(/[。；]+$/g, "");
}

function joinSummary(items: string[]) {
  return items
    .map(trimTrailingPunctuation)
    .filter(Boolean)
    .join("；");
}

function asSentence(text: string) {
  const normalized = trimTrailingPunctuation(text);
  return normalized ? `${normalized}。` : missingAssessmentText;
}

function hasService(services: PlannedService[], code: string) {
  return services.some((s) => s.code === code);
}

function hasPrefix(services: PlannedService[], prefix: string) {
  return services.some((s) => s.code.startsWith(prefix));
}

function groupProviderText(items: PlannedService[]) {
  const names = [...new Set(items.map((x) => x.providerName).filter(Boolean))];
  return names.length ? names.join("、") : "待確認";
}

type GhiSummaryKey = "environmentSummary" | "behaviorSummary";

function collectAnswerSummaries(
  form: AA01Form,
  prefix: "H" | "I"
): string[] {
  return Object.values(form.assessmentAnswers ?? {})
    .filter((answer) => answer.questionId.startsWith(prefix))
    .flatMap((answer) => {
      if (answer.type === "single" || answer.type === "multi") {
        return (answer.selectedOptions ?? [])
          .map((option) => option.summary)
          .filter(Boolean);
      }

      if (answer.type === "text") {
        const text =
          answer.text ??
          (typeof answer.value === "string" ? answer.value : "");
        return text ? [text] : [];
      }

      return [];
    });
}

function getGhiSummary(
  assessmentSummary: ReturnType<typeof buildAssessmentSummary>,
  key: GhiSummaryKey,
  form: AA01Form,
  prefix: "H" | "I"
): string[] {
  const extendedSummary = assessmentSummary as ReturnType<
    typeof buildAssessmentSummary
  > & Partial<Record<GhiSummaryKey, string[]>>;

  return extendedSummary[key] ?? collectAnswerSummaries(form, prefix);
}

export function generateProblemAnalysis(form: AA01Form) {
  const services = form.services || [];
  const assessmentSummary = buildAssessmentSummary(
    form.assessmentAnswers ?? {}
  );
  const environmentSummary = getGhiSummary(
    assessmentSummary,
    "environmentSummary",
    form,
    "H"
  );
  const behaviorSummary = getGhiSummary(
    assessmentSummary,
    "behaviorSummary",
    form,
    "I"
  );

  return {
    care: uniqueTexts([
      hasService(services, "BA13")
        ? "個案外出活動需專人陪同，申請陪同外出服務，以維持外出安全及社區參與。"
        : "",
      hasService(services, "BA14")
        ? "個案有就醫或復健需求，外出就醫需專人陪同，申請陪同就醫服務。"
        : "",
      hasPrefix(services, "BA") && !hasService(services, "BA13") && !hasService(services, "BA14")
        ? "個案日常生活功能受限，需透過居家服務協助維持基本生活照顧。"
        : "",
      hasPrefix(services, "C")
        ? "個案具專業服務需求，需由專業人員介入評估與指導，以維持功能及照顧安全。"
        : "",
      hasService(services, "OT01")
        ? "個案備餐或營養攝取需協助，申請營養餐飲服務，以維持基本營養與飲食穩定。"
        : "",
      assessmentSummary.healthSummary.length
        ? "個案有特殊健康或照護需求，需依健康狀況安排適切照顧與追蹤。"
        : "",
      behaviorSummary.length
        ? "個案有情緒或行為照顧風險，需評估主要照顧者照顧負荷及安全維護需求。"
        : "",
    ]),

    transport: hasService(services, "DA01")
      ? ["個案外出就醫或復健需交通接送協助，申請交通接送服務，以降低外出移動風險。"]
      : [],

    respite:
      hasPrefix(services, "GA") || hasPrefix(services, "SC")
        ? ["主要照顧者長期承擔照顧責任，需透過喘息或短照服務減輕照顧壓力並維持家庭照顧量能。"]
        : [],

    environment: uniqueTexts([
      hasPrefix(services, "E") || hasPrefix(services, "FA")
        ? "個案日常活動及照顧安全需輔具或居家無障礙改善協助，以提升生活安全及照顧便利性。"
        : "",
      environmentSummary.length
        ? "居家環境或社會參與可能影響生活安全與照顧安排，需評估環境改善及支持需求。"
        : "",
    ]),
  };
}

export function generateGoalSuggestions(form: AA01Form) {
  const services = form.services || [];
  const assessmentSummary = buildAssessmentSummary(
    form.assessmentAnswers ?? {}
  );
  const environmentSummary = getGhiSummary(
    assessmentSummary,
    "environmentSummary",
    form,
    "H"
  );
  const behaviorSummary = getGhiSummary(
    assessmentSummary,
    "behaviorSummary",
    form,
    "I"
  );
  const short = ["維持個案基本生活照顧穩定，降低立即性照顧風險。"];
  const mid = [
    "透過居家服務、專業服務或輔具環境改善，提升日常生活安全與照顧品質。",
  ];
  const long = [
    "維持個案於熟悉環境中生活，延緩失能惡化並減輕照顧者負荷。",
  ];

  if (assessmentSummary.healthSummary.length) {
    short.push("維持個案健康狀況穩定，降低特殊照護風險。");
  }

  if (environmentSummary.length) {
    mid.push("改善居家環境安全，降低跌倒及照顧風險。");
  }

  if (behaviorSummary.length) {
    mid.push("建立穩定照顧模式，降低情緒及行為問題對生活安全之影響。");
  }

  if (hasService(services, "BA13") || hasService(services, "BA14") || hasService(services, "DA01")) {
    short.push("協助個案安全外出就醫、復健或參與必要活動。");
    mid.push("維持個案規律就醫及外出活動之可近性。");
  }

  if (hasPrefix(services, "GA") || hasPrefix(services, "SC")) {
    short.push("減輕主要照顧者照顧負荷。");
    mid.push("維持家庭照顧量能及照顧品質。");
  }

  return {
    short: [...new Set(short)],
    mid: [...new Set(mid)],
    long: [...new Set(long)],
  };
}

export function buildAA01Draft(form: AA01Form) {
  const assessmentSummary = buildAssessmentSummary(
    form.assessmentAnswers ?? {}
  );
  const careProblems = buildCareProblems(form.assessmentAnswers ?? {});
  const serviceSuggestions = buildServiceSuggestions(careProblems);

  const services = form.services || [];
  const problems = generateProblemAnalysis(form);
  const serviceGoals = buildServiceGoals(services.map((s) => s.code));
  const buildInfo = getBuildInfo();
  const formatGoals = (items: string[]) => (items.length ? items.join("；") : "待補充");
  const approvalSuffix = (code: string) => {
    const template = getServiceGoalTemplate(code);
    return template ? `核定內容：${template.approvalText}` : "";
  };

  const legacyCommunicationSummary = [
    form.consciousness ? `意識${form.consciousness}` : "",
    form.vision ? `視力${form.vision}` : "",
    form.hearing ? `聽力${form.hearing}` : "",
    form.expression ? `表達能力${form.expression}` : "",
    form.understanding ? `理解能力${form.understanding}` : "",
  ]
    .filter(Boolean)
    .join("；");

  const communicationSummary =
    joinSummary(assessmentSummary.communicationSummary) ||
    legacyCommunicationSummary;

  const memorySummary = joinSummary(assessmentSummary.memorySummary);
  const adlSummary = joinSummary(assessmentSummary.adlSummary);
  const iadlSummary = joinSummary(assessmentSummary.iadlSummary);

  const healthSummary = [...assessmentSummary.healthSummary];

  const sofScore =
    assessmentSummary.numericAnswers["G4d-score"];

  if (sofScore !== undefined) {
    healthSummary.push(`SOF衰弱評估分數：${sofScore}分`);
  }

  const healthSummaryText = joinSummary(healthSummary);
  const environmentSummaryText =
    joinSummary(
      getGhiSummary(
        assessmentSummary,
        "environmentSummary",
        form,
        "H"
      )
    ) || trimTrailingPunctuation(form.environmentNote || "");
  const behaviorSummaryText = joinSummary(
    getGhiSummary(assessmentSummary, "behaviorSummary", form, "I")
  );

  const physicalCommunicationParts = [
    communicationSummary
      ? `個案溝通與感官能力為${trimTrailingPunctuation(communicationSummary)}`
      : "",
    memorySummary
      ? `短期記憶與認知能力為${memorySummary}`
      : "",
  ].filter(Boolean);
  const physicalCommunicationText = physicalCommunicationParts.length
    ? `依評估結果，${physicalCommunicationParts.join("；")}。`
    : missingAssessmentText;

  const dailyLivingParts = [
    adlSummary ? `個案於 ADLs 評估結果顯示${adlSummary}` : "",
    iadlSummary ? `IADLs 評估結果顯示${iadlSummary}` : "",
  ].filter(Boolean);
  const dailyLivingText = dailyLivingParts.length
    ? `${dailyLivingParts.join("；")}。`
    : missingAssessmentText;

  const healthAssessmentText = healthSummaryText
    ? `個案目前${healthSummaryText}。`
    : missingAssessmentText;
  const environmentAssessmentText = environmentSummaryText
    ? `個案居家環境及社會參與狀況為${environmentSummaryText}。`
    : missingAssessmentText;
  const behaviorAssessmentText = behaviorSummaryText
    ? `個案情緒及行為型態評估結果為${behaviorSummaryText}。`
    : missingAssessmentText;

  const now = new Date();
  const rocYear = now.getFullYear() - 1911;
  const startMonth = now.getDate() <= 15 ? now.getMonth() + 1 : now.getMonth() + 2;
  const fmtMonth = (m: number) => String(((m - 1) % 12) + 1).padStart(2, "0");

  const careServices = services.filter((s) =>
    ["BA", "BB", "BC", "BD", "CA", "CB", "CC", "CD", "OT"].some((p) => s.code.startsWith(p))
  );
  const transportServices = services.filter((s) => s.code.startsWith("DA"));
  const respiteServices = services.filter((s) => s.code.startsWith("GA") || s.code.startsWith("SC"));
  const equipmentServices = services.filter((s) => s.code.startsWith("E") || s.code.startsWith("FA"));

  const systemHintLines = [
    "系統輔助提示（需個管確認）",
    "以下為系統依評估結果產生之提示，仍需由個管依個案實際情況判斷，不代表自動核定服務。",
    "（一）\t照顧問題提示：",
    ...(careProblems.length
      ? careProblems.map(
          (problem, index) =>
            `${index + 1}.\t${problem.title}：${problem.description}（來源題目：${problem.sourceQuestionIds.join("、")}）`
        )
      : ["無系統提示。"]),
    "（二）\t服務需求提示：",
    ...(serviceSuggestions.length
      ? serviceSuggestions.map(
          (suggestion, index) =>
            `${index + 1}.\t${suggestion.serviceCode} ${suggestion.serviceName}：${suggestion.reason}${suggestion.caution ? ` 注意：${suggestion.caution}` : ""}`
        )
      : ["無系統提示。"]),
  ];

  const lines = [
    "AA01 AI照顧計畫系統",
    `系統版本：v${APP_VERSION}`,
    `產生日期：${buildInfo.date}`,
    `產生時間：${buildInfo.time}`,
    "",
    "一、\t個案現況評估",
    "(一)\t身心概況及照顧情形：",
    `1.\t身心功能與溝通狀況：${physicalCommunicationText}`,
    `2.\t日常生活功能：${dailyLivingText}`,
    `3.\t特殊複雜照護需求：${healthAssessmentText}`,
    `4.\t居家環境與社會參與：${environmentAssessmentText}`,
    `5.\t情緒與行為照顧風險：${behaviorAssessmentText}`,

    "(二)\t家庭功能概況：",
    `1.\t${asSentence(form.familyNote || "")}`,

    `(三)\t經濟概況：${missingAssessmentText}`,
    `(四)\t社會支持概況：${missingAssessmentText}`,

    "二、\t案家問題及需求：",
    `(一)\t照顧及專業服務：${problems.care.join("；") || "無。"}`,
    `(二)\t交通接送服務：${problems.transport.join("；") || "無。"}`,
    `(三)\t喘息服務：${problems.respite.join("；") || "無。"}`,
    `(四)\t輔具服務及居家無障礙環境改善：${problems.environment.join("；") || "無。"}`,

    "三、\t計畫執行規劃：",
    `(一)\t短期目標(${rocYear}${fmtMonth(startMonth)}-${rocYear}${fmtMonth(startMonth + 1)})：${formatGoals(serviceGoals.shortTermGoals)}`,
    `(二)\t中期目標(${rocYear}${fmtMonth(startMonth + 2)}-${rocYear}${fmtMonth(startMonth + 3)})：${formatGoals(serviceGoals.midTermGoals)}`,
    `(三)\t長期目標(${rocYear}${fmtMonth(startMonth + 4)}-${rocYear}${fmtMonth(startMonth + 5)})：${formatGoals(serviceGoals.longTermGoals)}`,

    ...systemHintLines,

    "四、\t經本次評估後，擬核定照顧服務內容如下：",
  ];

  if (careServices.length) {
    lines.push("(一)\t照顧及專業服務(給付額度：24,100元/月)：");
    careServices.forEach((s, i) => lines.push(`${i + 1}.\t${s.code}[${s.name}]*${s.quantity || "__"}${s.unit}${s.frequency ? `，${s.frequency}` : ""}。${approvalSuffix(s.code)}`));
    lines.push(`${careServices.length + 1}.\t服務單位：${groupProviderText(careServices)}。`);
  }

  if (transportServices.length) {
    lines.push("(二)\t交通接送(給付額度：1840元/月)：");
    transportServices.forEach((s, i) => lines.push(`${i + 1}.\t${s.code}[${s.name}]*${s.quantity || "__"}${s.unit}。${approvalSuffix(s.code)}`));
    lines.push(`${transportServices.length + 1}.\t服務單位：${groupProviderText(transportServices)}。`);
  }

  if (respiteServices.length) {
    lines.push("(三)\t喘息服務(剩餘額度：待確認元/年，額度區間：待確認)：");
    respiteServices.forEach((s, i) => lines.push(`${i + 1}.\t${s.name}:${s.code}*${s.quantity || "__"}${s.unit}。${approvalSuffix(s.code)}`));
    lines.push(`${respiteServices.length + 1}.\t服務單位：${groupProviderText(respiteServices)}。`);
  }

  if (equipmentServices.length) {
    lines.push("(四)\t輔具服務(剩餘額度：40000元/3年)：");
    equipmentServices.forEach((s, i) => lines.push(`${i + 1}.\t${s.code}[${s.name}]*${s.quantity || "__"}${s.unit}。${approvalSuffix(s.code)}`));
    lines.push(`${equipmentServices.length + 1}.\t服務單位：${groupProviderText(equipmentServices)}。實際核定內容依輔具核定函結果為主。`);
  }

  if (serviceGoals.missingCodes.length) {
    lines.push(
      `（系統提醒）下列服務碼尚未建立目標模板，待補充：${serviceGoals.missingCodes.join("、")}。`
    );
  }

  lines.push(
    "五、\t轉介其他資源：無。",
    "六、\t擬定照顧計畫與服務對象實際欲使用項目落差：",
    "(一)\t照專建議申請項目：待個管確認後填寫。",
    "(二)\t案家意願申請項目：待個管確認後填寫。",
    "案家意願申請項目與建議無落差。",
    "七、\t財團法人伊甸社會福利基金會A個管房立泓於____/__/__送審督導審核。"
  );

  return nlJoin(lines);
}
