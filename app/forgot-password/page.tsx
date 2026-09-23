"use client";

import { FormEvent, Suspense, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

function ForgotPasswordContent() {
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
    <main className="min-h-screen bg-[#f4f1e9] px-4 py-6 sm:px-6 lg:flex lg:items-center lg:justify-center lg:p-10">
      <section className="mx-auto grid w-full max-w-5xl overflow-hidden rounded-[2rem] border border-[#d9d5c9] bg-[#fffdfa] shadow-[0_24px_70px_rgba(41,62,55,0.16)] lg:min-h-[580px] lg:grid-cols-[0.9fr_1.1fr]">
        <div className="order-2 px-6 py-9 sm:px-10 lg:order-1 lg:flex lg:items-center lg:px-14">
          <div className="w-full">
            <div className="mb-8 flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#d9ebe4] text-lg font-bold text-[#187f7a]">
                ✦
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#187f7a]">
                  Lost &amp; Found
                </p>
                <p className="text-sm font-semibold text-[#263a36]">
                  Safety System
                </p>
              </div>
            </div>

            <div className="mb-7">
              <p className="text-sm font-medium text-[#187f7a]">Account recovery</p>
              <h1 className="mt-2 text-3xl font-bold tracking-tight text-[#263a36] sm:text-4xl">
                Reset your password
              </h1>
              <p className="mt-3 text-sm leading-6 text-[#68756f]">
                Enter your email address and we will send a secure reset link.
              </p>
            </div>

            {message && (
              <div className="mb-5 rounded-xl border border-[#b9ddd5] bg-[#edf8f4] px-4 py-3 text-sm text-[#17665f]">
                {message}
              </div>
            )}

            {displayedError && (
              <div className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {displayedError}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label htmlFor="email" className="mb-2 block text-sm font-semibold text-[#354640]">
                  Email address
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="you@example.com"
                  required
                  className="w-full rounded-xl border border-[#cfd6d0] bg-white px-4 py-3 text-sm text-[#263a36] outline-none transition placeholder:text-[#9aa39f] focus:border-[#187f7a] focus:ring-4 focus:ring-[#d9ebe4]"
                />
              </div>

              <button type="submit" disabled={loading} className="w-full rounded-xl bg-[#187f7a] px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-[#106661] focus:outline-none focus:ring-4 focus:ring-[#b9ddd5] disabled:cursor-not-allowed disabled:opacity-60">
                {loading ? "Sending..." : "Send reset link"}
              </button>
            </form>

            <div className="mt-7 text-center">
              <Link href="/login" className="text-sm font-semibold text-[#187f7a] hover:underline">
                Back to sign in
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
        <main className="flex min-h-screen items-center justify-center bg-[#f4f1e9]">
          <p className="text-sm text-[#68756f]">Loading...</p>
        </main>
      }
    >
      <ForgotPasswordContent />
    </Suspense>
  );
}
