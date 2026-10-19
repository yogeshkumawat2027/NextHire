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

export default function RecruiterCandidatePage({ params }) {
  return (
    <Suspense fallback={<div className="p-8">Loading candidate profile...</div>}>
      <RecruiterCandidateContent params={params} />
    </Suspense>
  );
}

async function RecruiterCandidateContent({ params }) {
  await connection();
  const session = await getCurrentUser();

  if (!session) {
    redirect("/login");
  }

  if (session.role !== "recruiter") {
    redirect("/employee/dashboard");
  }

  const { candidateId } = await params;
  if (!/^[1-9]\d*$/.test(candidateId)) {
    notFound();
  }

  const result = await pool.query(
    `SELECT u.name, u.email,
            ep.skills, ep.experience_years,
            ep.preferred_location, ep.preferred_job_type,
            ep.resume_path
     FROM users u
     LEFT JOIN employee_profiles ep ON ep.user_id = u.id
     WHERE u.id = $1 AND u.role = 'employee'`,
    [candidateId]
  );

  const candidate = result.rows[0];
  if (!candidate) {
    notFound();
  }

  const resumeUrl = candidate.resume_path
    ? `/api/recruiter/candidates/${candidateId}/resume`
    : null;

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <nav className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-6 py-4">
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

      <section className="mx-auto max-w-4xl px-6 py-10">
        <Link
          href="/recruiter/candidate-matches"
          className="inline-flex items-center gap-2 text-sm font-semibold text-indigo-600 hover:underline"
        >
          <ArrowLeft size={15} aria-hidden="true" />
          Back to candidate matches
        </Link>

        <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h1 className="flex items-center gap-2 text-3xl font-bold">
                <UserRound size={25} aria-hidden="true" className="text-indigo-600" />
                {candidate.name}
              </h1>
              <a
                href={`mailto:${candidate.email}`}
                className="mt-2 inline-flex items-center gap-2 text-indigo-600 hover:underline"
              >
                <Mail size={15} aria-hidden="true" />
                {candidate.email}
              </a>
            </div>
          </div>

          <dl className="mt-7 grid gap-5 border-t border-slate-100 pt-6 sm:grid-cols-2">
            <div>
              <dt className="flex items-center gap-2 text-sm text-slate-500">
                <BriefcaseBusiness size={15} aria-hidden="true" />
                Skills
              </dt>
              <dd className="mt-1 font-medium">
                {candidate.skills?.length
                  ? candidate.skills.join(", ")
                  : "Not provided"}
              </dd>
            </div>
            <div>
              <dt className="flex items-center gap-2 text-sm text-slate-500">
                <BriefcaseBusiness size={15} aria-hidden="true" />
                Experience
              </dt>
              <dd className="mt-1 font-medium">
                {candidate.experience_years ?? 0} years
              </dd>
            </div>
            <div>
              <dt className="flex items-center gap-2 text-sm text-slate-500">
                <MapPin size={15} aria-hidden="true" />
                Preferred location
              </dt>
              <dd className="mt-1 font-medium">
                {candidate.preferred_location || "Not provided"}
              </dd>
            </div>
            <div>
              <dt className="flex items-center gap-2 text-sm text-slate-500">
                <BriefcaseBusiness size={15} aria-hidden="true" />
                Preferred job type
              </dt>
              <dd className="mt-1 font-medium">
                {candidate.preferred_job_type || "Not provided"}
              </dd>
            </div>
          </dl>

          <div className="mt-7 border-t border-slate-100 pt-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="flex items-center gap-2 font-semibold">
                <FileText size={17} aria-hidden="true" className="text-indigo-600" />
                Resume
              </h2>
              {resumeUrl && (
                <a
                  href={resumeUrl}
                  className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700"
                >
                  <Download size={16} aria-hidden="true" />
                  Download Resume
                </a>
              )}
            </div>
            {resumeUrl ? (
              <div className="mt-3 space-y-3">
                <p className="text-sm text-slate-600">
                  {getResumeDisplayName(candidate.resume_path) || "Resume.pdf"}
                </p>
                <iframe
                  title={`${candidate.name}'s resume`}
                  src={`${resumeUrl}?preview=1`}
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
