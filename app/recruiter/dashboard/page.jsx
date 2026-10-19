
import { redirect } from "next/navigation";
import Link from "next/link";
import { Suspense } from "react";
import { getCurrentUser } from "@/lib/auth";
import pool from "@/lib/db";
import LogoutButton from "@/app/components/LogoutButton";
import { connection } from "next/server";
import {
  ArrowRight,
  BriefcaseBusiness,
  Building2,
  Plus,
  Sparkles,
  UserRound,
  UsersRound,
} from "lucide-react";

export default function RecruiterDashboard() {
  return (
    <Suspense fallback={<div className="p-8">Loading dashboard...</div>}>
      <RecruiterDashboardContent />
    </Suspense>
  );
}

async function RecruiterDashboardContent() {
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

      <section className="mx-auto max-w-6xl px-6 py-10">
        <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="flex items-center gap-3 text-3xl font-bold">
              {/* <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-100 text-indigo-700">
                <BriefcaseBusiness size={23} aria-hidden="true" />
              </span> */}
              Recruiter Dashboard
            </h1>
            <p className="mt-2 text-slate-600">
              Create and manage your job postings and applicants.
            </p>
          </div>

          <Link
            href="/recruiter/jobs/create"
            className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-5 py-3 font-semibold text-white hover:bg-indigo-700"
          >
            <Plus size={17} aria-hidden="true" />
            Create a Job
          </Link>
          <Link
            href="/recruiter/candidate-matches"
            className="inline-flex items-center gap-2 rounded-lg border border-indigo-600 px-5 py-3 font-semibold text-indigo-700 hover:bg-indigo-50"
          >
            <Sparkles size={17} aria-hidden="true" />
            AI Candidate Matching
          </Link>
        </div>

        <section aria-labelledby="created-jobs-title">
          <h2 id="created-jobs-title" className="mb-4 flex items-center gap-2 text-xl font-semibold">
            <Building2 size={19} aria-hidden="true" className="text-indigo-600" />
            Your Created Jobs
          </h2>
          <Suspense fallback={<p className="text-slate-600">Loading jobs...</p>}>
            <RecruiterJobs recruiterId={session.id} />
          </Suspense>
        </section>
      </section>
    </main>
  );
}

async function RecruiterJobs({ recruiterId }) {
  const result = await pool.query(
    `SELECT
       j.id,
       j.title,
       j.company,
       j.location,
       j.job_type,
       j.created_at,
       COUNT(a.id)::int AS applicant_count
     FROM jobs j
     LEFT JOIN applications a ON a.job_id = j.id
     WHERE j.recruiter_id = $1
     GROUP BY j.id
     ORDER BY j.created_at DESC`,
    [recruiterId]
  );

  if (result.rows.length === 0) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-8 text-center">
        <p className="font-medium">You haven&apos;t created any jobs yet.</p>
        <p className="mt-2 text-sm text-slate-600">
          Create a job to start receiving applications.
        </p>
      </div>
    );
  }

  return (
    <ul className="grid gap-4 md:grid-cols-2">
      {result.rows.map((job) => (
        <li key={job.id}>
          <Link
            href={`/recruiter/jobs/${job.id}`}
            className="block rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-indigo-300 hover:shadow"
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h3 className="text-lg font-semibold text-slate-900">
                  {job.title}
                </h3>
                <p className="mt-1 text-sm text-slate-600">
                  {job.company} · {job.location}
                </p>
              </div>

              <span className="inline-flex items-center gap-1.5 rounded-full bg-indigo-50 px-3 py-1 text-sm font-semibold text-indigo-700">
                <UsersRound size={14} aria-hidden="true" />
                {job.applicant_count}{" "}
                {job.applicant_count === 1 ? "applicant" : "applicants"}
              </span>
            </div>

            <p className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-indigo-600">
              View job and applicants
              <ArrowRight size={15} aria-hidden="true" />
            </p>
          </Link>
        </li>
      ))}
    </ul>
  );
}
