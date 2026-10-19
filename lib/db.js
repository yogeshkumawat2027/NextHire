
import { Pool } from "pg";
import { createHash } from "node:crypto";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL is missing in .env.local");
}

const globalForPg = globalThis;

const poolConfig = {
  connectionString,
  max: 5,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
  keepAlive: true,
  keepAliveInitialDelayMillis: 10000,
  ssl: { rejectUnauthorized: false },
};

const poolConfigFingerprint = createHash("sha256")
  .update(JSON.stringify(poolConfig))
  .digest("hex");

function redactDatabaseLogValue(value) {
  return String(value)
    .replace(/(postgres(?:ql)?:\/\/)[^/\s@]+@/gi, "$1[redacted]@")
    .replace(
      /\b(password|passwd|token|secret|api[_-]?key)(\s*[=:]\s*)[^\s,;]+/gi,
      "$1$2[redacted]"
    );
}

export function logDatabaseError(context, error) {
  const causes = [];
  const seen = new Set();
  let current = error;

  while (current && causes.length < 5 && !seen.has(current)) {
    if (typeof current === "object") seen.add(current);

    if (current instanceof Error) {
      const detail = {
        name: current.name,
        message: redactDatabaseLogValue(current.message),
      };
      if (current.code) detail.code = redactDatabaseLogValue(current.code);
      if (current.stack) detail.stack = redactDatabaseLogValue(current.stack);
      causes.push(detail);
      current = current.cause;
    } else {
      causes.push({ message: redactDatabaseLogValue(current) });
      break;
    }
  }

  console.error(context, { causes });
}

let pool = globalForPg.pgPool;

if (!pool || globalForPg.pgPoolConfigFingerprint !== poolConfigFingerprint) {
  const previousPool = pool;
  pool = new Pool(poolConfig);
  globalForPg.pgPool = pool;
  globalForPg.pgPoolConfigFingerprint = poolConfigFingerprint;
  pool.on("error", (error) => {
    logDatabaseError("PostgreSQL idle connection error:", error);
  });

  if (previousPool) {
    previousPool.end().catch((error) => {
      logDatabaseError("PostgreSQL stale pool shutdown error:", error);
    });
  }
}

export function getPoolStats() {
  return {
    totalCount: pool.totalCount,
    idleCount: pool.idleCount,
    waitingCount: pool.waitingCount,
  };
}

export default pool;
