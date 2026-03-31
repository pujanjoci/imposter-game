"use client";
import { InputHTMLAttributes, TextareaHTMLAttributes, forwardRef } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  large?: boolean;
}

export const InputBox = forwardRef<HTMLInputElement, InputProps>(function InputBox(
  { large, className = "", ...rest },
  ref
) {
  return (
    <input
      ref={ref}
      className={`input ${large ? "input-lg" : ""} ${className}`}
      {...rest}
    />
  );
});

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {}

export const TextareaBox = forwardRef<HTMLTextAreaElement, TextareaProps>(function TextareaBox(
  { className = "", ...rest },
  ref
) {
  return (
    <textarea
      ref={ref}
      className={`input ${className}`}
      rows={3}
      style={{ resize: "none", fontFamily: "inherit" }}
      {...rest}
    />
  );
});
