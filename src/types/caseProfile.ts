export interface FamilyProfile {
  maritalStatus?: string;
  childrenCount?: string;
  coResidents?: string[];
  primaryCaregiver?: string;
  secondaryCaregiver?: string;
  caregiverBurden?: string;
  note?: string;
}

export interface EconomicProfile {
  welfareCategory?: string;
  incomeSource?: string[];
  allowance?: string[];
  note?: string;
}

export interface SocialSupportProfile {
  relativesSupport?: string;
  communitySupport?: string;
  foundationSupport?: string;
  otherSupport?: string;
  note?: string;
}

export interface EnvironmentProfile {
  housingType?: string;
  floor?: string;
  elevator?: string;
  bathroomGrabBar?: string;
  antiSlip?: string;
  assistiveDevices?: string[];
  environmentRisk?: string[];
  note?: string;
}

export interface CaseProfile {
  family?: FamilyProfile;
  economic?: EconomicProfile;
  socialSupport?: SocialSupportProfile;
  environment?: EnvironmentProfile;
}

const PLACEHOLDER = "待補充";

function compose(parts: (string | false | undefined)[]): string {
  const kept = parts.filter((part): part is string => Boolean(part));
  return kept.length ? `${kept.join("；")}。` : PLACEHOLDER;
}

function list(values?: string[]): string {
  return values?.length ? values.join("、") : "";
}

export function formatFamilyProfile(family?: FamilyProfile): string {
  if (!family) return PLACEHOLDER;
  return compose([
    family.maritalStatus && `婚姻狀況：${family.maritalStatus}`,
    family.childrenCount && `子女數：${family.childrenCount}`,
    list(family.coResidents) && `同住者：${list(family.coResidents)}`,
    family.primaryCaregiver && `主要照顧者：${family.primaryCaregiver}`,
    family.secondaryCaregiver && `次要照顧者：${family.secondaryCaregiver}`,
    family.caregiverBurden && `照顧者負荷：${family.caregiverBurden}`,
    family.note && family.note,
  ]);
}

export function formatEconomicProfile(economic?: EconomicProfile): string {
  if (!economic) return PLACEHOLDER;
  return compose([
    economic.welfareCategory && `福利身份：${economic.welfareCategory}`,
    list(economic.incomeSource) && `收入來源：${list(economic.incomeSource)}`,
    list(economic.allowance) && `補助津貼：${list(economic.allowance)}`,
    economic.note && economic.note,
  ]);
}

export function formatSocialSupportProfile(social?: SocialSupportProfile): string {
  if (!social) return PLACEHOLDER;
  return compose([
    social.relativesSupport && `親屬支持：${social.relativesSupport}`,
    social.communitySupport && `社區支持：${social.communitySupport}`,
    social.foundationSupport && `基金會或機構支持：${social.foundationSupport}`,
    social.otherSupport && `其他支持：${social.otherSupport}`,
    social.note && social.note,
  ]);
}

export function formatEnvironmentProfile(environment?: EnvironmentProfile): string {
  if (!environment) return PLACEHOLDER;
  return compose([
    environment.housingType && `居住型態：${environment.housingType}`,
    environment.floor && `樓層：${environment.floor}`,
    environment.elevator && `電梯：${environment.elevator}`,
    environment.bathroomGrabBar && `浴室扶手：${environment.bathroomGrabBar}`,
    environment.antiSlip && `地面防滑：${environment.antiSlip}`,
    list(environment.assistiveDevices) &&
      `現有輔具：${list(environment.assistiveDevices)}`,
    list(environment.environmentRisk) &&
      `環境風險：${list(environment.environmentRisk)}`,
    environment.note && environment.note,
  ]);
}
