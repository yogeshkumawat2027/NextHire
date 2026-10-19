import Link from "next/link";
import { ArrowRight, BriefcaseBusiness, Sparkles, UsersRound } from "lucide-react";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
        <Link href="/" className="inline-flex items-center gap-2 text-2xl font-bold tracking-tight text-indigo-600">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-600 text-white">
            <BriefcaseBusiness size={18} aria-hidden="true" />
          </span>
          NextHire
        </Link>

        <div className="flex items-center gap-4">
          <Link href="/login" className="font-medium text-slate-600 hover:text-indigo-600">
            Login
          </Link>
          <Link
            href="/register"
            className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 font-medium text-white hover:bg-indigo-700"
          >
            Get Started
            <ArrowRight size={16} aria-hidden="true" />
          </Link>
        </div>
      </nav>

      <section className="mx-auto max-w-6xl px-6 pb-20 pt-20 text-center sm:pt-28">
        <span className="inline-flex items-center gap-2 rounded-full bg-indigo-50 px-4 py-2 text-sm font-medium text-indigo-700">
          <Sparkles size={15} aria-hidden="true" />
          Your career starts here
        </span>

        <h1 className="mx-auto mt-7 max-w-3xl text-4xl font-bold tracking-tight sm:text-6xl">
          Find the right job.
          <span className="mt-2 block text-indigo-600">
            Build your future.
          </span>
        </h1>

        <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-slate-600">
          NextHire connects talented employees with recruiters.
          Create an account and take the next step in your career.
        </p>

        <div className="mt-9 flex flex-wrap justify-center gap-4">
          <Link
            href="/register"
            className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-6 py-3 font-semibold text-white shadow-sm hover:bg-indigo-700"
          >
            Create Account <ArrowRight size={17} aria-hidden="true" />
          </Link>
          <Link
            href="/login"
            className="rounded-lg border border-slate-300 bg-white px-6 py-3 font-semibold hover:bg-slate-100"
          >
            Login
          </Link>
        </div>

        <div className="mt-20 grid gap-6 text-left sm:grid-cols-2">
          <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
            <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-50 text-indigo-700">
              <UsersRound size={24} aria-hidden="true" />
            </div>
            <h2 className="text-xl font-bold">For Employees</h2>
            <p className="mt-3 leading-7 text-slate-600">
              Discover career opportunities and prepare for your next move.
            </p>
            <Link
              href="/register"
              className="mt-5 inline-block font-semibold text-indigo-600 hover:text-indigo-800"
            >
              Join as Employee <ArrowRight size={15} aria-hidden="true" />
            </Link>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
            <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-violet-50 text-violet-700">
              <BriefcaseBusiness size={24} aria-hidden="true" />
            </div>
            <h2 className="text-xl font-bold">For Recruiters</h2>
            <p className="mt-3 leading-7 text-slate-600">
              Connect with talent and get ready to build your team.
            </p>
            <Link
              href="/register"
              className="mt-5 inline-block font-semibold text-indigo-600 hover:text-indigo-800"
            >
              Join as Recruiter <ArrowRight size={15} aria-hidden="true" />
            </Link>
          </div>
        </div>
      </section>

     <footer className="border-t border-slate-200 px-6 py-6 text-center text-sm text-slate-500">
  © 2026 NextHire. All rights reserved.
</footer>
    </main>
  );
}