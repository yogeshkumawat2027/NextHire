"use client";

import Link from "next/link";
import { useState } from "react";
import {
  ArrowRight,
  ExternalLink,
  LoaderCircle,
  Mail,
  Sparkles,
  UserRound,
} from "lucide-react";

export default function CandidateMatcher() {
  const [jobDescription, setJobDescription] = useState("");
  const [matches, setMatches] = useState(null);
  const [matching, setMatching] = useState(false);
  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);
  const [broadenedSearch, setBroadenedSearch] = useState(false);

  async function findCandidates(event) {
    event.preventDefault();
    setMatching(true);
    setMessage("");
    setIsError(false);
    setMatches(null);
    setBroadenedSearch(false);

    try {
      const response = await fetch("/api/recruiter/candidate-matches", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jobDescription }),
      });
      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.message || "Unable to find candidate matches.");
      }

      if (!Array.isArray(data.matches)) {
        throw new Error("Candidate matching returned an invalid response.");
      }

      setMatches(data.matches);
      setBroadenedSearch(data.broadenedSearch === true);
      setMessage(data.matches.length
        ? `Found ${data.matches.length} ranked candidate${data.matches.length === 1 ? "" : "s"}.`
        : "No employee profiles are available to match this job description.");
    } catch (error) {
      setIsError(true);
      setMessage(error.message || "Unable to find candidate matches.");
    } finally {
      setMatching(false);
    }
  }

  return (
    <section
      aria-labelledby="candidate-matcher-title"
      className="mb-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
    >
      <h2 id="candidate-matcher-title" className="flex items-center gap-2 text-xl font-semibold">
        <Sparkles size={19} aria-hidden="true" className="text-indigo-600" />
        AI Candidate Matching
      </h2>
      <p className="mt-2 text-sm text-slate-600">
        Paste a job description to find and rank relevant employee profiles.
      </p>

      <form onSubmit={findCandidates} className="mt-4 space-y-3">
        <label
          htmlFor="candidate-job-description"
          className="block text-sm font-medium text-slate-700"
        >
          Job description
        </label>
        <textarea
          id="candidate-job-description"
          value={jobDescription}
          onChange={(event) => setJobDescription(event.target.value)}
          maxLength={12000}
          minLength={20}
          rows={5}
          required
          placeholder="Paste role responsibilities, required skills, experience, and location..."
          className="w-full rounded-lg border border-slate-300 px-4 py-3 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
        />
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-xs text-slate-500">
            Enter 20–12,000 characters. Matches use job-related profile evidence.
          </p>
          <button
            type="submit"
            disabled={matching || jobDescription.trim().length < 20}
            className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {matching
              ? <LoaderCircle size={16} className="animate-spin" aria-hidden="true" />
              : <Sparkles size={16} aria-hidden="true" />}
            {matching ? "Finding candidates..." : "Find Candidates"}
            {!matching && <ArrowRight size={15} aria-hidden="true" />}
          </button>
        </div>
      </form>

      {message && (
        <p
          role={isError ? "alert" : "status"}
          className={`mt-4 rounded-lg p-3 text-sm ${
            isError ? "bg-rose-50 text-rose-800" : "bg-indigo-50 text-indigo-800"
          }`}
        >
          {message}
        </p>
      )}

      {broadenedSearch && (
        <p className="mt-3 rounded-lg bg-amber-50 p-3 text-sm text-amber-900">
          Fewer than five profiles met all extracted filters, so the search was
          broadened. Candidates are ranked by their available job-related
          evidence; lower scores may be less relevant.
        </p>
      )}

      {matches?.length > 0 && (
        <ol className="mt-5 space-y-3">
          {matches.map((candidate) => {
            const score = Number.isFinite(candidate.score)
              ? Math.max(0, Math.min(100, Math.round(candidate.score)))
              : 0;

            return (
              <li
                key={candidate.candidateId}
                className="rounded-xl border border-slate-200 p-4"
              >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h3 className="flex items-center gap-2 font-semibold text-slate-900">
                    <UserRound size={16} aria-hidden="true" className="text-slate-400" />
                    {candidate.name}
                  </h3>
                  <a
                    href={`mailto:${candidate.email}`}
                    className="mt-1 inline-flex items-center gap-1.5 text-sm text-indigo-600 hover:underline"
                  >
                    <Mail size={14} aria-hidden="true" />
                    {candidate.email}
                  </a>
                </div>
                <div className="flex shrink-0 items-center gap-3">
                  <span
                    className={`rounded-full px-3 py-1 text-sm font-semibold ${
                      score >= 70
                        ? "bg-emerald-50 text-emerald-800"
                        : score > 0
                          ? "bg-amber-50 text-amber-800"
                          : "bg-slate-100 text-slate-700"
                    }`}
                  >
                    {score}% match
                  </span>
                  <Link
                    href={`/recruiter/candidates/${encodeURIComponent(candidate.candidateId)}`}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:underline"
                  >
                    <ExternalLink size={14} aria-hidden="true" />
                    View details
                  </Link>
                </div>
              </div>

              <p className="mt-3 text-sm leading-6 text-slate-700">
                {candidate.explanation}
              </p>
              {Array.isArray(candidate.skills) && candidate.skills.length > 0 && (
                <p className="mt-2 text-sm text-slate-600">
                  <span className="font-medium">Skills:</span>{" "}
                  {candidate.skills.join(", ")}
                </p>
              )}
              {Number.isInteger(candidate.experienceYears) && (
                <p className="mt-1 text-sm text-slate-600">
                  <span className="font-medium">Experience:</span>{" "}
                  {candidate.experienceYears} years
                </p>
              )}
              </li>
            );
          })}
        </ol>
      )}
    </section>
  );
}
