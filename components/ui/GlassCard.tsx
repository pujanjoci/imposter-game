"use client";
import { ReactNode, CSSProperties } from "react";

interface Props {
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
  elevated?: boolean;
  onClick?: () => void;
}

export function GlassCard({ children, className = "", style, elevated, onClick }: Props) {
  return (
    <div
      onClick={onClick}
      className={`${elevated ? "glass-elevated" : "glass-card"} ${className}`}
      style={{ padding: "1.5rem", ...style }}
    >
      {children}
    </div>
  );
}
