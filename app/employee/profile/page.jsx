
"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import {
  ArrowLeft,
  ExternalLink,
  FileText,
  LoaderCircle,
  Pencil,
  RefreshCw,
  Save,
  Upload,
  UserRound,
  X,
} from "lucide-react";

export default function EmployeeProfilePage() {
  const [profile, setProfile] = useState({
    name: "",
    email: "",
    skills: [],
    experience_years: 0,
    preferred_location: "",
    preferred_job_type: "Full-time",
    resume_path: null,
    resume_name: null,
    has_resume_text: false,
  });
  const [savedProfile, setSavedProfile] = useState(null);
  const [editing, setEditing] = useState(false);

  const [skillsText, setSkillsText] = useState("");
  const resumeInputRef = useRef(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [loadingResume, setLoadingResume] = useState(false);
  const [resumeUrl, setResumeUrl] = useState("");
  const [resumePreviewError, setResumePreviewError] = useState("");
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("info");

  async function loadResumePreview() {
    setLoadingResume(true);
    setResumePreviewError("");

    try {
      const response = await fetch("/api/employee/resume");
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Could not load PDF preview");
      }

      if (typeof data.signedUrl !== "string" || !data.signedUrl) {
        throw new Error("The secure PDF link was not returned.");
      }

      setResumeUrl(data.signedUrl);
      if (typeof data.resumeName === "string") {
        setProfile((previous) => ({
          ...previous,
          resume_name: data.resumeName,
        }));
      }
    } catch (error) {
      setResumeUrl("");
      setResumePreviewError(error.message);
    } finally {
      setLoadingResume(false);
    }
  }

  useEffect(() => {
    async function loadProfile() {
      try {
        const response = await fetch("/api/employee/profile");
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || "Could not load profile");
        }

        setProfile(data.profile);
  setSavedProfile(data.profile);
        setSkillsText((data.profile.skills || []).join(", "));
        if (data.profile.resume_path) {
          await loadResumePreview();
        }
      } catch (error) {
        setMessage(error.message);
        setMessageType("error");
      } finally {
        setLoading(false);
      }
    }

    loadProfile();
  }, []);

  async function saveProfile(event) {
    event.preventDefault();
    setSaving(true);
    setMessage("");
    setMessageType("info");

    try {
      const updatedProfile = {
        ...profile,
        name: profile.name.trim(),
        skills: skillsText
          .split(",")
          .map((skill) => skill.trim())
          .filter(Boolean),
        experience_years: Number(profile.experience_years),
        preferred_location: String(profile.preferred_location || "").trim(),
        preferred_job_type: String(profile.preferred_job_type || "").trim(),
      };

      const response = await fetch("/api/employee/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: updatedProfile.name,
          skills: updatedProfile.skills,
          experience_years: updatedProfile.experience_years,
          preferred_location: updatedProfile.preferred_location,
          preferred_job_type: updatedProfile.preferred_job_type,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Could not save profile");
      }

      setProfile(updatedProfile);
      setSavedProfile(updatedProfile);
      setSkillsText(updatedProfile.skills.join(", "));
      setEditing(false);
      setMessage(data.message);
      setMessageType("success");
    } catch (error) {
      setMessage(error.message);
      setMessageType("error");
    } finally {
      setSaving(false);
    }
  }

  function cancelProfileEdit() {
    if (savedProfile) {
      setProfile(savedProfile);
      setSkillsText((savedProfile.skills || []).join(", "));
    }
    setEditing(false);
  }

  async function uploadResume(file) {
    if (!file) return;

    if (file.size === 0 || file.size > 5 * 1024 * 1024) {
      setMessage("Choose a non-empty PDF no larger than 5 MB.");
      setMessageType("error");
      return;
    }

    setUploading(true);
    setMessage("");
    setMessageType("info");

    try {
      const formData = new FormData();
      formData.append("resume", file);

      const response = await fetch("/api/employee/resume", {
        method: "POST",
        body: formData,
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.message || "Resume upload failed");
      }

      if (
        typeof data.resumePath !== "string" ||
        typeof data.resumeName !== "string" ||
        !Number.isInteger(data.resumeTextLength) ||
        data.resumeTextLength < 1
      ) {
        throw new Error("Resume upload returned no saved readable text. Please retry.");
      }

      setProfile((previous) => ({
        ...previous,
        resume_path: data.resumePath,
        resume_name: data.resumeName,
        has_resume_text: data.resumeTextLength > 0,
      }));

      setResumeUrl("");
      setMessage(data.message);
      setMessageType("success");
      await loadResumePreview();
    } catch (error) {
      setMessage(error.message);
      setMessageType("error");
    } finally {
      setUploading(false);
    }
  }

  if (loading) {
    return (
      <main className="flex items-center gap-2 p-8 text-slate-600">
        <LoaderCircle size={18} className="animate-spin" aria-hidden="true" />
        Loading profile...
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-10">
      <div className="mx-auto max-w-3xl space-y-6">
        <Link
          href="/employee/dashboard"
          className="inline-flex cursor-pointer items-center gap-2 text-sm font-semibold text-indigo-600 hover:underline"
        >
          <ArrowLeft size={16} aria-hidden="true" />
          Back to Dashboard
        </Link>
        <header className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="font-semibold text-indigo-600">NextHire</p>
            <h1 className="mt-2 flex items-center gap-2 text-3xl font-bold text-slate-900">
              <UserRound size={27} aria-hidden="true" className="text-indigo-600" />
              My Profile
            </h1>
            <p className="mt-2 text-slate-600">
              Complete your profile and upload your resume.
            </p>
          </div>
          <nav aria-label="Employee navigation" className="flex flex-wrap gap-2">
            {editing && (
              <button
                type="button"
                onClick={cancelProfileEdit}
                disabled={saving}
                className="cursor-pointer rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <ArrowLeft size={15} aria-hidden="true" />
                Back to Profile
              </button>
            )}
          </nav>
        </header>

        {message && (
          <p
            role={messageType === "error" ? "alert" : "status"}
            className={`rounded-lg p-3 text-sm ${
              messageType === "error"
                ? "bg-rose-50 text-rose-800"
                : messageType === "success"
                  ? "bg-emerald-50 text-emerald-800"
                  : "bg-white text-slate-700"
            }`}
          >
            {message}
          </p>
        )}

        {editing ? (
          <form
            onSubmit={saveProfile}
            className="space-y-5 rounded-2xl border bg-white p-6 shadow-sm"
          >
            <h2 className="flex items-center gap-2 text-xl font-semibold">
              <Pencil size={18} aria-hidden="true" className="text-indigo-600" />
              Update Profile
            </h2>

          <label className="block cursor-pointer text-sm font-medium">
            Full Name
            <input
              required
              maxLength={100}
              value={profile.name || ""}
              onChange={(e) =>
                setProfile({ ...profile, name: e.target.value })
              }
              className="mt-2 w-full rounded-lg border p-3"
            />
          </label>

          <label className="block text-sm font-medium">
            Email
            <input
              disabled
              value={profile.email || ""}
              className="mt-2 w-full rounded-lg border bg-slate-100 p-3"
            />
          </label>

          <label className="block cursor-pointer text-sm font-medium">
            Skills (comma-separated)
            <input
              value={skillsText}
              onChange={(e) => setSkillsText(e.target.value)}
              placeholder="React, JavaScript, SQL"
              className="mt-2 w-full rounded-lg border p-3"
            />
          </label>

          <label className="block cursor-pointer text-sm font-medium">
            Experience (years)
            <input
              type="number"
              min="0"
              max="60"
              step="1"
              required
              value={profile.experience_years ?? 0}
              onChange={(e) =>
                setProfile({
                  ...profile,
                  experience_years: e.target.value,
                })
              }
              className="mt-2 w-full rounded-lg border p-3"
            />
          </label>

          <label className="block cursor-pointer text-sm font-medium">
            Preferred Location
            <input
              maxLength={150}
              value={profile.preferred_location || ""}
              onChange={(e) =>
                setProfile({
                  ...profile,
                  preferred_location: e.target.value,
                })
              }
              placeholder="Jaipur, Remote..."
              className="mt-2 w-full rounded-lg border p-3"
            />
          </label>

          <label className="block cursor-pointer text-sm font-medium">
            Preferred Job Type
            <select
              value={profile.preferred_job_type || "Full-time"}
              onChange={(e) =>
                setProfile({
                  ...profile,
                  preferred_job_type: e.target.value,
                })
              }
              className="mt-2 w-full cursor-pointer rounded-lg border p-3"
            >
              <option>Full-time</option>
              <option>Part-time</option>
              <option>Internship</option>
              <option>Contract</option>
              <option>Remote</option>
            </select>
          </label>

            <div className="flex flex-wrap gap-3">
              <button
                disabled={saving}
                className="inline-flex cursor-pointer items-center gap-2 rounded-lg bg-indigo-600 px-5 py-3 font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
              >
                {saving ? (
                  <LoaderCircle size={16} className="animate-spin" aria-hidden="true" />
                ) : (
                  <Save size={16} aria-hidden="true" />
                )}
                {saving ? "Saving..." : "Save Changes"}
              </button>
              <button
                type="button"
                onClick={cancelProfileEdit}
                disabled={saving}
                className="cursor-pointer rounded-lg border border-slate-300 px-5 py-3 font-semibold text-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <X size={16} aria-hidden="true" />
                Cancel
              </button>
            </div>
          </form>
        ) : (
          <section className="space-y-5 rounded-2xl border bg-white p-6 shadow-sm">
            <h2 className="flex items-center gap-2 text-xl font-semibold">
              <UserRound size={18} aria-hidden="true" className="text-indigo-600" />
              Employee Details
            </h2>
            <dl className="grid gap-5 sm:grid-cols-2">
              <div>
                <dt className="text-sm text-slate-500">Full Name</dt>
                <dd className="mt-1 font-medium text-slate-900">{profile.name}</dd>
              </div>
              <div>
                <dt className="text-sm text-slate-500">Email</dt>
                <dd className="mt-1 break-all font-medium text-slate-900">
                  {profile.email}
                </dd>
              </div>
              <div>
                <dt className="text-sm text-slate-500">Skills</dt>
                <dd className="mt-1 font-medium text-slate-900">
                  {profile.skills?.length ? profile.skills.join(", ") : "Not set"}
                </dd>
              </div>
              <div>
                <dt className="text-sm text-slate-500">Experience</dt>
                <dd className="mt-1 font-medium text-slate-900">
                  {profile.experience_years ?? 0} years
                </dd>
              </div>
              <div>
                <dt className="text-sm text-slate-500">Preferred Location</dt>
                <dd className="mt-1 font-medium text-slate-900">
                  {profile.preferred_location || "Not set"}
                </dd>
              </div>
              <div>
                <dt className="text-sm text-slate-500">Preferred Job Type</dt>
                <dd className="mt-1 font-medium text-slate-900">
                  {profile.preferred_job_type || "Not set"}
                </dd>
              </div>
            </dl>
            <button
              type="button"
              onClick={() => {
                setMessage("");
                setEditing(true);
              }}
              className="inline-flex cursor-pointer items-center gap-2 rounded-lg bg-indigo-600 px-5 py-3 font-semibold text-white hover:bg-indigo-700"
            >
              <Pencil size={16} aria-hidden="true" />
              Update Profile
            </button>
          </section>
        )}

        <section className="space-y-4 rounded-2xl border bg-white p-6 shadow-sm">
          <h2 className="flex items-center gap-2 text-xl font-semibold">
            <FileText size={19} aria-hidden="true" className="text-indigo-600" />
            Resume
          </h2>
          <input
            ref={resumeInputRef}
            type="file"
            accept=".pdf,application/pdf"
            onChange={(event) => {
              const file = event.target.files?.[0];
              event.target.value = "";
              uploadResume(file);
            }}
            className="hidden"
            tabIndex={-1}
            aria-hidden="true"
          />

          <p className="text-sm text-slate-600">
            Upload your resume as a PDF, maximum 5 MB.
          </p>

          <p className={`text-sm ${profile.has_resume_text ? "text-emerald-700" : "text-slate-600"}`}>
            {profile.resume_path
              ? profile.has_resume_text
                ? "Resume uploaded."
                : "Resume stored without readable text. Upload a text-based PDF for resume-based matching."
              : "No resume uploaded yet."}
          </p>

          {profile.resume_path && (
            <div className="space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4">
                <div className="flex min-w-0 items-center gap-3">
                  <span
                    aria-hidden="true"
                    className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-rose-100 text-sm font-bold text-rose-700"
                  >
                    <FileText size={21} aria-hidden="true" />
                  </span>
                  <span className="truncate font-semibold text-slate-900">
                    {profile.resume_name || "Resume.pdf"}
                  </span>
                </div>
                <div className="flex shrink-0 gap-2">
                  {resumeUrl && (
                    <a
                      href={resumeUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                    >
                      <ExternalLink size={15} aria-hidden="true" />
                      Open PDF
                    </a>
                  )}
                  <button
                    type="button"
                    onClick={() => resumeInputRef.current?.click()}
                    disabled={uploading}
                    className="inline-flex cursor-pointer items-center gap-2 rounded-lg bg-indigo-600 px-3 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:cursor-not-allowed"
                  >
                    {uploading
                      ? <LoaderCircle size={15} className="animate-spin" aria-hidden="true" />
                      : <RefreshCw size={15} aria-hidden="true" />}
                    {uploading ? "Replacing..." : "Replace Resume"}
                  </button>
                </div>
              </div>

              {resumePreviewError ? (
                <div className="rounded-lg bg-rose-50 p-4 text-sm text-rose-800">
                  <p role="alert">{resumePreviewError}</p>
                  <button
                    type="button"
                    onClick={loadResumePreview}
                    className="mt-2 inline-flex cursor-pointer items-center gap-1.5 font-semibold underline"
                  >
                    <RefreshCw size={14} aria-hidden="true" />
                    Retry PDF preview
                  </button>
                </div>
              ) : loadingResume ? (
                <p className="rounded-lg border border-slate-200 bg-slate-50 p-8 text-center text-sm text-slate-600">
                  Loading PDF preview...
                </p>
              ) : resumeUrl ? (
                <iframe
                  title={`PDF preview: ${profile.resume_name || "Resume.pdf"}`}
                  src={resumeUrl}
                  className="h-[70vh] min-h-[480px] w-full rounded-xl border border-slate-300 bg-slate-100"
                />
              ) : null}
            </div>
          )}

          {!profile.resume_path && (
            <button
              type="button"
              onClick={() => resumeInputRef.current?.click()}
              disabled={uploading}
              className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-indigo-600 px-5 py-3 font-semibold text-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {uploading
                ? <LoaderCircle size={16} className="animate-spin" aria-hidden="true" />
                : <Upload size={16} aria-hidden="true" />}
              {uploading ? "Uploading..." : "Upload Resume"}
            </button>
          )}
        </section>
      </div>
    </main>
  );
}
