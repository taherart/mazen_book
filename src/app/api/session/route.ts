import { connection } from "next/server";
import { currentUser } from "@/lib/server/auth";
import { backendEnabled } from "@/lib/server/db";

/** Who is signed in. The client store reads this on load (components/session-sync.tsx). */
export async function GET() {
  // always per request: the build has no database, so a prerendered answer would say "no backend"
  await connection();
  const headers = { "Cache-Control": "no-store" };
  if (!backendEnabled()) return Response.json({ backend: false }, { headers });
  return Response.json({ backend: true, user: await currentUser({ renew: true }) }, { headers });
}
