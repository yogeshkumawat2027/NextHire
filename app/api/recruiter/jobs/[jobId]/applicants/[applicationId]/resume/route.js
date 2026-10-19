import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getResumeDisplayName } from "@/lib/resume";
import pool from "@/lib/db";

export async function GET(request, { params }) {
  try {
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
    if (
      !/^[1-9]\d*$/.test(jobId) ||
      !/^[1-9]\d*$/.test(applicationId)
    ) {
      return NextResponse.json({ message: "Applicant not found" }, { status: 404 });
    }

    const result = await pool.query(
      `SELECT ep.resume_path
       FROM applications a
       JOIN jobs j ON j.id = a.job_id AND j.recruiter_id = $1
       JOIN users u ON u.id = a.employee_id AND u.role = 'employee'
       JOIN employee_profiles ep ON ep.user_id = u.id
       WHERE j.id = $2 AND a.id = $3`,
      [user.id, jobId, applicationId]
    );

    const resumePath = result.rows[0]?.resume_path;
    if (!resumePath) {
      return NextResponse.json(
        { message: "No resume is available for this applicant." },
        { status: 404 }
      );
    }

    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!supabaseUrl || !supabaseServiceKey) {
      console.error("Resume storage configuration is missing");
      return NextResponse.json(
        { message: "Resume storage is not configured." },
        { status: 503 }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const preview = new URL(request.url).searchParams.get("preview") === "1";
    const { data, error } = await supabase.storage
      .from("resumes")
      .createSignedUrl(
        resumePath,
        60,
        preview
          ? {}
          : { download: getResumeDisplayName(resumePath) || "Resume.pdf" }
      );

    if (error || !data?.signedUrl) {
      console.error("Applicant resume download URL error:", error?.message);
      return NextResponse.json(
        { message: "Unable to prepare the resume download." },
        { status: 502 }
      );
    }

    return NextResponse.redirect(data.signedUrl);
  } catch (error) {
    console.error("Applicant resume download error:", error);
    return NextResponse.json(
      { message: "Unable to download this applicant's resume." },
      { status: 500 }
    );
  }
}
