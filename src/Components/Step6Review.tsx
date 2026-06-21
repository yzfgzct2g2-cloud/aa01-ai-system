import type { AA01Form } from "../types";
import { buildServiceValidationWarnings } from "../rules/serviceValidation";
import { StepSection } from "./common/StepSection";

export function Step6Review({ form }: { form: AA01Form }) {
  const warnings = buildServiceValidationWarnings(form);

  return (
    <StepSection title="六、檢核提醒">
      {warnings.length === 0 ? (
        <div className="notice notice--success">目前未偵測到明顯缺漏。</div>
      ) : (
        <div className="notice-list">
          {warnings.map((warning) => (
            <div key={warning} className="notice notice--warning">
              {warning}
            </div>
          ))}
        </div>
      )}
    </StepSection>
  );
}