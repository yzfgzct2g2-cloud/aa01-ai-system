import { useState } from "react";
import type { AA01Form } from "../types";
import { StepSection } from "./common/StepSection";
import { EmptyState } from "./common/EmptyState";
import { Button } from "./common/Button";
import { parseAssessmentText } from "../rules/pdfAssessmentParser";
import type { PdfParseResult } from "../rules/pdfAssessmentParser";

const confidenceBadge: Record<string, { label: string; className: string }> = {
  high: { label: "高", className: "badge badge-success" },
  medium: { label: "中", className: "badge badge-muted" },
  low: { label: "低", className: "badge badge-warning" },
};

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
            <Button
              variant="primary"
              disabled={!form.ocrText?.trim()}
              onClick={() => setResult(parseAssessmentText(form.ocrText || ""))}
            >
              解析評估表文字
            </Button>
          </div>
        </div>

        {result && (
          <div className="field-group">
            <p className="field-group__title">解析結果（僅供參考，不會自動套用）</p>
            <p className="form-help">
              系統僅依文字中明確出現的題號與勾選結果解析，需個管確認後才於後續階段填入評估表。
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
                  return (
                    <li key={answer.questionId} className="field-group">
                      <p>
                        <strong>{answer.questionId}</strong>：{formatCode(answer.detectedCode)}{" "}
                        <span className={badge.className}>信心 {badge.label}</span>
                      </p>
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
