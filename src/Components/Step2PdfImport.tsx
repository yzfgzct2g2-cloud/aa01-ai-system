import type { AA01Form } from "../types";

export function Step2PdfImport({
  form,
  setForm,
}: {
  form: AA01Form;
  setForm: (form: AA01Form) => void;
}) {
  return (
    <section className="rounded-xl bg-white p-6 shadow">
      <h2 className="mb-4 text-xl font-bold">二、PDF匯入</h2>

      <input
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

      {form.pdfFileName && (
        <div className="mt-4 rounded-lg bg-slate-100 p-4">
          <p>檔名：{form.pdfFileName}</p>
          <p>大小：{Math.round((form.pdfFileSize || 0) / 1024)} KB</p>

          <label>
            <input
              type="checkbox"
              checked={!!form.pdfConfirmed}
              onChange={(e) => setForm({ ...form, pdfConfirmed: e.target.checked })}
            />
            我確認這是正確案件PDF
          </label>
        </div>
      )}

      <textarea
        className="mt-4 w-full border p-3"
        rows={8}
        placeholder="OCR解析文字暫存區"
        value={form.ocrText || ""}
        onChange={(e) => setForm({ ...form, ocrText: e.target.value })}
      />
    </section>
  );
}