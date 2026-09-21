"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
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
    <main className="flex min-h-screen items-center justify-center bg-stone-50 px-4 py-10">
      <div className="w-full max-w-md rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
        <div className="mb-6">
          <p className="text-sm font-medium text-stone-500">
            Campus Lost & Found and Safety System
          </p>

          <h1 className="mt-1 text-3xl font-bold text-stone-900">
            Sign in
          </h1>

          <p className="mt-2 text-sm text-stone-600">
            Sign in to access campus lost and found and safety services.
          </p>
        </div>

        {errorMessage && (
          <div className="mb-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            {errorMessage}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="email"
              className="mb-1 block text-sm font-medium text-stone-700"
            >
              Email
            </label>

            <input
              id="email"
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="w-full rounded-xl border border-stone-300 px-3 py-2 outline-none transition focus:border-stone-500"
              placeholder="you@example.com"
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="mb-1 block text-sm font-medium text-stone-700"
            >
              Password
            </label>

            <input
              id="password"
              type="password"
              required
              autoComplete="current-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="w-full rounded-xl border border-stone-300 px-3 py-2 outline-none transition focus:border-stone-500"
              placeholder="Enter your password"
            />

            <div className="mt-2 text-right">
              <Link
                href="/forgot-password"
                className="text-sm text-gray-600 underline underline-offset-4 hover:text-gray-900"
              >
                Forgot password?
              </Link>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <input
              id="rememberMe"
              name="rememberMe"
              type="checkbox"
              checked={rememberMe}
              onChange={(event) => setRememberMe(event.target.checked)}
              className="h-4 w-4 rounded border-gray-300"
            />

            <label
              htmlFor="rememberMe"
              className="text-sm text-gray-700"
            >
              Remember me
            </label>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-stone-900 px-4 py-2.5 font-medium text-white transition hover:bg-stone-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? "Signing in..." : "Sign in"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-stone-600">
          Do not have an account?{" "}
          <Link
            href="/register"
            className="font-medium text-stone-900 underline"
          >
            Register
          </Link>
        </p>
      </div>
    </main>
  );
}
