
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

    if (user.role !== "recruiter") {
      return NextResponse.json(
        { message: "Only recruiters can create jobs" },
        { status: 403 }
      );
    }

    const {
      title,
      company,
      location,
      jobType,
      description,
      skills,
    } = await request.json();

    if (
      !title?.trim() ||
      !company?.trim() ||
      !location?.trim() ||
      !jobType?.trim() ||
      !description?.trim()
    ) {
      return NextResponse.json(
        { message: "Please fill in all required fields" },
        { status: 400 }
      );
    }

    const result = await pool.query(
      `INSERT INTO jobs
       (recruiter_id, title, company, location, job_type, description, skills)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [
        user.id,
        title.trim(),
        company.trim(),
        location.trim(),
        jobType.trim(),
        description.trim(),
        Array.isArray(skills)
          ? skills.filter((skill) => typeof skill === "string")
          : [],
      ]
    );

    return NextResponse.json(
      {
        message: "Job created successfully",
        job: result.rows[0],
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Create job error:", error);

    return NextResponse.json(
      { message: "Unable to create job" },
      { status: 500 }
    );
  }
}
