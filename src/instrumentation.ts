// Runs once when a server process starts: bring the database schema up to date before any request.
export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs" || !process.env.DATABASE_URL) return;
  const { migrate } = await import("./lib/server/migrations");
  await migrate();
}
