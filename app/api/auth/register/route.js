import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import pool from "@/lib/db";
import { createToken, COOKIE_NAME } from "@/lib/auth";



export async function POST(request) {
  try {
    const body = await request.json();

    const name =
      typeof body.name === "string" ? body.name.trim() : "";
    const email =
      typeof body.email === "string"
        ? body.email.trim().toLowerCase()
        : "";
    const password =
      typeof body.password === "string" ? body.password : "";
    const role = body.role;

    if (!name || name.length > 100) {
      return NextResponse.json(
        { error: "Enter a valid name." },
        { status: 400 }
      );
    }

    if (
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ||
      email.length > 255
    ) {
      return NextResponse.json(
        { error: "Enter a valid email." },
        { status: 400 }
      );
    }

    if (password.length < 8 || password.length > 72) {
      return NextResponse.json(
        { error: "Password must be 8–72 characters." },
        { status: 400 }
      );
    }

    if (!["employee", "recruiter"].includes(role)) {
      return NextResponse.json(
        { error: "Select a valid role." },
        { status: 400 }
      );
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const result = await pool.query(
      `INSERT INTO users (name, email, password, role)
       VALUES ($1, $2, $3, $4)
       RETURNING id, name, email, role`,
      [name, email, passwordHash, role]
    );

    const user = result.rows[0];
    const token = createToken(user);

    const response = NextResponse.json({
      user,
      message: "Registration successful.",
    });

    response.cookies.set(COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24,
    });

    return response;
  } catch (error) {
    if (error.code === "23505") {
      return NextResponse.json(
        { error: "Email is already registered." },
        { status: 409 }
      );
    }

    console.error("Registration error:", error.message);

    return NextResponse.json(
      { error: "Registration failed. Please try again." },
      { status: 500 }
    );
  }
}