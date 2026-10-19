
import Link from "next/link";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { getCurrentUser } from "@/lib/auth";
import pool, { logDatabaseError } from "@/lib/db";
import { connection } from "next/server";
import { AlertCircle, BriefcaseBusiness } from "lucide-react";
import JobBrowser from "./JobBrowser";
import ProfileMenu from "@/app/components/ProfileMenu";

export default function EmployeeDashboard() {
  return (
    <Suspense fallback={<div className="p-6">Loading dashboard...</div>}>
      <EmployeeDashboardContent />
    </Suspense>
  );
}

async function EmployeeDashboardContent() {
  await connection();

  const session = await getCurrentUser();

  if (!session) redirect("/login");
  if (session.role !== "employee") redirect("/recruiter/dashboard");

  let jobs;
  let profile = null;
  let databaseUnavailable = false;
  try {
    const jobsResult = await pool.query(
      `SELECT j.id, j.title, j.company, j.location, j.job_type,
              j.description, j.skills,
              EXISTS (
                SELECT 1
                FROM applications a
                WHERE a.job_id = j.id AND a.employee_id = $1
              ) AS has_applied
       FROM jobs j
       ORDER BY j.created_at DESC`,
      [session.id]
    );
    jobs = jobsResult.rows;
  } catch (error) {
    logDatabaseError("Employee dashboard job fetch error:", error);
    databaseUnavailable = true;
  }

  if (!databaseUnavailable) {
    try {
      const profileResult = await pool.query(
        `SELECT u.name, u.email, ep.skills, ep.experience_years,
                ep.preferred_location, ep.preferred_job_type
         FROM users u
         LEFT JOIN employee_profiles ep ON ep.user_id = u.id
         WHERE u.id = $1`,
        [session.id]
      );
      profile = profileResult.rows[0] ?? null;
    } catch (error) {
      logDatabaseError("Employee dashboard profile fetch error:", error);
    }
  }

  return (
    <main className="min-h-screen bg-slate-50">
      <nav className="flex items-center justify-between border-b border-slate-200 bg-white px-5 py-4 sm:px-8">
        <Link href="/" className="inline-flex items-center gap-2 text-xl font-bold text-indigo-600">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 text-white">
            <BriefcaseBusiness size={16} aria-hidden="true" />
          </span>
          NextHire
        </Link>

        <ProfileMenu profileHref="/employee/profile" />
      </nav>

      <section className="mx-auto max-w-7xl px-4 py-6 sm:px-8 sm:py-8">
        {databaseUnavailable ? (
          <div
            role="alert"
            className="rounded-xl border border-amber-200 bg-amber-50 p-6 text-amber-950"
          >
            <h2 className="flex items-center gap-2 font-semibold">
              <AlertCircle size={18} aria-hidden="true" />
              Jobs are temporarily unavailable
            </h2>
            <p className="mt-2 text-sm leading-6">
              NextHire could not connect to PostgreSQL. If you use Supabase,
              check that your server-side database connection uses a reachable
              Session Pooler endpoint, especially if your network does not
              support IPv6. Restart the development server after updating the
              database connection settings.
            </p>
          </div>
        ) : (
          <JobBrowser jobs={jobs} profile={profile} />
        )}
      </section>
    </main>
  );
}
