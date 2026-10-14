import "server-only";
import type { DemoState, EntryStatus, RaffleWeek, Winner } from "../demo/store";
import { getMethod } from "../methods";
import type { WeekInfo } from "../types";
import { openDraws } from "../week";
import type { SessionUser } from "./auth";
import { db } from "./db";

export type Raffle = Omit<DemoState["admin"], "entries">;

const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

interface WeekRow {
  starts_at: Date;
  week: number;
  method: number | null;
  prize: string;
  winner_id: string | null;
  winner_name: string | null;
  drawn_at: Date | null;
  announced: boolean;
}

/** A week's entries are the write-ups for its method sent while it was open. */
export const inWeek = (w: WeekInfo) => [new Date(w.startsAt), new Date(w.endsAt)] as const;

/** This week's method and prize, the winners of the last 52 weeks (announced ones only, unless
 *  the viewer is an admin), the size of this week's draw, and for admins the open draws. */
export async function loadRaffle(user: SessionUser | null): Promise<Raffle> {
  const sql = db();
  const draws = openDraws(new Date());
  const [current] = draws;
  // 52 weeks back, so each week number appears once
  const since = new Date(new Date(current.startsAt).getTime() - 51 * WEEK_MS);
  const rows = await sql<WeekRow[]>`select * from weeks where starts_at >= ${since} order by starts_at`;
  const byStart = new Map(rows.map((r) => [r.starts_at.toISOString(), r]));
  const methodOf = (w: WeekInfo) => byStart.get(w.startsAt)?.method ?? w.week;

  const winners: Record<number, Winner> = {};
  for (const r of rows) {
    if (!r.winner_name || !r.drawn_at || (!r.announced && !user?.admin)) continue;
    winners[r.week] = { name: r.winner_name, method: r.method ?? r.week, drawnAt: r.drawn_at.toISOString(), announced: r.announced, mine: !!user && r.winner_id === user.id };
  }

  const [from, to] = inWeek(current);
  const [entryCounts] = await sql<Raffle["entryCounts"][]>`
    select count(*)::int as total, (count(*) filter (where entry = 'eligible'))::int as eligible, (count(*) filter (where entry = 'pending'))::int as pending
    from challenges where method = ${methodOf(current)} and submitted_at >= ${from} and submitted_at < ${to}`;

  const raffle: RaffleWeek[] = user?.admin
    ? await Promise.all(
        draws.map(async (w) => {
          const method = methodOf(w);
          const total = getMethod(method)!.steps.length + 1;
          const [start, end] = inWeek(w);
          const [entries, [{ n }]] = await Promise.all([
            sql<{ user_id: string; name: string; done: number[]; note: string; entry: EntryStatus }[]>`
              select c.user_id, u.name, c.done, c.note, c.entry from challenges c join users u on u.id = c.user_id
              where c.method = ${method} and c.submitted_at >= ${start} and c.submitted_at < ${end} order by c.submitted_at`,
            sql<{ n: number }[]>`select count(*)::int as n from raffle_events where week_starts_at = ${start} and action = 'draw'`,
          ]);
          return {
            weekStart: w.startsAt,
            week: w.week,
            method,
            draws: n,
            entries: entries.map((e) => ({ id: `${e.user_id}:${method}`, name: e.name, method, done: e.done.length, total, note: e.note, status: e.entry, sample: false })),
          };
        }),
      )
    : [];

  const now = byStart.get(current.startsAt);
  return { weekMethod: now?.method ?? null, prize: now?.prize ?? "", winners, entryCounts, raffle };
}
