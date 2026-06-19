import { buildAssessmentSummary } from "../rules/assessmentSummary";
import type { AA01Form } from "../types";

interface Step5SummaryReviewProps {
  form: AA01Form;
}

export function Step5SummaryReview({ form }: Step5SummaryReviewProps) {
  const summary = buildAssessmentSummary(
    form.assessmentAnswers ?? {}
  );

  const sections = [
    ["溝通能力", summary.communicationSummary],
    ["短期記憶", summary.memorySummary],
    ["ADLs", summary.adlSummary],
    ["IADLs", summary.iadlSummary],
    ["特殊複雜照護需求", summary.healthSummary],
    ["居家環境與社會參與", summary.environmentSummary],
    ["情緒與行為", summary.behaviorSummary],
  ] as const;

  const numericAnswers = Object.entries(summary.numericAnswers);

  return (
    <section className="space-y-6 rounded-xl bg-white p-6 shadow">
      <h1 className="text-2xl font-bold">評估摘要確認</h1>

      <div className="grid gap-4 md:grid-cols-2">
        {sections.map(([title, values]) => (
          <article key={title} className="rounded-lg border p-4">
            <h2 className="text-lg font-bold">{title}</h2>
            <p className="mt-2 whitespace-pre-wrap text-slate-700">
              {values.length ? values.join("；") : "無資料"}
            </p>
          </article>
        ))}

        <article className="rounded-lg border p-4 md:col-span-2">
          <h2 className="text-lg font-bold">評估分數</h2>
          {numericAnswers.length ? (
            <ul className="mt-2 space-y-1 text-slate-700">
              {numericAnswers.map(([questionId, value]) => (
                <li key={questionId}>
                  {questionId}：{value}
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-2 text-slate-700">無資料</p>
          )}
        </article>
      </div>
    </section>
  );
}
