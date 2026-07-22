import {
  LEGACY_IDENTITY_VALUES,
  isIdentityTypeValue,
} from "../data/identityOptions";

export interface LegacyFieldResolution {
  normalizedValue: string;
  originalValue: string;
  isValid: boolean;
  isLegacy: boolean;
  needsUserSelection: boolean;
}

const CMS_CHINESE_LEVELS: Record<string, string> = {
  二: "2",
  三: "3",
  四: "4",
  五: "5",
  六: "6",
  七: "7",
  八: "8",
};

function originalValue(value: unknown): string {
  if (value === undefined || value === null) return "";
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? String(value) : value.toISOString();
  }
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  try {
    return String(value);
  } catch {
    return "";
  }
}

function emptyResolution(): LegacyFieldResolution {
  return {
    normalizedValue: "",
    originalValue: "",
    isValid: true,
    isLegacy: false,
    needsUserSelection: false,
  };
}

function validResolution(
  value: unknown,
  original: string,
  normalizedValue: string
): LegacyFieldResolution {
  return {
    normalizedValue,
    originalValue: original,
    isValid: true,
    isLegacy: typeof value !== "string" || original !== normalizedValue,
    needsUserSelection: false,
  };
}

function invalidResolution(original: string): LegacyFieldResolution {
  return {
    normalizedValue: "",
    originalValue: original,
    isValid: false,
    isLegacy: true,
    needsUserSelection: true,
  };
}

function validCalendarDate(year: number, month: number, day: number): boolean {
  if (!Number.isInteger(year) || year < 1 || year > 9999) return false;
  if (!Number.isInteger(month) || month < 1 || month > 12) return false;
  if (!Number.isInteger(day) || day < 1) return false;
  return day <= new Date(Date.UTC(year, month, 0)).getUTCDate();
}

function canonicalDate(year: number, month: number, day: number): string | null {
  if (!validCalendarDate(year, month, day)) return null;
  return `${String(year).padStart(4, "0")}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function dateParts(match: RegExpMatchArray, roc = false): string | null {
  const rawYear = Number(match[1]);
  const year = roc ? rawYear + 1911 : rawYear;
  return canonicalDate(year, Number(match[2]), Number(match[3]));
}

export function resolveLegacyAssessmentDate(value: unknown): LegacyFieldResolution {
  const original = originalValue(value);
  const trimmed = original.trim();
  if (!trimmed) return emptyResolution();

  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return validResolution(value, original, value.toISOString().slice(0, 10));
  }

  const isoDate = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  const slashDate = trimmed.match(/^(\d{4})\/(\d{1,2})\/(\d{1,2})$/);
  const isoTimestamp = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})T\d{2}:\d{2}(?::\d{2}(?:\.\d{1,9})?)?(?:Z|[+-]\d{2}:?\d{2})$/i);
  const rocNamed = trimmed.match(/^民國\s*(\d{1,3})\s*年\s*(\d{1,2})\s*月\s*(\d{1,2})\s*日?$/);
  const rocSeparated = trimmed.match(/^民國\s*(\d{1,3})\s*[./-]\s*(\d{1,2})\s*[./-]\s*(\d{1,2})$/);
  const rocYear = trimmed.match(/^(\d{2,3})\s*年\s*(\d{1,2})\s*月\s*(\d{1,2})\s*日$/);

  const normalized = isoDate
    ? dateParts(isoDate)
    : slashDate
      ? dateParts(slashDate)
      : isoTimestamp
        ? dateParts(isoTimestamp)
        : rocNamed
          ? dateParts(rocNamed, true)
          : rocSeparated
            ? dateParts(rocSeparated, true)
            : rocYear
              ? dateParts(rocYear, true)
              : null;

  return normalized
    ? validResolution(value, original, normalized)
    : invalidResolution(original);
}

export function resolveLegacyCmsLevel(value: unknown): LegacyFieldResolution {
  const original = originalValue(value);
  const trimmed = original.trim();
  if (!trimmed) return emptyResolution();

  const compact = trimmed.replace(/\s+/g, "").replace(/^CMS/i, "");
  const arabic = compact.match(/^([2-8])(?:級)?$/);
  const chinese = compact.match(/^第?([二三四五六七八])級?$/);
  const normalized = arabic?.[1] ?? (chinese ? CMS_CHINESE_LEVELS[chinese[1]] : undefined);

  return normalized
    ? validResolution(value, original, normalized)
    : invalidResolution(original);
}

export function resolveLegacyIdentityType(value: unknown): LegacyFieldResolution {
  const original = originalValue(value);
  const trimmed = original.trim();
  if (!trimmed) return emptyResolution();

  const normalized = isIdentityTypeValue(trimmed)
    ? trimmed
    : LEGACY_IDENTITY_VALUES.get(trimmed);

  return normalized
    ? validResolution(value, original, normalized)
    : invalidResolution(original);
}
