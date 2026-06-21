import type { AA01Form } from "../types";
import { StepSection } from "./common/StepSection";
import { EmptyState } from "./common/EmptyState";

export function Step2PdfImport({
  form,
  setForm,
}: {
  form: AA01Form;
  setForm: (form: AA01Form) => void;
}) {
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
          <span className="form-label">OCR 解析文字（暫存區）</span>
          <textarea
            className="form-textarea"
            rows={8}
            placeholder="OCR解析文字暫存區"
            value={form.ocrText || ""}
            onChange={(e) => setForm({ ...form, ocrText: e.target.value })}
          />
        </div>
      </div>
    </StepSection>
  );
}