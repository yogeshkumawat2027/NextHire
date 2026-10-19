
"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  BriefcaseBusiness,
  Building2,
  FileText,
  LoaderCircle,
  MapPin,
  Plus,
  Sparkles,
  Tags,
  WandSparkles,
} from "lucide-react";

export default function CreateJobPage() {
  const [form, setForm] = useState({
    title: "",
    company: "",
    location: "",
    jobType: "Full-time",
    description: "",
    skills: "",
  });

  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [jobBrief, setJobBrief] = useState("");
  const [generatingDraft, setGeneratingDraft] = useState(false);
  const [draftMessage, setDraftMessage] = useState("");
  const [showAiDraft, setShowAiDraft] = useState(false);

  function handleChange(event) {
    setForm({
      ...form,
      [event.target.name]: event.target.value,
    });
  }

  async function handleGenerateDraft(event) {
    event.preventDefault();
    setDraftMessage("");
    setGeneratingDraft(true);

    try {
      const response = await fetch("/api/recruiter/jobs/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jobBrief,
          currentDraft: {
            title: form.title,
            location: form.location,
            jobType: form.jobType,
            description: form.description,
            skills: form.skills
              .split(",")
              .map((skill) => skill.trim())
              .filter(Boolean),
          },
        }),
      });
      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.message || "Unable to generate a job draft.");
      }

      const draft = data.draft;
      setForm((current) => ({
        ...current,
        title: draft.title || current.title,
        location: draft.location || current.location,
        jobType: draft.jobType || current.jobType,
        description: draft.description || current.description,
        skills: Array.isArray(draft.skills) && draft.skills.length
          ? draft.skills.join(", ")
          : current.skills,
      }));
      setDraftMessage("AI draft added. Review and edit every field before posting.");
    } catch (error) {
      setDraftMessage(error.message || "Unable to generate a job draft.");
    } finally {
      setGeneratingDraft(false);
    }
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setMessage("");
    setLoading(true);

    try {
      const response = await fetch("/api/jobs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          skills: form.skills
            .split(",")
            .map((skill) => skill.trim())
            .filter(Boolean),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setMessage(data.message || "Unable to create job");
        return;
      }

      setMessage("Job created successfully!");

      setForm({
        title: "",
        company: "",
        location: "",
        jobType: "Full-time",
        description: "",
        skills: "",
      });
    } catch {
      setMessage("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  const inputClass =
    "w-full rounded-lg border border-slate-300 bg-white px-4 py-3 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100";

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-10 text-slate-900">
      <div className="mx-auto max-w-3xl">
        <Link
          href="/recruiter/dashboard"
          className="inline-flex items-center gap-2 text-sm font-medium text-indigo-600 hover:underline"
        >
          <ArrowLeft size={15} aria-hidden="true" />
          Back to Dashboard
        </Link>

        <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <p className="text-sm font-semibold uppercase tracking-wider text-indigo-600">
            Recruiter Workspace
          </p>

          <div className="mt-2 flex flex-wrap items-center justify-between gap-3">
            <h1 className="flex items-center gap-2 text-3xl font-bold">
              <BriefcaseBusiness size={25} aria-hidden="true" className="text-indigo-600" />
              Create a Job
            </h1>
            <button
              type="button"
              aria-expanded={showAiDraft}
              aria-controls="ai-job-draft"
              onClick={() => setShowAiDraft((isOpen) => !isOpen)}
              className="inline-flex items-center gap-2 rounded-lg border border-indigo-200 bg-indigo-50 px-4 py-2 text-sm font-semibold text-indigo-700 hover:bg-indigo-100"
            >
              <Sparkles size={16} aria-hidden="true" />
              {showAiDraft ? "Close AI" : "Fill with AI"}
            </button>
          </div>

          <p className="mt-2 text-slate-600">
            Add an opportunity for employees to discover.
          </p>

          {showAiDraft && (
            <section
              id="ai-job-draft"
              className="mt-6 rounded-xl border border-indigo-100 bg-indigo-50/60 p-4"
            >
              <h2 className="flex items-center gap-2 font-semibold text-slate-900">
                <WandSparkles size={17} aria-hidden="true" className="text-indigo-600" />
                Fill with AI
              </h2>
              <p className="mt-1 text-sm text-slate-600">
                Describe the role briefly. AI will suggest a title, location,
                job type, skills, and description. Your company name stays yours
                to enter.
              </p>
              <form onSubmit={handleGenerateDraft} className="mt-3 space-y-3">
                <label htmlFor="job-brief" className="sr-only">
                  Briefly describe the job
                </label>
                <textarea
                  id="job-brief"
                  value={jobBrief}
                  onChange={(event) => setJobBrief(event.target.value)}
                  maxLength={2000}
                  minLength={10}
                  rows={3}
                  required
                  placeholder="Example: Hiring a mid-level React developer in Jaipur to build accessible web apps; 3+ years of experience."
                  className={inputClass}
                />
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <p className="text-xs text-slate-500">
                    10–2,000 characters. Generated suggestions remain editable.
                  </p>
                  <button
                    type="submit"
                    disabled={generatingDraft || jobBrief.trim().length < 10}
                    className="inline-flex items-center gap-2 rounded-lg border border-indigo-200 bg-white px-4 py-2 text-sm font-semibold text-indigo-700 hover:bg-indigo-100 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {generatingDraft
                      ? <LoaderCircle size={15} className="animate-spin" aria-hidden="true" />
                      : <Sparkles size={15} aria-hidden="true" />}
                    {generatingDraft ? "Generating draft..." : "Generate Job Draft"}
                  </button>
                </div>
              </form>
              {draftMessage && (
                <p
                  role="status"
                  className="mt-3 rounded-lg bg-white p-3 text-sm text-indigo-800"
                >
                  {draftMessage}
                </p>
              )}
            </section>
          )}

          <form onSubmit={handleSubmit} className="mt-8 space-y-5">
            <div>
              <label className="mb-2 flex items-center gap-2 font-medium">
                <BriefcaseBusiness size={16} aria-hidden="true" className="text-slate-400" />
                Job Title *
              </label>
              <input
                className={inputClass}
                name="title"
                value={form.title}
                onChange={handleChange}
                placeholder="Frontend Developer"
                required
              />
            </div>

            <div>
              <label className="mb-2 flex items-center gap-2 font-medium">
                <Building2 size={16} aria-hidden="true" className="text-slate-400" />
                Company *
              </label>
              <input
                className={inputClass}
                name="company"
                value={form.company}
                onChange={handleChange}
                placeholder="Company name"
                required
              />
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <label className="mb-2 flex items-center gap-2 font-medium">
                  <MapPin size={16} aria-hidden="true" className="text-slate-400" />
                  Location *
                </label>
                <input
                  className={inputClass}
                  name="location"
                  value={form.location}
                  onChange={handleChange}
                  placeholder="Jaipur / Remote"
                  required
                />
              </div>

              <div>
                <label className="mb-2 flex items-center gap-2 font-medium">
                  <BriefcaseBusiness size={16} aria-hidden="true" className="text-slate-400" />
                  Job Type *
                </label>
                <select
                  className={inputClass}
                  name="jobType"
                  value={form.jobType}
                  onChange={handleChange}
                >
                  <option>Full-time</option>
                  <option>Part-time</option>
                  <option>Internship</option>
                  <option>Contract</option>
                </select>
              </div>
            </div>

            <div>
              <label className="mb-2 flex items-center gap-2 font-medium">
                <Tags size={16} aria-hidden="true" className="text-slate-400" />
                Required Skills
              </label>
              <input
                className={inputClass}
                name="skills"
                value={form.skills}
                onChange={handleChange}
                placeholder="React, JavaScript, CSS"
              />
              <p className="mt-1 text-sm text-slate-500">
                Separate skills with commas.
              </p>
            </div>

            <div>
              <label className="mb-2 flex items-center gap-2 font-medium">
                <FileText size={16} aria-hidden="true" className="text-slate-400" />
                Job Description *
              </label>
              <textarea
                className={inputClass}
                name="description"
                value={form.description}
                onChange={handleChange}
                placeholder="Describe the responsibilities and requirements..."
                rows={6}
                required
              />
            </div>

            {message && (
              <p
                role="status"
                className="rounded-lg bg-indigo-50 p-3 text-sm text-indigo-700"
              >
                {message}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-indigo-600 px-5 py-3 font-semibold text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? (
                <LoaderCircle size={17} className="animate-spin" aria-hidden="true" />
              ) : (
                <Plus size={17} aria-hidden="true" />
              )}
              {loading ? "Creating Job..." : "Create Job"}
              {!loading && <ArrowRight size={16} aria-hidden="true" />}
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}
