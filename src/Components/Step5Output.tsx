import { useState } from "react";

import type { AA01Form } from "../types";
import { buildAA01Draft } from "../rules/aa01Generator";
import { copyText } from "../utils/clipboard";
import { getBuildInfo } from "../utils/buildInfo";
import { StepSection } from "./common/StepSection";
import { Button } from "./common/Button";

export function Step5Output({ form }: { form: AA01Form }) {
  const draft = buildAA01Draft(form);
  const buildInfo = getBuildInfo();
  const [copyStatus, setCopyStatus] = useState<"idle" | "success" | "error">("idle");

  const handleCopy = async () => {
    setCopyStatus("idle");
    try {
      await copyText(draft);
      setCopyStatus("success");
    } catch {
      setCopyStatus("error");
    }
  };

  return (
    <StepSection title="七、AA01產出">
      <div className="field-group">
        <p className="field-group__title">草稿產生資訊</p>
        <p>
          產生日期：{buildInfo.date}
          {" ／ "}
          產生時間：{buildInfo.time}
        </p>
      </div>
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
          onClick={() => void handleCopy()}
        >
          複製AA01草稿
        </Button>
      </div>
      {copyStatus !== "idle" && (
        <p
          className={`notice ${copyStatus === "success" ? "notice--success" : "notice--warning"}`}
          role="status"
          aria-live={copyStatus === "success" ? "polite" : "assertive"}
        >
          {copyStatus === "success"
            ? "已複製 AA01 草稿。"
            : "複製失敗，請手動選取上方草稿內容後複製。"}
        </p>
      )}
    </StepSection>
  );
}
