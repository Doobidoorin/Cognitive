"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useSession } from "@/lib/useSession";

export default function RegisterPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const router = useRouter();
  const { refresh } = useSession();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (password !== confirm) {
      setError("Passwords don't match.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Something went wrong.");
        return;
      }
      await refresh();
      router.push("/assessment");
      router.refresh();
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto flex max-w-md flex-col items-center px-4 py-16">
      <div className="glass-panel-strong w-full p-8">
        <h1 className="text-center text-2xl font-bold text-sky-900">Create your account</h1>
        <p className="mt-2 text-center text-sm text-sky-700">
          No email required — just a username and password you can remember.
        </p>

        <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4">
          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-sky-700">
              Username
            </label>
            <input
              className="input-aero"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="3-20 characters, letters/numbers/_"
              autoComplete="username"
              required
              minLength={3}
              maxLength={20}
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-sky-700">
              Password
            </label>
            <input
              className="input-aero"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="At least 6 characters"
              autoComplete="new-password"
              required
              minLength={6}
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-sky-700">
              Confirm password
            </label>
            <input
              className="input-aero"
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              autoComplete="new-password"
              required
              minLength={6}
            />
          </div>

          {error && (
            <div className="rounded-xl bg-red-50 px-4 py-2 text-sm font-medium text-red-600">{error}</div>
          )}

          <button type="submit" disabled={submitting} className="btn-glossy mt-2 w-full">
            {submitting ? "Creating account…" : "Create account"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-sky-700">
          Already have an account?{" "}
          <Link href="/login" className="font-semibold text-sky-900 underline">
            Log in
          </Link>
        </p>
      </div>
    </div>
  );
}
