import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { Suspense } from "react";
import { connection } from "next/server";
import LogoutButton from "@/app/components/LogoutButton";
import { getCurrentUser } from "@/lib/auth";
import { getResumeDisplayName } from "@/lib/resume";
import pool from "@/lib/db";
import {
  ArrowLeft,
  BriefcaseBusiness,
  Download,
  FileText,
  Mail,
  MapPin,
  UserRound,
} from "lucide-react";

export default function RecruiterApplicantPage({ params }) {
  return (
    <Suspense fallback={<div>Loading candidate details...</div>}>
      <RecruiterApplicantContent params={params} />
    </Suspense>
  );
}

async function RecruiterApplicantContent({ params }) {
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

  const result = await pool.query(
    `SELECT j.id AS job_id, j.title AS job_title,
            a.id AS application_id, a.status,
            u.name, u.email,
            ep.skills, ep.experience_years,
            ep.preferred_location, ep.preferred_job_type,
            ep.resume_path
     FROM applications a
     JOIN jobs j ON j.id = a.job_id AND j.recruiter_id = $1
     JOIN users u ON u.id = a.employee_id AND u.role = 'employee'
     LEFT JOIN employee_profiles ep ON ep.user_id = u.id
     WHERE j.id = $2 AND a.id = $3`,
    [session.id, jobId, applicationId]
  );

  const applicant = result.rows[0];
  if (!applicant) notFound();

  const resumeDownloadUrl = applicant.resume_path
    ? `/api/recruiter/jobs/${jobId}/applicants/${applicationId}/resume`
    : null;

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

      <section className="mx-auto max-w-5xl px-6 py-10">
        <Link
          href={`/recruiter/jobs/${jobId}`}
          className="inline-flex items-center gap-2 text-sm font-semibold text-indigo-600 hover:underline"
        >
          <ArrowLeft size={15} aria-hidden="true" />
          Back to applicants
        </Link>

        <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-sm font-semibold text-indigo-600">
                Applicant for {applicant.job_title}
              </p>
              <h1 className="mt-2 flex items-center gap-2 text-3xl font-bold">
                <UserRound size={25} aria-hidden="true" className="text-indigo-600" />
                {applicant.name}
              </h1>
              <a
                href={`mailto:${applicant.email}`}
                className="mt-2 inline-flex items-center gap-2 text-indigo-600 hover:underline"
              >
                <Mail size={15} aria-hidden="true" />
                {applicant.email}
              </a>
            </div>
            <span className="rounded-full bg-amber-50 px-3 py-1 text-sm font-semibold capitalize text-amber-800">
              {applicant.status || "pending"}
            </span>
          </div>

          <dl className="mt-7 grid gap-5 border-t border-slate-100 pt-6 sm:grid-cols-2">
            <div>
              <dt className="flex items-center gap-2 text-sm text-slate-500">
                <BriefcaseBusiness size={15} aria-hidden="true" />
                Skills
              </dt>
              <dd className="mt-1 font-medium">
                {applicant.skills?.length
                  ? applicant.skills.join(", ")
                  : "Not provided"}
              </dd>
            </div>
            <div>
              <dt className="flex items-center gap-2 text-sm text-slate-500">
                <BriefcaseBusiness size={15} aria-hidden="true" />
                Experience
              </dt>
              <dd className="mt-1 font-medium">
                {applicant.experience_years ?? 0} years
              </dd>
            </div>
            <div>
              <dt className="flex items-center gap-2 text-sm text-slate-500">
                <MapPin size={15} aria-hidden="true" />
                Preferred location
              </dt>
              <dd className="mt-1 font-medium">
                {applicant.preferred_location || "Not provided"}
              </dd>
            </div>
            <div>
              <dt className="flex items-center gap-2 text-sm text-slate-500">
                <BriefcaseBusiness size={15} aria-hidden="true" />
                Preferred job type
              </dt>
              <dd className="mt-1 font-medium">
                {applicant.preferred_job_type || "Not provided"}
              </dd>
            </div>
          </dl>

          <div className="mt-7 border-t border-slate-100 pt-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="flex items-center gap-2 font-semibold">
                <FileText size={17} aria-hidden="true" className="text-indigo-600" />
                Resume
              </h2>
              {resumeDownloadUrl && (
                <a
                  href={resumeDownloadUrl}
                  className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700"
                >
                  <Download size={16} aria-hidden="true" />
                  Download Resume
                </a>
              )}
            </div>
            {resumeDownloadUrl ? (
              <div className="mt-3 space-y-3">
                <p className="text-sm text-slate-600">
                  {getResumeDisplayName(applicant.resume_path) || "Resume.pdf"}
                </p>
                <iframe
                  title={`${applicant.name}'s resume`}
                  src={`${resumeDownloadUrl}?preview=1`}
                  className="h-[70vh] min-h-[480px] w-full rounded-xl border border-slate-300 bg-slate-100"
                />
              </div>
            ) : (
              <p className="mt-2 text-sm text-slate-600">
                This candidate has not uploaded a resume.
              </p>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}
