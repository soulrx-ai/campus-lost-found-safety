"use client";

import AuthPreferences from "@/components/i18n/AuthPreferences";
import { AppMessage, Text } from "@/components/i18n/Text";
import { useLanguage } from "@/components/i18n/LanguageProvider";

import { FormEvent, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import PasswordInput from "@/components/auth/PasswordInput";

export default function RegisterPage() {
  const { t } = useLanguage();
  const router = useRouter();
  const supabase = createClient();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [errorMessage, setErrorMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setErrorMessage("");

    const cleanFullName = fullName.trim();
    const cleanEmail = email.trim();

    if (!cleanFullName) {
      setErrorMessage("Full name is required.");
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage("Passwords do not match.");
      return;
    }

    if (password.length < 6) {
      setErrorMessage(
        "Password must contain at least 6 characters."
      );
      return;
    }

    setLoading(true);

    try {
      const { data, error } =
        await supabase.auth.signUp({
          email: cleanEmail,
          password,
          options: {
            data: {
              full_name: cleanFullName,
            },
          },
        });

      if (error) {
        setErrorMessage(error.message);
        return;
      }

      if (!data.user) {
        setErrorMessage(
          "Unable to create account."
        );
        return;
      }

      router.push("/login");
      router.refresh();
    } catch {
      setErrorMessage(
        "Something went wrong. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-[var(--background)] px-4 py-6 sm:px-6 lg:flex lg:items-center lg:justify-center lg:p-10">
      <section className="mx-auto grid w-full max-w-5xl overflow-hidden rounded-[2rem] border border-[var(--border)] bg-[var(--surface)] shadow-[0_24px_70px_rgba(41,62,55,0.16)] lg:min-h-[650px] lg:grid-cols-[0.9fr_1.1fr]">
        <div className="order-2 px-6 py-9 sm:px-10 lg:order-1 lg:flex lg:items-center lg:px-14">
          <div className="w-full">
            <div className="mb-4">
              <AuthPreferences />
            </div>
            <div className="mb-7 flex items-center gap-3">
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

            <div className="mb-6">
              <p className="text-sm font-medium text-[#187f7a]"><Text id="Join the community" /></p>
              <h1 className="mt-2 text-3xl font-bold tracking-tight text-[var(--foreground)] sm:text-4xl">
                <Text id="Create your account" />
              </h1>
              <p className="mt-3 text-sm leading-6 text-[var(--foreground-muted)]">
                <Text id="Start using campus services with a safer, simpler way to report and recover belongings." />
              </p>
            </div>

            {errorMessage && (
              <div className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                <AppMessage text={errorMessage} />
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="fullName" className="mb-2 block text-sm font-semibold text-[var(--foreground)]">
                  <Text id="Full name" />
                </label>
                <input
                  id="fullName"
                  type="text"
                  required
                  autoComplete="name"
                  value={fullName}
                  onChange={(event) => setFullName(event.target.value)}
                  className="w-full rounded-xl border border-[var(--border-strong)] bg-[var(--surface)] px-4 py-3 text-sm text-[var(--foreground)] outline-none transition placeholder:text-[var(--placeholder)] focus:border-[#187f7a] focus:ring-4 focus:ring-[#d9ebe4]"
                  placeholder={t("Your full name")}
                />
              </div>

              <div>
                <label htmlFor="email" className="mb-2 block text-sm font-semibold text-[var(--foreground)]">
                  <Text id="Email address" />
                </label>
                <input
                  id="email"
                  type="email"
                  required
                  autoComplete="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  className="w-full rounded-xl border border-[var(--border-strong)] bg-[var(--surface)] px-4 py-3 text-sm text-[var(--foreground)] outline-none transition placeholder:text-[var(--placeholder)] focus:border-[#187f7a] focus:ring-4 focus:ring-[#d9ebe4]"
                  placeholder={t("you@example.com")}
                />
              </div>

              <div>
                <label htmlFor="password" className="mb-2 block text-sm font-semibold text-[var(--foreground)]">
                  <Text id="Password" />
                </label>
                <PasswordInput
                  id="password"
                  required
                  minLength={6}
                  autoComplete="new-password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder={t("At least 6 characters")}
                />
              </div>

              <div>
                <label htmlFor="confirmPassword" className="mb-2 block text-sm font-semibold text-[var(--foreground)]">
                  <Text id="Confirm password" />
                </label>
                <PasswordInput
                  id="confirmPassword"
                  required
                  minLength={6}
                  autoComplete="new-password"
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  placeholder={t("Enter your password again")}
                />
              </div>

              <button type="submit" disabled={loading} className="w-full rounded-xl bg-[#187f7a] px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-[#106661] focus:outline-none focus:ring-4 focus:ring-[#b9ddd5] disabled:cursor-not-allowed disabled:opacity-60">
                {loading ? <Text id="Creating account..." /> : <Text id="Create account" />}
              </button>
            </form>

            <p className="mt-6 text-center text-sm text-[var(--foreground-muted)]">
              <Text id="Already have an account?" />{" "}
              <Link href="/login" className="font-semibold text-[#187f7a] hover:underline">
                <Text id="Sign in" />
              </Link>
            </p>
          </div>
        </div>

        <aside className="relative order-1 min-h-64 overflow-hidden bg-[#356d62] p-7 text-white sm:min-h-80 lg:order-2 lg:min-h-full lg:p-12">
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
