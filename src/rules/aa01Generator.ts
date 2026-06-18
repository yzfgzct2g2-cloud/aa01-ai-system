import type { AA01Form, PlannedService } from "../types";

function nlJoin(items: string[]) {
  return items.join("\n");
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

export function generateProblemAnalysis(form: AA01Form) {
  const services = form.services || [];

  return {
    care: [
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
    ].filter(Boolean),

    transport: hasService(services, "DA01")
      ? ["個案外出就醫或復健需交通接送協助，申請交通接送服務，以降低外出移動風險。"]
      : [],

    respite:
      hasPrefix(services, "GA") || hasPrefix(services, "SC")
        ? ["主要照顧者長期承擔照顧責任，需透過喘息或短照服務減輕照顧壓力並維持家庭照顧量能。"]
        : [],

    environment:
      hasPrefix(services, "E") || hasPrefix(services, "FA")
        ? ["個案日常活動及照顧安全需輔具或居家無障礙改善協助，以提升生活安全及照顧便利性。"]
        : [],
  };
}

export function generateGoalSuggestions(form: AA01Form) {
  const services = form.services || [];
  const short = ["維持個案基本生活功能及居家安全。"];
  const mid = ["延緩功能退化並維持照顧穩定性。"];
  const long = ["維持個案於社區穩定生活並提升生活品質。"];

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
  const services = form.services || [];
  const problems = generateProblemAnalysis(form);
  const goals = generateGoalSuggestions(form);

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

  const lines = [
    "一、\t個案現況評估",
    "(一)\t身心概況及照顧情形：",
    `1.\t個案${form.consciousness || "意識狀態待補充"}，視力${form.vision || "待補充"}，聽力${form.hearing || "待補充"}，表達能力${form.expression || "待補充"}，理解能力${form.understanding || "待補充"}。`,
    `2.\t日常活動功能：${form.adlNote || "待補充"}。工具性日常生活功能：${form.iadlNote || "待補充"}。`,
    `3.\t疾病史與特殊照護需求：${form.diseaseNote || "待補充"}。`,

    "(二)\t家庭功能概況：",
    `1.\t${form.familyNote || "待補充。"}。`,

    "(三)\t經濟概況：待補充。",
    "(四)\t社會支持概況：待補充。",
    `(五)\t輔具及居家環境概況：${form.environmentNote || "待補充"}。`,

    "二、\t案家問題及需求：",
    `(一)\t照顧及專業服務：${problems.care.join("；") || "無。"}`,
    `(二)\t交通接送服務：${problems.transport.join("；") || "無。"}`,
    `(三)\t喘息服務：${problems.respite.join("；") || "無。"}`,
    `(四)\t輔具服務及居家無障礙環境改善：${problems.environment.join("；") || "無。"}`,

    "三、\t計畫執行規劃：",
    `(一)\t短期目標(${rocYear}${fmtMonth(startMonth)}-${rocYear}${fmtMonth(startMonth + 1)})：${goals.short.join("；")}`,
    `(二)\t中期目標(${rocYear}${fmtMonth(startMonth + 2)}-${rocYear}${fmtMonth(startMonth + 3)})：${goals.mid.join("；")}`,
    `(三)\t長期目標(${rocYear}${fmtMonth(startMonth + 4)}-${rocYear}${fmtMonth(startMonth + 5)})：${goals.long.join("；")}`,

    "四、\t經本次評估後，擬核定照顧服務內容如下：",
  ];

  if (careServices.length) {
    lines.push("(一)\t照顧及專業服務(給付額度：24,100元/月)：");
    careServices.forEach((s, i) => lines.push(`${i + 1}.\t${s.code}[${s.name}]*${s.quantity || "__"}${s.unit}${s.frequency ? `，${s.frequency}` : ""}。`));
    lines.push(`${careServices.length + 1}.\t服務單位：${groupProviderText(careServices)}。`);
  }

  if (transportServices.length) {
    lines.push("(二)\t交通接送(給付額度：1840元/月)：");
    transportServices.forEach((s, i) => lines.push(`${i + 1}.\t${s.code}[${s.name}]*${s.quantity || "__"}${s.unit}。`));
    lines.push(`${transportServices.length + 1}.\t服務單位：${groupProviderText(transportServices)}。`);
  }

  if (respiteServices.length) {
    lines.push("(三)\t喘息服務(剩餘額度：待確認元/年，額度區間：待確認)：");
    respiteServices.forEach((s, i) => lines.push(`${i + 1}.\t${s.name}:${s.code}*${s.quantity || "__"}${s.unit}。`));
    lines.push(`${respiteServices.length + 1}.\t服務單位：${groupProviderText(respiteServices)}。`);
  }

  if (equipmentServices.length) {
    lines.push("(四)\t輔具服務(剩餘額度：40000元/3年)：");
    equipmentServices.forEach((s, i) => lines.push(`${i + 1}.\t${s.code}[${s.name}]*${s.quantity || "__"}${s.unit}。`));
    lines.push(`${equipmentServices.length + 1}.\t服務單位：${groupProviderText(equipmentServices)}。實際核定內容依輔具核定函結果為主。`);
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