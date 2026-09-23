"use client";

import { useLanguage } from "./LanguageProvider";

export default function LanguageControl({ compact = false }: { compact?: boolean }) {
  const { language, setLanguage, t } = useLanguage();
  return (
    <button
      type="button"
      aria-label={t(language === "en" ? "Switch to Thai" : "Switch to English")}
      onClick={() => setLanguage(language === "en" ? "th" : "en")}
      className={compact
        ? "inline-flex min-h-10 items-center gap-3 rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm text-[var(--foreground)] transition hover:bg-[var(--surface-soft)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--primary)]"
        : "flex min-h-11 w-full items-center justify-between gap-3 border-b border-[var(--border)] px-4 py-3 text-left text-sm text-[var(--foreground)] transition hover:bg-[var(--surface-soft)] focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[var(--primary)]"}
    >
      <span>{t("Language")}</span>
      <span lang={language} className="shrink-0 text-xs font-medium text-[var(--foreground-muted)]">
        {language === "en" ? "English" : "ไทย"}
      </span>
    </button>
  );
}
