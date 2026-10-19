
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { Suspense } from "react";
import { connection } from "next/server";
import {
  ArrowLeft,
  BriefcaseBusiness,
  Building2,
  FileText,
} from "lucide-react";

import ProfileMenu from "@/app/components/ProfileMenu";
import ApplicantReport from "@/app/recruiter/applicant-matcher/ApplicantReport";
import { getCurrentUser } from "@/lib/auth";
import pool, { logDatabaseError } from "@/lib/db";

export default function RecruiterApplicantReportPage({ params }) {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-white px-6 py-10 text-sm text-slate-500">
          Loading report...
        </main>
      }
    >
      <RecruiterApplicantReportContent params={params} />
    </Suspense>
  );
}

async function RecruiterApplicantReportContent({ params }) {
  await connection();

  const session = await getCurrentUser();

  if (!session) redirect("/login");
  if (session.role !== "recruiter") redirect("/employee/dashboard");

  const { jobId, applicationId } = await params;

  if (
    !/^[1-9]\d*$/.test(jobId) ||
    !/^[1-9]\d*$/.test(applicationId)
  ) {
    notFound();
  }

  let result;

  try {
    result = await pool.query(
      `SELECT
         j.id AS job_id,
         j.title,
         j.company,
         a.id AS application_id
       FROM jobs j
       JOIN applications a ON a.job_id = j.id
       JOIN users u ON u.id = a.employee_id AND u.role = 'employee'
       WHERE j.id = $1
         AND j.recruiter_id = $2
         AND a.id = $3`,
      [jobId, session.id, applicationId]
    );
  } catch (error) {
    logDatabaseError("Recruiter applicant report lookup failed:", error);

    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50 px-5">
        <div className="w-full max-w-md rounded-lg border border-slate-200 bg-white p-7">
          <h1 className="text-lg font-semibold text-slate-900">
            Unable to load report
          </h1>
          <p className="mt-2 text-sm leading-6 text-slate-500">
            Something went wrong. Please try again.
          </p>
          <div className="mt-5 flex gap-4 text-sm font-medium">
            <Link
              href={`/recruiter/jobs/${jobId}/applicants/${applicationId}/report`}
              className="text-indigo-600 hover:text-indigo-700"
            >
              Try again
            </Link>
            <Link
              href={`/recruiter/jobs/${jobId}`}
              className="text-slate-600 hover:text-slate-900"
            >
              Back to applicants
            </Link>
          </div>
        </div>
      </main>
    );
  }

  const application = result.rows[0];

  if (!application) notFound();

  return (
    <main className="min-h-screen bg-slate-50">
      <header className="sticky top-0 z-20 border-b border-slate-200 bg-white">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-5 sm:px-8">
          <Link
            href="/recruiter/dashboard"
            className="flex items-center gap-2.5"
          >
            <span className="flex size-8 items-center justify-center rounded-md bg-indigo-600 text-white">
              <BriefcaseBusiness size={17} />
            </span>
            <span className="text-lg font-semibold tracking-tight text-slate-900">
              NextHire
            </span>
          </Link>

          <ProfileMenu profileHref="/recruiter/profile" />
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-5 py-8 sm:px-8">
        <Link
          href={`/recruiter/jobs/${application.job_id}`}
          className="inline-flex items-center gap-2 text-sm text-slate-500 transition hover:text-slate-900"
        >
          <ArrowLeft size={16} />
          Back to applicants
        </Link>

        <section className="mt-7 flex flex-col justify-between gap-5 border-b border-slate-200 pb-6 sm:flex-row sm:items-center">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
              Applicant report
            </h1>
            <p className="mt-2 text-sm text-slate-500">
              Review the candidate's evaluation and application details.
            </p>
          </div>

          <div className="flex items-center gap-3 self-start rounded-lg border border-slate-200 bg-white px-4 py-3 sm:self-center">
            <FileText size={19} className="shrink-0 text-slate-400" />
            <div className="min-w-0">
              <p className="max-w-64 truncate text-sm font-medium text-slate-800">
                {application.title}
              </p>
              {application.company && (
                <p className="mt-1 flex items-center gap-1.5 text-xs text-slate-500">
                  <Building2 size={13} />
                  {application.company}
                </p>
              )}
            </div>
          </div>
        </section>

        <section className="mt-7">
          <ApplicantReport
            jobId={String(application.job_id)}
            applicationId={String(application.application_id)}
            recruiterId={String(session.id)}
            jobTitle={application.title}
            company={application.company}
          />
        </section>
      </div>
    </main>
  );
}
