"use client";
import { ReactNode, ButtonHTMLAttributes } from "react";

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  variant?: "primary" | "secondary" | "danger" | "success";
  size?: "sm" | "md" | "lg";
  full?: boolean;
  loading?: boolean;
}

export function GameButton({
  children,
  variant = "primary",
  size = "md",
  full,
  loading,
  disabled,
  className = "",
  ...rest
}: Props) {
  const variantClass = {
    primary: "btn-primary",
    secondary: "btn-secondary",
    danger: "btn-danger",
    success: "btn-success",
  }[variant];

  const sizeClass = { sm: "btn-sm", md: "", lg: "btn-lg" }[size];

  return (
    <button
      {...rest}
      disabled={disabled || loading}
      className={`btn ${variantClass} ${sizeClass} ${full ? "btn-full" : ""} ${className}`}
    >
      {loading && <span className="spinner" />}
      {children}
    </button>
  );
}
