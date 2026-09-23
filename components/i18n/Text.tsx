"use client";

import { useLanguage } from "./LanguageProvider";
import { translateUiText, type TranslationKey, type TranslationParams } from "@/lib/i18n/translations";
import { displayValue } from "@/lib/i18n/display";

// Client leaves let server pages keep their queries and guards on the server.
export function Text({ id, params }: { id: TranslationKey; params?: TranslationParams }) {
  const { t } = useLanguage();
  return <>{t(id, params)}</>;
}

// For existing helper props containing known application copy, never user content.
export function UiText({ text }: { text: string }) {
  const { language } = useLanguage();
  return <>{translateUiText(language, text)}</>;
}

export function DisplayValue({ value }: { value: string }) {
  const { language } = useLanguage();
  return <>{displayValue(language, value)}</>;
}

const messagePrefixes: readonly TranslationKey[] = [
  "Image upload failed:", "Unable to submit report:", "Unable to create ticket:",
  "Unable to verify claim:", "Unable to verify item:", "Evidence upload failed:",
  "Unable to submit claim:", "Unable to submit incident:",
];

// Translate application copy, retaining any backend diagnostic suffix verbatim.
export function AppMessage({ text }: { text: string }) {
  const { language, t } = useLanguage();
  const prefix = messagePrefixes.find((candidate) => text.startsWith(candidate + " "));
  return <>{prefix ? t(prefix) + text.slice(prefix.length) : translateUiText(language, text)}</>;
}
