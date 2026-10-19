import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { Suspense } from "react";
import { connection } from "next/server";
import LogoutButton from "@/app/components/LogoutButton";
import ApplicantMatcher from "@/app/recruiter/applicant-matcher/ApplicantMatcher";
import { getCurrentUser } from "@/lib/auth";
import pool from "@/lib/db";
import {
  ArrowLeft,
  BriefcaseBusiness,
  Building2,
  UserRound,
} from "lucide-react";

export default function RecruiterApplicantMatchesPage({ params }) {
  return (
    <Suspense fallback={<div className="p-8">Loading AI applicant matches...</div>}>
      <RecruiterApplicantMatchesContent params={params} />
    </Suspense>
  );
}

async function RecruiterApplicantMatchesContent({ params }) {
  await connection();
  const session = await getCurrentUser();

  if (!session) redirect("/login");
  if (session.role !== "recruiter") redirect("/employee/dashboard");

  const { jobId } = await params;
  if (!/^[1-9]\d*$/.test(jobId)) notFound();

  const jobResult = await pool.query(
    `SELECT j.id, j.title, j.company, COUNT(a.id)::int AS applicant_count
     FROM jobs j
     LEFT JOIN applications a ON a.job_id = j.id
     WHERE j.id = $1 AND j.recruiter_id = $2
     GROUP BY j.id`,
    [jobId, session.id]
  );
  const job = jobResult.rows[0];
  if (!job) notFound();

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <nav className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <Link href="/" className="inline-flex items-center gap-2 text-2xl font-bold text-indigo-600">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-600 text-white">
              <BriefcaseBusiness size={18} aria-hidden="true" />
            </span>
            NextHire
          </Link>
          <div className="flex items-center gap-3">
            <Link
              href="/recruiter/profile"
              className="inline-flex items-center gap-2 rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              <UserRound size={16} aria-hidden="true" />
              Profile
            </Link>
            <LogoutButton />
          </div>
        </div>
      </nav>

      <section className="mx-auto max-w-5xl px-6 py-6">
        <Link
          href={`/recruiter/jobs/${job.id}`}
          className="inline-flex items-center gap-2 text-sm font-semibold text-indigo-600 hover:underline"
        >
          <ArrowLeft size={15} aria-hidden="true" />
          Back to job and applicants
        </Link>

        <header className="mt-4 flex flex-wrap items-baseline gap-x-3 gap-y-1">
          <h1 className="inline-flex items-center gap-2 text-2xl font-bold">
            <Building2 size={21} aria-hidden="true" className="text-indigo-600" />
            {job.title}
          </h1>
          <p className="text-sm text-slate-500">
            {job.company} · {job.applicant_count} applicant
            {job.applicant_count === 1 ? "" : "s"}
          </p>
        </header>

        <ApplicantMatcher
          jobId={String(job.id)}
          applicantCount={job.applicant_count}
        />
      </section>
    </main>
  );
}
