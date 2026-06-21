import type { AA01Form } from "../types";
import { buildAA01Draft } from "../rules/aa01Generator";
import { StepSection } from "./common/StepSection";
import { Button } from "./common/Button";

export function Step5Output({ form }: { form: AA01Form }) {
  const draft = buildAA01Draft(form);

  return (
    <StepSection title="五、AA01輸出">
      <p className="form-help">系統產生之 AA01 草稿，請個管確認後再使用。</p>
      <textarea
        className="form-textarea"
        style={{ marginTop: 12, minHeight: 520 }}
        rows={28}
        value={draft}
        readOnly
      />

      <div className="form-actions">
        <Button
          variant="primary"
          onClick={() => navigator.clipboard.writeText(draft)}
        >
          複製AA01草稿
        </Button>
      </div>
    </StepSection>
  );
}