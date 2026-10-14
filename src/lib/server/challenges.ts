import "server-only";
import type { ChallengeState, EntryStatus } from "../demo/store";
import { db } from "./db";

/** A member's challenges in the shape the client store keeps them. */
export async function loadChallenges(userId: string): Promise<Record<number, ChallengeState>> {
  const rows = await db()<{ method: number; joined_at: Date; done: number[]; note: string; submitted_at: Date | null; entry: EntryStatus }[]>`
    select method, joined_at, done, note, submitted_at, entry from challenges where user_id = ${userId}`;
  return Object.fromEntries(
    rows.map((r) => [r.method, { joinedAt: r.joined_at.toISOString(), done: r.done, note: r.note, submittedAt: r.submitted_at?.toISOString() ?? null, entry: r.entry }]),
  );
}
