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
    <div className="flex gap-2">
      {steps.map((label, index) => (
        <button
          key={label}
          onClick={() => setStep(index)}
          className={index === step ? "font-bold" : ""}
        >
          {index + 1}. {label}
        </button>
      ))}
    </div>
  );
}