
import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import pool from "@/lib/db";
import { getResumeDisplayName } from "@/lib/resume";

function isDatabaseConnectionError(error) {
  const errorMessage = [error?.message, error?.cause?.message]
    .filter((message) => typeof message === "string")
    .join(" ");

  return (
    (typeof error?.code === "string" &&
      (error.code.startsWith("08") ||
        ["53300", "57P01", "57P02", "57P03"].includes(error.code))) ||
    /connection terminated|connection timeout|timeout exceeded when trying to connect|ECONNRESET|ECONNREFUSED|ETIMEDOUT|EHOSTUNREACH|ENETUNREACH/i
      .test(errorMessage)
  );
}

export async function GET() {
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
        { message: "Employee access only" },
        { status: 403 }
      );
    }

    const result = await pool.query(
      `SELECT u.name, u.email,
              ep.skills, ep.experience_years,
              ep.preferred_location, ep.preferred_job_type,
              ep.resume_path,
              COALESCE(NULLIF(BTRIM(ep.resume_text), ''), '') <> '' AS has_resume_text
       FROM users u
       LEFT JOIN employee_profiles ep ON ep.user_id = u.id
       WHERE u.id = $1`,
      [user.id]
    );

    if (!result.rows.length) {
      return NextResponse.json(
        { message: "User not found" },
        { status: 404 }
      );
    }

    const profile = result.rows[0];
    return NextResponse.json({
      profile: {
        ...profile,
        resume_name: getResumeDisplayName(profile.resume_path),
      },
    });
  } catch (error) {
    console.error("Profile fetch error:", error);
    if (isDatabaseConnectionError(error)) {
      return NextResponse.json(
        {
          message: "Could not connect to PostgreSQL. Check that the configured database endpoint is reachable; for Supabase, use the Session Pooler endpoint when direct IPv6 access is unavailable.",
        },
        { status: 503 }
      );
    }

    return NextResponse.json(
      { message: "Unable to load profile" },
      { status: 500 }
    );
  }
}

export async function PUT(request) {
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
        { message: "Employee access only" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const name = typeof body.name === "string" ? body.name.trim() : "";
    const skills = Array.isArray(body.skills)
      ? body.skills.filter(
          (skill) => typeof skill === "string" && skill.trim()
        ).map((skill) => skill.trim()).slice(0, 50)
      : [];
    const experienceYears = Number(body.experience_years);
    const location = typeof body.preferred_location === "string"
      ? body.preferred_location.trim()
      : "";
    const jobType = typeof body.preferred_job_type === "string"
      ? body.preferred_job_type.trim()
      : "";

    if (!name || name.length > 100) {
      return NextResponse.json(
        { message: "Enter a valid name (maximum 100 characters)" },
        { status: 400 }
      );
    }

    if (
      !Number.isInteger(experienceYears) ||
      experienceYears < 0 ||
      experienceYears > 60
    ) {
      return NextResponse.json(
        { message: "Experience must be between 0 and 60 years" },
        { status: 400 }
      );
    }

    if (location.length > 150 || jobType.length > 50) {
      return NextResponse.json(
        { message: "Location or job type is too long" },
        { status: 400 }
      );
    }

    const client = await pool.connect();
    let connectionError;
    try {
      await client.query("BEGIN");
      await client.query(
        "UPDATE users SET name = $1 WHERE id = $2",
        [name, user.id]
      );

      await client.query(
        `INSERT INTO employee_profiles
           (user_id, skills, experience_years,
            preferred_location, preferred_job_type)
         VALUES ($1, $2, $3, $4, $5)
         ON CONFLICT (user_id)
         DO UPDATE SET
           skills = EXCLUDED.skills,
           experience_years = EXCLUDED.experience_years,
           preferred_location = EXCLUDED.preferred_location,
           preferred_job_type = EXCLUDED.preferred_job_type,
           updated_at = NOW()`,
        [user.id, skills, experienceYears, location, jobType]
      );

      await client.query("COMMIT");
    } catch (error) {
      try {
        await client.query("ROLLBACK");
      } catch (rollbackError) {
        connectionError = rollbackError;
        console.error("Profile save rollback error:", rollbackError);
      }
      throw error;
    } finally {
      client.release(connectionError);
    }

    return NextResponse.json({
      message: "Profile saved successfully",
    });
  } catch (error) {
    console.error("Profile save error:", error);
    if (isDatabaseConnectionError(error)) {
      return NextResponse.json(
        {
          message: "Could not connect to PostgreSQL. Check that the configured database endpoint is reachable; for Supabase, use the Session Pooler endpoint when direct IPv6 access is unavailable.",
        },
        { status: 503 }
      );
    }

    return NextResponse.json(
      { message: "Unable to save profile" },
      { status: 500 }
    );
  }
}
