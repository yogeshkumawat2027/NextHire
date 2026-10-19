import Link from "next/link";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { connection } from "next/server";
import ProfileMenu from "@/app/components/ProfileMenu";
import { getCurrentUser } from "@/lib/auth";
import pool from "@/lib/db";
import {
  ArrowLeft,
  BriefcaseBusiness,
  Mail,
  ShieldCheck,
  UserRound,
} from "lucide-react";

export default function RecruiterProfilePage() {
  return (
    <Suspense fallback={<div>Loading profile...</div>}>
      <RecruiterProfileContent />
    </Suspense>
  );
}

async function RecruiterProfileContent() {
  await connection();
  const session = await getCurrentUser();

  if (!session) redirect("/login");
  if (session.role !== "recruiter") redirect("/employee/dashboard");

  const result = await pool.query(
    "SELECT name, email FROM users WHERE id = $1 AND role = $2",
    [session.id, "recruiter"]
  );
  const recruiter = result.rows[0];
  if (!recruiter) redirect("/login");

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
          <ProfileMenu profileHref="/recruiter/profile" />
        </div>
      </nav>

      <section className="mx-auto max-w-4xl px-6 py-10">
        <Link
          href="/recruiter/dashboard"
          className="inline-flex items-center gap-2 text-sm font-semibold text-indigo-600 hover:underline"
        >
          <ArrowLeft size={15} aria-hidden="true" />
          Back to Dashboard
        </Link>
        <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h1 className="flex items-center gap-2 text-2xl font-bold">
            <UserRound size={22} aria-hidden="true" className="text-indigo-600" />
            Recruiter Profile
          </h1>
          <dl className="mt-6 grid gap-5 sm:grid-cols-2">
            <div>
              <dt className="flex items-center gap-2 text-sm text-slate-500">
                <UserRound size={15} aria-hidden="true" />
                Full name
              </dt>
              <dd className="mt-1 font-semibold">{recruiter.name}</dd>
            </div>
            <div>
              <dt className="flex items-center gap-2 text-sm text-slate-500">
                <Mail size={15} aria-hidden="true" />
                Email address
              </dt>
              <dd className="mt-1 break-all font-semibold">{recruiter.email}</dd>
            </div>
            <div>
              <dt className="flex items-center gap-2 text-sm text-slate-500">
                <ShieldCheck size={15} aria-hidden="true" />
                Account role
              </dt>
              <dd className="mt-1 font-semibold">Recruiter</dd>
            </div>
          </dl>
        </div>
      </section>
    </main>
  );
}
