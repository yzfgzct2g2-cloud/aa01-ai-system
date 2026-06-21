import { buildAssessmentSummary } from "../rules/assessmentSummary";
import { buildCareProblems } from "../rules/problemMatrix";
import { buildServiceSuggestions } from "../rules/serviceSuggestion";
import type { AA01Form } from "../types";
import { StepSection } from "./common/StepSection";
import { EmptyState } from "./common/EmptyState";

interface Step5SummaryReviewProps {
  form: AA01Form;
}

export function Step5SummaryReview({ form }: Step5SummaryReviewProps) {
  const summary = buildAssessmentSummary(
    form.assessmentAnswers ?? {}
  );
  const careProblems = buildCareProblems(form.assessmentAnswers ?? {});
  const serviceSuggestions = buildServiceSuggestions(careProblems);

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
    <StepSection title="評估摘要確認">
      <div className="grid gap-4 md:grid-cols-2">
        {sections.map(([title, values]) => (
          <article key={title} className="rounded-lg border p-4">
            <h2 className="text-lg font-bold">{title}</h2>
            {values.length ? (
              <p className="mt-2 whitespace-pre-wrap text-slate-700">
                {values.join("；")}
              </p>
            ) : (
              <EmptyState />
            )}
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
            <EmptyState />
          )}
        </article>

        <article className="rounded-lg border p-4 md:col-span-2">
          <h2 className="text-lg font-bold">系統問題提示</h2>
          <p className="mt-2 text-sm text-slate-600">
            以下為系統依評估結果產生之提示，仍需由個管依個案實際情況判斷。
          </p>
          {careProblems.length ? (
            <ul className="mt-3 space-y-3 text-slate-700">
              {careProblems.map((problem) => (
                <li key={problem.id} className="rounded-lg border p-3">
                  <strong>{problem.title}</strong>
                  <p className="mt-1">{problem.description}</p>
                  <small className="mt-1 block text-slate-500">
                    來源題目：{problem.sourceQuestionIds.join("、")}
                  </small>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState message="無系統提示" />
          )}
        </article>

        <article className="rounded-lg border p-4 md:col-span-2">
          <h2 className="text-lg font-bold">服務需求提示</h2>
          <p className="mt-2 text-sm text-slate-600">
            僅供個管評估參考，不代表自動勾選或核定服務。
          </p>
          {serviceSuggestions.length ? (
            <ul className="mt-3 space-y-3 text-slate-700">
              {serviceSuggestions.map((suggestion) => (
                <li key={suggestion.id} className="rounded-lg border p-3">
                  <strong>
                    {suggestion.serviceCode} {suggestion.serviceName}
                  </strong>
                  <p className="mt-1">{suggestion.reason}</p>
                  {suggestion.caution && (
                    <p className="mt-1 text-amber-700">注意：{suggestion.caution}</p>
                  )}
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState message="無系統提示" />
          )}
        </article>
      </div>
    </StepSection>
  );
}
