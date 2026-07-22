import { useCallback, useState } from "react";
import type { Dispatch, SetStateAction } from "react";
import { Stepper } from "./Components/Stepper";
import { AppHeader } from "./Components/common/AppHeader";
import { Step1Basic } from "./Components/Step1Basic";
import { Step2PdfImport } from "./Components/Step2PdfImport";
import { Step3Assessment } from "./Components/Step3Assessment";
import { Step4CaseProfile } from "./Components/Step4CaseProfile";
import { Step4Services } from "./Components/Step4Services";
import { Step5SummaryReview } from "./Components/Step5SummaryReview";
import { Step5Output } from "./Components/Step5Output";
import { Step6Review } from "./Components/Step6Review";
import { DraftRecoveryGate } from "./Components/DraftRecoveryGate";
import { useDraftSession } from "./hooks/useDraftSession";
import type {
  AA01Form,
  AssessmentAnswer,
  AssessmentCategorySelections,
} from "./types";
import type { DraftProgress, DraftSection } from "./persistence/draftModel";
import "./Components/DraftRecoveryGate.css";

const steps = [
  "個案資料",
  "PDF匯入",
  "評估確認",
  "個案概況",
  "服務規劃",
  "摘要確認",
  "計畫檢核",
  "AA01產出",
];

export default function App() {
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<AA01Form>({});
  const [currentSection, setCurrentSection] = useState<DraftSection | null>(null);
  const [currentQuestion, setCurrentQuestion] = useState<string | null>(null);
  const [draftProgress, setDraftProgress] = useState<DraftProgress>({
    answered: 0,
    total: 0,
    percent: 0,
  });
  const hydrateDraft = useCallback((draft: {
    form: AA01Form;
    currentStep: number;
    currentSection: DraftSection | null;
    currentQuestion: string | null;
    progress: DraftProgress;
  }) => {
    setForm(draft.form);
    setStep(draft.currentStep);
    setCurrentSection(draft.currentSection);
    setCurrentQuestion(draft.currentQuestion);
    setDraftProgress(draft.progress);
  }, []);
  const draftSession = useDraftSession({
    form,
    currentStep: step,
    currentSection,
    currentQuestion,
    progress: draftProgress,
    onHydrate: hydrateDraft,
  });
  const setAssessmentAnswers: Dispatch<
    SetStateAction<Record<string, AssessmentAnswer>>
  > = (nextAnswers) => {
    setForm((currentForm) => {
      const currentAnswers = currentForm.assessmentAnswers ?? {};
      const assessmentAnswers =
        typeof nextAnswers === "function"
          ? nextAnswers(currentAnswers)
          : nextAnswers;

      return { ...currentForm, assessmentAnswers };
    });
  };
  const setAssessmentCategorySelections: Dispatch<
    SetStateAction<AssessmentCategorySelections>
  > = (nextSelections) => {
    setForm((currentForm) => {
      const currentSelections = currentForm.assessmentCategorySelections ?? {};
      const assessmentCategorySelections = typeof nextSelections === "function"
        ? nextSelections(currentSelections)
        : nextSelections;

      return { ...currentForm, assessmentCategorySelections };
    });
  };

  const changeStep = async (nextStep: number) => {
    await draftSession.flush();
    setStep(nextStep);
  };

  if (draftSession.startupState === "checking") {
    return (
      <main className="draft-recovery-shell" aria-busy="true">
        <section className="draft-recovery-empty">
          <h1>正在檢查此裝置上的草稿…</h1>
        </section>
      </main>
    );
  }

  if (draftSession.startupState === "error") {
    return (
      <main className="draft-recovery-shell">
        <section className="draft-recovery-empty" role="alert">
          <h1>無法檢查本機草稿</h1>
          <p>{draftSession.startupError}</p>
          <button
            type="button"
            className="draft-button draft-button--primary"
            onClick={() => void draftSession.refreshDrafts()}
          >
            再試一次
          </button>
        </section>
      </main>
    );
  }

  if (draftSession.startupState === "recovery") {
    return (
      <DraftRecoveryGate
        drafts={draftSession.drafts}
        error={draftSession.startupError}
        onContinue={draftSession.continueDraft}
        onRefresh={draftSession.refreshDrafts}
        onDelete={draftSession.deleteDraft}
      />
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 p-6 text-slate-900">
      <div className="mx-auto max-w-6xl space-y-6">
        <AppHeader />

        <Stepper steps={steps} step={step} setStep={(nextStep) => void changeStep(nextStep)} />

        <div className="draft-save-status" role="status" aria-live="polite">
          {draftSession.saveState === "saving" && "正在儲存草稿…"}
          {draftSession.saveState === "saved" && `已儲存在此裝置${draftSession.lastSavedAt ? `（${new Date(draftSession.lastSavedAt).toLocaleTimeString("zh-TW")}）` : ""}`}
          {draftSession.saveState === "unsaved" && "尚有未保存內容"}
          {draftSession.saveState === "error" && (
            <>
              <span>儲存失敗，最新資料仍保留在此頁面。{draftSession.saveError}</span>
              <button type="button" onClick={() => void draftSession.retrySave()}>重試儲存</button>
            </>
          )}
        </div>

        {step === 0 && <Step1Basic form={form} setForm={setForm} />}
        {step === 1 && <Step2PdfImport form={form} setForm={setForm} />}
        {step === 2 && (
          <Step3Assessment
            assessmentAnswers={form.assessmentAnswers ?? {}}
            setAssessmentAnswers={setAssessmentAnswers}
            categorySelections={form.assessmentCategorySelections}
            setCategorySelections={setAssessmentCategorySelections}
            currentSection={currentSection}
            currentQuestion={currentQuestion}
            onSectionChange={setCurrentSection}
            onQuestionChange={setCurrentQuestion}
            onProgressChange={setDraftProgress}
          />
        )}
        {step === 3 && <Step4CaseProfile form={form} setForm={setForm} />}
        {step === 4 && <Step4Services form={form} setForm={setForm} />}
        {step === 5 && <Step5SummaryReview form={form} />}
        {step === 6 && <Step6Review form={form} />}
        {step === 7 && <Step5Output form={form} />}

        <div className="flex justify-between">
          <button disabled={step === 0} onClick={() => void changeStep(step - 1)}>
            上一步
          </button>
          <button disabled={step === steps.length - 1} onClick={() => void changeStep(step + 1)}>
            下一步
          </button>
        </div>
      </div>
    </main>
  );
}
