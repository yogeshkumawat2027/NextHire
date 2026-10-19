"use client";

import Link from "next/link";
import { Fragment, useEffect, useRef, useState } from "react";
import {
  ArrowLeft,
  CheckCircle2,
  CircleDashed,
  MinusCircle,
  Sparkles,
  UserRound,
  XCircle,
} from "lucide-react";

const NOT_EVIDENCED_TEXT = "Not evidenced in the resume.";

function isReportMatch(match, applicationId) {
  return (
    match &&
    match.applicationId === applicationId &&
    typeof match.name === "string" &&
    typeof match.summary === "string" &&
    match.jobFit &&
    match.jobFit.experience &&
    (match.jobFit.experience.candidateYears === null ||
      Number.isInteger(match.jobFit.experience.candidateYears)) &&
    (match.jobFit.experience.minimumRequiredYears === null ||
      Number.isInteger(match.jobFit.experience.minimumRequiredYears)) &&
    (match.jobFit.experience.maximumPreferredYears === null ||
      Number.isInteger(match.jobFit.experience.maximumPreferredYears)) &&
    ["meets", "below", "candidate-unknown", "not-specified"].includes(
      match.jobFit.experience.status
    ) &&
    match.jobFit.location &&
    (match.jobFit.location.candidatePreference === null ||
      typeof match.jobFit.location.candidatePreference === "string") &&
    (match.jobFit.location.jobLocation === null ||
      typeof match.jobFit.location.jobLocation === "string") &&
    (match.jobFit.location.jobType === null ||
      typeof match.jobFit.location.jobType === "string") &&
    ["aligned", "different", "not-provided"].includes(
      match.jobFit.location.status
    ) &&
    (match.score === null ||
      (Number.isInteger(match.score) && match.score >= 0 && match.score <= 100)) &&
    Array.isArray(match.activities) &&
    match.activities.length <= 30 &&
    new Set(
      match.activities.map((activity) => `${activity?.type}:${activity?.entry}`)
    ).size === match.activities.length &&
    match.activities.every(
      (activity) =>
        activity &&
        ["project", "experience", "other"].includes(activity.type) &&
        typeof activity.entry === "string" &&
        typeof activity.excerpt === "string"
    ) &&
    Array.isArray(match.skillAssessments) &&
    match.skillAssessments.every((assessment) =>
      assessment &&
      typeof assessment.skill === "string" &&
      typeof assessment.skillMentioned === "boolean" &&
      typeof assessment.isProfileSkill === "boolean" &&
      Number.isInteger(assessment.score) &&
      assessment.score >= 0 &&
      assessment.score <= 100 &&
      ["matched", "partial", "not_evidenced"].includes(assessment.status) &&
      Array.isArray(assessment.activityEvidence) &&
      assessment.activityEvidence.length <= match.activities.length &&
      new Set(
        assessment.activityEvidence.map(
          (evidence) => `${evidence?.type}:${evidence?.entry}`
        )
      ).size === assessment.activityEvidence.length &&
      assessment.activityEvidence.every(
        (evidence) =>
          evidence &&
          ["project", "experience", "other"].includes(evidence.type) &&
          typeof evidence.entry === "string" &&
          typeof evidence.excerpt === "string" &&
          match.activities.some(
            (activity) =>
              activity.type === evidence.type &&
              activity.entry === evidence.entry
          )
      )
    )
  );
}

function coverageScore(assessments) {
  if (!assessments.length) return null;
  return Math.round(
    assessments.reduce((sum, assessment) => sum + assessment.score, 0) /
      assessments.length
  );
}

function orderSkillAssessments(assessments) {
  return [...assessments].sort((first, second) =>
    Number(second.isProfileSkill) - Number(first.isProfileSkill) ||
    second.score - first.score ||
    first.skill.localeCompare(second.skill)
  );
}

const STATUS_DETAILS = {
  matched: {
    label: "Matched",
    className: "bg-emerald-50 text-emerald-800",
    icon: CheckCircle2,
  },
  partial: {
    label: "Partially matched",
    className: "bg-amber-50 text-amber-800",
    icon: MinusCircle,
  },
  not_evidenced: {
    label: "Not evidenced",
    className: "bg-slate-100 text-slate-700",
    icon: CircleDashed,
  },
};

export default function ApplicantReport({
  jobId,
  applicationId,
  recruiterId,
  jobTitle,
  company,
}) {
  const [match, setMatch] = useState(null);
  const [loading, setLoading] = useState(true);
  const [cacheError, setCacheError] = useState("");
  const [attempt, setAttempt] = useState(0);
  const reportRequestRef = useRef(null);

  useEffect(() => {
    let active = true;
    async function loadReport() {
      setLoading(true);
      setCacheError("");
      const key = `nexthire:applicant-report:v8:${recruiterId}:${jobId}:${applicationId}`;
      let storageUnavailable = false;
      try {
        try {
          const stored = window.localStorage.getItem(key);
          const cache = stored ? JSON.parse(stored) : null;
          if (
            cache?.version === 8 &&
            isReportMatch(cache.match, applicationId)
          ) {
            if (active) setMatch(cache.match);
            return;
          }
        } catch {
          storageUnavailable = true;
        }

        let pendingRequest = reportRequestRef.current;
        if (!pendingRequest) {
          pendingRequest = (async () => {
            const response = await fetch(
              `/api/recruiter/jobs/${encodeURIComponent(jobId)}/applicants/${encodeURIComponent(applicationId)}/report`,
              { method: "POST" }
            );
            const data = await response.json().catch(() => ({}));
            if (!response.ok) {
              throw new Error(data.message || "Unable to generate this applicant report.");
            }
            if (!isReportMatch(data.match, applicationId)) {
              throw new Error("Applicant report returned an invalid response.");
            }
            return data.match;
          })();
          reportRequestRef.current = pendingRequest;
        }

        let generatedMatch;
        try {
          generatedMatch = await pendingRequest;
        } finally {
          if (reportRequestRef.current === pendingRequest) {
            reportRequestRef.current = null;
          }
        }
        if (!active) return;
        setMatch(generatedMatch);
        if (storageUnavailable) {
          setCacheError("Report generated, but browser storage is unavailable.");
        }
        try {
          window.localStorage.setItem(key, JSON.stringify({
            version: 8,
            match: generatedMatch,
          }));
        } catch {
          setCacheError("Report generated, but could not be saved for reuse.");
        }
      } catch (error) {
        if (active) setCacheError(error.message || "Unable to generate this applicant report.");
      } finally {
        if (active) setLoading(false);
      }
    }
    loadReport();
    return () => {
      active = false;
    };
  }, [applicationId, attempt, jobId, recruiterId]);

  const assessments = match
    ? orderSkillAssessments(match.skillAssessments)
    : [];
  const score = match ? match.score ?? coverageScore(assessments) : null;

  return (
    <section className="mt-6">
      <Link
        href={`/recruiter/jobs/${encodeURIComponent(jobId)}`}
        className="inline-flex items-center gap-2 text-sm font-semibold text-indigo-700 hover:underline"
      >
        <ArrowLeft size={15} aria-hidden="true" />
        Back to applicants
      </Link>

      {loading ? (
        <p role="status" className="mt-5 rounded-xl border border-slate-200 bg-white p-5 text-sm text-slate-600">
          <span className="inline-flex items-center gap-2">
            <Sparkles size={16} aria-hidden="true" className="text-indigo-600" />
            Generating this applicant’s AI report...
          </span>
        </p>
      ) : cacheError && !match ? (
        <div role="status" className="mt-5 rounded-xl border border-amber-200 bg-amber-50 p-5 text-sm text-amber-900">
          {cacheError}
          {!match && (
            <button
              type="button"
              onClick={() => setAttempt((current) => current + 1)}
              className="ml-3 font-semibold text-amber-950 underline"
            >
              Retry
            </button>
          )}
        </div>
      ) : match && (
        <div className="mt-5 space-y-5">
          {cacheError && (
            <p role="status" className="rounded-lg bg-amber-50 p-3 text-sm text-amber-900">
              {cacheError}
            </p>
          )}
          <header className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="flex items-center gap-2 text-sm font-semibold text-indigo-700">
                  <Sparkles size={16} aria-hidden="true" />
                  Applicant report
                </p>
                <h1 className="mt-2 text-2xl font-bold text-slate-900">
                  {match.name}
                </h1>
                <p className="mt-1 flex items-center gap-2 text-sm text-slate-500">
                  <UserRound size={15} aria-hidden="true" />
                  {Number.isInteger(match.experienceYears)
                    ? `${match.experienceYears} years of experience`
                    : "Experience not provided"}
                </p>
                <p className="mt-2 text-sm text-slate-500">
                  {jobTitle} · {company}
                </p>
              </div>
              <div className="min-w-32 rounded-xl bg-indigo-50 px-5 py-3 text-center">
                <p className="text-xs font-semibold uppercase tracking-wide text-indigo-700">
                  Skill evidence match
                </p>
                <p className="mt-1 text-3xl font-bold text-indigo-900">
                  {score === null ? "N/A" : `${score}%`}
                </p>
                <p className="mt-1 text-xs text-indigo-700">
                  Average across job-relevant skills
                </p>
              </div>
            </div>
            <p className="mt-5 max-w-4xl leading-7 text-slate-700">
              {match.summary}
            </p>
          </header>

          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div>
              <h2 className="text-base font-semibold text-slate-900">
                Job fit against the description
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Skills are selected from the resume based on this role’s description and requirements.
              </p>
            </div>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <JobFitDetail
                title="Experience"
                value={
                  match.jobFit.experience.candidateYears === null
                    ? "Candidate experience not provided"
                    : `${match.jobFit.experience.candidateYears} years in profile`
                }
                detail={
                  match.jobFit.experience.minimumRequiredYears === null
                    ? "No minimum experience found in the job description"
                    : match.jobFit.experience.maximumPreferredYears === null
                      ? `${match.jobFit.experience.minimumRequiredYears} years stated in the job description`
                      : `${match.jobFit.experience.minimumRequiredYears}–${match.jobFit.experience.maximumPreferredYears} years stated in the job description`
                }
                status={match.jobFit.experience.status}
                statusLabels={{
                  meets: "Meets stated minimum",
                  below: "Below stated minimum",
                  "candidate-unknown": "Candidate experience unavailable",
                  "not-specified": "No experience minimum stated",
                }}
                statusTone={
                  match.jobFit.experience.status === "below"
                    ? "amber"
                    : match.jobFit.experience.status === "meets"
                      ? "emerald"
                      : "slate"
                }
              />
              <JobFitDetail
                title="Preferred location"
                value={
                  match.jobFit.location.candidatePreference ||
                  "Candidate preference not set"
                }
                detail={
                  match.jobFit.location.jobLocation
                    ? `Job location: ${match.jobFit.location.jobLocation}${match.jobFit.location.jobType ? ` · ${match.jobFit.location.jobType}` : ""}`
                    : "Job location not provided"
                }
                status={match.jobFit.location.status}
                statusLabels={{
                  aligned: "Preference aligns",
                  different: "Location differs",
                  "not-provided": "Comparison unavailable",
                }}
                statusTone={
                  match.jobFit.location.status === "different"
                    ? "amber"
                    : match.jobFit.location.status === "aligned"
                      ? "emerald"
                      : "slate"
                }
              />
            </div>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h2 className="text-base font-semibold text-slate-900">
                  Relevant resume skills
                </h2>
              </div>
              {assessments.length > 0 && (
                <p className="text-xs text-slate-500">
                  {assessments.length} {assessments.length === 1 ? "skill" : "skills"} assessed
                </p>
              )}
            </div>

            {assessments.length > 0 ? (
              <>
                <SkillCoverageChart
                  assessments={assessments}
                  activities={match.activities}
                />
                <ul className="mt-3 divide-y divide-slate-100">
                  {assessments.map((assessment, index) => {
                    const status = STATUS_DETAILS[assessment.status];
                    const StatusIcon = status.icon;
                    return (
                      <Fragment key={assessment.skill}>
                        {(index === 0 ||
                          assessment.isProfileSkill !== assessments[index - 1]?.isProfileSkill) && (
                          <li className="pt-4 text-xs font-semibold uppercase tracking-wide text-slate-500 first:pt-2">
                            {assessment.isProfileSkill
                              ? "Profile skills"
                              : "Additional skills found in resume"}
                          </li>
                        )}
                        <li className="grid gap-2 py-4 sm:grid-cols-[minmax(10rem,0.8fr)_minmax(0,2fr)] sm:gap-5">
                          <div>
                            <h3 className="font-semibold text-slate-900">
                              {assessment.skill}
                              <span className="ml-2 text-sm font-bold tabular-nums text-indigo-700">
                                {assessment.score}%
                              </span>
                            </h3>
                            <span className={`mt-1 inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ${status.className}`}>
                              <StatusIcon size={13} aria-hidden="true" />
                              {status.label}
                            </span>
                          </div>
                          <div className="text-sm leading-6 text-slate-700">
                            <ActivityEvidence
                              entries={assessment.activityEvidence}
                            />
                          </div>
                        </li>
                      </Fragment>
                    );
                  })}
                </ul>
              </>
            ) : (
              <p className="mt-4 rounded-lg bg-slate-50 p-4 text-sm text-slate-600">
                No relevant skills could be verified in the resume for this job.
              </p>
            )}
          </section>

          <section className="grid gap-5 lg:grid-cols-2">
            <SkillGroup
              title="Key strengths"
              skills={assessments.filter((assessment) => assessment.status === "matched")}
              empty="No relevant skills have activity evidence in the resume."
              tone="emerald"
            />
            <SkillGroup
              title="Skill gaps to explore"
              skills={assessments.filter((assessment) => assessment.status !== "matched")}
              empty="All assessed skills have activity evidence."
              tone="amber"
            />
          </section>

        </div>
      )}
    </section>
  );
}

function JobFitDetail({ title, value, detail, status, statusLabels, statusTone }) {
  const toneClasses = {
    emerald: "bg-emerald-50 text-emerald-800",
    amber: "bg-amber-50 text-amber-800",
    slate: "bg-slate-100 text-slate-700",
  };

  return (
    <article className="rounded-xl border border-slate-200 bg-slate-50 p-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <h3 className="font-semibold text-slate-900">{title}</h3>
        <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${toneClasses[statusTone]}`}>
          {statusLabels[status]}
        </span>
      </div>
      <p className="mt-2 text-sm font-medium text-slate-800">{value}</p>
      <p className="mt-1 text-sm text-slate-600">{detail}</p>
    </article>
  );
}

function SkillCoverageChart({ assessments, activities }) {
  const activityTotal = activities.length;

  return (
    <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-3 sm:p-4">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-sm font-semibold text-slate-800">Skill coverage</h3>
        <span className="text-xs text-slate-500">
          {activityTotal} resume {activityTotal === 1 ? "activity" : "activities"}
        </span>
      </div>
      <p className="mb-3 text-xs text-slate-500">
        50% for a mention; +10 for the first project, +5 for each additional project, +15 for work mention, and +10 for practical work use.
      </p>
      <ul className="space-y-2">
        {assessments.map((assessment) => {
          const score = assessment.score;
          const evidenceTypes = new Set(
            assessment.activityEvidence.map((evidence) => evidence.type)
          );
          const hasProjectEvidence = evidenceTypes.has("project");
          const hasExperienceEvidence = evidenceTypes.has("experience");
          const hasOtherEvidence = evidenceTypes.has("other");
          const evidenceLabels = [
            assessment.skillMentioned ? "Listed" : null,
            hasProjectEvidence ? "Project" : null,
            hasExperienceEvidence ? "Experience" : null,
            hasOtherEvidence ? "Other activity" : null,
          ].filter(Boolean);
          return (
            <li
              key={assessment.skill}
              className="rounded-lg border border-slate-200 bg-white px-3 py-2.5"
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <span className="font-semibold text-slate-900">
                    {assessment.skill}
                  </span>
                  <span className={`ml-2 rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                    assessment.isProfileSkill
                      ? "bg-indigo-50 text-indigo-700"
                      : "bg-slate-100 text-slate-600"
                  }`}>
                    {assessment.isProfileSkill ? "Profile skill" : "Resume-discovered"}
                  </span>
                </div>
                <span className="rounded-lg bg-indigo-50 px-3 py-1.5 text-sm font-bold tabular-nums text-indigo-800">
                  {score === null ? "N/A" : `${score}%`}
                </span>
              </div>
              {score !== null && (
                <div
                  role="progressbar"
                  aria-label={`${assessment.skill} resume evidence coverage`}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-valuenow={score}
                  className="mt-2 h-2 overflow-hidden rounded-full bg-slate-200"
                >
                  <div
                    aria-hidden="true"
                    className="h-full rounded-full bg-indigo-600 transition-[width]"
                    style={{ width: `${score}%` }}
                  />
                </div>
              )}
              <span className="mt-1 block text-xs text-slate-500">
                {evidenceLabels.length > 0
                  ? `Evidence: ${evidenceLabels.join(" · ")}`
                  : "No resume evidence"}
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function ActivityEvidence({ entries }) {
  return (
    <div className="text-sm leading-6 text-slate-700">
      <h4 className="font-medium text-slate-800">Activity evidence</h4>
      {entries.length > 0 ? (
        <ul className="mt-1 space-y-2">
          {entries.map((item) => (
            <li
              key={`${item.type}:${item.entry}`}
              className="rounded-lg bg-slate-50 px-3 py-2"
            >
              <span className="font-medium capitalize text-slate-800">
                {item.type}: {item.entry}
              </span>
              <span className="block text-slate-600">“{item.excerpt}”</span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-1 italic text-slate-500">{NOT_EVIDENCED_TEXT}</p>
      )}
    </div>
  );
}

function SkillGroup({ title, skills, empty, tone }) {
  const isStrength = tone === "emerald";
  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className={`flex items-center gap-2 text-lg font-semibold ${
        isStrength ? "text-emerald-800" : "text-amber-800"
      }`}>
        {isStrength
          ? <CheckCircle2 size={17} aria-hidden="true" />
          : <MinusCircle size={17} aria-hidden="true" />}
        {title}
      </h2>
      {skills.length > 0 ? (
        <ul className="mt-3 space-y-2">
          {skills.map((assessment) => (
            <li key={assessment.skill} className="text-sm text-slate-700">
              <span className="font-medium">{assessment.skill}</span>
              {assessment.status === "partial" && (
                <span className="text-slate-500"> · partially evidenced</span>
              )}
              {assessment.status === "not_evidenced" && (
                <span className="text-slate-500"> · not evidenced in the resume</span>
              )}
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-3 text-sm text-slate-600">{empty}</p>
      )}
    </article>
  );
}
