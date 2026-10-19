
import { redirect } from "next/navigation";
import Link from "next/link";
import { Suspense } from "react";
import { connection } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import pool, { logDatabaseError } from "@/lib/db";
import ProfileMenu from "@/app/components/ProfileMenu";
import {
  ArrowRight,
  BriefcaseBusiness,
  Building2,
  MapPin,
  Plus,
  Sparkles,
  UsersRound,
} from "lucide-react";

export default function RecruiterDashboard() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-slate-50 p-8 text-sm text-slate-500">
          Loading dashboard...
        </main>
      }
    >
      <RecruiterDashboardContent />
    </Suspense>
  );
}

async function RecruiterDashboardContent() {
  await connection();

  const session = await getCurrentUser();

  if (!session) redirect("/login");
  if (session.role !== "recruiter") redirect("/employee/dashboard");

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex h-[68px] max-w-6xl items-center justify-between px-5 sm:px-8">
          <Link href="/" className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-600 text-white">
              <BriefcaseBusiness size={19} aria-hidden="true" />
            </span>
            <span className="text-xl font-bold tracking-tight">
              NextHire
            </span>
          </Link>

          <ProfileMenu profileHref="/recruiter/profile" />
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-5 py-8 sm:px-8 sm:py-10">
        <section className="flex flex-col justify-between gap-5 border-b border-slate-200 pb-7 sm:flex-row sm:items-center">
          <div>
            <p className="text-sm font-medium text-indigo-600">
              Recruiter workspace
            </p>
            <h1 className="mt-1.5 text-2xl font-bold tracking-tight sm:text-3xl">
              Jobs
            </h1>
            <p className="mt-2 text-sm leading-6 text-slate-500">
              Manage your job postings and review applicants.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Link
              href="/recruiter/candidate-matches"
              className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-slate-400 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
            >
              <Sparkles size={16} aria-hidden="true" />
              AI Candidate Matching
            </Link>

            <Link
              href="/recruiter/jobs/create"
              className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
            >
              <Plus size={17} aria-hidden="true" />
              Create a Job
            </Link>
          </div>
        </section>

        <section aria-labelledby="created-jobs-title" className="pt-8">
          <div className="mb-5">
            <h2
              id="created-jobs-title"
              className="text-lg font-semibold tracking-tight"
            >
              Your Created Jobs
            </h2>
            {/* <p className="mt-1 text-sm text-slate-500">
              All job postings created by you.
            </p> */}
          </div>

          <Suspense
            fallback={
              <div className="rounded-lg border border-slate-200 bg-white p-6 text-sm text-slate-500">
                Loading your jobs...
              </div>
            }
          >
            <RecruiterJobs recruiterId={session.id} />
          </Suspense>
        </section>
      </div>
    </main>
  );
}

async function RecruiterJobs({ recruiterId }) {
  let result;

  try {
    result = await pool.query(
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
  } catch (error) {
    logDatabaseError("Recruiter dashboard jobs query failed:", error);

    return (
      <div
        role="alert"
        className="rounded-lg border border-rose-200 bg-white p-6"
      >
        <p className="text-sm font-semibold text-rose-800">
          Your jobs could not be loaded.
        </p>
        <p className="mt-1 text-sm leading-6 text-slate-600">
          The database connection may be temporarily unavailable. Please try
          again.
        </p>
        <Link
          href="/recruiter/dashboard"
          className="mt-3 inline-flex items-center text-sm font-semibold text-indigo-600 hover:underline"
        >
          Retry dashboard
          <ArrowRight size={15} className="ml-1" aria-hidden="true" />
        </Link>
      </div>
    );
  }

  if (result.rows.length === 0) {
    return (
      <div className="rounded-lg border border-slate-200 bg-white px-6 py-14 text-center">
        <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100 text-slate-500">
          <Building2 size={22} aria-hidden="true" />
        </span>
        <h3 className="mt-4 text-base font-semibold">
          No jobs posted yet
        </h3>
        <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-slate-500">
          Create your first job posting to start receiving applications from
          candidates.
        </p>
        <Link
          href="/recruiter/jobs/create"
          className="mt-5 inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-700"
        >
          <Plus size={16} aria-hidden="true" />
          Create a Job
        </Link>
      </div>
    );
  }

  return (
    <>
      <div className="mb-4 flex items-center gap-2 text-sm text-slate-500">
        <BriefcaseBusiness size={16} aria-hidden="true" />
        <span>
          {result.rows.length}{" "}
          {result.rows.length === 1 ? "job posting" : "job postings"}
        </span>
      </div>

      <ul className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {result.rows.map((job) => (
          <li key={job.id}>
            <Link
              href={`/recruiter/jobs/${job.id}`}
              className="group block h-full rounded-xl border border-slate-200 bg-white p-5 transition-colors hover:border-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 sm:p-6"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <h3 className="text-base font-semibold leading-6 text-slate-900 transition-colors group-hover:text-indigo-700">
                    {job.title}
                  </h3>

                  <p className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-slate-500">
                    <span className="font-medium text-slate-700">
                      {job.company}
                    </span>
                    <span aria-hidden="true">·</span>
                    <span className="inline-flex items-center gap-1">
                      <MapPin size={13} aria-hidden="true" />
                      {job.location}
                    </span>
                  </p>
                </div>

                <span className="inline-flex shrink-0 items-center gap-1.5 rounded-md border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs font-semibold text-slate-700">
                  <UsersRound size={14} aria-hidden="true" />
                  {job.applicant_count}
                  {/* <span className="hidden sm:inline">
                    {job.applicant_count === 1 ? "applicant" : "applicants"}
                  </span> */}
                </span>
              </div>

              {/* Job type, posting date and action in one row */}
              <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4">
                <div className="flex flex-wrap items-center gap-3">
                  {job.job_type && (
                    <span className="rounded-md bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">
                      {job.job_type}
                    </span>
                  )}

                  {job.created_at && (
                    <span className="text-xs text-slate-400">
                      Posted{" "}
                      {new Date(job.created_at).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </span>
                  )}
                </div>

                <span className="inline-flex shrink-0 items-center gap-1.5 text-sm font-semibold text-indigo-600">
                  View job
                  <ArrowRight
                    size={15}
                    aria-hidden="true"
                    className="transition-transform group-hover:translate-x-0.5"
                  />
                </span>
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </>
  );
}
