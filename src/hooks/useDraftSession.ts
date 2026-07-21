import { useCallback, useEffect, useRef, useState } from "react";

import type { AA01Form } from "../types";
import {
  DraftSaveQueue,
  classifyFormChange,
} from "../persistence/draftAutosave";
import type { DraftSaveState } from "../persistence/draftAutosave";
import {
  createLocalDraft,
  hasRecoverableUserInput,
} from "../persistence/draftModel";
import type {
  DraftProgress,
  DraftSection,
  DraftSummary,
  LocalDraft,
} from "../persistence/draftModel";
import { DraftRepository } from "../persistence/draftRepository";
import type { DraftMetadataPatch } from "../persistence/draftRepository";

const NAVIGATION_HINT_KEY = "aa01:last-draft-navigation";

type StorageContract = Pick<Storage, "getItem" | "setItem" | "removeItem">;

export interface DraftRepositoryContract {
  saveDraft(draft: LocalDraft): Promise<LocalDraft>;
  loadDraft(draftId: string): Promise<LocalDraft>;
  listDrafts(): Promise<DraftSummary[]>;
  deleteDraft(draftId: string): Promise<void>;
  updateDraftMetadata(draftId: string, patch: DraftMetadataPatch): Promise<LocalDraft>;
  getMostRecentDraft(): Promise<DraftSummary | null>;
}

export interface DraftHydration {
  form: AA01Form;
  currentStep: number;
  currentSection: DraftSection | null;
  currentQuestion: string | null;
  progress: DraftProgress;
}

export interface UseDraftSessionOptions {
  form: AA01Form;
  currentStep: number;
  currentSection: DraftSection | null;
  currentQuestion: string | null;
  progress: DraftProgress;
  onHydrate: (value: DraftHydration) => void;
  initializeRepository?: () => Promise<DraftRepositoryContract>;
  createDraftId?: () => string;
  storage?: StorageContract | null;
}

export interface UseDraftSessionResult {
  startupState: "checking" | "recovery" | "ready" | "error";
  drafts: DraftSummary[];
  startupError: string | null;
  saveState: DraftSaveState;
  saveError: string | null;
  lastSavedAt: string | null;
  activeDraftId: string | null;
  continueDraft: (draftId: string) => Promise<void>;
  deleteDraft: (draftId: string) => Promise<void>;
  refreshDrafts: () => Promise<void>;
  retrySave: () => Promise<void>;
  flush: () => Promise<void>;
}

function defaultRepositoryInitializer() {
  return DraftRepository.initialize();
}

function defaultDraftId() {
  return crypto.randomUUID();
}

function defaultStorage(): StorageContract | null {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

function errorMessage(reason: unknown, fallback: string) {
  return reason instanceof Error ? reason.message : fallback;
}

function same(left: unknown, right: unknown) {
  return JSON.stringify(left) === JSON.stringify(right);
}

function buildSnapshot(
  active: LocalDraft | null,
  input: {
    draftId: string;
    form: AA01Form;
    currentStep: number;
    currentSection: DraftSection | null;
    currentQuestion: string | null;
    progress: DraftProgress;
    now: string;
  }
) {
  const current = createLocalDraft(input);
  if (!active) return current;

  return {
    ...current,
    status: active.status,
    revision: active.revision,
    createdAt: active.createdAt,
    lastOpenedAt: active.lastOpenedAt,
  };
}

export function useDraftSession({
  form,
  currentStep,
  currentSection,
  currentQuestion,
  progress,
  onHydrate,
  initializeRepository = defaultRepositoryInitializer,
  createDraftId = defaultDraftId,
  storage = defaultStorage(),
}: UseDraftSessionOptions): UseDraftSessionResult {
  const [startupState, setStartupState] = useState<UseDraftSessionResult["startupState"]>("checking");
  const [drafts, setDrafts] = useState<DraftSummary[]>([]);
  const [startupError, setStartupError] = useState<string | null>(null);
  const [saveState, setSaveState] = useState<DraftSaveState>("idle");
  const [saveError, setSaveError] = useState<string | null>(null);
  const [lastSavedAt, setLastSavedAt] = useState<string | null>(null);
  const [activeDraftId, setActiveDraftId] = useState<string | null>(null);
  const repositoryRef = useRef<DraftRepositoryContract | null>(null);
  const queueRef = useRef<DraftSaveQueue | null>(null);
  const activeDraftRef = useRef<LocalDraft | null>(null);
  const previousFormRef = useRef<AA01Form>(form);
  const previousNavigationRef = useRef({
    currentStep,
    currentSection,
    currentQuestion,
    progress,
  });
  const skipNextReadyObservationRef = useRef(false);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const writeNavigationHint = useCallback((
    draftId: string,
    navigation = { currentStep, currentSection, currentQuestion }
  ) => {
    try {
      storage?.setItem(NAVIGATION_HINT_KEY, JSON.stringify({
        draftId,
        ...navigation,
      }));
    } catch {
      // The hint is optional; IndexedDB remains the source of truth.
    }
  }, [currentQuestion, currentSection, currentStep, storage]);

  const removeNavigationHint = useCallback(() => {
    try {
      storage?.removeItem(NAVIGATION_HINT_KEY);
    } catch {
      // Storage access may be denied; no draft data is stored in this hint.
    }
  }, [storage]);

  const configureQueue = useCallback((repository: DraftRepositoryContract) => {
    if (queueRef.current) return queueRef.current;
    queueRef.current = new DraftSaveQueue(
      (draft) => repository.saveDraft(draft),
      {
        debounceMs: 500,
        onStateChange: (state, saved, error) => {
          if (saved) {
            activeDraftRef.current = saved;
          }
          if (!mountedRef.current) return;
          setSaveState(state);
          setSaveError(error?.message ?? null);
          if (saved) {
            setActiveDraftId(saved.draftId);
            setLastSavedAt(saved.updatedAt);
          }
        },
      }
    );
    return queueRef.current;
  }, []);

  const refreshDrafts = useCallback(async () => {
    setStartupState("checking");
    setStartupError(null);
    try {
      const repository = repositoryRef.current ?? await initializeRepository();
      repositoryRef.current = repository;
      configureQueue(repository);
      const availableDrafts = await repository.listDrafts();
      setDrafts(availableDrafts);
      if (availableDrafts.length > 0) {
        setStartupState("recovery");
      } else {
        removeNavigationHint();
        setStartupState("ready");
      }
    } catch (reason) {
      setStartupError(errorMessage(reason, "無法檢查此裝置上的草稿，請再試一次。"));
      setStartupState("error");
    }
  }, [configureQueue, initializeRepository, removeNavigationHint]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void refreshDrafts();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [refreshDrafts]);

  useEffect(() => {
    if (startupState !== "ready" || !repositoryRef.current || !queueRef.current) {
      previousFormRef.current = form;
      return;
    }

    if (skipNextReadyObservationRef.current) {
      skipNextReadyObservationRef.current = false;
      previousFormRef.current = form;
      return;
    }

    const previousForm = previousFormRef.current;
    previousFormRef.current = form;
    if (same(previousForm, form)) return;

    const active = activeDraftRef.current;
    if (!active && !hasRecoverableUserInput(form)) return;

    const draftId = active?.draftId ?? createDraftId();
    const snapshot = buildSnapshot(active, {
      draftId,
      form,
      currentStep,
      currentSection,
      currentQuestion,
      progress,
      now: new Date().toISOString(),
    });
    if (!active) {
      activeDraftRef.current = snapshot;
      setActiveDraftId(draftId);
    }
    writeNavigationHint(draftId);
    queueRef.current.schedule(snapshot, classifyFormChange(previousForm, form));
  }, [
    createDraftId,
    currentQuestion,
    currentSection,
    currentStep,
    form,
    progress,
    startupState,
    writeNavigationHint,
  ]);

  useEffect(() => {
    const previous = previousNavigationRef.current;
    previousNavigationRef.current = {
      currentStep,
      currentSection,
      currentQuestion,
      progress,
    };

    if (startupState !== "ready" || skipNextReadyObservationRef.current) return;
    if (!activeDraftRef.current || !queueRef.current) return;
    if (
      previous.currentStep === currentStep &&
      previous.currentSection === currentSection &&
      previous.currentQuestion === currentQuestion &&
      same(previous.progress, progress)
    ) return;

    const saveNavigation = async () => {
      const flushed = await queueRef.current?.flush();
      if (flushed) activeDraftRef.current = flushed;
      const active = activeDraftRef.current;
      if (!active || !queueRef.current) return;
      const snapshot = buildSnapshot(active, {
        draftId: active.draftId,
        form,
        currentStep,
        currentSection,
        currentQuestion,
        progress,
        now: new Date().toISOString(),
      });
      writeNavigationHint(active.draftId);
      queueRef.current.schedule(snapshot, "immediate");
    };

    void saveNavigation().catch((reason) => {
      setSaveState("error");
      setSaveError(errorMessage(reason, "導覽位置尚未保存。"));
    });
  }, [
    currentQuestion,
    currentSection,
    currentStep,
    form,
    progress,
    startupState,
    writeNavigationHint,
  ]);

  const flush = useCallback(async () => {
    try {
      const saved = await queueRef.current?.flush();
      if (saved) activeDraftRef.current = saved;
    } catch {
      // The queue retains the latest snapshot and reports the error via state.
    }
  }, []);

  const retrySave = useCallback(async () => {
    try {
      const saved = await queueRef.current?.retry();
      if (saved) activeDraftRef.current = saved;
    } catch {
      // Keep the retryable snapshot in memory and leave the error visible.
    }
  }, []);

  useEffect(() => {
    const flushOnPageExit = () => {
      void flush().catch(() => undefined);
    };
    const flushWhenHidden = () => {
      if (document.visibilityState === "hidden") flushOnPageExit();
    };

    window.addEventListener("pagehide", flushOnPageExit);
    document.addEventListener("visibilitychange", flushWhenHidden);
    return () => {
      window.removeEventListener("pagehide", flushOnPageExit);
      document.removeEventListener("visibilitychange", flushWhenHidden);
      flushOnPageExit();
    };
  }, [flush]);

  const continueDraft = useCallback(async (draftId: string) => {
    const repository = repositoryRef.current;
    if (!repository) throw new Error("草稿儲存庫尚未完成初始化。");

    setStartupError(null);
    try {
      const draft = await repository.loadDraft(draftId);
      activeDraftRef.current = draft;
      setActiveDraftId(draft.draftId);
      setLastSavedAt(draft.updatedAt);
      skipNextReadyObservationRef.current = true;
      previousFormRef.current = draft.form;
      previousNavigationRef.current = {
        currentStep: draft.currentStep,
        currentSection: draft.currentSection,
        currentQuestion: draft.currentQuestion,
        progress: draft.progress,
      };
      writeNavigationHint(draft.draftId, {
        currentStep: draft.currentStep,
        currentSection: draft.currentSection,
        currentQuestion: draft.currentQuestion,
      });
      onHydrate({
        form: structuredClone(draft.form),
        currentStep: draft.currentStep,
        currentSection: draft.currentSection,
        currentQuestion: draft.currentQuestion,
        progress: { ...draft.progress },
      });
      setStartupState("ready");

      const openedAt = new Date().toISOString();
      const queue = configureQueue(repository);
      queue.schedule({ ...draft, lastOpenedAt: openedAt, updatedAt: openedAt }, "immediate");
    } catch (reason) {
      setStartupError(errorMessage(reason, "草稿載入失敗，原始資料仍保留在此裝置。"));
      setStartupState("recovery");
      throw reason;
    }
  }, [configureQueue, onHydrate, writeNavigationHint]);

  const deleteDraft = useCallback(async (draftId: string) => {
    const repository = repositoryRef.current;
    if (!repository) throw new Error("草稿儲存庫尚未完成初始化。");
    await repository.deleteDraft(draftId);
    const remaining = await repository.listDrafts();
    setDrafts(remaining);
    if (remaining.length === 0) {
      removeNavigationHint();
      setStartupState("ready");
    } else {
      setStartupState("recovery");
    }
  }, [removeNavigationHint]);

  return {
    startupState,
    drafts,
    startupError,
    saveState,
    saveError,
    lastSavedAt,
    activeDraftId,
    continueDraft,
    deleteDraft,
    refreshDrafts,
    retrySave,
    flush,
  };
}
