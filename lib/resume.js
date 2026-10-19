import { randomUUID } from "node:crypto";

export function createResumeStoragePath(userId, originalName) {
  const safeName = originalName
    .replace(/[\/\\\u0000-\u001F\u007F]/g, "_")
    .replace(/^\.+/, "")
    .trim()
    .slice(0, 120) || "Resume.pdf";

  return {
    path: `${userId}/${randomUUID()}--${safeName}`,
    name: safeName,
  };
}

export function getResumeDisplayName(resumePath) {
  if (typeof resumePath !== "string") return null;

  const storedName = resumePath.split("/").pop() || "";
  const match = storedName.match(/^[0-9a-f-]{36}--(.+)$/i);
  return match?.[1] || (storedName ? "Resume.pdf" : null);
}
