import type { ReactNode } from "react";
import "./common.css";

interface StepSectionProps {
  title: string;
  children: ReactNode;
}

export function StepSection({ title, children }: StepSectionProps) {
  return (
    <section className="step-section">
      <h2 className="step-section__title">{title}</h2>
      {children}
    </section>
  );
}
