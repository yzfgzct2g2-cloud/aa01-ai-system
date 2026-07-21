import { useMemo, useState } from "react";

import { compareDraftsByUpdatedAt } from "../persistence/draftModel";
import type { DraftSummary } from "../persistence/draftModel";

interface DraftRecoveryGateProps {
  drafts: DraftSummary[];
  loading?: boolean;
  error?: string | null;
  onContinue: (draftId: string) => Promise<void>;
  onRefresh: () => Promise<void>;
  onDelete: (draftId: string) => Promise<void>;
}

const STEP_LABELS = [
  "個案資料",
  "PDF匯入",
  "評估確認",
  "個案概況",
  "服務規劃",
  "摘要確認",
  "計畫檢核",
  "AA01產出",
];

function formatSavedAt(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "時間無法辨識";
  return new Intl.DateTimeFormat("zh-TW", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function DraftCard({
  draft,
  featured = false,
  busy,
  confirmDiscard,
  onContinue,
  onRequestDiscard,
  onCancelDiscard,
  onConfirmDiscard,
}: {
  draft: DraftSummary;
  featured?: boolean;
  busy: boolean;
  confirmDiscard: boolean;
  onContinue: () => void;
  onRequestDiscard: () => void;
  onCancelDiscard: () => void;
  onConfirmDiscard: () => void;
}) {
  const stepLabel = STEP_LABELS[draft.currentStep] ?? `步驟 ${draft.currentStep + 1}`;
  return (
    <article
      className="draft-recovery-card"
      data-draft-card
      data-draft-id={draft.draftId}
      data-featured-draft={featured ? "true" : undefined}
    >
      <div className="draft-recovery-card__heading">
        <div>
          <span className="draft-recovery-card__eyebrow">未完成草稿</span>
          <h2>{draft.displayName}</h2>
        </div>
        <span className="draft-recovery-card__status">資料已儲存在此裝置</span>
      </div>

      <dl className="draft-recovery-meta">
        <div><dt>最後儲存</dt><dd>{formatSavedAt(draft.updatedAt)}</dd></div>
        <div><dt>目前步驟</dt><dd>{draft.currentStep + 1}. {stepLabel}</dd></div>
        <div><dt>目前題組</dt><dd>{draft.currentSection ?? "尚未進入評估題組"}</dd></div>
        <div><dt>草稿狀態</dt><dd>未完成</dd></div>
      </dl>

      <div className="draft-recovery-progress">
        <div>
          <span>完成進度</span>
          <strong>{draft.progress.percent}%</strong>
        </div>
        <progress max="100" value={draft.progress.percent}>
          {draft.progress.percent}%
        </progress>
        <small>{draft.progress.answered}／{draft.progress.total} 項</small>
      </div>

      {confirmDiscard ? (
        <div className="draft-discard-confirmation" role="alertdialog" aria-label="確認捨棄草稿">
          <strong>確定要捨棄這份草稿嗎？</strong>
          <p>捨棄後，這份草稿將從此裝置刪除，且目前沒有雲端備份。</p>
          <div className="draft-recovery-actions">
            <button type="button" className="draft-button draft-button--secondary" onClick={onCancelDiscard} disabled={busy}>
              取消
            </button>
            <button type="button" className="draft-button draft-button--danger" onClick={onConfirmDiscard} disabled={busy}>
              確認捨棄
            </button>
          </div>
        </div>
      ) : (
        <div className="draft-recovery-actions">
          <button
            type="button"
            className="draft-button draft-button--primary"
            data-recovery-primary={featured ? "true" : undefined}
            onClick={onContinue}
            disabled={busy}
          >
            繼續填寫
          </button>
          <button type="button" className="draft-button draft-button--discard" onClick={onRequestDiscard} disabled={busy}>
            捨棄草稿
          </button>
        </div>
      )}
    </article>
  );
}

export function DraftRecoveryGate({
  drafts,
  loading = false,
  error = null,
  onContinue,
  onRefresh,
  onDelete,
}: DraftRecoveryGateProps) {
  const [showList, setShowList] = useState(false);
  const [confirmDraftId, setConfirmDraftId] = useState<string | null>(null);
  const [busyDraftId, setBusyDraftId] = useState<string | null>(null);
  const [hiddenDraftIds, setHiddenDraftIds] = useState<string[]>([]);
  const [actionError, setActionError] = useState<string | null>(null);
  const sortedDrafts = useMemo(
    () => [...drafts]
      .filter((draft) => !hiddenDraftIds.includes(draft.draftId))
      .sort(compareDraftsByUpdatedAt),
    [drafts, hiddenDraftIds]
  );

  const continueDraft = async (draftId: string) => {
    if (busyDraftId) return;
    setBusyDraftId(draftId);
    setActionError(null);
    try {
      await onContinue(draftId);
    } catch (reason) {
      setActionError(reason instanceof Error ? reason.message : "草稿載入失敗，請再試一次。");
    } finally {
      setBusyDraftId(null);
    }
  };

  const deleteDraft = async (draftId: string) => {
    if (busyDraftId) return;
    setBusyDraftId(draftId);
    setActionError(null);
    try {
      await onDelete(draftId);
      setHiddenDraftIds((current) => [...current, draftId]);
      setConfirmDraftId(null);
    } catch (reason) {
      setActionError(reason instanceof Error ? reason.message : "草稿刪除失敗，請再試一次。");
    } finally {
      setBusyDraftId(null);
    }
  };

  if (sortedDrafts.length === 0) {
    return (
      <main className="draft-recovery-shell">
        <section className="draft-recovery-empty">
          <h1>此裝置沒有未完成草稿</h1>
          <button type="button" className="draft-button draft-button--secondary" onClick={() => void onRefresh()}>
            重新檢查
          </button>
        </section>
      </main>
    );
  }

  const visibleDrafts = showList ? sortedDrafts : [sortedDrafts[0]];

  return (
    <main className="draft-recovery-shell">
      <section className="draft-recovery-panel" aria-labelledby="draft-recovery-title">
        <div className="draft-recovery-intro">
          <div>
            <span className="draft-recovery-kicker">AA01 本機草稿</span>
            <h1 id="draft-recovery-title">找到未完成的本機草稿</h1>
            <p>請先選擇如何處理草稿，系統才會開啟評估表單。</p>
          </div>
          {sortedDrafts.length > 0 && (
            <button
              type="button"
              className="draft-button draft-button--secondary"
              onClick={() => setShowList((current) => !current)}
            >
              {showList ? "返回最近草稿" : "查看草稿清單"}
            </button>
          )}
        </div>

        {(error || actionError) && (
          <div className="draft-recovery-error" role="alert" aria-live="assertive">
            <span>{actionError ?? error}</span>
            <button type="button" className="draft-button draft-button--secondary" onClick={() => void onRefresh()}>
              重試
            </button>
          </div>
        )}

        <div className="draft-recovery-list" aria-busy={loading}>
          {visibleDrafts.map((draft, index) => (
            <DraftCard
              key={draft.draftId}
              draft={draft}
              featured={!showList && index === 0}
              busy={loading || busyDraftId !== null}
              confirmDiscard={confirmDraftId === draft.draftId}
              onContinue={() => void continueDraft(draft.draftId)}
              onRequestDiscard={() => {
                setActionError(null);
                setConfirmDraftId(draft.draftId);
              }}
              onCancelDiscard={() => setConfirmDraftId(null)}
              onConfirmDiscard={() => void deleteDraft(draft.draftId)}
            />
          ))}
        </div>
      </section>
    </main>
  );
}
