
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createRequire } from "node:module";
import { PDFParse } from "pdf-parse";
import { getCurrentUser } from "@/lib/auth";
import pool from "@/lib/db";
import {
  createResumeStoragePath,
  getResumeDisplayName,
} from "@/lib/resume";

const MAX_RESUME_TEXT_LENGTH = 20000;
const MAX_RESUME_SIZE = 5 * 1024 * 1024;
const MAX_RESUME_PAGES = 50;

const requireFromProject = createRequire(`${process.cwd()}/package.json`);
const pdfParseWorker = requireFromProject("pdf-parse/worker");
const pdfWorkerSource = pdfParseWorker.getData();

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
      `SELECT resume_path
       FROM employee_profiles
       WHERE user_id = $1`,
      [user.id]
    );
    const profile = result.rows[0];

    if (!profile?.resume_path) {
      return NextResponse.json(
        { message: "No resume has been uploaded yet." },
        { status: 404 }
      );
    }

    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!supabaseUrl || !supabaseServiceKey) {
      console.error("Resume storage configuration is missing");
      return NextResponse.json(
        { message: "Resume storage is not configured. Please contact support." },
        { status: 503 }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const { data, error } = await supabase.storage
      .from("resumes")
      .createSignedUrl(profile.resume_path, 300);

    if (error || !data?.signedUrl) {
      console.error("Resume preview URL error:", error);
      return NextResponse.json(
        { message: "Unable to create a secure link for this resume. Please try again." },
        { status: 502 }
      );
    }

    return NextResponse.json({
      resumeName: getResumeDisplayName(profile.resume_path),
      signedUrl: data.signedUrl,
      expiresIn: 300,
    });
  } catch (error) {
    console.error("Resume text fetch error:", error);
    return NextResponse.json(
      { message: "Unable to open the saved resume. Please try again." },
      { status: 500 }
    );
  }
}

async function extractResumeText(bytes) {
  if (typeof pdfWorkerSource !== "string" || !pdfWorkerSource.startsWith("data:")) {
    throw new Error("pdf-parse did not provide an inline PDF worker");
  }

  PDFParse.setWorker(pdfWorkerSource);
  if (PDFParse.setWorker() !== pdfWorkerSource) {
    throw new Error("pdf-parse did not accept its inline PDF worker");
  }

  const parser = new PDFParse({
    data: bytes,
    isEvalSupported: false,
    useSystemFonts: true,
    verbosity: 0,
  });

  try {
    const parsedPdf = await parser.getText({
      first: MAX_RESUME_PAGES,
      itemJoiner: " ",
      pageJoiner: "",
    });

    return (Array.isArray(parsedPdf.pages)
      ? parsedPdf.pages.map((page) => page.text).join(" ")
      : "")
      .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, " ")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, MAX_RESUME_TEXT_LENGTH);
  } finally {
    await parser.destroy();
  }
}

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
        { message: "Only employees can upload resumes" },
        { status: 403 }
      );
    }

    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!supabaseUrl || !supabaseServiceKey) {
      console.error("Resume storage configuration is missing");
      return NextResponse.json(
        { message: "Resume storage is not configured. Please contact support." },
        { status: 503 }
      );
    }

    let supabase;
    try {
      supabase = createClient(supabaseUrl, supabaseServiceKey);
    } catch (error) {
      console.error("Resume storage configuration error:", error);
      return NextResponse.json(
        { message: "Resume storage could not be initialized. Please contact support." },
        { status: 503 }
      );
    }

    const formData = await request.formData();
    const file = formData.get("resume");

    if (!file || typeof file === "string") {
      return NextResponse.json(
        { message: "Please select a PDF resume" },
        { status: 400 }
      );
    }

    if (file.size === 0) {
      return NextResponse.json(
        { message: "The selected PDF is empty. Please choose a non-empty resume." },
        { status: 400 }
      );
    }

    if (file.size > MAX_RESUME_SIZE) {
      return NextResponse.json(
        { message: "Resume must be no larger than 5 MB." },
        { status: 400 }
      );
    }

    const bytes = Buffer.from(await file.arrayBuffer());
    if (!bytes.subarray(0, 1024).includes(Buffer.from("%PDF-"))) {
      return NextResponse.json(
        { message: "Only valid PDF files are allowed" },
        { status: 400 }
      );
    }

    let resumeText;
    try {
      resumeText = await extractResumeText(bytes);
    } catch (error) {
      console.error("Resume PDF parsing error:", error);
      const isPasswordProtected = error?.name === "PasswordException";
      const parserError = [error?.message, error?.cause?.message]
        .filter((message) => typeof message === "string")
        .join(" ");
      const isWorkerSetupError = /worker|pdf\.worker/i.test(parserError);
      return NextResponse.json(
        {
          message: isPasswordProtected
            ? "This PDF is password-protected. Please remove its password and upload it again."
            : isWorkerSetupError
              ? "The PDF text extraction service could not start. Please retry later or contact support."
              : "This PDF could not be read. Please upload a valid, text-based PDF.",
        },
        { status: isWorkerSetupError ? 503 : 400 }
      );
    }

    if (!resumeText) {
      return NextResponse.json(
        {
          message: "No readable text was found. Please upload a text-based PDF; scanned or image-only PDFs are not supported.",
        },
        { status: 422 }
      );
    }

    const { path: filePath, name: resumeName } = createResumeStoragePath(
      user.id,
      file.name
    );

    const { error: uploadError } = await supabase.storage
      .from("resumes")
      .upload(filePath, bytes, {
        contentType: "application/pdf",
        upsert: false,
      });

    if (uploadError) {
      console.error("Resume storage error:", uploadError);
      const causeCode = uploadError.originalError?.cause?.code;
      const message = causeCode === "ENOTFOUND"
        ? "Could not resolve the Supabase Storage hostname. Check SUPABASE_URL for a typo."
        : `Supabase Storage rejected the upload: ${uploadError.message || "Unknown storage error"}`;

      return NextResponse.json(
        { message },
        { status: Number(uploadError.statusCode) === 413 ? 413 : 502 }
      );
    }

    try {
      const result = await pool.query(
        `INSERT INTO employee_profiles (user_id, resume_path, resume_text)
         VALUES ($1, $2, $3)
         ON CONFLICT (user_id)
         DO UPDATE SET resume_path = EXCLUDED.resume_path,
                       resume_text = EXCLUDED.resume_text,
                       updated_at = NOW()
         RETURNING resume_path, resume_text`,
        [user.id, filePath, resumeText]
      );

      if (
        result.rowCount !== 1 ||
        result.rows[0].resume_path !== filePath ||
        result.rows[0].resume_text !== resumeText
      ) {
        throw new Error("Resume profile persistence did not return the saved values");
      }
    } catch (dbError) {
      console.error("Resume path database save error:", dbError);

      try {
        const { error: cleanupError } = await supabase.storage
          .from("resumes")
          .remove([filePath]);

        if (cleanupError) {
          console.error("Resume cleanup error:", cleanupError);
        }
      } catch (cleanupError) {
        console.error("Resume cleanup error:", cleanupError);
      }

      return NextResponse.json(
        {
          message: "The PDF reached storage, but its profile status could not be saved. Please retry.",
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: "Resume uploaded successfully.",
      resumePath: filePath,
      resumeName,
      resumeTextLength: resumeText.length,
    });
  } catch (error) {
    console.error("Resume upload error:", error);
    const message = error?.message === "fetch failed"
      ? "Could not reach Supabase Storage. Check the storage endpoint and server network."
      : "The resume upload could not be completed. Please retry or check the server logs.";

    return NextResponse.json(
      { message },
      { status: 500 }
    );
  }
}
