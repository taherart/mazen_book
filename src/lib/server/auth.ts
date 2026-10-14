import "server-only";
import { hash, verify } from "@node-rs/argon2";
import { createHash, randomBytes } from "node:crypto";
import { cookies, headers } from "next/headers";
import type { DemoUser, Intent } from "../demo/store";
import { db } from "./db";

export type SessionUser = DemoUser;

export const SESSION_COOKIE = "m52_session";
const SESSION_DAYS = 30;
/** A session with less than this left is extended when the visitor comes back. */
const RENEW_DAYS = 15;
const DAY = 24 * 60 * 60 * 1000;

/* ---------- passwords: Argon2id with OWASP's minimum cost (19 MiB, 2 passes) ---------- */

const ARGON = { memoryCost: 19456, timeCost: 2, parallelism: 1 };
export const hashPassword = (password: string) => hash(password, ARGON);

let dummy: Promise<string> | undefined;
/** Checks the password, spending the same time whether or not the account exists. */
export async function checkPassword(stored: string | undefined, password: string) {
  dummy ??= hash("no account has this password", ARGON);
  try {
    return await verify(stored ?? (await dummy), password);
  } catch {
    return false;
  }
}

/* ---------- sessions: random token in an HttpOnly cookie, only its hash in the database ---------- */

const digest = (token: string) => createHash("sha256").update(token).digest("hex");

async function writeCookie(token: string, expires: Date) {
  const proto = (await headers()).get("x-forwarded-proto");
  // Caddy says how the visitor arrived; plain-HTTP previews (the bare IP) cannot hold Secure cookies
  (await cookies()).set(SESSION_COOKIE, token, { httpOnly: true, secure: proto === "https", sameSite: "lax", path: "/", expires });
}

export async function startSession(userId: string) {
  const token = randomBytes(32).toString("base64url");
  const expires = new Date(Date.now() + SESSION_DAYS * DAY);
  await db()`insert into sessions (id, user_id, expires_at) values (${digest(token)}, ${userId}, ${expires})`;
  await writeCookie(token, expires);
  // expired sessions are swept now and then rather than on a schedule
  if (Math.random() < 0.05) await db()`delete from sessions where expires_at < now()`;
}

export async function endSession() {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (token) await db()`delete from sessions where id = ${digest(token)}`;
  jar.delete(SESSION_COOKIE);
}

const admins = () => new Set((process.env.ADMIN_EMAILS ?? "").split(",").map((e) => e.trim().toLowerCase()).filter(Boolean));

interface UserRow {
  id: string;
  name: string;
  email: string;
  intents: string[];
  created_at: Date;
}

export const toSessionUser = (u: UserRow): SessionUser => ({
  id: u.id,
  name: u.name,
  email: u.email,
  admin: admins().has(u.email.toLowerCase()),
  joinedAt: u.created_at.toISOString(),
  intents: u.intents as Intent[],
});

/** The signed-in member, or null. `renew` extends a session that is past half its life. */
export async function currentUser({ renew = false } = {}): Promise<SessionUser | null> {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) return null;
  const [row] = await db()<(UserRow & { expires_at: Date })[]>`
    select u.id, u.name, u.email, u.intents, u.created_at, s.expires_at
    from sessions s join users u on u.id = s.user_id
    where s.id = ${digest(token)} and s.expires_at > now()`;
  if (!row) return null;
  if (renew && row.expires_at.getTime() - Date.now() < RENEW_DAYS * DAY) {
    const expires = new Date(Date.now() + SESSION_DAYS * DAY);
    await db()`update sessions set expires_at = ${expires} where id = ${digest(token)}`;
    await writeCookie(token, expires);
  }
  return toSessionUser(row);
}

/* ---------- rate limiting: in memory, which is enough for the single web container ---------- */

const hits = new Map<string, { count: number; until: number }>();

/** Counts one attempt against `key`; true once more than `max` happened inside the window. */
export function overLimit(key: string, max: number, windowMinutes: number) {
  const now = Date.now();
  if (hits.size > 10_000) for (const [k, v] of hits) if (v.until < now) hits.delete(k);
  const entry = hits.get(key);
  if (!entry || entry.until < now) {
    hits.set(key, { count: 1, until: now + windowMinutes * 60_000 });
    return false;
  }
  entry.count += 1;
  return entry.count > max;
}

/** The visitor's address as Caddy saw it (Caddy replaces any X-Forwarded-For the client sends). */
export async function clientIp() {
  return (await headers()).get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
}
