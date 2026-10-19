import Link from "next/link";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { connection } from "next/server";
import ProfileMenu from "@/app/components/ProfileMenu";
import { getCurrentUser } from "@/lib/auth";
import CandidateMatcher from "../dashboard/CandidateMatcher";
import { ArrowLeft, BriefcaseBusiness, Sparkles, UserRound } from "lucide-react";

export default function RecruiterCandidateMatchesPage() {
  return (
    <Suspense fallback={<div className="p-8">Loading candidate matching...</div>}>
      <RecruiterCandidateMatchesContent />
    </Suspense>
  );
}

async function RecruiterCandidateMatchesContent() {
  await connection();
  const session = await getCurrentUser();

  if (!session) {
    redirect("/login");
  }

  if (session.role !== "recruiter") {
    redirect("/employee/dashboard");
  }

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <nav className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Link href="/" className="inline-flex items-center gap-2 text-2xl font-bold text-indigo-600">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-600 text-white">
              <BriefcaseBusiness size={18} aria-hidden="true" />
            </span>
            NextHire
          </Link>
          <ProfileMenu profileHref="/recruiter/profile" />
        </div>
      </nav>

      <section className="mx-auto max-w-4xl px-6 py-10">
        <Link
          href="/recruiter/dashboard"
          className="inline-flex items-center gap-2 text-sm font-semibold text-indigo-600 hover:underline"
        >
          <ArrowLeft size={15} aria-hidden="true" />
          Back to Dashboard
        </Link>
        <header className="mb-6 mt-5">
          <h1 className="flex items-center gap-2 text-3xl font-bold">
            <Sparkles size={26} aria-hidden="true" className="text-indigo-600" />
            AI Candidate Matching
          </h1>
          <p className="mt-2 text-slate-600">
            Find and rank employee profiles against a job description.
          </p>
        </header>
        <CandidateMatcher />
      </section>
    </main>
  );
}
