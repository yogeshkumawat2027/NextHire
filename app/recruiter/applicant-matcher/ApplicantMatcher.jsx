"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  ArrowRight,
  CheckCircle2,
  FileText,
  LoaderCircle,
  Mail,
  Sparkles,
  UserRound,
  UsersRound,
  XCircle,
} from "lucide-react";

function experienceLabel(value) {
  return {
    meets: "Meets requirements",
    partially_meets: "Partially meets",
    does_not_meet: "Does not meet",
    not_specified: "Not specified",
  }[value] || "Not specified";
}

export default function ApplicantMatcher({ jobId, applicantCount }) {
  const [matching, setMatching] = useState(applicantCount > 0);
  const [matches, setMatches] = useState(
    applicantCount === 0 ? [] : null
  );
  const [requiredSkills, setRequiredSkills] = useState([]);
  const [matchError, setMatchError] = useState("");
  const matchingStarted = useRef(false);

  const matchApplicants = useCallback(async () => {
    if (!jobId || applicantCount === 0) return;
    setMatching(true);
    setMatches(null);
    setRequiredSkills([]);
    setMatchError("");

    try {
      const response = await fetch("/api/recruiter/applicant-matcher", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jobId }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data.message || "Unable to match applicants.");
      }
      if (!Array.isArray(data.matches) || !Array.isArray(data.requiredSkills)) {
        throw new Error("Applicant matching returned an invalid response.");
      }
      setMatches(data.matches);
      setRequiredSkills(data.requiredSkills);
    } catch (error) {
      setMatchError(error.message || "Unable to match applicants.");
    } finally {
      setMatching(false);
    }
  }, [applicantCount, jobId]);

  useEffect(() => {
    if (applicantCount === 0 || matchingStarted.current) return;
    matchingStarted.current = true;
    matchApplicants();
  }, [applicantCount, matchApplicants]);

  return (
    <section aria-labelledby="applicant-results-title" className="mt-4">
      {matching && (
        <p role="status" className="flex items-center gap-2 rounded-lg bg-indigo-50 p-3 text-sm text-indigo-800">
          <LoaderCircle size={16} className="animate-spin" aria-hidden="true" />
          Evaluating applicants against this job...
        </p>
      )}

      {matchError && (
        <p role="alert" className="rounded-lg bg-rose-50 p-3 text-sm text-rose-800">
          <XCircle size={16} aria-hidden="true" className="mr-1 inline" />
          {matchError} Refresh this page to try again.
        </p>
      )}

      {matches && matches.length === 0 && (
        <p role="status" className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white p-4 text-slate-700">
          <UsersRound size={17} aria-hidden="true" className="text-slate-400" />
          No employee applications were found for this job.
        </p>
      )}

      {matches?.length > 0 && (
        <section aria-labelledby="applicant-results-title">
          <div className="mb-3 flex items-center justify-between">
            <h2 id="applicant-results-title" className="flex items-center gap-2 text-xl font-bold">
              <Sparkles size={18} aria-hidden="true" className="text-indigo-600" />
              Ranked Applicants
            </h2>
            <span className="text-sm text-slate-500">
              {matches.length} ranked
            </span>
          </div>

          {requiredSkills.length > 0 && (
            <p className="mb-3 rounded-lg bg-indigo-50 p-3 text-sm text-indigo-900">
              <span className="font-semibold">Evaluated requirements:</span>{" "}
              {requiredSkills.join(", ")}
            </p>
          )}

          <ol className="space-y-3">
            {matches.map((candidate) => (
              <li
                key={candidate.applicationId}
                className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h3 className="flex items-center gap-2 font-semibold text-slate-900">
                      <UserRound size={16} aria-hidden="true" className="text-slate-400" />
                      {candidate.name}
                    </h3>
                    <a
                      href={`mailto:${candidate.email}`}
                      className="inline-flex items-center gap-1.5 text-sm text-indigo-600 hover:underline"
                    >
                      <Mail size={14} aria-hidden="true" />
                      {candidate.email}
                    </a>
                    <p className="mt-1 text-sm text-slate-600">
                      {Number.isInteger(candidate.experienceYears)
                        ? `${candidate.experienceYears} years experience`
                        : "Experience not provided"}
                      {" · "}
                      {candidate.hasResumeText
                        ? "Resume text available"
                        : "No readable resume text"}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-3">
                    <span
                      className={`rounded-full px-3 py-1 text-sm font-semibold ${
                        candidate.score >= 70
                          ? "bg-emerald-50 text-emerald-800"
                          : candidate.score > 0
                            ? "bg-amber-50 text-amber-800"
                            : "bg-slate-100 text-slate-700"
                      }`}
                    >
                      {candidate.score}% match
                    </span>
                    <Link
                      href={`/recruiter/jobs/${encodeURIComponent(jobId)}/applicants/${encodeURIComponent(candidate.applicationId)}`}
                      className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:underline"
                    >
                      <FileText size={14} aria-hidden="true" />
                      View application
                    </Link>
                  </div>
                </div>

                <p className="mt-3 text-sm leading-5 text-slate-700">
                  {candidate.explanation}
                </p>

                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  <div>
                    <h4 className="flex items-center gap-1.5 text-sm font-semibold text-emerald-800">
                      <CheckCircle2 size={15} aria-hidden="true" />
                      Matched skills
                    </h4>
                    <p className="mt-1 text-sm text-slate-700">
                      {candidate.matchedSkills.length
                        ? candidate.matchedSkills.join(", ")
                        : "No required skills matched"}
                    </p>
                  </div>
                  <div>
                    <h4 className="flex items-center gap-1.5 text-sm font-semibold text-rose-800">
                      <XCircle size={15} aria-hidden="true" />
                      Missing skills
                    </h4>
                    <p className="mt-1 text-sm text-slate-700">
                      {candidate.missingSkills.length
                        ? candidate.missingSkills.join(", ")
                        : "None"}
                    </p>
                  </div>
                </div>

                <p className="mt-2 text-sm text-slate-600">
                  <span className="font-medium">Experience fit:</span>{" "}
                  {experienceLabel(candidate.experienceFit)}
                </p>

              </li>
            ))}
          </ol>
        </section>
      )}
    </section>
  );
}
