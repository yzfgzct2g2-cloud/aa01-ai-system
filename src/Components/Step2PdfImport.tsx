import { useState } from "react";
import type { AA01Form } from "../types";
import { StepSection } from "./common/StepSection";
import { EmptyState } from "./common/EmptyState";
import { Button } from "./common/Button";
import { parseAssessmentText } from "../rules/pdfAssessmentParser";
import type { PdfParseResult } from "../rules/pdfAssessmentParser";
import { applyParsedAssessment, hasAnswerValue } from "../rules/applyParsedAssessment";

const confidenceBadge: Record<string, { label: string; className: string }> = {
  high: { label: "高", className: "badge badge-success" },
  medium: { label: "中", className: "badge badge-muted" },
  low: { label: "低", className: "badge badge-warning" },
};

interface ApplySummary {
  applied: number;
  skipped: number;
  conflicts: number;
}

function formatCode(detectedCode: string | string[] | number | "") {
  if (Array.isArray(detectedCode)) return detectedCode.join("、");
  return detectedCode === "" ? "（無）" : String(detectedCode);
}

export function Step2PdfImport({
  form,
  setForm,
}: {
  form: AA01Form;
  setForm: (form: AA01Form) => void;
}) {
  const [result, setResult] = useState<PdfParseResult | null>(null);
  const [checkedIds, setCheckedIds] = useState<Set<string>>(new Set());
  const [applySummary, setApplySummary] = useState<ApplySummary | null>(null);

  const existingAnswers = form.assessmentAnswers ?? {};
  const hasExisting = (questionId: string) =>
    hasAnswerValue(existingAnswers[questionId]);

  const handleParse = () => {
    const parsed = parseAssessmentText(form.ocrText || "");
    const autoChecked = new Set(
      parsed.parsedAnswers
        .filter(
          (answer) =>
            (answer.confidence === "high" || answer.confidence === "medium") &&
            !answer.warning &&
            !hasExisting(answer.questionId)
        )
        .map((answer) => answer.questionId)
    );
    setResult(parsed);
    setCheckedIds(autoChecked);
    setApplySummary(null);
  };

  const toggle = (questionId: string) => {
    setCheckedIds((current) => {
      const next = new Set(current);
      if (next.has(questionId)) next.delete(questionId);
      else next.add(questionId);
      return next;
    });
  };

  const handleApply = () => {
    if (!result) return;
    const selected = result.parsedAnswers.filter((answer) =>
      checkedIds.has(answer.questionId)
    );
    const applied = applyParsedAssessment(existingAnswers, selected);
    setForm({ ...form, assessmentAnswers: applied.assessmentAnswers });
    setApplySummary({
      applied: applied.applied.length,
      skipped: applied.skipped.length,
      conflicts: applied.conflicts.length,
    });
  };

  const checkedCount = result
    ? result.parsedAnswers.filter((answer) => checkedIds.has(answer.questionId)).length
    : 0;

  return (
    <StepSection title="二、PDF匯入">
      <div className="field-list">
        <div className="form-field">
          <span className="form-label">選擇照專評估表 PDF</span>
          <input
            className="file-input"
            type="file"
            accept="application/pdf"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (!file) return;

              setForm({
                ...form,
                pdfFileName: file.name,
                pdfFileSize: file.size,
                pdfConfirmed: false,
              });
            }}
          />
          <p className="form-help">匯入後請確認為正確案件，OCR 解析將於後續階段提供。</p>
        </div>

        {form.pdfFileName ? (
          <div className="field-group">
            <p className="field-group__title">已選檔案</p>
            <p>檔名：{form.pdfFileName}</p>
            <p>大小：{Math.round((form.pdfFileSize || 0) / 1024)} KB</p>

            <label className="inline-field">
              <input
                type="checkbox"
                checked={!!form.pdfConfirmed}
                onChange={(e) => setForm({ ...form, pdfConfirmed: e.target.checked })}
              />
              我確認這是正確案件PDF
              {form.pdfConfirmed && <span className="badge badge-success">已確認</span>}
            </label>
          </div>
        ) : (
          <EmptyState message="尚未匯入 PDF" />
        )}

        <div className="form-field">
          <span className="form-label">評估表文字（暫貼上 PDF 文字內容）</span>
          <textarea
            className="form-textarea"
            rows={8}
            placeholder="本階段請先貼上 PDF 轉出的純文字內容，例如：C1 1 清醒"
            value={form.ocrText || ""}
            onChange={(e) => setForm({ ...form, ocrText: e.target.value })}
          />
          <div className="form-actions">
            <Button variant="primary" disabled={!form.ocrText?.trim()} onClick={handleParse}>
              解析評估表文字
            </Button>
          </div>
        </div>

        {result && (
          <div className="field-group">
            <p className="field-group__title">解析結果確認（勾選後才會套用）</p>
            <p className="form-help">
              系統僅依文字中明確出現的題號與勾選結果解析。預設勾選信心高/中且無衝突的項目，
              已有人工答案者不會被覆蓋。請確認後再套用至評估表。
            </p>

            <p>
              已辨識題目：
              <span className="badge badge-success">{result.parsedAnswers.length}</span>
              {" ／ "}
              待人工確認：
              <span className="badge badge-warning">{result.unresolvedItems.length}</span>
            </p>

            {result.parsedAnswers.length ? (
              <ul className="notice-list">
                {result.parsedAnswers.map((answer) => {
                  const badge = confidenceBadge[answer.confidence];
                  const conflict = hasExisting(answer.questionId);
                  return (
                    <li key={answer.questionId} className="field-group">
                      <label className="inline-field">
                        <input
                          type="checkbox"
                          checked={checkedIds.has(answer.questionId)}
                          disabled={conflict}
                          onChange={() => toggle(answer.questionId)}
                        />
                        <strong>{answer.questionId}</strong>：{formatCode(answer.detectedCode)}{" "}
                        <span className={badge.className}>信心 {badge.label}</span>
                        {conflict && (
                          <span className="badge badge-warning">已有答案，將略過</span>
                        )}
                      </label>
                      {answer.warning && (
                        <p>
                          <span className="badge badge-warning">注意</span> {answer.warning}
                        </p>
                      )}
                      <p className="form-help">來源：{answer.sourceText}</p>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <EmptyState message="尚未辨識到任何題目" />
            )}

            <div className="form-actions">
              <Button
                variant="primary"
                disabled={checkedCount === 0}
                onClick={handleApply}
              >
                套用至評估表（已勾選 {checkedCount} 筆）
              </Button>
            </div>

            {applySummary && (
              <p>
                已套用：
                <span className="badge badge-success">{applySummary.applied}</span>
                {" ／ "}
                跳過：<span className="badge badge-muted">{applySummary.skipped}</span>
                {" ／ "}
                衝突：<span className="badge badge-warning">{applySummary.conflicts}</span>
              </p>
            )}

            <p className="field-group__title">待人工確認項目</p>
            {result.unresolvedItems.length ? (
              <ul className="notice-list">
                {result.unresolvedItems.map((item) => (
                  <li key={item} className="notice notice--warning">
                    {item}
                  </li>
                ))}
              </ul>
            ) : (
              <EmptyState message="無待確認項目" />
            )}

            <p className="field-group__title">原始文字預覽（前 1000 字）</p>
            <textarea
              className="form-textarea"
              rows={6}
              value={result.rawTextPreview}
              readOnly
            />
          </div>
        )}
      </div>
    </StepSection>
  );
}
