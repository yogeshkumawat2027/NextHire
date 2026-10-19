
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { Suspense } from "react";
import { connection } from "next/server";
import ProfileMenu from "@/app/components/ProfileMenu";
import { getCurrentUser } from "@/lib/auth";
import pool, { logDatabaseError } from "@/lib/db";
import {
  ArrowLeft,
  ArrowRight,
  BriefcaseBusiness,
  Building2,
  CalendarDays,
  FileText,
  MapPin,
  UsersRound,
} from "lucide-react";

export default function RecruiterJobPage({ params }) {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-slate-50 p-6 text-sm text-slate-500">
          Loading job details...
        </main>
      }
    >
      <RecruiterJobContent params={params} />
    </Suspense>
  );
}

async function RecruiterJobContent({ params }) {
  await connection();

  const user = await getCurrentUser();

  if (!user) redirect("/login");
  if (user.role !== "recruiter") redirect("/employee/dashboard");

  const { jobId } = await params;

  if (!/^[1-9]\d*$/.test(jobId)) notFound();

  let job;

  try {
    const result = await pool.query(
      `SELECT id, title, company, location, job_type, description, skills, created_at
       FROM jobs
       WHERE id = $1 AND recruiter_id = $2`,
      [jobId, user.id]
    );

    job = result.rows[0];
  } catch (error) {
    logDatabaseError("Recruiter job details query failed:", error);
    return <DatabaseUnavailable jobId={jobId} />;
  }

  if (!job) notFound();

  let applicants = [];

  try {
    const result = await pool.query(
      `SELECT
         a.id AS application_id,
         a.status,
         u.name,
         u.email,
         ep.skills,
         ep.experience_years
       FROM applications a
       JOIN users u
         ON u.id = a.employee_id
         AND u.role = 'employee'
       LEFT JOIN employee_profiles ep
         ON ep.user_id = u.id
       WHERE a.job_id = $1
       ORDER BY u.name`,
      [job.id]
    );

    applicants = result.rows;
  } catch (error) {
    logDatabaseError("Recruiter job applicants query failed:", error);
    return <DatabaseUnavailable jobId={jobId} />;
  }

  const jobSkills = Array.isArray(job.skills)
    ? [...new Set(job.skills.filter((skill) => typeof skill === "string"))]
    : [];

  const normalizedJobSkills = jobSkills.map((skill) => skill.toLowerCase());

  const rankedApplicants = applicants
    .map((applicant) => {
      const profileSkills = Array.isArray(applicant.skills)
        ? applicant.skills.filter((skill) => typeof skill === "string")
        : [];

      const matchedSkills = profileSkills.filter((skill) =>
        normalizedJobSkills.includes(skill.toLowerCase())
      );

      const matchScore =
        jobSkills.length > 0
          ? Math.round((matchedSkills.length / jobSkills.length) * 100)
          : 0;

      return {
        ...applicant,
        profileSkills,
        matchedSkills: [...new Set(matchedSkills)],
        matchScore,
      };
    })
    .sort(
      (a, b) =>
        b.matchScore - a.matchScore ||
        b.matchedSkills.length - a.matchedSkills.length ||
        (a.name || "").localeCompare(b.name || "")
    );

  const jobDescription =
    typeof job.description === "string" ? job.description.trim() : "";

  const descriptionPreview =
    jobDescription.length > 220
      ? `${jobDescription.slice(0, 220).trim()}`
      : jobDescription;

  const postedDate = job.created_at
    ? new Date(job.created_at).toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : "Date unavailable";

  return (
    <main className="min-h-screen bg-slate-50 text-slate-800">
      <header className="sticky top-0 z-20 border-b border-slate-200/80 bg-white/95 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 sm:px-6">
          <Link
            href="/recruiter/dashboard"
            className="text-xl font-bold tracking-tight text-indigo-700"
          >
            NextHire
          </Link>

          <ProfileMenu />
        </div>
      </header>

      <div className="mx-auto max-w-5xl px-4 py-5 sm:px-6 sm:py-7">
        <Link
          href="/recruiter/dashboard"
          className="mb-4 inline-flex items-center gap-2 text-sm font-medium text-slate-500 transition hover:text-indigo-700"
        >
          <ArrowLeft size={16} />
          Back to jobs
        </Link>

       
{/* Job details */}

{/* Job details */}
<section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
  <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
    <div className="min-w-0">
      <div className="mb-1.5 flex items-center gap-2 text-sm text-slate-500">
        <Building2 size={15} />
        <span>{job.company || "Company not specified"}</span>
      </div>

      <h1 className="text-xl font-semibold tracking-tight text-slate-900 sm:text-2xl">
        {job.title}
      </h1>

      <div className="mt-2.5 flex flex-wrap gap-x-4 gap-y-1.5 text-sm text-slate-500">
        {job.location && (
          <span className="inline-flex items-center gap-1.5">
            <MapPin size={14} />
            {job.location}
          </span>
        )}

        {job.job_type && (
          <span className="inline-flex items-center gap-1.5">
            <BriefcaseBusiness size={14} />
            {job.job_type}
          </span> 
        )}

        <span className="inline-flex items-center gap-1.5">
          <CalendarDays size={14} />
          Posted {postedDate}
        </span>
      </div>
    </div>

    <div className="flex shrink-0 items-center gap-2 self-start rounded-lg bg-indigo-50 px-3 py-2 text-sm text-indigo-700">
      <UsersRound size={16} />
      <span className="font-semibold">{applicants.length}</span>
      <span>applicants</span>
    </div>
  </div>

  {/* Job description */}
  {jobDescription && (
    <div className="mt-4 border-t border-slate-100 pt-3">
      <h2 className="mb-1.5 text-sm font-semibold text-slate-800">
        Job description
      </h2>

      {jobDescription.length > 180 ? (
        <details className="group">
          <summary className="list-none cursor-pointer text-sm leading-6 text-slate-600">
            <span className="group-open:hidden">
              {descriptionPreview}{" "}
              <span className="whitespace-nowrap font-medium text-indigo-600 hover:text-indigo-800">
                ...more
              </span>
            </span>

            <span className="hidden whitespace-pre-line group-open:inline">
              {jobDescription}{" "}
              <span className="whitespace-nowrap font-medium text-indigo-600 hover:text-indigo-800">
                less
              </span>
            </span>
          </summary>
        </details>
      ) : (
        <p className="whitespace-pre-line text-sm leading-6 text-slate-600">
          {jobDescription}
        </p>
      )}
    </div>
  )}

  {/* Required skills */}
  {jobSkills.length > 0 && (
    <div className="mt-3 border-t border-slate-100 pt-3">
      <h2 className="mb-2 text-sm font-semibold text-slate-800">
        Required skills
      </h2>

      <div className="flex flex-wrap gap-1.5">
        {jobSkills.map((skill) => (
          <span
            key={skill}
            className="inline-flex items-center rounded-md border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-600"
          >
            {skill}
          </span>
        ))}
      </div>
    </div>
  )}
</section>



       
{/* Applicants */}
<section className="mt-5">
  <div className="mb-3 flex items-center justify-between">
    <div>
      <h2 className="text-lg font-semibold text-slate-900">
        Applicants
        <span className="ml-2 text-sm font-medium text-slate-400">
          ({rankedApplicants.length})
        </span>
      </h2>
      <p className="mt-0.5 text-xs text-slate-500">
        Review candidates who applied for this job.
      </p>
    </div>
  </div>

  {rankedApplicants.length === 0 ? (
    <div className="rounded-xl border border-slate-200 bg-white px-5 py-10 text-center">
      <UsersRound size={26} className="mx-auto mb-2 text-slate-300" />
      <h3 className="text-sm font-semibold text-slate-800">
        No applicants yet
      </h3>
      <p className="mt-1 text-sm text-slate-500">
        Applicants will appear here when employees apply.
      </p>
    </div>
  ) : (
    <div className="space-y-2">
      {rankedApplicants.map((applicant) => {
        const profileHref = `/recruiter/jobs/${job.id}/applicants/${applicant.application_id}`;
        const reportHref = `${profileHref}/report`;

        return (
          <article
            key={applicant.application_id}
            className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 transition hover:border-indigo-200 hover:shadow-sm sm:flex-row sm:items-center sm:justify-between"
          >
            {/* Line 1: Avatar and name */}
            <div className="flex min-w-0 flex-1 items-center gap-3">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-indigo-50 text-sm font-semibold text-indigo-700">
                {(applicant.name || "U")
                  .trim()
                  .charAt(0)
                  .toUpperCase()}
              </div>

              <div className="min-w-0 flex-1">
                <h3 className="truncate text-sm font-semibold text-slate-900">
                  {applicant.name || "Unnamed applicant"}
                </h3>

                {/* Line 2: Email */}
                <p className="truncate text-xs text-slate-500">
                  {applicant.email || "No email provided"}
                </p>

                {/* Line 3: Experience and status */}
                <p className="mt-1 truncate text-xs text-slate-500">
                  {applicant.experience_years != null
                    ? `${applicant.experience_years} years experience`
                    : "Experience not specified"}
                  {applicant.status && (
                    <>
                      <span className="mx-1.5 text-slate-300">·</span>
                      <span className="capitalize">
                        {String(applicant.status).replace(/[_-]/g, " ")}
                      </span>
                    </>
                  )}
                </p>
              </div>
            </div>

            {/* Line 4: Match score and action buttons */}
            <div className="flex shrink-0 items-center justify-between gap-3 border-t border-slate-100 pt-3 sm:justify-end sm:border-t-0 sm:pt-0">
              <div className="text-right">
                <p className="text-sm font-semibold tabular-nums text-indigo-700">
                  {applicant.matchScore}%
                </p>
                <p className="text-[10px] text-slate-400">Skill match</p>
              </div>

              <Link
                href={profileHref}
                className="inline-flex h-9 items-center justify-center rounded-lg border border-indigo-200 bg-transparent px-3 text-xs font-medium text-indigo-700 transition hover:border-indigo-600 hover:bg-indigo-600 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
              >
                View Profile
              </Link>

              <Link
                href={reportHref}
                className="inline-flex h-9 items-center justify-center rounded-lg border border-slate-200 bg-transparent px-3 text-xs font-medium text-slate-600 transition hover:border-slate-800 hover:bg-slate-800 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-500"
              >
                AI Report
              </Link>
            </div>
          </article>
        );
      })}
    </div>
  )}
</section>

      </div>
    </main>
  );
}

function DatabaseUnavailable({ jobId }) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-6 text-center shadow-sm">
        <h1 className="text-lg font-semibold text-slate-900">
          Unable to load job details
        </h1>
        <p className="mt-2 text-sm leading-6 text-slate-500">
          The database could not return the job information. Please try again.
        </p>
        <Link
          href={`/recruiter/jobs/${encodeURIComponent(jobId)}`}
          className="mt-5 inline-flex items-center gap-2 rounded-lg border border-indigo-200 px-4 py-2 text-sm font-medium text-indigo-700 transition hover:border-indigo-600 hover:bg-indigo-600 hover:text-white"
        >
          Try again
          <ArrowRight size={15} />
        </Link>
      </div>
    </main>
  );
}
