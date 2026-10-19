import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { generateApplicantReport } from "@/lib/ai/applicant-matcher";
import pool from "@/lib/db";

export async function POST(_request, { params }) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json(
      { message: "Please log in first" },
      { status: 401 }
    );
  }
  if (user.role !== "recruiter") {
    return NextResponse.json(
      { message: "Recruiter access only" },
      { status: 403 }
    );
  }

  const { jobId, applicationId } = await params;
  if (!/^[1-9]\d*$/.test(jobId) || !/^[1-9]\d*$/.test(applicationId)) {
    return NextResponse.json(
      { message: "Choose a valid job and application." },
      { status: 400 }
    );
  }

  try {
    const result = await pool.query(
      `SELECT j.id AS job_id, j.title, j.description, j.skills, j.location,
              j.job_type,
              a.id AS application_id,
              u.id AS candidate_id, u.name, u.email,
              ep.experience_years, ep.preferred_location,
              ep.resume_text, ep.skills AS profile_skills
       FROM jobs j
       JOIN applications a ON a.job_id = j.id
       JOIN users u ON u.id = a.employee_id AND u.role = 'employee'
       LEFT JOIN employee_profiles ep ON ep.user_id = u.id
       WHERE j.id = $1 AND j.recruiter_id = $2 AND a.id = $3`,
      [jobId, user.id, applicationId]
    );
    const row = result.rows[0];
    if (!row) {
      return NextResponse.json(
        { message: "Applicant not found for this job." },
        { status: 404 }
      );
    }

    const match = await generateApplicantReport(
      {
        title: row.title,
        description: row.description,
        skills: row.skills,
        location: row.location,
        job_type: row.job_type,
      },
      row,
      String(row.job_id)
    );
    return NextResponse.json({
      job: { id: String(row.job_id), title: row.title },
      match,
    });
  } catch (error) {
    console.error("Applicant report generation failed:", {
      name: error?.name,
      status: error?.status,
      code: error?.code,
      operation: error?.matcherOperation,
    });

    if (error?.status === 503) {
      return NextResponse.json(
        { message: "AI applicant reporting is not configured." },
        { status: 503 }
      );
    }
    if (error?.status === 429) {
      return NextResponse.json(
        { message: "AI reporting is busy. Please try again shortly." },
        { status: 429 }
      );
    }
    if (error?.status === 413) {
      return NextResponse.json(
        { message: "This resume is too large to analyze. Shorten the resume and retry." },
        { status: 413 }
      );
    }
    if (error?.code === "APPLICANT_REPORT_OUTPUT_LIMIT") {
      return NextResponse.json(
        { message: "The AI could not complete this report within its response limit. Please retry, or shorten the resume if the issue continues." },
        { status: 502 }
      );
    }
    if (error?.status === 502) {
      return NextResponse.json(
        { message: "The AI could not return a complete report. Please retry, or shorten the resume if the issue continues." },
        { status: 502 }
      );
    }
    if (error?.status === 400 || error?.message?.startsWith("Groq returned")) {
      return NextResponse.json(
        { message: "The AI could not return a complete report. Please retry, or shorten the resume if the issue continues." },
        { status: 502 }
      );
    }

    return NextResponse.json(
      { message: "Unable to generate this applicant report right now." },
      { status: 500 }
    );
  }
}
