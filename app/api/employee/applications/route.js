import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import pool from "@/lib/db";

export async function POST(request) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { message: "Please log in first" },
        { status: 401 }
      );
    }

    if (user.role !== "employee") {
      return NextResponse.json(
        { message: "Only employees can apply for jobs" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const jobId = String(body.jobId ?? "");

    if (!/^[1-9]\d*$/.test(jobId)) {
      return NextResponse.json(
        { message: "Choose a valid job" },
        { status: 400 }
      );
    }

    const client = await pool.connect();

    try {
      await client.query("BEGIN");
      await client.query(
        "SELECT pg_advisory_xact_lock(hashtext($1), hashtext($2))",
        [String(user.id), jobId]
      );

      const jobResult = await client.query(
        "SELECT id FROM jobs WHERE id = $1",
        [jobId]
      );

      if (!jobResult.rows.length) {
        await client.query("COMMIT");
        return NextResponse.json(
          { message: "This job is no longer available" },
          { status: 404 }
        );
      }

      const existingApplication = await client.query(
        "SELECT id FROM applications WHERE job_id = $1 AND employee_id = $2",
        [jobId, user.id]
      );

      if (existingApplication.rows.length) {
        await client.query("COMMIT");
        return NextResponse.json(
          { message: "You already applied for this job" },
          { status: 409 }
        );
      }

      await client.query(
        `INSERT INTO applications (job_id, employee_id, status)
         VALUES ($1, $2, $3)`,
        [jobId, user.id, "pending"]
      );

      await client.query("COMMIT");

      return NextResponse.json(
        { message: "Your application was submitted successfully" },
        { status: 201 }
      );
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error("Job application error:", error);
    return NextResponse.json(
      { message: "Unable to submit your application. Please try again." },
      { status: 500 }
    );
  }
}