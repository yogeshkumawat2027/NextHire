"use client";

import Link from "next/link";
import { useState } from "react";
import {
  Building2,
  BriefcaseBusiness,
  ChevronRight,
  FilterX,
  MapPin,
  Search,
  Sparkles,
  Tags,
  UserRound,
} from "lucide-react";
import ApplyNowButton from "./ApplyNowButton";

const JOB_TYPES = ["Full-time", "Part-time", "Contract", "Internship"];

export default function JobBrowser({ jobs, profile }) {
  const [search, setSearch] = useState("");
  const [location, setLocation] = useState("");
  const [jobType, setJobType] = useState("");
  const [selectedSkills, setSelectedSkills] = useState([]);
  const [recommendedJobs, setRecommendedJobs] = useState(null);
  const [matching, setMatching] = useState(false);
  const [matchMessage, setMatchMessage] = useState("");
  const [matchError, setMatchError] = useState(false);

  const locations = [...new Set(
    jobs.map((job) => job.location).filter(Boolean)
  )].sort((first, second) => first.localeCompare(second));
  const skills = [...new Set(
    jobs.flatMap((job) => Array.isArray(job.skills) ? job.skills : [])
      .filter((value) => typeof value === "string" && value.trim())
  )].sort((first, second) => first.localeCompare(second));

  async function findBestJobs() {
    setMatching(true);
    setMatchMessage("");
    setMatchError(false);

    try {
      const response = await fetch("/api/employee/job-matches", {
        method: "POST",
      });
      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.message || "Unable to find job matches.");
      }

      setRecommendedJobs(data.recommendations || []);
      setMatchMessage(data.message || "Jobs ranked using your profile and resume.");
    } catch (error) {
      setMatchError(true);
      setMatchMessage(error.message);
    } finally {
      setMatching(false);
    }
  }

  function showAllJobs() {
    setRecommendedJobs(null);
    setMatchMessage("");
    setMatchError(false);
  }

  const normalizedSearch = search.trim().toLowerCase();
  const visibleJobs = recommendedJobs ?? jobs;
  const filteredJobs = visibleJobs.filter((job) => {
    const matchesSearch = !normalizedSearch || [
      job.title,
      job.company,
      ...(Array.isArray(job.skills) ? job.skills : []),
    ].some((value) =>
      typeof value === "string" && value.toLowerCase().includes(normalizedSearch)
    );
    const matchesLocation = !location || job.location === location;
    const matchesJobType = !jobType || job.job_type === jobType;
    const jobSkills = Array.isArray(job.skills)
      ? job.skills.filter((requiredSkill) => typeof requiredSkill === "string")
      : [];
    const matchesSkills = selectedSkills.length === 0 || selectedSkills.some((selectedSkill) =>
      jobSkills.some((requiredSkill) =>
        requiredSkill.toLowerCase() === selectedSkill.toLowerCase()
      )
    );

    return matchesSearch && matchesLocation && matchesJobType && matchesSkills;
  });

  function clearFilters() {
    setSearch("");
    setLocation("");
    setJobType("");
    setSelectedSkills([]);
  }

  return (
    <div className="grid items-start gap-5 lg:grid-cols-8 xl:gap-6">
      <aside className="lg:col-span-2">
        <section className="rounded-xl border border-slate-200 bg-white shadow-sm">
          <h2 className="flex items-center gap-2 px-4 py-4 font-semibold text-slate-900">
            <span className="flex items-center gap-2">
              <FilterX size={17} aria-hidden="true" className="text-indigo-600" />
              Search filters
            </span>
          </h2>
          <div className="space-y-4 border-t border-slate-100 px-4 py-4">
            <fieldset className="text-sm font-medium text-slate-700">
              <legend className="flex items-center gap-2">
                <MapPin size={15} aria-hidden="true" className="text-slate-400" />
                Location
              </legend>
              <div className="mt-3 max-h-48 space-y-2.5 overflow-y-auto">
                {[{ label: "Any location", value: "" }, ...locations.map((option) => ({
                  label: option,
                  value: option,
                }))].map((option) => (
                  <label key={option.value || "any-location"} className="flex cursor-pointer items-center gap-2 text-sm font-normal text-slate-700">
                    <input
                      type="radio"
                      name="job-location"
                      value={option.value}
                      checked={location === option.value}
                      onChange={() => setLocation(option.value)}
                      className="h-4 w-4 cursor-pointer accent-indigo-600 focus:ring-indigo-500"
                    />
                    <span className="break-words">{option.label}</span>
                  </label>
                ))}
              </div>
            </fieldset>

            <fieldset className="border-t border-slate-100 pt-4">
              <legend className="flex items-center gap-2 text-sm font-medium text-slate-700">
                <BriefcaseBusiness size={15} aria-hidden="true" className="text-slate-400" />
                Job Type
              </legend>
              <div className="mt-3 space-y-2.5">
                {[{ label: "Any job type", value: "" }, ...JOB_TYPES.map((type) => ({
                  label: type,
                  value: type,
                }))].map((option) => (
                  <label key={option.value || "any"} className="flex cursor-pointer items-center gap-2 text-sm font-normal text-slate-700">
                    <input
                      type="radio"
                      name="job-type"
                      value={option.value}
                      checked={jobType === option.value}
                      onChange={() => setJobType(option.value)}
                      className="h-4 w-4 cursor-pointer accent-indigo-600 focus:ring-indigo-500"
                    />
                    {option.label}
                  </label>
                ))}
              </div>
            </fieldset>

            <fieldset className="border-t border-slate-100 pt-4">
              <legend className="flex items-center gap-2 text-sm font-medium text-slate-700">
                <Tags size={15} aria-hidden="true" className="text-slate-400" />
                Required Skill
              </legend>
              <div className="mt-3 max-h-52 space-y-2.5 overflow-y-auto">
                {skills.map((option) => (
                  <label key={option} className="flex cursor-pointer items-center gap-2 text-sm font-normal text-slate-700">
                    <input
                      type="checkbox"
                      checked={selectedSkills.includes(option)}
                      onChange={(event) => {
                        setSelectedSkills((currentSkills) =>
                          event.target.checked
                            ? [...currentSkills, option]
                            : currentSkills.filter((selected) => selected !== option)
                        );
                      }}
                      className="h-4 w-4 cursor-pointer rounded border-slate-300 accent-indigo-600 focus:ring-indigo-500"
                    />
                    <span className="break-words">{option}</span>
                  </label>
                ))}
                {skills.length === 0 && (
                  <p className="text-sm font-normal text-slate-500">No skills listed.</p>
                )}
              </div>
            </fieldset>

            <button
              type="button"
              onClick={clearFilters}
              className="w-full cursor-pointer rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              Clear filters
            </button>
          </div>
        </section>
      </aside>

      <section aria-labelledby="jobs-heading" className="min-w-0 lg:col-span-4">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 id="jobs-heading" className="text-2xl font-bold tracking-tight text-slate-900">
              Find Jobs
            </h1>
            <p className="mt-1 text-sm text-slate-500" aria-live="polite">
              {filteredJobs.length} {filteredJobs.length === 1 ? "job" : "jobs"} found
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={findBestJobs}
              disabled={matching}
              className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-indigo-200 bg-white px-3 py-2 text-sm font-semibold text-indigo-700 hover:bg-indigo-50 disabled:cursor-wait disabled:opacity-60"
            >
              <Sparkles size={15} aria-hidden="true" />
              {matching ? "Finding..." : "AI matches"}
            </button>
            {recommendedJobs !== null && (
              <button
                type="button"
                onClick={showAllJobs}
                className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                <BriefcaseBusiness size={15} aria-hidden="true" />
                All jobs
              </button>
            )}
          </div>
        </div>

        <label className="mb-4 flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm focus-within:border-indigo-400 focus-within:ring-2 focus-within:ring-indigo-100">
          <Search size={18} aria-hidden="true" className="shrink-0 text-slate-400" />
          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search by job title, company, or skill"
            aria-label="Search jobs"
            className="w-full bg-transparent text-sm text-slate-900 outline-none placeholder:text-slate-400"
          />
        </label>

        {matchMessage && (
          <p
            role={matchError ? "alert" : "status"}
            className={`mb-4 rounded-lg border p-3 text-sm ${
              matchError
                ? "border-rose-200 bg-rose-50 text-rose-800"
                : "border-indigo-100 bg-indigo-50 text-indigo-800"
            }`}
          >
            {matchMessage}
          </p>
        )}

        {filteredJobs.length === 0 ? (
          <div className="rounded-xl border border-slate-200 bg-white p-8 text-center shadow-sm">
            <p className="font-semibold text-slate-900">
              {recommendedJobs !== null && visibleJobs.length === 0
                ? "No job matches were found"
                : jobs.length === 0
                  ? "No jobs are available right now"
                  : "No jobs match these filters"}
            </p>
            <p className="mt-2 text-sm text-slate-600">
              {recommendedJobs !== null && visibleJobs.length === 0
                ? "Try updating your profile or view all available jobs."
                : jobs.length === 0
                  ? "Check back soon for new opportunities."
                  : "Try a different search or clear your filters."}
            </p>
            {filteredJobs.length === 0 && jobs.length > 0 && (
              <button
                type="button"
                onClick={clearFilters}
                className="mt-4 cursor-pointer rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
              >
                Clear filters
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {filteredJobs.map((job) => (
              <article
                key={job.id}
                className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition-shadow hover:shadow-md sm:p-5"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h2 className="text-lg font-bold leading-snug text-slate-900">
                      {job.title}
                    </h2>
                    <p className="mt-1 flex items-center gap-2 text-sm font-medium text-slate-600">
                      <Building2 size={15} aria-hidden="true" className="shrink-0 text-slate-400" />
                      {job.company}
                    </p>
                  </div>
                  <Link
                    href={`/employee/jobs/${encodeURIComponent(job.id)}`}
                    aria-label={`View details for ${job.title}`}
                    className="inline-flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-full border border-slate-200 text-slate-500 hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700"
                  >
                    <ChevronRight size={19} aria-hidden="true" />
                  </Link>
                </div>

                <div className="mt-3 flex items-end justify-between gap-3">
                  <div className="flex flex-col items-start gap-2">
                    <p className="flex items-center gap-2 text-sm text-slate-500">
                      <MapPin size={15} aria-hidden="true" className="shrink-0 text-slate-400" />
                      {job.location}
                    </p>
                    <span className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700">
                      {job.job_type}
                    </span>
                  </div>
                  <ApplyNowButton
                    jobId={job.id}
                    alreadyApplied={job.has_applied}
                  />
                </div>
                {recommendedJobs !== null && (
                  <div className="mt-4 rounded-lg border border-emerald-100 bg-emerald-50 p-3">
                    <p className="text-sm font-semibold text-emerald-800">
                      {job.score}% match
                    </p>
                    <p className="mt-1 text-sm leading-5 text-emerald-900">
                      {job.explanation}
                    </p>
                  </div>
                )}
              </article>
            ))}
          </div>
        )}
      </section>

      <aside className="self-start lg:sticky lg:top-6 lg:col-span-2">
        <section className="rounded-xl border border-slate-200 bg-white px-4 py-5 shadow-sm">
          {profile ? (
            <div className="flex flex-col items-center text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-indigo-50 text-indigo-700">
                <UserRound size={22} aria-hidden="true" />
              </div>
              <p className="mt-3 break-words font-semibold text-slate-900">
                {profile.name || "Name not set"}
              </p>
              <div className="mt-4 w-full border-t border-slate-100 pt-4">
                {/* <h3 className="text-left text-sm font-medium text-slate-700">Skills</h3> */}
                <div className="mt-2 flex flex-wrap justify-center gap-1.5">
                  {Array.isArray(profile.skills) && profile.skills.length ? profile.skills.map((item) => (
                    <span key={item} className="rounded-md bg-slate-100 px-2 py-1 text-xs font-medium text-slate-700">
                      {item}
                    </span>
                  )) : <span className="text-sm text-slate-500">No skills added yet.</span>}
                </div>
              </div>
            </div>
          ) : (
            <p className="text-sm text-slate-600">
              Profile details are currently unavailable.
            </p>
          )}
          <Link
            href="/employee/profile"
            className="mt-4 inline-flex w-full cursor-pointer items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700"
          >
            <UserRound size={16} aria-hidden="true" />
            Update Profile
          </Link>
        </section>
      </aside>
    </div>
  );
}