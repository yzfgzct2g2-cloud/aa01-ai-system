import type { AA01Form, AssessmentAnswer } from "../types";
import type { LocalDraft } from "./draftModel";

export type SaveMode = "immediate" | "debounced";
export type DraftSaveState = "idle" | "unsaved" | "saving" | "saved" | "error";

const FREE_TEXT_TOP_LEVEL = new Set([
  "caseName",
  "caseNumber",
  "ocrText",
  "consciousness",
  "vision",
  "hearing",
  "expression",
  "understanding",
  "adlNote",
  "iadlNote",
  "diseaseNote",
  "familyNote",
  "environmentNote",
]);

const FREE_TEXT_PROFILE_PATHS = new Set([
  "family.note",
  "economic.note",
  "socialSupport.otherSupport",
  "socialSupport.note",
  "environment.note",
]);

const FREE_TEXT_SERVICE_PATHS = new Set([
  "quantity",
  "frequency",
  "providerName",
]);

function same(left: unknown, right: unknown) {
  return JSON.stringify(left) === JSON.stringify(right);
}

function answerHasValue(answer: AssessmentAnswer | undefined) {
  if (!answer) return false;
  if (Array.isArray(answer.value)) return answer.value.length > 0;
  if (typeof answer.value === "string") return answer.value.trim().length > 0;
  return typeof answer.value === "number" && Number.isFinite(answer.value);
}

function changedProfilePaths(
  previous: unknown,
  next: unknown,
  prefix = ""
): string[] {
  if (same(previous, next)) return [];
  const previousIsRecord = typeof previous === "object" && previous !== null && !Array.isArray(previous);
  const nextIsRecord = typeof next === "object" && next !== null && !Array.isArray(next);
  if (!previousIsRecord && !nextIsRecord) {
    return [prefix];
  }

  const left = previousIsRecord ? previous as Record<string, unknown> : {};
  const right = nextIsRecord ? next as Record<string, unknown> : {};
  const keys = new Set([...Object.keys(left), ...Object.keys(right)]);
  return [...keys].flatMap((key) => changedProfilePaths(
    left[key],
    right[key],
    prefix ? `${prefix}.${key}` : key
  ));
}

function servicesUseOnlyFreeText(previous: unknown, next: unknown) {
  if (!Array.isArray(previous) || !Array.isArray(next)) return false;
  if (previous.length !== next.length) return false;

  return next.every((nextService, index) => {
    const previousService = previous[index];
    if (
      typeof previousService !== "object" || previousService === null ||
      typeof nextService !== "object" || nextService === null ||
      Array.isArray(previousService) || Array.isArray(nextService)
    ) return false;

    const left = previousService as Record<string, unknown>;
    const right = nextService as Record<string, unknown>;
    if (left.id !== right.id) return false;
    return changedProfilePaths(left, right).every((path) =>
      FREE_TEXT_SERVICE_PATHS.has(path)
    );
  });
}

export function classifyFormChange(previous: AA01Form, next: AA01Form): SaveMode {
  const topLevelKeys = new Set([...Object.keys(previous), ...Object.keys(next)]);
  let changed = false;
  let onlyFreeText = true;

  for (const key of topLevelKeys) {
    const previousValue = previous[key as keyof AA01Form];
    const nextValue = next[key as keyof AA01Form];
    if (same(previousValue, nextValue)) continue;
    changed = true;

    if (key === "assessmentAnswers") {
      const previousAnswers = previous.assessmentAnswers ?? {};
      const nextAnswers = next.assessmentAnswers ?? {};
      const questionIds = new Set([
        ...Object.keys(previousAnswers),
        ...Object.keys(nextAnswers),
      ]);

      for (const questionId of questionIds) {
        const previousAnswer = previousAnswers[questionId];
        const nextAnswer = nextAnswers[questionId];
        if (same(previousAnswer, nextAnswer)) continue;
        if (!nextAnswer || (answerHasValue(previousAnswer) && !answerHasValue(nextAnswer))) {
          return "immediate";
        }
        if (nextAnswer.type !== "text") return "immediate";
      }
      continue;
    }

    if (key === "caseProfile") {
      const paths = changedProfilePaths(previousValue ?? {}, nextValue ?? {});
      if (paths.some((path) => !FREE_TEXT_PROFILE_PATHS.has(path))) {
        return "immediate";
      }
      continue;
    }

    if (key === "services") {
      if (!servicesUseOnlyFreeText(previousValue, nextValue)) return "immediate";
      continue;
    }

    if (!FREE_TEXT_TOP_LEVEL.has(key)) return "immediate";
  }

  if (!changed) onlyFreeText = false;
  return onlyFreeText ? "debounced" : "immediate";
}

interface DraftSaveQueueOptions {
  debounceMs?: number;
  onStateChange?: (
    state: DraftSaveState,
    saved?: LocalDraft,
    error?: Error
  ) => void;
}

export class DraftSaveQueue {
  private readonly save: (draft: LocalDraft) => Promise<LocalDraft>;
  private readonly debounceMs: number;
  private readonly onStateChange?: DraftSaveQueueOptions["onStateChange"];
  private pending: LocalDraft | null = null;
  private pendingReady = false;
  private timer: ReturnType<typeof setTimeout> | null = null;
  private running: Promise<LocalDraft | null> | null = null;
  private lastSaved: LocalDraft | null = null;

  constructor(
    save: (draft: LocalDraft) => Promise<LocalDraft>,
    options: DraftSaveQueueOptions = {}
  ) {
    this.save = save;
    this.debounceMs = options.debounceMs ?? 500;
    this.onStateChange = options.onStateChange;
  }

  schedule(draft: LocalDraft, mode: SaveMode): void {
    this.pending = structuredClone(draft);
    this.pendingReady = mode === "immediate";
    this.clearTimer();
    this.emit("unsaved");

    if (mode === "immediate") {
      void this.drain().catch(() => undefined);
      return;
    }

    this.timer = setTimeout(() => {
      this.timer = null;
      this.pendingReady = true;
      void this.drain().catch(() => undefined);
    }, this.debounceMs);
  }

  async flush(): Promise<LocalDraft | null> {
    this.clearTimer();
    if (this.pending) this.pendingReady = true;
    return this.drain();
  }

  async retry(): Promise<LocalDraft | null> {
    if (this.pending) this.pendingReady = true;
    return this.drain();
  }

  hasPending(): boolean {
    return this.pending !== null;
  }

  getLastSaved(): LocalDraft | null {
    return this.lastSaved ? structuredClone(this.lastSaved) : null;
  }

  private clearTimer() {
    if (this.timer === null) return;
    clearTimeout(this.timer);
    this.timer = null;
  }

  private emit(state: DraftSaveState, saved?: LocalDraft, error?: Error) {
    this.onStateChange?.(state, saved, error);
  }

  private getPending() {
    return this.pending;
  }

  private async drain(): Promise<LocalDraft | null> {
    if (this.running) return this.running;

    this.running = this.runReadyWrites();
    try {
      return await this.running;
    } finally {
      this.running = null;
      if (this.pending && this.pendingReady) {
        void this.drain().catch(() => undefined);
      }
    }
  }

  private async runReadyWrites(): Promise<LocalDraft | null> {
    while (this.pending && this.pendingReady) {
      const snapshot = this.pending;
      this.pending = null;
      this.pendingReady = false;
      this.emit("saving");

      try {
        const saved = await this.save(snapshot);
        this.lastSaved = saved;
        const pending = this.getPending();
        if (pending) {
          this.pending = {
            ...pending,
            revision: saved.revision,
            createdAt: saved.createdAt,
          };
        }
        this.emit(this.pending ? "unsaved" : "saved", saved);
      } catch (reason) {
        const error = reason instanceof Error ? reason : new Error(String(reason));
        if (!this.pending) this.pending = snapshot;
        this.pendingReady = false;
        this.emit("error", undefined, error);
        throw error;
      }
    }

    return this.lastSaved;
  }
}
