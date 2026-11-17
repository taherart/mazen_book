import "server-only";
import type { SessionUser } from "./auth";
import { db } from "./db";

export interface Ratings {
  /** Per method: the average of the readers' stars and how many rated it. */
  methods: Record<number, { average: number; count: number }>;
  /** The signed-in member's own ratings. */
  mine: Record<number, { stars: number; comment: string }>;
}

export async function loadRatings(user: SessionUser | null): Promise<Ratings> {
  const sql = db();
  const [all, own] = await Promise.all([
    sql<{ method: number; average: number; count: number }[]>`select method, round(avg(stars), 1)::float as average, count(*)::int as count from ratings group by method`,
    user ? sql<{ method: number; stars: number; comment: string }[]>`select method, stars, comment from ratings where user_id = ${user.id}` : [],
  ]);
  return {
    methods: Object.fromEntries(all.map((r) => [r.method, { average: r.average, count: r.count }])),
    mine: Object.fromEntries(own.map((r) => [r.method, { stars: r.stars, comment: r.comment }])),
  };
}
