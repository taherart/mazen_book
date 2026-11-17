import "server-only";
import { cache } from "react";
import { connection } from "next/server";
import { type Access, CREDIT, INVITE_CAP, OPEN_ACCESS } from "../access";
import { FREE_METHODS } from "../methods";
import { openDraws } from "../week";
import { type SessionUser, currentUser } from "./auth";
import { backendEnabled, db } from "./db";

/** The method on this week's challenge: the calendar's, unless the team picked another. */
export async function currentWeekMethod() {
  const [week] = openDraws(new Date());
  const [row] = await db()<{ method: number | null }[]>`select method from weeks where starts_at = ${new Date(week.startsAt)}`;
  return row?.method ?? week.week;
}

const uniq = (list: number[]) => [...new Set(list)].sort((a, b) => a - b);

/**
 * What a visitor may read. Open to everyone: the five free methods and this week's challenge.
 * A member adds the methods they unlocked and every method whose challenge they joined (so joining
 * the weekly challenge keeps its method). Book owners and the team have everything.
 */
export async function loadAccess(user: SessionUser | null): Promise<Access> {
  const sql = db();
  const [weekMethod, [code]] = await Promise.all([currentWeekMethod(), sql<{ on: boolean }[]>`select exists (select 1 from settings where key = 'book_code' and value <> '') as on`]);
  const base = { ...OPEN_ACCESS, all: false, bookCode: code.on, open: uniq([...FREE_METHODS, weekMethod]) };
  if (!user) return base;

  const [[me], unlocked, joined] = await Promise.all([
    sql<{ submitted: number; ratings: number; stories: number; survey: number; invited: number; spent: number; book_owner: boolean; invite_code: string; was_invited: boolean }[]>`
      select
        (select count(*) from challenges where user_id = u.id and submitted_at is not null)::int as submitted,
        (select count(*) from ratings where user_id = u.id)::int as ratings,
        (select count(*) from stories where user_id = u.id and status = 'approved')::int as stories,
        (select count(*) from surveys where user_id = u.id)::int as survey,
        (select count(*) from users f join surveys s on s.user_id = f.id where f.invited_by = u.id)::int as invited,
        (select count(*) from unlocks where user_id = u.id and source = 'credit')::int as spent,
        u.book_owner, u.invite_code, u.invited_by is not null as was_invited
      from users u where u.id = ${user.id}`,
    sql<{ method: number }[]>`select method from unlocks where user_id = ${user.id}`,
    sql<{ method: number }[]>`select method from challenges where user_id = ${user.id}`,
  ]);
  if (!me) return base;

  const earned = {
    challenges: me.submitted * CREDIT.challenge,
    ratings: me.ratings * CREDIT.rating,
    stories: me.stories * CREDIT.story,
    invites: Math.min(me.invited, INVITE_CAP) * CREDIT.invite,
    // the friend's own welcome, once they have answered the survey too
    welcome: me.was_invited && me.survey ? CREDIT.invite : 0,
  };
  const total = earned.challenges + earned.ratings + earned.stories + earned.invites + earned.welcome;
  return {
    ...base,
    all: user.admin || me.book_owner,
    open: uniq([...base.open, ...unlocked.map((r) => r.method), ...joined.map((r) => r.method)]),
    credits: Math.max(0, total - me.spent),
    survey: me.survey > 0,
    bookOwner: me.book_owner,
    inviteCode: me.invite_code,
    invited: me.invited,
    earned,
  };
}

/** The signed-in visitor and their access, read once per request however many parts of a page ask. */
export const requestAccess = cache(async () => {
  const user = await currentUser();
  return { user, access: await loadAccess(user) };
});

/** Whether this request may read a method's second page. Always decided per request: the build has
 *  no database, so a prerendered answer would publish every method. */
export async function methodOpen(method: number) {
  await connection();
  if (!backendEnabled()) return true;
  const { access } = await requestAccess();
  return access.all || access.open.includes(method);
}
