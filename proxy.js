import { NextResponse } from "next/server";
import { COOKIE_NAME, verifyToken } from "@/lib/auth";

export function proxy(request) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get(COOKIE_NAME)?.value;
  const user = token ? verifyToken(token) : null;

  const isEmployee = pathname.startsWith("/employee");
  const isRecruiter = pathname.startsWith("/recruiter");
  const isAuthPage =
    pathname === "/login" || pathname === "/register";

  if (isEmployee || isRecruiter) {
    if (!user) {
      const url = new URL("/login", request.url);
      return NextResponse.redirect(url);
    }

    if (isEmployee && user.role !== "employee") {
      return NextResponse.redirect(
        new URL("/recruiter/dashboard", request.url)
      );
    }

    if (isRecruiter && user.role !== "recruiter") {
      return NextResponse.redirect(
        new URL("/employee/dashboard", request.url)
      );
    }
  }

  if (isAuthPage && user) {
    const dashboard =
      user.role === "employee"
        ? "/employee/dashboard"
        : "/recruiter/dashboard";

    return NextResponse.redirect(
      new URL(dashboard, request.url)
    );
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/employee/:path*",
    "/recruiter/:path*",
    "/login",
    "/register",
  ],
};

