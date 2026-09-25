"use client";

import { InputHTMLAttributes, useState } from "react";
import { useLanguage } from "@/components/i18n/LanguageProvider";

interface PasswordInputProps extends InputHTMLAttributes<HTMLInputElement> {
  id: string;
}

export default function PasswordInput({
  id,
  className = "",
  ...props
}: PasswordInputProps) {
  const [showPassword, setShowPassword] = useState(false);
  const { t } = useLanguage();
  const toggleLabel = t(showPassword ? "Hide password" : "Show password");

  return (
    <div className="relative">
      <input
        {...props}
        id={id}
        type={showPassword ? "text" : "password"}
        className={`w-full rounded-xl border border-[var(--border-strong)] bg-[var(--surface)] px-4 py-3 pr-11 text-sm text-[var(--foreground)] outline-none transition placeholder:text-[var(--placeholder)] focus:border-[#187f7a] focus:ring-4 focus:ring-[#d9ebe4] ${className}`}
      />
      <button
        type="button"
        onClick={() => setShowPassword((prev) => !prev)}
        className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-1 text-[var(--foreground-muted)] transition hover:text-[var(--foreground)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--heading)]"
        aria-label={toggleLabel}
        aria-pressed={showPassword}
        title={toggleLabel}
      >
        {showPassword ? (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-5 w-5"
          >
            <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" />
            <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68" />
            <path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61" />
            <line x1="2" x2="22" y1="2" y2="22" />
          </svg>
        ) : (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-5 w-5"
          >
            <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
            <circle cx="12" cy="12" r="3" />
          </svg>
        )}
      </button>
    </div>
  );
}
