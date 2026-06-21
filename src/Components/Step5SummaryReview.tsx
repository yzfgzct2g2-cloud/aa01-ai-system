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
    <StepSection title="五、摘要確認">
      <div className="form-grid">
        {sections.map(([title, values]) => (
          <article key={title} className="field-group">
            <h3 className="field-group__title">{title}</h3>
            {values.length ? (
              <p style={{ whiteSpace: "pre-wrap" }}>{values.join("；")}</p>
            ) : (
              <EmptyState />
            )}
          </article>
        ))}

        <article className="field-group form-row">
          <h3 className="field-group__title">評估分數</h3>
          {numericAnswers.length ? (
            <ul style={{ margin: 0, paddingLeft: 20 }}>
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

        <article className="field-group form-row">
          <h3 className="field-group__title">系統問題提示</h3>
          <p className="form-help">
            以下為系統依評估結果產生之提示，仍需由個管依個案實際情況判斷。
          </p>
          {careProblems.length ? (
            <ul className="notice-list">
              {careProblems.map((problem) => (
                <li key={problem.id} className="field-group">
                  <p className="field-group__title">{problem.title}</p>
                  <p>{problem.description}</p>
                  <p className="form-help">
                    來源題目：{problem.sourceQuestionIds.join("、")}
                  </p>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState message="無系統提示" />
          )}
        </article>

        <article className="field-group form-row">
          <h3 className="field-group__title">服務需求提示</h3>
          <p className="form-help">
            僅供個管評估參考，不代表自動勾選或核定服務。
          </p>
          {serviceSuggestions.length ? (
            <ul className="notice-list">
              {serviceSuggestions.map((suggestion) => (
                <li key={suggestion.id} className="field-group">
                  <p className="field-group__title">
                    {suggestion.serviceCode} {suggestion.serviceName}
                  </p>
                  <p>{suggestion.reason}</p>
                  {suggestion.caution && (
                    <p>
                      <span className="badge badge-warning">注意</span>{" "}
                      {suggestion.caution}
                    </p>
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
