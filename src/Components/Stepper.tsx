import "./common/common.css";

export function Stepper({
  steps,
  step,
  setStep,
}: {
  steps: string[];
  step: number;
  setStep: (step: number) => void;
}) {
  return (
    <nav className="stepper" aria-label="流程步驟">
      {steps.map((label, index) => {
        const status =
          index === step ? "active" : index < step ? "done" : "pending";

        return (
          <button
            key={label}
            type="button"
            className={`stepper-item stepper-item--${status}`}
            aria-current={index === step ? "step" : undefined}
            onClick={() => setStep(index)}
          >
            <span className="stepper-index">
              {index < step ? "✓" : index + 1}
            </span>
            <span className="stepper-label">{label}</span>
          </button>
        );
      })}
    </nav>
  );
}
