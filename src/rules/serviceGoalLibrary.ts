import { SERVICE_CATALOG } from "../data/serviceCatalog.ts";

export interface ServiceGoalTemplate {
  serviceCode: string;
  serviceName: string;
  category:
    | "home-care"
    | "day-care"
    | "transportation"
    | "respite"
    | "professional"
    | "assistive-device"
    | "home-modification"
    | "meal"
    | "other";
  approvalText: string;
  shortTermGoal: string;
  midTermGoal: string;
  longTermGoal: string;
  cautions?: string[];
}

/**
 * Formal goal/approval text per service code. Sentences describe only the
 * service's purpose, benefit and goal — never the individual's condition, and
 * never imply automatic approval. Used to formalise AA01 sections 三 and 四.
 */
const SERVICE_GOAL_TEMPLATES: ServiceGoalTemplate[] = [
  {
    serviceCode: "BA01",
    serviceName: "基本身體清潔",
    category: "home-care",
    approvalText: "協助個案維持身體清潔，以維護皮膚健康及個人衛生。",
    shortTermGoal: "透過基本身體清潔服務，維持個案日常清潔與舒適。",
    midTermGoal: "透過規律清潔協助，維持個案皮膚健康並降低感染風險。",
    longTermGoal: "藉由持續清潔照顧，維持個案個人衛生及生活品質。",
  },
  {
    serviceCode: "BA02",
    serviceName: "基本日常照顧",
    category: "home-care",
    approvalText: "協助個案完成基本日常生活照顧，以維持生活功能。",
    shortTermGoal: "透過基本日常照顧服務，維持個案日常生活基本需求。",
    midTermGoal: "透過規律日常照顧，維持個案生活功能穩定。",
    longTermGoal: "藉由持續日常照顧，延緩功能退化並維持生活品質。",
  },
  {
    serviceCode: "BA04",
    serviceName: "協助進食或管灌餵食",
    category: "home-care",
    approvalText: "協助個案安全進食或管灌餵食，以維持營養攝取及進食安全。",
    shortTermGoal: "透過進食協助，維持個案進食安全與營養攝取。",
    midTermGoal: "透過規律進食協助，維持個案營養狀況穩定。",
    longTermGoal: "藉由持續進食照顧，維持個案營養及健康狀況。",
  },
  {
    serviceCode: "BA07",
    serviceName: "協助沐浴及洗頭",
    category: "home-care",
    approvalText: "協助個案安全沐浴及洗頭，以維持身體清潔及照顧安全。",
    shortTermGoal: "透過沐浴協助，維持個案清潔與沐浴安全。",
    midTermGoal: "透過規律沐浴協助，維持個案皮膚健康及舒適。",
    longTermGoal: "藉由持續沐浴照顧，維持個案個人衛生及生活品質。",
  },
  {
    serviceCode: "BA11",
    serviceName: "肢體關節活動",
    category: "home-care",
    approvalText: "協助個案進行肢體關節活動，以維持關節活動度及肢體功能。",
    shortTermGoal: "透過肢體關節活動，維持個案關節活動度。",
    midTermGoal: "透過規律關節活動，延緩肢體功能退化。",
    longTermGoal: "藉由持續關節活動，維持個案肢體功能及生活自理能力。",
  },
  {
    serviceCode: "BA12",
    serviceName: "協助上（下）樓梯",
    category: "home-care",
    approvalText: "協助個案安全上下樓梯，以維持外出移動安全。",
    shortTermGoal: "透過上下樓梯協助，維持個案移動安全。",
    midTermGoal: "透過規律移動協助，維持個案外出活動能力。",
    longTermGoal: "藉由持續移動協助，維持個案生活範圍及社區參與。",
  },
  {
    serviceCode: "BA13",
    serviceName: "陪同外出",
    category: "home-care",
    approvalText: "協助個案安全外出，以維持社區參與及生活功能。",
    shortTermGoal: "透過陪同外出服務，維持個案外出活動安全。",
    midTermGoal: "透過規律外出活動，維持個案社會參與及生活功能。",
    longTermGoal: "藉由持續外出活動，維持個案生活品質及社區參與能力。",
  },
  {
    serviceCode: "BA14",
    serviceName: "陪同就醫",
    category: "home-care",
    approvalText: "協助個案安全就醫，以維持規律就醫及健康管理。",
    shortTermGoal: "透過陪同就醫服務，維持個案就醫安全。",
    midTermGoal: "透過規律就醫協助，維持個案健康管理及病情穩定。",
    longTermGoal: "藉由持續就醫協助，維持個案健康狀況及生活品質。",
  },
  {
    serviceCode: "BA15-1",
    serviceName: "家務協助（自用）",
    category: "home-care",
    approvalText: "協助個案維持居家環境整潔，以維持生活品質及居家安全。",
    shortTermGoal: "透過家務協助，維持個案居家環境整潔。",
    midTermGoal: "透過規律家務協助，維持個案居家生活品質。",
    longTermGoal: "藉由持續家務協助，維持個案安全且穩定的居家生活。",
  },
  {
    serviceCode: "BA15-2",
    serviceName: "家務協助（共用）",
    category: "home-care",
    approvalText: "協助個案維持居家環境整潔，以維持生活品質及居家安全。",
    shortTermGoal: "透過家務協助，維持個案居家環境整潔。",
    midTermGoal: "透過規律家務協助，維持個案居家生活品質。",
    longTermGoal: "藉由持續家務協助，維持個案安全且穩定的居家生活。",
  },
  {
    serviceCode: "BA16-1",
    serviceName: "代購或代領或代送服務（自用）",
    category: "home-care",
    approvalText: "協助個案處理代購、代領或代送事務，以維持日常生活所需。",
    shortTermGoal: "透過代購代領服務，維持個案日常生活物資供應。",
    midTermGoal: "透過規律代辦協助，維持個案日常生活穩定。",
    longTermGoal: "藉由持續代辦協助，維持個案居家生活自主與品質。",
  },
  {
    serviceCode: "BA18",
    serviceName: "安全看視",
    category: "home-care",
    approvalText: "提供個案安全看視，以維護居家照顧安全。",
    shortTermGoal: "透過安全看視服務，維護個案居家安全。",
    midTermGoal: "透過規律安全看視，降低個案居家照顧風險。",
    longTermGoal: "藉由持續安全看視，維持個案安全且穩定的照顧環境。",
  },
  {
    serviceCode: "BA20",
    serviceName: "陪伴服務",
    category: "home-care",
    approvalText: "提供個案陪伴服務，以維持情緒支持及生活參與。",
    shortTermGoal: "透過陪伴服務，提供個案情緒支持。",
    midTermGoal: "透過規律陪伴，維持個案生活參與及情緒穩定。",
    longTermGoal: "藉由持續陪伴，維持個案心理健康及生活品質。",
  },
  {
    serviceCode: "DA01",
    serviceName: "交通接送",
    category: "transportation",
    approvalText: "協助個案外出就醫或復健之交通接送，以降低外出移動風險。",
    shortTermGoal: "透過交通接送服務，維持個案外出就醫安全。",
    midTermGoal: "透過規律交通接送，維持個案規律就醫及復健。",
    longTermGoal: "藉由持續交通接送，維持個案健康管理及社區可近性。",
  },
  {
    serviceCode: "BB07",
    serviceName: "日間照顧（全日）",
    category: "day-care",
    approvalText: "提供個案日間照顧服務，以維持日間生活照顧及社會參與。",
    shortTermGoal: "透過日間照顧服務，維持個案日間生活照顧。",
    midTermGoal: "透過規律日間照顧，維持個案生活功能及社會互動。",
    longTermGoal: "藉由持續日間照顧，延緩功能退化並減輕家庭照顧負荷。",
  },
  {
    serviceCode: "BB08",
    serviceName: "日間照顧（半日）",
    category: "day-care",
    approvalText: "提供個案日間照顧服務，以維持日間生活照顧及社會參與。",
    shortTermGoal: "透過日間照顧服務，維持個案日間生活照顧。",
    midTermGoal: "透過規律日間照顧，維持個案生活功能及社會互動。",
    longTermGoal: "藉由持續日間照顧，延緩功能退化並減輕家庭照顧負荷。",
  },
  {
    serviceCode: "BD03",
    serviceName: "社區式照顧服務",
    category: "day-care",
    approvalText: "提供個案社區式照顧服務，以維持社區生活參與。",
    shortTermGoal: "透過社區式服務，維持個案社區生活參與。",
    midTermGoal: "透過規律社區服務，維持個案生活功能及社會互動。",
    longTermGoal: "藉由持續社區服務，維持個案社區生活及生活品質。",
  },
  {
    serviceCode: "GA03",
    serviceName: "日間照顧中心喘息服務（全日）",
    category: "respite",
    approvalText: "提供主要照顧者喘息服務，以減輕照顧負荷並維持家庭照顧量能。",
    shortTermGoal: "透過喘息服務，減輕主要照顧者照顧負荷。",
    midTermGoal: "透過規律喘息服務，維持家庭照顧量能。",
    longTermGoal: "藉由持續喘息服務，維持家庭穩定照顧及照顧者身心健康。",
  },
  {
    serviceCode: "GA04",
    serviceName: "日間照顧中心喘息服務（半日）",
    category: "respite",
    approvalText: "提供主要照顧者喘息服務，以減輕照顧負荷並維持家庭照顧量能。",
    shortTermGoal: "透過喘息服務，減輕主要照顧者照顧負荷。",
    midTermGoal: "透過規律喘息服務，維持家庭照顧量能。",
    longTermGoal: "藉由持續喘息服務，維持家庭穩定照顧及照顧者身心健康。",
  },
  {
    serviceCode: "GA05",
    serviceName: "機構住宿式喘息服務",
    category: "respite",
    approvalText: "提供主要照顧者機構住宿式喘息服務，以減輕照顧負荷並維持家庭照顧量能。",
    shortTermGoal: "透過喘息服務，減輕主要照顧者照顧負荷。",
    midTermGoal: "透過規律喘息服務，維持家庭照顧量能。",
    longTermGoal: "藉由持續喘息服務，維持家庭穩定照顧及照顧者身心健康。",
  },
  {
    serviceCode: "EA",
    serviceName: "輔具服務（EA 類）",
    category: "assistive-device",
    approvalText: "協助個案取得適切輔具，以提升生活自理及照顧安全。",
    shortTermGoal: "透過輔具服務，提升個案生活自理安全。",
    midTermGoal: "透過適切輔具使用，維持個案生活功能。",
    longTermGoal: "藉由持續輔具支持，維持個案獨立生活能力及照顧安全。",
    cautions: ["實際核定內容依輔具核定函結果為主。"],
  },
  {
    serviceCode: "EB",
    serviceName: "輔具服務（EB 類）",
    category: "assistive-device",
    approvalText: "協助個案取得適切輔具，以提升生活自理及照顧安全。",
    shortTermGoal: "透過輔具服務，提升個案生活自理安全。",
    midTermGoal: "透過適切輔具使用，維持個案生活功能。",
    longTermGoal: "藉由持續輔具支持，維持個案獨立生活能力及照顧安全。",
    cautions: ["實際核定內容依輔具核定函結果為主。"],
  },
  {
    serviceCode: "Meal Service",
    serviceName: "營養餐飲服務",
    category: "meal",
    approvalText: "提供個案營養餐飲服務，以維持基本營養及飲食穩定。",
    shortTermGoal: "透過營養餐飲服務，維持個案基本營養攝取。",
    midTermGoal: "透過規律餐飲服務，維持個案營養狀況穩定。",
    longTermGoal: "藉由持續餐飲服務，維持個案健康及生活品質。",
  },
];

const templateMap = new Map<string, ServiceGoalTemplate>(
  SERVICE_GOAL_TEMPLATES.map((template) => [template.serviceCode, template])
);

type Category = ServiceGoalTemplate["category"];

/** Default goal text per category, so every catalogued service code resolves. */
const CATEGORY_GOALS: Record<
  Category,
  (name: string) => Omit<ServiceGoalTemplate, "serviceCode" | "serviceName" | "category">
> = {
  "home-care": (n) => ({
    approvalText: `協助個案${n}，以維持日常生活照顧及生活功能。`,
    shortTermGoal: `透過${n}，維持個案日常生活照顧需求。`,
    midTermGoal: `透過規律${n}，維持個案生活功能穩定。`,
    longTermGoal: `藉由持續${n}，延緩功能退化並維持生活品質。`,
  }),
  "day-care": (n) => ({
    approvalText: `提供個案${n}，以維持日間照顧及社會參與。`,
    shortTermGoal: `透過${n}，維持個案日間生活照顧。`,
    midTermGoal: `透過規律${n}，維持個案生活功能及社會互動。`,
    longTermGoal: `藉由持續${n}，延緩功能退化並減輕家庭照顧負荷。`,
  }),
  transportation: (n) => ({
    approvalText: `提供個案${n}，以降低外出移動風險。`,
    shortTermGoal: `透過${n}，維持個案外出就醫安全。`,
    midTermGoal: `透過規律${n}，維持個案規律就醫及復健。`,
    longTermGoal: `藉由持續${n}，維持個案健康管理及社區可近性。`,
  }),
  respite: (n) => ({
    approvalText: `提供主要照顧者${n}，以減輕照顧負荷並維持家庭照顧量能。`,
    shortTermGoal: `透過${n}，減輕主要照顧者照顧負荷。`,
    midTermGoal: `透過規律${n}，維持家庭照顧量能。`,
    longTermGoal: `藉由持續${n}，維持家庭穩定照顧及照顧者身心健康。`,
  }),
  professional: (n) => ({
    approvalText: `提供個案${n}，以維持專業照護品質及照顧安全。`,
    shortTermGoal: `透過${n}，維持個案專業照護需求。`,
    midTermGoal: `透過規律${n}，維持個案功能及照顧安全。`,
    longTermGoal: `藉由持續${n}，維持個案健康狀況及生活品質。`,
  }),
  "assistive-device": (n) => ({
    approvalText: `協助個案取得${n}，以提升生活自理及照顧安全。`,
    shortTermGoal: `透過${n}，提升個案生活自理安全。`,
    midTermGoal: `透過適切輔具使用，維持個案生活功能。`,
    longTermGoal: `藉由持續輔具支持，維持個案獨立生活能力及照顧安全。`,
    cautions: ["實際核定內容依輔具核定函結果為主。"],
  }),
  "home-modification": (n) => ({
    approvalText: `協助個案進行${n}，以改善居家無障礙環境及照顧安全。`,
    shortTermGoal: `透過${n}，改善居家環境安全。`,
    midTermGoal: `透過居家無障礙改善，降低居家活動風險。`,
    longTermGoal: `藉由居家無障礙環境，維持個案安全且穩定的居家生活。`,
    cautions: ["實際核定內容依核定函結果為主。"],
  }),
  meal: (n) => ({
    approvalText: `提供個案${n}，以維持基本營養及飲食穩定。`,
    shortTermGoal: `透過${n}，維持個案基本營養攝取。`,
    midTermGoal: `透過規律餐飲服務，維持個案營養狀況穩定。`,
    longTermGoal: `藉由持續餐飲服務，維持個案健康及生活品質。`,
  }),
  other: (n) => ({
    approvalText: `提供個案${n}，以維持照顧需求。`,
    shortTermGoal: `透過${n}，維持個案照顧需求。`,
    midTermGoal: `透過規律服務，維持個案照顧穩定。`,
    longTermGoal: `藉由持續服務，維持個案生活品質。`,
  }),
};

function categoryForCatalog(groupKey: string, code: string): Category {
  switch (groupKey) {
    case "B":
      if (code.startsWith("BA")) return "home-care";
      return "day-care"; // BB 日照 / BC 家庭托顧 / BD 社區式
    case "C":
      return "professional";
    case "D":
      return "transportation";
    case "E":
      return "assistive-device";
    case "F":
      return "home-modification";
    case "G":
    case "SC":
      return "respite";
    case "OT":
      return "meal";
    default:
      return "other";
  }
}

function buildFromCatalog(): Map<string, ServiceGoalTemplate> {
  const generated = new Map<string, ServiceGoalTemplate>();
  for (const [groupKey, group] of Object.entries(SERVICE_CATALOG)) {
    for (const item of group.items) {
      const category = categoryForCatalog(groupKey, item.code);
      generated.set(item.code, {
        serviceCode: item.code,
        serviceName: item.name,
        category,
        ...CATEGORY_GOALS[category](item.name),
      });
    }
  }
  return generated;
}

const catalogTemplateMap = buildFromCatalog();

/**
 * Resolve a service code to its goal template. Curated templates win; otherwise
 * every catalogued service code resolves via its category default. Assistive
 * device codes (EAxx / EBxx) keep the curated family template, and OT01 maps to
 * the meal-service template.
 */
export function getServiceGoalTemplate(
  serviceCode: string
): ServiceGoalTemplate | undefined {
  if (!serviceCode) return undefined;
  const curated = templateMap.get(serviceCode);
  if (curated) return curated;
  if (serviceCode.startsWith("EA")) return templateMap.get("EA");
  if (serviceCode.startsWith("EB")) return templateMap.get("EB");
  if (serviceCode === "OT01") return templateMap.get("Meal Service");
  return catalogTemplateMap.get(serviceCode);
}

export interface ServiceGoalApproval {
  serviceCode: string;
  serviceName: string;
  approvalText: string;
  cautions?: string[];
}

export interface ServiceGoalsResult {
  shortTermGoals: string[];
  midTermGoals: string[];
  longTermGoals: string[];
  approvals: ServiceGoalApproval[];
  missingCodes: string[];
}

/**
 * Aggregate goals and approval text for the given service codes. Duplicate
 * codes (or codes mapping to the same template) never produce duplicate goals,
 * and codes without a template are returned in `missingCodes`. Never throws.
 */
export function buildServiceGoals(serviceCodes: string[]): ServiceGoalsResult {
  const shortTermGoals: string[] = [];
  const midTermGoals: string[] = [];
  const longTermGoals: string[] = [];
  const approvals: ServiceGoalApproval[] = [];
  const missingCodes: string[] = [];

  const seenTemplate = new Set<string>();
  const seenMissing = new Set<string>();
  const shortSeen = new Set<string>();
  const midSeen = new Set<string>();
  const longSeen = new Set<string>();

  const pushUnique = (target: string[], seen: Set<string>, text: string) => {
    if (text && !seen.has(text)) {
      seen.add(text);
      target.push(text);
    }
  };

  for (const code of serviceCodes ?? []) {
    if (!code) continue;

    const template = getServiceGoalTemplate(code);
    if (!template) {
      if (!seenMissing.has(code)) {
        seenMissing.add(code);
        missingCodes.push(code);
      }
      continue;
    }

    if (seenTemplate.has(template.serviceCode)) continue;
    seenTemplate.add(template.serviceCode);

    approvals.push({
      serviceCode: code,
      serviceName: template.serviceName,
      approvalText: template.approvalText,
      ...(template.cautions ? { cautions: template.cautions } : {}),
    });
    pushUnique(shortTermGoals, shortSeen, template.shortTermGoal);
    pushUnique(midTermGoals, midSeen, template.midTermGoal);
    pushUnique(longTermGoals, longSeen, template.longTermGoal);
  }

  return { shortTermGoals, midTermGoals, longTermGoals, approvals, missingCodes };
}
