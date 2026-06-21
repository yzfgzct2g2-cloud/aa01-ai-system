import type { AA01Form } from "../types";
import { buildAA01Draft } from "../rules/aa01Generator";
import { StepSection } from "./common/StepSection";
import { Button } from "./common/Button";

export function Step5Output({ form }: { form: AA01Form }) {
  const draft = buildAA01Draft(form);

  return (
    <StepSection title="五、AA01輸出">
      <textarea className="w-full border p-3" rows={28} value={draft} readOnly />

      <Button
        variant="primary"
        className="mt-4"
        onClick={() => navigator.clipboard.writeText(draft)}
      >
        複製AA01草稿
      </Button>
    </StepSection>
  );
}