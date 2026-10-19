import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { Suspense } from "react";
import { connection } from "next/server";
import ProfileMenu from "@/app/components/ProfileMenu";
import { getCurrentUser } from "@/lib/auth";
import pool from "@/lib/db";
import {
  ArrowLeft,
  ArrowRight,
  BriefcaseBusiness,
  Building2,
  MapPin,
  Sparkles,
  UsersRound,
} from "lucide-react";

export default function RecruiterJobPage({ params }) {
  return (
    <Suspense fallback={<div>Loading job details...</div>}>
      <RecruiterJobContent params={params} />
    </Suspense>
  );
}

async function RecruiterJobContent({ params }) {
  await connection();
  const session = await getCurrentUser();

  if (!session) redirect("/login");
  if (session.role !== "recruiter") redirect("/employee/dashboard");

  const { jobId } = await params;
  if (!/^[1-9]\d*$/.test(jobId)) notFound();

  const jobResult = await pool.query(
    `SELECT id, title, company, location, job_type, description, skills, created_at
     FROM jobs
     WHERE id = $1 AND recruiter_id = $2`,
    [jobId, session.id]
  );
  const job = jobResult.rows[0];
  if (!job) notFound();

  const applicantResult = await pool.query(
    `SELECT a.id AS application_id, a.status, u.name
     FROM applications a
     JOIN users u ON u.id = a.employee_id AND u.role = 'employee'
     WHERE a.job_id = $1
     ORDER BY u.name`,
    [jobId]
  );
  const jobDescription = typeof job.description === "string"
    ? job.description.trim()
    : "";
  const descriptionPreview = jobDescription.length > 220
    ? `${jobDescription.slice(0, 220).trimEnd()}...`
    : jobDescription;
  const jobSkills = Array.isArray(job.skills)
    ? job.skills.filter((skill) => typeof skill === "string")
    : [];

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
          <ProfileMenu profileHref="/recruiter/profile" />
        </div>
      </nav>

      <section className="mx-auto max-w-5xl px-6 py-10">
        <Link
          href="/recruiter/dashboard"
          className="inline-flex items-center gap-2 text-sm font-semibold text-indigo-600 hover:underline"
        >
          <ArrowLeft size={15} aria-hidden="true" />
          Back to Dashboard
        </Link>

        <article className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="flex items-center gap-2 text-sm font-semibold text-indigo-600">
            <Building2 size={15} aria-hidden="true" />
            {job.company}
          </p>
          <div className="mt-2 flex flex-wrap items-center justify-between gap-4">
            <h1 className="text-3xl font-bold">{job.title}</h1>
            <Link
              href={`/recruiter/jobs/${job.id}/applicant-matches`}
              className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700"
            >
              <Sparkles size={16} aria-hidden="true" />
              AI Applicant Matcher
              <ArrowRight size={15} aria-hidden="true" />
            </Link>
          </div>
          <p className="mt-2 flex items-center gap-2 text-sm text-slate-600">
            <MapPin size={15} aria-hidden="true" className="text-slate-400" />
            {job.location} · {job.job_type}
          </p>
          <div className="mt-4 border-t border-slate-100 pt-4">
            {/* <h2 className="font-semibold">Job Description</h2>
            <p className="mt-1 whitespace-pre-wrap text-sm leading-6 text-slate-700">
              {descriptionPreview || "No description provided."}
            </p> */}
            {/* {jobSkills.length > 0 && (
              <p className="mt-2 line-clamp-1 text-sm text-slate-600">
                <span className="font-medium">Skills:</span>{" "}
                {jobSkills.slice(0, 5).join(", ")}
                {jobSkills.length > 5 ? ", ..." : ""}
              </p>
            )} */}
            {(descriptionPreview !== jobDescription || jobSkills.length > 5) && (
              <details className="group mt-3">
                <summary className="w-fit cursor-pointer text-sm font-semibold text-indigo-600 hover:underline">
                  Show full job details
                </summary>
                <div className="mt-3 space-y-4 rounded-lg bg-slate-50 p-4">
                  <div>
                    <h3 className="text-sm font-semibold">Full description</h3>
                    <p className="mt-1 whitespace-pre-wrap text-sm leading-6 text-slate-700">
                      {jobDescription || "No description provided."}
                    </p>
                  </div>
                  {jobSkills.length > 0 && (
                    <div>
                      <h3 className="text-sm font-semibold">All required skills</h3>
                      <p className="mt-1 text-sm text-slate-700">
                        {jobSkills.join(", ")}
                      </p>
                    </div>
                  )}
                </div>
              </details>
            )}
          </div>
        </article>

        <section aria-labelledby="applicants-title" className="mt-8">
          <h2 id="applicants-title" className="flex items-center gap-2 text-2xl font-bold">
            <UsersRound size={21} aria-hidden="true" className="text-indigo-600" />
            Applicants ({applicantResult.rows.length})
          </h2>
          {applicantResult.rows.length === 0 ? (
            <p className="mt-4 rounded-xl border border-slate-200 bg-white p-6 text-slate-600">
              No candidates have applied for this job yet.
            </p>
          ) : (
            <ul className="mt-4 space-y-4">
              {applicantResult.rows.map((applicant) => (
                <li key={applicant.application_id}>
                  <Link
                    href={`/recruiter/jobs/${job.id}/applicants/${applicant.application_id}`}
                    className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-indigo-300 hover:shadow"
                  >
                    <div className="min-w-0">
                      <h3 className="truncate text-base font-semibold">
                        {applicant.name}
                      </h3>
                      <p className="mt-1 text-sm text-slate-500">
                        Application status: {applicant.status || "pending"}
                      </p>
                    </div>
                    <span className="inline-flex shrink-0 items-center gap-1 text-xs font-semibold text-indigo-600">
                      View application
                      <ArrowRight size={13} aria-hidden="true" />
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      </section>
    </main>
  );
}
