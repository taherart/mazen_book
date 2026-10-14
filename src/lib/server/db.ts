import "server-only";
import postgres from "postgres";

/**
 * The database is optional: without DATABASE_URL (local work, CI builds) the site runs in demo
 * mode and keeps everything in the visitor's browser, as before the backend existed.
 */
export const backendEnabled = () => Boolean(process.env.DATABASE_URL);

const globalForDb = globalThis as unknown as { sql?: postgres.Sql };

/** One pool per server process (kept across hot reloads in development). */
export function db() {
  if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is not set");
  globalForDb.sql ??= postgres(process.env.DATABASE_URL, { max: 10, idle_timeout: 30, connect_timeout: 10, onnotice: () => {} });
  return globalForDb.sql;
}
