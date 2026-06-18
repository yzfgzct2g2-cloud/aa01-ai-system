import { useState } from "react";
import type { Dispatch, SetStateAction } from "react";
import { Stepper } from "./Components/Stepper";
import { Step1Basic } from "./Components/Step1Basic";
import { Step2PdfImport } from "./Components/Step2PdfImport";
import { Step3Assessment } from "./Components/Step3Assessment";
import { Step4Services } from "./Components/Step4Services";
import { Step5Output } from "./Components/Step5Output";
import { Step6Review } from "./Components/Step6Review";
import type { AA01Form, AssessmentAnswer } from "./types";

const steps = ["基本資料", "PDF匯入", "評估表", "服務規劃", "檢核提醒", "AA01輸出"];

export default function App() {
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<AA01Form>({});
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

  return (
    <main className="min-h-screen bg-slate-50 p-6 text-slate-900">
      <div className="mx-auto max-w-6xl space-y-6">
        <h1 className="text-3xl font-bold">AA01 AI 照顧計畫系統 V3</h1>

        <Stepper steps={steps} step={step} setStep={setStep} />

        {step === 0 && <Step1Basic form={form} setForm={setForm} />}
        {step === 1 && <Step2PdfImport form={form} setForm={setForm} />}
        {step === 2 && (
          <Step3Assessment
            assessmentAnswers={form.assessmentAnswers ?? {}}
            setAssessmentAnswers={setAssessmentAnswers}
          />
        )}
        {step === 3 && <Step4Services form={form} setForm={setForm} />}
        {step === 4 && <Step6Review form={form} />}
        {step === 5 && <Step5Output form={form} />}

        <div className="flex justify-between">
          <button disabled={step === 0} onClick={() => setStep(step - 1)}>
            上一步
          </button>
          <button disabled={step === steps.length - 1} onClick={() => setStep(step + 1)}>
            下一步
          </button>
        </div>
      </div>
    </main>
  );
}
