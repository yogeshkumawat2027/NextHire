import jwt from "jsonwebtoken";
import { cookies } from "next/headers";

const COOKIE_NAME = "nexthire_token";

function getSecret() {
  const secret = process.env.JWT_SECRET;

  if (!secret) {
    throw new Error("JWT_SECRET is missing");
  }

  return secret;
}

export function createToken(user) {
  return jwt.sign(
    {
      role: user.role,
    },
    getSecret(),
    {
      subject: String(user.id),
      expiresIn: "1d",
      algorithm: "HS256",
    }
  );
}

export function verifyToken(token) {
  try {
    const payload = jwt.verify(token, getSecret(), {
      algorithms: ["HS256"],
    });

    if (
      typeof payload === "string" ||
      !payload.sub ||
      !["employee", "recruiter"].includes(payload.role)
    ) {
      return null;
    }

    return {
      id: payload.sub,
      role: payload.role,
    };
  } catch {
    return null;
  }
}

export async function getCurrentUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;

  if (!token) return null;

  return verifyToken(token);
}

export { COOKIE_NAME };