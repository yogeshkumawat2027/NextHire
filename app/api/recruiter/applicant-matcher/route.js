import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { matchApplicants } from "@/lib/ai/applicant-matcher";
import pool from "@/lib/db";

async function getRecruiter() {
  const user = await getCurrentUser();
  if (!user) {
    return {
      response: NextResponse.json(
        { message: "Please log in first" },
        { status: 401 }
      ),
    };
  }
  if (user.role !== "recruiter") {
    return {
      response: NextResponse.json(
        { message: "Recruiter access only" },
        { status: 403 }
      ),
    };
  }
  return { user };
}

function logMatcherError(context, error) {
  console.error(context, {
    name: error?.name,
    status: error?.status,
    code: error?.code,
  });
}

export async function POST(request) {
  const { user, response } = await getRecruiter();
  if (response) return response;

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { message: "Request body must be valid JSON" },
      { status: 400 }
    );
  }

  const jobId = typeof body?.jobId === "string"
    ? body.jobId
    : String(body?.jobId ?? "");
  if (!/^[1-9]\d*$/.test(jobId)) {
    return NextResponse.json(
      { message: "Choose a valid job." },
      { status: 400 }
    );
  }

  try {
    const jobResult = await pool.query(
      `SELECT id, title, company, location, job_type, description, skills
       FROM jobs
       WHERE id = $1 AND recruiter_id = $2`,
      [jobId, user.id]
    );
    const job = jobResult.rows[0];
    if (!job) {
      return NextResponse.json(
        { message: "Job not found." },
        { status: 404 }
      );
    }

    const applicantResult = await pool.query(
      `SELECT a.id AS application_id,
              u.id AS candidate_id, u.name, u.email,
              ep.skills, ep.experience_years, ep.resume_text
       FROM applications a
       JOIN users u ON u.id = a.employee_id AND u.role = 'employee'
       LEFT JOIN employee_profiles ep ON ep.user_id = u.id
       WHERE a.job_id = $1
       ORDER BY a.id`,
      [job.id]
    );

    const { requiredSkills, matches } = await matchApplicants(
      job,
      applicantResult.rows
    );

    return NextResponse.json({
      job: {
        id: String(job.id),
        title: job.title,
        company: job.company,
      },
      applicantCount: applicantResult.rows.length,
      requiredSkills,
      matches,
    });
  } catch (error) {
    logMatcherError("AI applicant matching failed:", error);

    if (error.status === 503) {
      return NextResponse.json(
        { message: "AI applicant matching is not configured." },
        { status: 503 }
      );
    }
    if (error.status === 429) {
      return NextResponse.json(
        { message: "AI matching is busy. Please try again shortly." },
        { status: 429 }
      );
    }
    if (error.message?.startsWith("Groq returned")) {
      return NextResponse.json(
        { message: "The AI response could not be validated. Please retry." },
        { status: 502 }
      );
    }

    return NextResponse.json(
      { message: "Unable to match applicants right now. Please try again." },
      { status: 500 }
    );
  }
}
