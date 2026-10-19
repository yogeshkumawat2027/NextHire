"use client";

import { useState } from "react";
import { Check, LoaderCircle } from "lucide-react";

export default function ApplyNowButton({ jobId, alreadyApplied }) {
  const [applied, setApplied] = useState(alreadyApplied);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [hasError, setHasError] = useState(false);

  async function apply() {
    setSubmitting(true);
    setMessage("");
    setHasError(false);

    try {
      const response = await fetch("/api/employee/applications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jobId }),
      });
      const data = await response.json().catch(() => ({}));

      if (response.status === 409) {
        setApplied(true);
        setMessage(data.message || "You already applied for this job.");
        return;
      }

      if (!response.ok) {
        throw new Error(data.message || "Unable to submit your application.");
      }

      setApplied(true);
      setMessage(data.message || "Your application was submitted.");
    } catch (error) {
      setHasError(true);
      setMessage(error.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div>
      <button
        type="button"
        onClick={apply}
        disabled={applied || submitting}
        className="inline-flex cursor-pointer items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 font-semibold text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-slate-300"
      >
        {submitting ? (
          <LoaderCircle size={16} className="animate-spin" aria-hidden="true" />
        ) : applied ? (
          <Check size={16} aria-hidden="true" />
        ) : null}
        {submitting ? "Applying..." : applied ? "Applied" : "Apply Now"}
      </button>
      {message && (
        <p
          role={hasError ? "alert" : "status"}
          className={`mt-2 text-sm ${
            hasError ? "text-rose-700" : "text-emerald-700"
          }`}
        >
          {message}
        </p>
      )}
    </div>
  );
}