import type { AA01Form, CaseType } from "../types";
import { IDENTITY_OPTIONS } from "../data/identityOptions";
import {
  resolveLegacyAssessmentDate,
  resolveLegacyCmsLevel,
  resolveLegacyIdentityType,
} from "./Step1Basic.logic";
import { StepSection } from "./common/StepSection";

function LegacyValueWarning({ id, originalValue }: {
  id: string;
  originalValue: string;
}) {
  return (
    <span id={id} className="form-error basic-data-legacy-warning" role="status">
      偵測到舊資料：{originalValue}
      <br />
      請重新選擇
    </span>
  );
}

export function Step1Basic({
  form,
  setForm,
}: {
  form: AA01Form;
  setForm: (form: AA01Form) => void;
}) {
  const update = (key: keyof AA01Form, value: string) =>
    setForm({ ...form, [key]: value });
  const assessmentDate = resolveLegacyAssessmentDate(form.assessmentDate);
  const cmsLevel = resolveLegacyCmsLevel(form.cmsLevel);
  const identityType = resolveLegacyIdentityType(form.identityType);

  return (
    <StepSection title="一、個案資料">
      <div className="form-grid">
        <label className="form-field">
          <span className="form-label">案件類型</span>
          <select
            className="form-select"
            value={form.caseType || ""}
            onChange={(e) => update("caseType", e.target.value as CaseType)}
          >
            <option value="">請選擇</option>
            <option value="新案">新案</option>
            <option value="複評">複評</option>
            <option value="半年AA01">半年AA01</option>
          </select>
        </label>

        <label className="form-field">
          <span className="form-label">案號</span>
          <input
            className="form-input"
            value={form.caseNumber || ""}
            onChange={(e) => update("caseNumber", e.target.value)}
          />
        </label>

        <label className="form-field">
          <span className="form-label">個案姓名</span>
          <input
            className="form-input"
            value={form.caseName || ""}
            onChange={(e) => update("caseName", e.target.value)}
          />
        </label>

        <label className="form-field">
          <span className="form-label">評估日期</span>
          <input
            id="assessment-date"
            name="assessmentDate"
            type="date"
            className="form-input"
            value={assessmentDate.normalizedValue}
            aria-describedby={assessmentDate.needsUserSelection ? "assessment-date-legacy" : undefined}
            onChange={(e) => update("assessmentDate", e.target.value)}
          />
          {assessmentDate.needsUserSelection && (
            <LegacyValueWarning id="assessment-date-legacy" originalValue={assessmentDate.originalValue} />
          )}
        </label>

        <label className="form-field">
          <span className="form-label">CMS等級</span>
          <select
            id="cms-level"
            name="cmsLevel"
            className="form-select"
            value={cmsLevel.normalizedValue}
            aria-describedby={cmsLevel.needsUserSelection ? "cms-level-legacy" : undefined}
            onChange={(e) => update("cmsLevel", e.target.value)}
          >
            <option value="">請選擇</option>
            {["2", "3", "4", "5", "6", "7", "8"].map((level) => (
              <option key={level} value={level}>{level}級</option>
            ))}
          </select>
          {cmsLevel.needsUserSelection && (
            <LegacyValueWarning id="cms-level-legacy" originalValue={cmsLevel.originalValue} />
          )}
        </label>

        <label className="form-field">
          <span className="form-label">身分別</span>
          <select
            id="identity-type"
            name="identityType"
            className="form-select"
            value={identityType.normalizedValue}
            aria-describedby={identityType.needsUserSelection ? "identity-type-legacy" : undefined}
            onChange={(e) => update("identityType", e.target.value)}
          >
            <option value="">請選擇</option>
            {IDENTITY_OPTIONS.map(({ value, label }) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
          {identityType.needsUserSelection && (
            <LegacyValueWarning id="identity-type-legacy" originalValue={identityType.originalValue} />
          )}
        </label>
      </div>
    </StepSection>
  );
}
