import { openDB } from "idb";
import type { DBSchema, IDBPDatabase } from "idb";

import {
  DraftMigrationError,
  UnsupportedDraftVersionError,
  compareDraftsByUpdatedAt,
  migrateDraft,
  toDraftSummary,
} from "./draftModel";
import type {
  DraftProgress,
  DraftSection,
  DraftStatus,
  DraftSummary,
  LocalDraft,
} from "./draftModel";

const DATABASE_NAME = "aa01-local-drafts";
const DATABASE_VERSION = 1;
const STORE_NAME = "drafts" as const;

interface DraftDatabase extends DBSchema {
  drafts: {
    key: string;
    value: unknown;
    indexes: {
      updatedAt: string;
      status: DraftStatus;
    };
  };
}

export type DraftMetadataPatch = Partial<{
  currentStep: number;
  currentSection: DraftSection | null;
  currentQuestion: string | null;
  progress: DraftProgress;
  status: DraftStatus;
  updatedAt: string;
  lastOpenedAt: string;
}>;

export class DraftNotFoundError extends Error {
  constructor(draftId: string) {
    super(`找不到草稿：${draftId}`);
    this.name = "DraftNotFoundError";
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function text(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function futureDraftSummary(raw: unknown): DraftSummary {
  if (!isRecord(raw)) {
    throw new DraftMigrationError("草稿摘要格式無法辨識，原始資料已保留。");
  }

  const draftId = text(raw.draftId);
  const form = isRecord(raw.form) ? raw.form : null;
  if (!draftId || !form) {
    throw new DraftMigrationError("草稿摘要缺少識別碼或表單資料，原始資料已保留。");
  }

  const rawProgress = isRecord(raw.progress) ? raw.progress : {};
  const answered = Number.isFinite(rawProgress.answered) ? Math.max(0, Number(rawProgress.answered)) : 0;
  const total = Number.isFinite(rawProgress.total) ? Math.max(0, Number(rawProgress.total)) : 0;
  const percent = Number.isFinite(rawProgress.percent)
    ? Math.min(100, Math.max(0, Number(rawProgress.percent)))
    : 0;
  const validSections = new Set(["C", "D", "E", "F", "G", "H", "I"]);
  const currentSection = typeof raw.currentSection === "string" && validSections.has(raw.currentSection)
    ? raw.currentSection as DraftSection
    : null;
  const status = raw.status === "completed" || raw.status === "discarded"
    ? raw.status
    : "draft";
  const caseName = text(form.caseName);
  const caseNumber = text(form.caseNumber);

  return {
    draftId,
    caseId: text(raw.caseId) ?? caseNumber,
    displayName: text(raw.displayName) ?? caseName ?? caseNumber ?? "未命名草稿",
    currentStep: Number.isFinite(raw.currentStep)
      ? Math.max(0, Math.trunc(Number(raw.currentStep)))
      : 0,
    currentSection,
    progress: { answered, total, percent },
    status,
    revision: Number.isInteger(raw.revision) && Number(raw.revision) > 0
      ? Number(raw.revision)
      : 1,
    schemaVersion: Number.isFinite(raw.schemaVersion) ? Number(raw.schemaVersion) : 0,
    updatedAt: typeof raw.updatedAt === "string" ? raw.updatedAt : "1970-01-01T00:00:00.000Z",
  };
}

function summarizeStoredDraft(raw: unknown): DraftSummary {
  try {
    return toDraftSummary(migrateDraft(raw));
  } catch (error) {
    if (error instanceof UnsupportedDraftVersionError) {
      return futureDraftSummary(raw);
    }
    throw error;
  }
}

export class DraftRepository {
  private readonly database: IDBPDatabase<DraftDatabase>;

  private constructor(database: IDBPDatabase<DraftDatabase>) {
    this.database = database;
  }

  static async initialize(databaseName = DATABASE_NAME): Promise<DraftRepository> {
    const database = await openDB<DraftDatabase>(databaseName, DATABASE_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          const store = db.createObjectStore(STORE_NAME, { keyPath: "draftId" });
          store.createIndex("updatedAt", "updatedAt");
          store.createIndex("status", "status");
        }
      },
    });

    return new DraftRepository(database);
  }

  async saveDraft(draft: LocalDraft): Promise<LocalDraft> {
    const transaction = this.database.transaction(STORE_NAME, "readwrite");
    const existingRaw = await transaction.store.get(draft.draftId);
    const existing = existingRaw === undefined ? null : migrateDraft(existingRaw);
    const persisted: LocalDraft = {
      ...structuredClone(draft),
      createdAt: existing?.createdAt ?? draft.createdAt,
      revision: existing ? existing.revision + 1 : 1,
      schemaVersion: 1,
    };

    await transaction.store.put(persisted);
    await transaction.done;
    return persisted;
  }

  async loadDraft(draftId: string): Promise<LocalDraft> {
    const raw = await this.database.get(STORE_NAME, draftId);
    if (raw === undefined) throw new DraftNotFoundError(draftId);
    return migrateDraft(raw);
  }

  async listDrafts(): Promise<DraftSummary[]> {
    const records = await this.database.getAll(STORE_NAME);
    return records
      .map(summarizeStoredDraft)
      .filter((draft) => draft.status === "draft")
      .sort(compareDraftsByUpdatedAt);
  }

  async deleteDraft(draftId: string): Promise<void> {
    const transaction = this.database.transaction(STORE_NAME, "readwrite");
    await transaction.store.delete(draftId);
    await transaction.done;
  }

  async updateDraftMetadata(
    draftId: string,
    patch: DraftMetadataPatch
  ): Promise<LocalDraft> {
    const draft = await this.loadDraft(draftId);
    return this.saveDraft({ ...draft, ...structuredClone(patch) });
  }

  async getMostRecentDraft(): Promise<DraftSummary | null> {
    return (await this.listDrafts())[0] ?? null;
  }
}
