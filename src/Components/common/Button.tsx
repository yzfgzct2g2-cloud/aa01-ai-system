import type { ButtonHTMLAttributes } from "react";
import "./common.css";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary";
}

export function Button({ variant = "secondary", className, ...props }: ButtonProps) {
  return (
    <button
      {...props}
      className={`ui-btn ui-btn--${variant}${className ? ` ${className}` : ""}`}
    />
  );
}
