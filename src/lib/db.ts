import { Pool } from "pg";

const connectionString =
  process.env.DATABASE_URL ||
  "postgresql://postgres.lkdtgjwvtuknfjjixrif:XEUG6YoEYWAOe2xJ@aws-0-ap-south-1.pooler.supabase.com:6543/postgres";

// Global pool to prevent connection exhaustion during hot-reload in development
declare global {
  // eslint-disable-next-line no-var
  var __dbPool: Pool | undefined;
}

export const pool: Pool =
  global.__dbPool ||
  new Pool({
    connectionString,
    ssl: { rejectUnauthorized: false },
    max: 10,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 10000,
  });

if (process.env.NODE_ENV !== "production") {
  global.__dbPool = pool;
}

export async function query(text: string, params?: unknown[]) {
  const start = Date.now();
  const res = await pool.query(text, params);
  const duration = Date.now() - start;
  if (process.env.NODE_ENV === "development" && duration > 1000) {
    console.warn(`[db] Slow query (${duration}ms):`, text);
  }
  return res;
}
