import type { AA01Form, AssessmentQuestion } from "../types";

export const DRAFT_SCHEMA_VERSION = 1 as const;
export const DRAFT_STATUSES = ["draft", "completed", "discarded"] as const;

export type DraftStatus = (typeof DRAFT_STATUSES)[number];
export type DraftSection = Exclude<AssessmentQuestion["section"], undefined>;

export interface DraftProgress {
  answered: number;
  total: number;
  percent: number;
}

export interface LocalDraft {
  draftId: string;
  caseId: string | null;
  displayName: string;
  form: AA01Form;
  currentStep: number;
  currentSection: DraftSection | null;
  currentQuestion: string | null;
  progress: DraftProgress;
  status: DraftStatus;
  revision: number;
  schemaVersion: typeof DRAFT_SCHEMA_VERSION;
  createdAt: string;
  updatedAt: string;
  lastOpenedAt: string;
}

export interface DraftSummary {
  draftId: string;
  caseId: string | null;
  displayName: string;
  currentStep: number;
  currentSection: DraftSection | null;
  progress: DraftProgress;
  status: DraftStatus;
  revision: number;
  schemaVersion: number;
  updatedAt: string;
}

export class UnsupportedDraftVersionError extends Error {
  constructor(version: number) {
    super(`此草稿使用較新的資料版本（${version}），目前版本無法開啟。`);
    this.name = "UnsupportedDraftVersionError";
  }
}

export class DraftMigrationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "DraftMigrationError";
  }
}

const EMPTY_PROGRESS: DraftProgress = { answered: 0, total: 0, percent: 0 };
const SECTIONS = new Set<DraftSection>(["C", "D", "E", "F", "G", "H", "I"]);

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function hasValue(value: unknown): boolean {
  if (typeof value === "string") return value.trim().length > 0;
  if (typeof value === "number") return Number.isFinite(value);
  if (typeof value === "boolean") return true;
  if (Array.isArray(value)) return value.some(hasValue);
  if (!isRecord(value)) return false;
  return Object.values(value).some(hasValue);
}

export function hasRecoverableUserInput(form: AA01Form): boolean {
  return Object.entries(form).some(([key, value]) => {
    if (key !== "assessmentAnswers") return hasValue(value);
    if (!isRecord(value)) return false;

    return Object.values(value).some((answer) => {
      if (!isRecord(answer)) return false;
      return hasValue(answer.value) || hasValue(answer.text);
    });
  });
}

function trimmed(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const result = value.trim();
  return result.length > 0 ? result : null;
}

function displayName(form: AA01Form): string {
  return trimmed(form.caseName) ?? trimmed(form.caseNumber) ?? "未命名草稿";
}

function normalizeProgress(value: unknown): DraftProgress {
  if (!isRecord(value)) return { ...EMPTY_PROGRESS };

  const answered = Number.isFinite(value.answered) ? Math.max(0, Number(value.answered)) : 0;
  const total = Number.isFinite(value.total) ? Math.max(0, Number(value.total)) : 0;
  const percent = Number.isFinite(value.percent)
    ? Math.min(100, Math.max(0, Number(value.percent)))
    : total === 0
      ? 0
      : Math.round((answered / total) * 100);

  return { answered, total, percent };
}

function normalizeSection(value: unknown): DraftSection | null {
  return typeof value === "string" && SECTIONS.has(value as DraftSection)
    ? value as DraftSection
    : null;
}

function normalizeStatus(value: unknown): DraftStatus {
  if (value === "in-progress") return "draft";
  return DRAFT_STATUSES.includes(value as DraftStatus) ? value as DraftStatus : "draft";
}

function normalizeDate(value: unknown, fallback: string): string {
  return typeof value === "string" && !Number.isNaN(Date.parse(value)) ? value : fallback;
}

export function createLocalDraft(input: {
  draftId: string;
  form: AA01Form;
  currentStep: number;
  currentSection: DraftSection | null;
  currentQuestion: string | null;
  progress: DraftProgress;
  now?: string;
}): LocalDraft {
  const now = input.now ?? new Date().toISOString();

  return {
    draftId: input.draftId,
    caseId: trimmed(input.form.caseNumber),
    displayName: displayName(input.form),
    form: structuredClone(input.form),
    currentStep: Math.max(0, Math.trunc(input.currentStep)),
    currentSection: input.currentSection,
    currentQuestion: trimmed(input.currentQuestion),
    progress: normalizeProgress(input.progress),
    status: "draft",
    revision: 1,
    schemaVersion: DRAFT_SCHEMA_VERSION,
    createdAt: now,
    updatedAt: now,
    lastOpenedAt: now,
  };
}

export function migrateDraft(raw: unknown): LocalDraft {
  if (!isRecord(raw)) {
    throw new DraftMigrationError("草稿資料格式無法辨識，原始資料已保留。");
  }

  const schemaVersion = raw.schemaVersion === undefined ? 0 : Number(raw.schemaVersion);
  if (Number.isFinite(schemaVersion) && schemaVersion > DRAFT_SCHEMA_VERSION) {
    throw new UnsupportedDraftVersionError(schemaVersion);
  }

  const draftId = trimmed(raw.draftId);
  if (!draftId || !isRecord(raw.form)) {
    throw new DraftMigrationError("草稿缺少識別碼或表單資料，原始資料已保留。");
  }

  const form = structuredClone(raw.form) as AA01Form;
  const fallbackDate = "1970-01-01T00:00:00.000Z";
  const updatedAt = normalizeDate(raw.updatedAt, fallbackDate);
  const createdAt = normalizeDate(raw.createdAt, updatedAt);

  return {
    draftId,
    caseId: trimmed(raw.caseId) ?? trimmed(form.caseNumber),
    displayName: trimmed(raw.displayName) ?? displayName(form),
    form,
    currentStep: Number.isFinite(raw.currentStep)
      ? Math.max(0, Math.trunc(Number(raw.currentStep)))
      : 0,
    currentSection: normalizeSection(raw.currentSection),
    currentQuestion: trimmed(raw.currentQuestion),
    progress: normalizeProgress(raw.progress),
    status: normalizeStatus(raw.status),
    revision: Number.isInteger(raw.revision) && Number(raw.revision) > 0
      ? Number(raw.revision)
      : 1,
    schemaVersion: DRAFT_SCHEMA_VERSION,
    createdAt,
    updatedAt,
    lastOpenedAt: normalizeDate(raw.lastOpenedAt, updatedAt),
  };
}

export function toDraftSummary(draft: LocalDraft): DraftSummary {
  return {
    draftId: draft.draftId,
    caseId: draft.caseId,
    displayName: draft.displayName,
    currentStep: draft.currentStep,
    currentSection: draft.currentSection,
    progress: { ...draft.progress },
    status: draft.status,
    revision: draft.revision,
    schemaVersion: draft.schemaVersion,
    updatedAt: draft.updatedAt,
  };
}

export function compareDraftsByUpdatedAt(left: DraftSummary, right: DraftSummary) {
  const leftTime = Date.parse(left.updatedAt);
  const rightTime = Date.parse(right.updatedAt);
  const safeLeft = Number.isNaN(leftTime) ? 0 : leftTime;
  const safeRight = Number.isNaN(rightTime) ? 0 : rightTime;
  return safeRight - safeLeft;
}
