export const IDENTITY_OPTIONS = [
  { value: "class1", label: "第一類" },
  { value: "class2", label: "第二類" },
  { value: "class3", label: "第三類" },
] as const;

export type IdentityTypeValue = (typeof IDENTITY_OPTIONS)[number]["value"];

const IDENTITY_LABELS: Record<IdentityTypeValue, string> = Object.fromEntries(
  IDENTITY_OPTIONS.map(({ value, label }) => [value, label])
) as Record<IdentityTypeValue, string>;

export function isIdentityTypeValue(value: string): value is IdentityTypeValue {
  return value in IDENTITY_LABELS;
}

export function getIdentityTypeLabel(value: IdentityTypeValue): string {
  return IDENTITY_LABELS[value];
}

export function formatIdentityType(value: unknown): string {
  if (typeof value !== "string") return "";
  const trimmed = value.trim();
  if (!trimmed) return "";
  if (isIdentityTypeValue(trimmed)) return getIdentityTypeLabel(trimmed);

  const legacyValue = LEGACY_IDENTITY_VALUES.get(trimmed);
  return legacyValue ? getIdentityTypeLabel(legacyValue) : value;
}

export const LEGACY_IDENTITY_VALUES = new Map<string, IdentityTypeValue>([
  ["第一類", "class1"],
  ["第一類／低收", "class1"],
  ["第一類/低收", "class1"],
  ["低收入戶", "class1"],
  ["低收", "class1"],
  ["第二類", "class2"],
  ["第二類／中低收", "class2"],
  ["第二類/中低收", "class2"],
  ["中低收入戶", "class2"],
  ["中低收", "class2"],
  ["第三類", "class3"],
  ["第三類／一般戶", "class3"],
  ["第三類/一般戶", "class3"],
  ["一般戶", "class3"],
]);
