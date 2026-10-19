import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { Suspense } from "react";
import { connection } from "next/server";
import LogoutButton from "@/app/components/LogoutButton";
import ApplyNowButton from "@/app/employee/dashboard/ApplyNowButton";
import { getCurrentUser } from "@/lib/auth";
import pool from "@/lib/db";
import {
  ArrowLeft,
  ArrowRight,
  BriefcaseBusiness,
  Building2,
  MapPin,
  Tags,
  UserRound,
} from "lucide-react";

export default function EmployeeJobPage({ params }) {
  return (
    <Suspense fallback={<div className="p-6">Loading job details...</div>}>
      <EmployeeJobContent params={params} />
    </Suspense>
  );
}

async function EmployeeJobContent({ params }) {
  await connection();
  const session = await getCurrentUser();

  if (!session) redirect("/login");
  if (session.role !== "employee") redirect("/recruiter/dashboard");

  const { jobId } = await params;
  if (!/^[1-9]\d*$/.test(jobId)) notFound();

  const result = await pool.query(
    `SELECT j.id, j.title, j.company, j.location, j.job_type,
            j.description, j.skills,
            EXISTS (
              SELECT 1
              FROM applications a
              WHERE a.job_id = j.id AND a.employee_id = $2
            ) AS has_applied
     FROM jobs j
     WHERE j.id = $1`,
    [jobId, session.id]
  );
  const job = result.rows[0];
  if (!job) notFound();

  const jobDescription = typeof job.description === "string"
    ? job.description.trim()
    : "";
  const jobSkills = Array.isArray(job.skills)
    ? job.skills.filter((skill) => typeof skill === "string")
    : [];

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <nav className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-5 py-4 sm:px-8">
          <Link href="/" className="inline-flex cursor-pointer items-center gap-2 text-xl font-bold text-indigo-600">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 text-white">
              <BriefcaseBusiness size={16} aria-hidden="true" />
            </span>
            NextHire
          </Link>
          <div className="flex items-center gap-3">
            <Link
              href="/employee/profile"
              className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              <UserRound size={16} aria-hidden="true" />
              Employee Profile
            </Link>
            <LogoutButton />
          </div>
        </div>
      </nav>

      <section className="mx-auto max-w-5xl px-5 py-8 sm:px-8 sm:py-10">
        <Link
          href="/employee/dashboard"
          className="inline-flex cursor-pointer items-center gap-2 text-sm font-semibold text-indigo-600 hover:underline"
        >
          <ArrowLeft size={15} aria-hidden="true" />
          Back to Jobs
        </Link>

        <article className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <p className="flex items-center gap-2 text-sm font-semibold text-indigo-600">
            <Building2 size={15} aria-hidden="true" />
            {job.company}
          </p>
          <h1 className="mt-2 text-3xl font-bold">{job.title}</h1>
          <p className="mt-3 flex flex-wrap items-center gap-2 text-sm text-slate-600">
            <MapPin size={15} aria-hidden="true" className="text-slate-400" />
            {job.location} <span aria-hidden="true">·</span> {job.job_type}
          </p>

          <section className="mt-6 border-t border-slate-100 pt-6">
            <h2 className="text-lg font-semibold">Job Description</h2>
            <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-700">
              {jobDescription || "No description provided."}
            </p>
          </section>

          <section className="mt-6 border-t border-slate-100 pt-6">
            <h2 className="flex items-center gap-2 text-lg font-semibold">
              <Tags size={17} aria-hidden="true" className="text-indigo-600" />
              Required Skills
            </h2>
            {jobSkills.length > 0 ? (
              <div className="mt-3 flex flex-wrap gap-2">
                {jobSkills.map((skill, index) => (
                  <span
                    key={`${job.id}-${index}`}
                    className="rounded-full bg-indigo-50 px-3 py-1 text-sm text-indigo-700"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            ) : (
              <p className="mt-2 text-sm text-slate-500">
                No specific skills listed.
              </p>
            )}
          </section>

          <div className="mt-7 border-t border-slate-100 pt-6">
            <ApplyNowButton
              jobId={job.id}
              alreadyApplied={job.has_applied}
            />
          </div>
        </article>
      </section>
    </main>
  );
}
