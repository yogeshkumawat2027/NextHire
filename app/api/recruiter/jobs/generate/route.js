import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { generateJobDraft } from "@/lib/ai/job-draft";

const MAX_BRIEF_LENGTH = 2000;

export async function POST(request) {
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

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { message: "Request body must be valid JSON" },
      { status: 400 }
    );
  }

  if (
    !body ||
    typeof body.jobBrief !== "string" ||
    body.jobBrief.trim().length < 10 ||
    body.jobBrief.length > MAX_BRIEF_LENGTH ||
    (body.currentDraft !== undefined &&
      (!body.currentDraft || typeof body.currentDraft !== "object" ||
        Array.isArray(body.currentDraft)))
  ) {
    return NextResponse.json(
      { message: "Provide a job brief between 10 and 2,000 characters." },
      { status: 400 }
    );
  }

  try {
    const draft = await generateJobDraft(body.jobBrief, body.currentDraft);
    return NextResponse.json({ draft });
  } catch (error) {
    console.error("AI job draft generation failed:", {
      name: error.name,
      status: error.status,
      code: error.code,
    });

    if (error.status === 503) {
      return NextResponse.json(
        { message: "AI job drafting is not configured." },
        { status: 503 }
      );
    }

    if (error.status === 429) {
      return NextResponse.json(
        { message: "AI drafting is busy. Please try again shortly." },
        { status: 429 }
      );
    }

    return NextResponse.json(
      { message: "Unable to generate a job draft. Please try again." },
      { status: 502 }
    );
  }
}
