import type { ServiceGroupKey, PurchaseType } from "./data/serviceCatalog";

export type CaseType = "新案" | "複評" | "半年AA01";

export interface PlannedService {
  id: string;
  serviceKind: "一般服務" | "輔具/無障礙";
  group: ServiceGroupKey;
  code: string;
  name: string;
  unit: string;
  quantity: string;
  frequency: string;
  providerName: string;
  providerStatus: "舊案原派" | "案家指定" | "待媒合" | "新派案" | "";
  equipmentUseType?: "購置" | "租賃" | "皆可";
  purchaseType?: PurchaseType;
}

export interface AA01Form {
  caseType?: CaseType;
  caseName?: string;
  assessmentDate?: string;
  cmsLevel?: string;
  identityType?: string;

  pdfFileName?: string;
  pdfFileSize?: number;
  pdfConfirmed?: boolean;
  ocrText?: string;

  assessmentAnswers?: Record<string, string>;

  consciousness?: string;
  vision?: string;
  hearing?: string;
  expression?: string;
  understanding?: string;

  adlNote?: string;
  iadlNote?: string;
  diseaseNote?: string;
  familyNote?: string;
  environmentNote?: string;

  services?: PlannedService[];
}