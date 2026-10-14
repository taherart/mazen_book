"use server";

import { randomInt } from "node:crypto";
import type { EntryStatus } from "../demo/store";
import { openDraws } from "../week";
import { currentUser } from "./auth";
import { backendEnabled, db } from "./db";
import { inWeek } from "./raffle";

/** Raffle decisions. Each one checks the admin list on the server, and only this week's or last
 *  week's draw can change. Draws, announcements and undos are logged in raffle_events. */
type Result = { ok: boolean };
const NO = { ok: false } as const;
const YES = { ok: true } as const;

async function admin() {
  if (!backendEnabled()) return null;
  const user = await currentUser();
  return user?.admin ? user : null;
}

/** The open week an action names, or null for any other value. */
function openWeek(weekStart: unknown, { currentOnly = false } = {}) {
  const weeks = openDraws(new Date());
  return (currentOnly ? weeks.slice(0, 1) : weeks).find((w) => w.startsAt === weekStart) ?? null;
}

export async function setWeekMethodAction(weekStart: unknown, method: unknown): Promise<Result> {
  const user = await admin();
  const w = openWeek(weekStart, { currentOnly: true });
  if (!user || !w || (method !== null && !(Number.isInteger(method) && (method as number) >= 1 && (method as number) <= 52))) return NO;
  const override = method === w.week ? null : (method as number | null);
  // the method is fixed once the week has been drawn
  const rows = await db()`
    insert into weeks (starts_at, week, method) values (${new Date(w.startsAt)}, ${w.week}, ${override})
    on conflict (starts_at) do update set method = excluded.method where weeks.drawn_at is null
    returning week`;
  return { ok: rows.length > 0 };
}

export async function setPrizeAction(weekStart: unknown, prize: unknown): Promise<Result> {
  const user = await admin();
  const w = openWeek(weekStart, { currentOnly: true });
  if (!user || !w || typeof prize !== "string") return NO;
  const text = prize.trim().replace(/[\u0000-\u001f\u007f]/g, "");
  if (text.length > 200) return NO;
  await db()`
    insert into weeks (starts_at, week, prize) values (${new Date(w.startsAt)}, ${w.week}, ${text})
    on conflict (starts_at) do update set prize = excluded.prize`;
  return YES;
}

const ENTRY = /^([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}):(\d{1,2})$/;
const STATUSES: EntryStatus[] = ["pending", "eligible", "rejected"];

/** Entry ids are "<member id>:<method>". A decision cannot change once its week has been drawn. */
export async function reviewEntryAction(entryId: unknown, status: unknown): Promise<Result> {
  const match = typeof entryId === "string" ? ENTRY.exec(entryId) : null;
  if (!(await admin()) || !match || !STATUSES.includes(status as EntryStatus)) return NO;
  const rows = await db()`
    update challenges c set entry = ${status as string}
    where c.user_id = ${match[1]} and c.method = ${Number(match[2])} and c.submitted_at is not null
      and not exists (select 1 from weeks w where w.drawn_at is not null and c.submitted_at >= w.starts_at and c.submitted_at < w.starts_at + interval '7 days')
    returning c.method`;
  return { ok: rows.length > 0 };
}

/** Picks one eligible entry uniformly with the server's cryptographic generator. */
export async function drawWinnerAction(weekStart: unknown): Promise<Result> {
  const user = await admin();
  const w = openWeek(weekStart);
  if (!user || !w) return NO;
  const [start, end] = inWeek(w);
  return db().begin(async (tx) => {
    await tx`insert into weeks (starts_at, week) values (${start}, ${w.week}) on conflict do nothing`;
    const [row] = await tx<{ method: number | null; drawn_at: Date | null }[]>`select method, drawn_at from weeks where starts_at = ${start} for update`;
    if (row.drawn_at) return NO;
    const method = row.method ?? w.week;
    const pool = await tx<{ user_id: string; name: string }[]>`
      select c.user_id, u.name from challenges c join users u on u.id = c.user_id
      where c.method = ${method} and c.entry = 'eligible' and c.submitted_at >= ${start} and c.submitted_at < ${end}
      order by c.user_id`;
    if (!pool.length) return NO;
    const pick = pool[randomInt(pool.length)];
    await tx`update weeks set winner_id = ${pick.user_id}, winner_name = ${pick.name}, drawn_at = now(), announced = false where starts_at = ${start}`;
    await tx`
      insert into raffle_events (week_starts_at, action, method, candidates, winner_id, winner_name, admin_id, admin_email)
      values (${start}, 'draw', ${method}, ${pool.map((p) => p.user_id)}::uuid[], ${pick.user_id}, ${pick.name}, ${user.id}, ${user.email})`;
    return YES;
  });
}

export async function announceWinnerAction(weekStart: unknown): Promise<Result> {
  const user = await admin();
  const w = openWeek(weekStart);
  if (!user || !w) return NO;
  const start = new Date(w.startsAt);
  return db().begin(async (tx) => {
    const [row] = await tx<{ method: number | null; winner_id: string | null; winner_name: string }[]>`
      update weeks set announced = true where starts_at = ${start} and winner_name is not null and not announced
      returning method, winner_id, winner_name`;
    if (!row) return NO;
    await tx`
      insert into raffle_events (week_starts_at, action, method, winner_id, winner_name, admin_id, admin_email)
      values (${start}, 'announce', ${row.method ?? w.week}, ${row.winner_id}, ${row.winner_name}, ${user.id}, ${user.email})`;
    return YES;
  });
}

/** Withdraws an announcement, or, before one, cancels the result so the week can be drawn again. */
export async function undoWinnerAction(weekStart: unknown): Promise<Result> {
  const user = await admin();
  const w = openWeek(weekStart);
  if (!user || !w) return NO;
  const start = new Date(w.startsAt);
  return db().begin(async (tx) => {
    const [row] = await tx<{ method: number | null; winner_id: string | null; winner_name: string | null; announced: boolean }[]>`
      select method, winner_id, winner_name, announced from weeks where starts_at = ${start} for update`;
    if (!row?.winner_name) return NO;
    if (row.announced) await tx`update weeks set announced = false where starts_at = ${start}`;
    else await tx`update weeks set winner_id = null, winner_name = null, drawn_at = null where starts_at = ${start}`;
    await tx`
      insert into raffle_events (week_starts_at, action, method, winner_id, winner_name, admin_id, admin_email)
      values (${start}, ${row.announced ? "withdraw" : "cancel"}, ${row.method ?? w.week}, ${row.winner_id}, ${row.winner_name}, ${user.id}, ${user.email})`;
    return YES;
  });
}
