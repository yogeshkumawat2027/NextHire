import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { matchCandidates } from "@/lib/ai/candidate-matcher";

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
    typeof body.jobDescription !== "string" ||
    body.jobDescription.trim().length < 20 ||
    body.jobDescription.length > 12000
  ) {
    return NextResponse.json(
      { message: "Provide a job description between 20 and 12,000 characters." },
      { status: 400 }
    );
  }

  try {
    const result = await matchCandidates(body.jobDescription);
    return NextResponse.json(result);
  } catch (error) {
    console.error("AI candidate matching failed:", {
      name: error.name,
      status: error.status,
      code: error.code,
      message: String(error.message || "Unknown error").slice(0, 300),
      filterField: error.filterField,
      filterExpected: error.filterExpected,
      filterActual: error.filterActual,
    });

    if (error.status === 429) {
      return NextResponse.json(
        { message: "AI matching is busy. Please try again shortly." },
        { status: 429 }
      );
    }

    if (error.status === 503) {
      return NextResponse.json(
        { message: "AI candidate matching is not configured." },
        { status: 503 }
      );
    }

    if (error.status === 400 || error.status === 401 || error.status === 403) {
      return NextResponse.json(
        { message: "The AI matching request could not be completed." },
        { status: 502 }
      );
    }

    if (error.message?.startsWith("Groq returned")) {
      return NextResponse.json(
        { message: "The AI response could not be validated. Please retry." },
        { status: 502 }
      );
    }

    return NextResponse.json(
      { message: "Unable to match candidates right now. Please try again." },
      { status: 500 }
    );
  }
}


