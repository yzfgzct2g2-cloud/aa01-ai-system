import type { AA01Form, CaseType } from "../types";
import { StepSection } from "./common/StepSection";

export function Step1Basic({
  form,
  setForm,
}: {
  form: AA01Form;
  setForm: (form: AA01Form) => void;
}) {
  const update = (key: keyof AA01Form, value: string) =>
    setForm({ ...form, [key]: value });

  return (
    <StepSection title="一、基本資料">
      <div className="grid gap-4 md:grid-cols-2">
        <label>
          案件類型
          <select
            value={form.caseType || ""}
            onChange={(e) => update("caseType", e.target.value as CaseType)}
          >
            <option value="">請選擇</option>
            <option value="新案">新案</option>
            <option value="複評">複評</option>
            <option value="半年AA01">半年AA01</option>
          </select>
        </label>

        <label>
          個案姓名
          <input value={form.caseName || ""} onChange={(e) => update("caseName", e.target.value)} />
        </label>

        <label>
          評估日期
          <input value={form.assessmentDate || ""} onChange={(e) => update("assessmentDate", e.target.value)} />
        </label>

        <label>
          CMS等級
          <input value={form.cmsLevel || ""} onChange={(e) => update("cmsLevel", e.target.value)} />
        </label>

        <label>
          身分別
          <input value={form.identityType || ""} onChange={(e) => update("identityType", e.target.value)} />
        </label>
      </div>
    </StepSection>
  );
}