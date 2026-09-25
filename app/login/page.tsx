"use client";

import AuthPreferences from "@/components/i18n/AuthPreferences";
import { AppMessage, Text } from "@/components/i18n/Text";
import { useLanguage } from "@/components/i18n/LanguageProvider";

import { FormEvent, useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import PasswordInput from "@/components/auth/PasswordInput";

export default function LoginPage() {
  const { t } = useLanguage();
  const router = useRouter();
  const supabase = createClient();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const rememberedEmail = window.localStorage.getItem(
      "campus-remembered-email"
    );

    if (rememberedEmail) {
      const animationFrame = window.requestAnimationFrame(() => {
        setEmail(rememberedEmail);
        setRememberMe(true);
      });

      return () => window.cancelAnimationFrame(animationFrame);
    }
  }, []);

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setLoading(true);
    setErrorMessage("");

    try {
      const { data, error } =
        await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });

      if (error || !data.user) {
        setErrorMessage(
          error?.message ?? "Unable to sign in."
        );
        return;
      }

      const {
        data: profile,
        error: profileError,
      } = await supabase
        .from("profiles")
        .select("role, status")
        .eq("id", data.user.id)
        .single();

      if (profileError || !profile) {
        await supabase.auth.signOut();

        setErrorMessage(
          "Your account profile could not be loaded. Please contact an administrator."
        );
        return;
      }

      if (profile.status !== "ACTIVE") {
        await supabase.auth.signOut();

        setErrorMessage(
          "Your account is inactive. Please contact an administrator."
        );
        return;
      }

      if (rememberMe) {
        window.localStorage.setItem(
          "campus-remembered-email",
          email.trim().toLowerCase()
        );
      } else {
        window.localStorage.removeItem("campus-remembered-email");
      }

      router.replace("/");
      router.refresh();
    } catch {
      await supabase.auth.signOut();

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
              <p className="text-sm font-medium text-[#187f7a]"><Text id="Welcome back" /></p>
              <h1 className="mt-2 text-3xl font-bold tracking-tight text-[var(--foreground)] sm:text-4xl">
                <Text id="Sign in to your account" />
              </h1>
              <p className="mt-3 text-sm leading-6 text-[var(--foreground-muted)]">
                <Text id="Access campus lost & found and safety services in one place." />
              </p>
            </div>

            {errorMessage && (
              <div className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                <AppMessage text={errorMessage} />
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
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
                <div className="mb-2 flex items-center justify-between gap-4">
                  <label htmlFor="password" className="text-sm font-semibold text-[var(--foreground)]">
                    <Text id="Password" />
                  </label>
                  <Link href="/forgot-password" className="text-xs font-semibold text-[#187f7a] hover:text-[#106661] hover:underline">
                    <Text id="Forgot password?" />
                  </Link>
                </div>
                <PasswordInput
                  id="password"
                  required
                  autoComplete="current-password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder={t("Enter your password")}
                />
              </div>

              <label htmlFor="rememberMe" className="flex w-fit cursor-pointer items-center gap-2 text-sm text-[var(--foreground-muted)]">
                <input
                  id="rememberMe"
                  name="rememberMe"
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(event) => setRememberMe(event.target.checked)}
                  className="h-4 w-4 rounded border-[var(--border-strong)] accent-[#187f7a]"
                />
                <Text id="Remember me" />
              </label>

              <button type="submit" disabled={loading} className="w-full rounded-xl bg-[#187f7a] px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-[#106661] focus:outline-none focus:ring-4 focus:ring-[#b9ddd5] disabled:cursor-not-allowed disabled:opacity-60">
                {loading ? <Text id="Signing in..." /> : <Text id="Sign in" />}
              </button>
            </form>

            <p className="mt-7 text-center text-sm text-[var(--foreground-muted)]">
              <Text id="Don't have an account?" />{" "}
              <Link href="/register" className="font-semibold text-[#187f7a] hover:underline">
                <Text id="Create an account" />
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
