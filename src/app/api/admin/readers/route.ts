import { connection } from "next/server";
import { currentAdmin } from "@/lib/server/auth";
import { backendEnabled, db } from "@/lib/server/db";

/** For admins: how far members get through the unlock steps, what the survey says about them, and
 *  what readers think of each method. Read-only. */
const headers = { "Cache-Control": "no-store" };

export async function GET() {
  await connection();
  if (!backendEnabled()) return Response.json({ error: "no-backend" }, { status: 404, headers });
  if (!(await currentAdmin())) return Response.json({ error: "forbidden" }, { status: 403, headers });
  const sql = db();

  const [[funnel], survey, ratings, comments, unlocked, [code]] = await Promise.all([
    sql`
      select
        (select count(*) from users)::int as members,
        (select count(*) from surveys)::int as surveyed,
        (select count(distinct user_id) from challenges)::int as joined,
        (select count(distinct user_id) from challenges where submitted_at is not null)::int as submitted,
        (select count(distinct user_id) from ratings)::int as raters,
        (select count(distinct user_id) from stories where status = 'approved')::int as storytellers,
        (select count(*) from users where invited_by is not null)::int as invited,
        (select count(*) from users where book_owner)::int as "bookOwners",
        (select count(*) from unlocks where source = 'credit')::int as "creditUnlocks"`,
    sql<{ question: string; answer: string; n: number }[]>`
      select 'capital' as question, capital as answer, count(*)::int as n from surveys group by capital
      union all select 'time', time_band, count(*)::int from surveys group by time_band
      union all select 'place', place, count(*)::int from surveys group by place
      union all select 'level', level::text, count(*)::int from surveys group by level
      union all select 'goal', goal, count(*)::int from surveys group by goal`,
    sql<{ method: number; average: number; count: number }[]>`select method, round(avg(stars), 1)::float as average, count(*)::int as count from ratings group by method order by count(*) desc, method`,
    sql<{ method: number; stars: number; comment: string; name: string; at: Date }[]>`
      select r.method, r.stars, r.comment, u.name, r.created_at as at from ratings r join users u on u.id = r.user_id
      where r.comment <> '' order by r.created_at desc limit 100`,
    sql<{ method: number; n: number }[]>`select method, count(*)::int as n from unlocks where source = 'credit' group by method order by count(*) desc, method limit 10`,
    sql<{ value: string }[]>`select coalesce((select value from settings where key = 'book_code'), '') as value`,
  ]);
  return Response.json({ funnel, survey, ratings, comments: comments.map((c) => ({ ...c, at: c.at.toISOString() })), unlocked, bookCode: code.value }, { headers });
}
