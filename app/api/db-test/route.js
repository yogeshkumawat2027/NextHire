import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import pool, { logDatabaseError } from "@/lib/db";

export async function GET() {
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

  const startedAt = Date.now();
  try {
    await pool.query("SELECT 1");
    return NextResponse.json({
      ok: true,
      latencyMs: Date.now() - startedAt,
    });
  } catch (error) {
    logDatabaseError("Database health check failed:", error);
    return NextResponse.json(
      { ok: false, message: "Database connection is temporarily unavailable." },
      { status: 503 }
    );
  }
}
