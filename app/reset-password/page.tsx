"use client";

import AuthPreferences from "@/components/i18n/AuthPreferences";
import { AppMessage, Text } from "@/components/i18n/Text";
import { useLanguage } from "@/components/i18n/LanguageProvider";

import { FormEvent, useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import PasswordInput from "@/components/auth/PasswordInput";

export default function ResetPasswordPage() {
  const { t } = useLanguage();
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    let isMounted = true;

    async function checkSession() {
      try {
        const {
          data: { session },
          error: sessionError,
        } = await supabase.auth.getSession();

        if (!isMounted) return;

        if (sessionError || !session) {
          setError(
            "This password reset link is invalid or has expired. Please request a new one."
          );
        }
      } catch {
        if (isMounted) {
          setError(
            "Unable to verify your password reset session. Please try again."
          );
        }
      } finally {
        if (isMounted) {
          setCheckingSession(false);
        }
      }
    }

    void checkSession();

    return () => {
      isMounted = false;
    };
  }, [supabase]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setMessage("");
    setError("");

    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);

    try {
      const { error: updateError } = await supabase.auth.updateUser({
        password,
      });

      if (updateError) {
        throw updateError;
      }

      setMessage("Your password has been updated successfully.");

      setPassword("");
      setConfirmPassword("");

      // The recovery session is only needed to update the password.
      // Clear it before returning the user to the sign-in screen.
      await supabase.auth.signOut({ scope: "local" });

      setTimeout(() => {
        router.replace("/login");
        router.refresh();
      }, 1200);
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Unable to update your password."
      );
    } finally {
      setLoading(false);
    }
  }

  if (checkingSession) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[var(--background)] px-6 py-12">
        <p className="text-sm text-[var(--foreground-muted)]"><Text id="Checking password reset session..." /></p>
      </main>
    );
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
                <Text id="Create a new password" />
              </h1>
              <p className="mt-3 text-sm leading-6 text-[var(--foreground-muted)]">
                <Text id="Choose a new password to secure your account." />
              </p>
            </div>

            {message && (
              <div className="mb-5 rounded-xl border border-[var(--success)]/30 bg-[var(--success-soft)] px-4 py-3 text-sm text-[var(--success)]">
                <AppMessage text={message} />
              </div>
            )}

            {error && (
              <div className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                <AppMessage text={error} />
              </div>
            )}

            {!error && (
              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label htmlFor="password" className="mb-2 block text-sm font-semibold text-[var(--foreground)]">
                    <Text id="New password" />
                  </label>
                  <PasswordInput
                    id="password"
                    name="password"
                    autoComplete="new-password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    placeholder={t("At least 6 characters")}
                    required
                    minLength={6}
                  />
                </div>

                <div>
                  <label htmlFor="confirmPassword" className="mb-2 block text-sm font-semibold text-[var(--foreground)]">
                    <Text id="Confirm new password" />
                  </label>
                  <PasswordInput
                    id="confirmPassword"
                    name="confirmPassword"
                    autoComplete="new-password"
                    value={confirmPassword}
                    onChange={(event) => setConfirmPassword(event.target.value)}
                    placeholder={t("Enter your new password again")}
                    required
                    minLength={6}
                  />
                </div>

                <button type="submit" disabled={loading} className="ui-button-primary w-full shadow-sm">
                  {loading ? <Text id="Updating..." /> : <Text id="Update password" />}
                </button>
              </form>
            )}

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
