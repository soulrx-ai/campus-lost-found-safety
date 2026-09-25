"use client";

import AuthPreferences from "@/components/i18n/AuthPreferences";
import { AppMessage, Text } from "@/components/i18n/Text";
import { useLanguage } from "@/components/i18n/LanguageProvider";

import { FormEvent, Suspense, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

function ForgotPasswordContent() {
  const { t } = useLanguage();
  const supabase = createClient();
  const searchParams = useSearchParams();

  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const invalidTokenError =
    searchParams.get("error") === "invalid_token"
      ? "This password reset link is invalid or has expired. Please request a new one."
      : "";
  const displayedError = error || invalidTokenError;

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setMessage("");
    setError("");

    const cleanEmail = email.trim().toLowerCase();

    if (!cleanEmail) {
      setError("Please enter your email address.");
      return;
    }

    setLoading(true);

    try {
      const { error: resetError } =
        await supabase.auth.resetPasswordForEmail(cleanEmail, {
          redirectTo: `${window.location.origin}/reset-password`,
        });

      if (resetError) {
        throw resetError;
      }

      setMessage(
        "If an account exists with this email, a password reset link has been sent."
      );
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Unable to send password reset email."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-[var(--background)] px-4 py-6 sm:px-6 lg:flex lg:items-center lg:justify-center lg:p-10">
      <section className="mx-auto grid w-full max-w-5xl overflow-hidden rounded-[2rem] border border-[var(--border)] bg-[var(--surface)] shadow-[0_24px_70px_rgba(41,62,55,0.16)] lg:min-h-[580px] lg:grid-cols-[0.9fr_1.1fr]">
        <div className="order-2 px-6 py-9 sm:px-10 lg:order-1 lg:flex lg:items-center lg:px-14">
          <div className="w-full">
            <div className="mb-4">
              <AuthPreferences />
            </div>
            <div className="mb-8 flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#d9ebe4] text-lg font-bold text-[#187f7a]">
                ✦
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#187f7a]">
                  <Text id="Lost & Found" />
                </p>
                <p className="text-sm font-semibold text-[var(--foreground)]">
                  <Text id="Safety System" />
                </p>
              </div>
            </div>

            <div className="mb-7">
              <p className="text-sm font-medium text-[#187f7a]"><Text id="Account recovery" /></p>
              <h1 className="mt-2 text-3xl font-bold tracking-tight text-[var(--heading)] sm:text-4xl">
                <Text id="Reset your password" />
              </h1>
              <p className="mt-3 text-sm leading-6 text-[var(--foreground-muted)]">
                <Text id="Enter your email address and we will send a secure reset link." />
              </p>
            </div>

            {message && (
              <div className="mb-5 rounded-xl border border-[var(--success)]/30 bg-[var(--success-soft)] px-4 py-3 text-sm text-[var(--success)]">
                <AppMessage text={message} />
              </div>
            )}

            {displayedError && (
              <div className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                <AppMessage text={displayedError} />
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label htmlFor="email" className="mb-2 block text-sm font-semibold text-[var(--foreground)]">
                  <Text id="Email address" />
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder={t("you@example.com")}
                  required
                  className="w-full rounded-xl border border-[var(--border-strong)] bg-[var(--surface)] px-4 py-3 text-sm text-[var(--foreground)] outline-none transition placeholder:text-[var(--placeholder)] focus:border-[#187f7a] focus:ring-4 focus:ring-[#d9ebe4]"
                />
              </div>

              <button type="submit" disabled={loading} className="ui-button-primary w-full shadow-sm">
                {loading ? <Text id="Sending..." /> : <Text id="Send reset link" />}
              </button>
            </form>

            <div className="mt-7 text-center">
              <Link href="/login" className="text-sm font-semibold text-[#187f7a] hover:underline">
                <Text id="Back to sign in" />
              </Link>
            </div>
          </div>
        </div>

        <aside className="relative order-1 min-h-64 overflow-hidden bg-[#356d62] sm:min-h-80 lg:order-2 lg:min-h-full">
          <Image
            src="/images/auth-campus.jpg"
            alt=""
            fill
            priority
            sizes="(min-width: 1024px) 55vw, 100vw"
            className="object-cover"
          />
        </aside>
      </section>
    </main>
  );
}

export default function ForgotPasswordPage() {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-screen items-center justify-center bg-[var(--background)]">
          <p className="text-sm text-[var(--foreground-muted)]"><Text id="Loading..." /></p>
        </main>
      }
    >
      <ForgotPasswordContent />
    </Suspense>
  );
}
