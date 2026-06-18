import type { AA01Form, PlannedService } from "../types";

function hasService(services: PlannedService[], code: string) {
  return services.some((s) => s.code === code);
}

function hasPrefix(services: PlannedService[], prefix: string) {
  return services.some((s) => s.code.startsWith(prefix));
}

export function buildServiceValidationWarnings(form: AA01Form) {
  const services = form.services || [];
  const warnings: string[] = [];

  if (hasService(services, "BA14") && !hasService(services, "DA01")) {
    warnings.push("已選 BA14 陪同就醫，請確認是否需同步評估 DA01 交通接送。");
  }

  if (hasService(services, "BA13") && !hasService(services, "DA01")) {
    warnings.push("已選 BA13 陪同外出，若個案行動受限或需輪椅外出，請確認是否需交通接送。");
  }

  if ((hasPrefix(services, "GA") || hasPrefix(services, "SC")) && !form.familyNote) {
    warnings.push("已選喘息或短照服務，建議補充主要照顧者負荷或家庭照顧限制。");
  }

  if ((hasPrefix(services, "E") || hasPrefix(services, "FA")) && !form.environmentNote) {
    warnings.push("已選輔具或無障礙服務，建議補充居家環境風險、既有輔具或申請理由。");
  }

  if (hasService(services, "OT01") && !form.diseaseNote && !form.iadlNote) {
    warnings.push("已選 OT01 營養餐飲服務，建議補充備餐困難、營養攝取或 IADL 限制。");
  }

  return warnings;
}