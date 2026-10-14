import { connection } from "next/server";
import { currentUser } from "@/lib/server/auth";
import { loadChallenges } from "@/lib/server/challenges";
import { loadCommunity } from "@/lib/server/community";
import { backendEnabled } from "@/lib/server/db";
import { loadRaffle } from "@/lib/server/raffle";

/** Who is signed in. The client store reads this on load (components/session-sync.tsx). */
export async function GET() {
  // always per request: the build has no database, so a prerendered answer would say "no backend"
  await connection();
  const headers = { "Cache-Control": "no-store" };
  if (!backendEnabled()) return Response.json({ backend: false }, { headers });
  const user = await currentUser({ renew: true });
  const [challenges, community, raffle] = await Promise.all([user ? loadChallenges(user.id) : {}, loadCommunity(user), loadRaffle(user)]);
  return Response.json({ backend: true, user, challenges, community, raffle }, { headers });
}
