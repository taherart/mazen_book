"use server";

import { timingSafeEqual } from "node:crypto";
import { CREDIT, GOALS, type Goal, type SurveyAnswers, bestFits } from "../access";
import { getMethod, getSummaries } from "../methods";
import type { CapitalBand, Level, Place, TimeBand } from "../types";
import { loadAccess } from "./access";
import { currentUser, overLimit } from "./auth";
import { backendEnabled, db } from "./db";

/** Opening methods: the survey, spending a credit, rating a method, the book code. Each action
 *  works out the member's access on the server; nothing the browser says about it is trusted. */
type Result = { ok: boolean };
const NO = { ok: false } as const;
const YES = { ok: true } as const;

const pick = <T extends string>(v: unknown, allowed: readonly T[]) => (allowed.includes(v as T) ? (v as T) : null);
const methodNumber = (v: unknown) => (typeof v === "number" && Number.isInteger(v) && getMethod(v) ? v : null);

async function member() {
  return backendEnabled() ? currentUser() : null;
}

/** The answers are kept only with the member's consent, and open the methods that fit them best. */
export async function submitSurveyAction(input: Record<string, unknown>): Promise<{ ok: true; unlocked: number[] } | { ok: false; error: string }> {
  const user = await member();
  if (!user) return { ok: false, error: "سجّل دخولك أولًا." };
  const answers: Partial<SurveyAnswers> = {
    capital: pick<CapitalBand>(input.capital, ["zero", "low", "high"]) ?? undefined,
    time: pick<TimeBand>(input.time, ["week", "month", "more"]) ?? undefined,
    place: pick<Place>(input.place, ["home", "field", "both"]) ?? undefined,
    level: ([1, 2, 3] as Level[]).find((l) => l === input.level),
    goal: pick<Goal>(input.goal, Object.keys(GOALS) as Goal[]) ?? undefined,
  };
  if (!answers.capital || !answers.time || !answers.place || !answers.level || !answers.goal) return { ok: false, error: "أجب عن الأسئلة الخمسة كلها." };
  if (input.consent !== true) return { ok: false, error: "نحتاج موافقتك على حفظ إجاباتك." };
  const a = answers as SurveyAnswers;

  return db().begin(async (tx) => {
    const saved = await tx`
      insert into surveys (user_id, capital, time_band, place, level, goal)
      values (${user.id}, ${a.capital}, ${a.time}, ${a.place}, ${a.level}, ${a.goal})
      on conflict (user_id) do nothing returning user_id`;
    if (!saved.length) return { ok: false, error: "أجبت عن الاستبيان من قبل." } as const;
    const { open, all } = await loadAccess(user);
    const unlocked = all ? [] : bestFits(getSummaries(), a, open, CREDIT.survey);
    for (const method of unlocked) await tx`insert into unlocks (user_id, method, source) values (${user.id}, ${method}, 'survey') on conflict do nothing`;
    return { ok: true, unlocked } as const;
  });
}

/** Spends one credit on a method the member chose. */
export async function unlockMethodAction(method: unknown): Promise<Result> {
  const user = await member();
  const n = methodNumber(method);
  if (!user || !n) return NO;
  return db().begin(async (tx) => {
    // one unlock at a time per member, so two tabs cannot spend the same credit
    await tx`select id from users where id = ${user.id} for update`;
    const access = await loadAccess(user);
    if (access.all || access.open.includes(n) || access.credits < 1) return NO;
    await tx`insert into unlocks (user_id, method, source) values (${user.id}, ${n}, 'credit')`;
    return YES;
  });
}

/** Stars and one optional line, from a member who has done at least one task of the method's
 *  challenge. The average is public; the line goes to the author only. */
export async function rateMethodAction(method: unknown, stars: unknown, comment: unknown): Promise<Result> {
  const user = await member();
  const n = methodNumber(method);
  if (!user || !n || typeof stars !== "number" || !Number.isInteger(stars) || stars < 1 || stars > 5) return NO;
  const text = typeof comment === "string" ? comment.trim().replace(/[\u0000-\u001f\u007f]/g, " ").slice(0, 300) : "";
  const rows = await db()`
    insert into ratings (user_id, method, stars, comment)
    select ${user.id}, ${n}, ${stars}, ${text}
    where exists (select 1 from challenges where user_id = ${user.id} and method = ${n} and cardinality(done) > 0)
    on conflict (user_id, method) do update set stars = excluded.stars, comment = excluded.comment
    returning method`;
  return { ok: rows.length > 0 };
}

const normal = (code: string) => code.trim().toUpperCase().replace(/\s+/g, "");

/** The code printed in the book opens every method for its owner. */
export async function redeemBookCodeAction(code: unknown): Promise<{ ok: true } | { ok: false; error: string }> {
  const user = await member();
  if (!user) return { ok: false, error: "سجّل دخولك أولًا." };
  if (overLimit(`bookcode:${user.id}`, 6, 60)) return { ok: false, error: "محاولات كثيرة. انتظر ساعة ثم حاول مجددًا." };
  const [row] = await db()<{ value: string }[]>`select value from settings where key = 'book_code'`;
  const given = Buffer.from(typeof code === "string" ? normal(code).slice(0, 64) : "");
  const real = Buffer.from(row?.value ?? "");
  if (!real.length || given.length !== real.length || !timingSafeEqual(given, real)) return { ok: false, error: "الرمز غير صحيح. تأكد منه كما هو مطبوع في الكتاب." };
  await db()`update users set book_owner = true where id = ${user.id}`;
  return { ok: true };
}

/** Admin: set or clear the book code. An empty value hides the form from members. */
export async function setBookCodeAction(code: unknown): Promise<Result> {
  const user = await member();
  if (!user?.admin || typeof code !== "string") return NO;
  const value = normal(code);
  if (value && !/^[A-Z0-9-]{6,32}$/.test(value)) return NO;
  await db()`insert into settings (key, value) values ('book_code', ${value}) on conflict (key) do update set value = excluded.value`;
  return YES;
}
