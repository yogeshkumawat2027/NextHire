"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, BriefcaseBusiness, KeyRound, Mail, UserRound, UsersRound } from "lucide-react";

export default function RegisterPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("employee");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password, role }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Registration failed.");
        return;
      }

      window.location.assign(
        data.user.role === "employee"
          ? "/employee/dashboard"
          : "/recruiter/dashboard"
      );
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  const inputClass =
    "w-full rounded-lg border border-slate-300 px-4 py-3 outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100";

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-10">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-7 shadow-sm sm:p-9">
        <Link href="/" className="inline-flex items-center gap-2 text-2xl font-bold text-indigo-600">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-600 text-white">
            <KeyRound size={18} aria-hidden="true" />
          </span>
          NextHire
        </Link>

        <h1 className="mt-7 text-3xl font-bold tracking-tight text-slate-900">
          Create your account
        </h1>
        <p className="mt-2 text-sm text-slate-500">
          Get started with NextHire today.
        </p>

        {error && (
          <p role="alert" className="mt-5 rounded-lg bg-red-50 p-3 text-sm text-red-700">
            {error}
          </p>
        )}

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label htmlFor="name" className="mb-2 flex items-center gap-2 text-sm font-medium text-slate-700">
              <UserRound size={15} aria-hidden="true" className="text-slate-400" />
              Full name
            </label>
            <input
              id="name"
              type="text"
              autoComplete="name"
              placeholder="Enter your full name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={100}
              required
              className={inputClass}
            />
          </div>

          <div>
            <label htmlFor="email" className="mb-2 flex items-center gap-2 text-sm font-medium text-slate-700">
              <Mail size={15} aria-hidden="true" className="text-slate-400" />
              Email address
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className={inputClass}
            />
          </div>

          <div>
            <label htmlFor="password" className="mb-2 flex items-center gap-2 text-sm font-medium text-slate-700">
              <KeyRound size={15} aria-hidden="true" className="text-slate-400" />
              Password
            </label>
            <input
              id="password"
              type="password"
              autoComplete="new-password"
              placeholder="At least 8 characters"
              minLength={8}
              maxLength={72}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className={inputClass}
            />
          </div>

          <div>
            <label htmlFor="role" className="mb-2 flex items-center gap-2 text-sm font-medium text-slate-700">
              {role === "employee"
                ? <UsersRound size={15} aria-hidden="true" className="text-slate-400" />
                : <BriefcaseBusiness size={15} aria-hidden="true" className="text-slate-400" />}
              I want to join as
            </label>
            <select
              id="role"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className={inputClass}
            >
              <option value="employee">Employee — Find jobs</option>
              <option value="recruiter">Recruiter — Find talent</option>
            </select>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-3 font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? "Creating account..." : "Create Account"}
            {!loading && <ArrowRight size={17} aria-hidden="true" />}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-600">
          Already have an account?{" "}
          <Link href="/login" className="font-semibold text-indigo-600 hover:underline">
            Login
          </Link>
        </p>
      </div>
    </main>
  );
}