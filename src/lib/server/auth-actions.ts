"use server";

import type { Intent } from "../demo/store";
import { type SessionUser, checkPassword, clientIp, currentUser, endSession, hashPassword, overLimit, startSession, toSessionUser } from "./auth";
import { backendEnabled, db } from "./db";

/** `demo` means there is no database here: the caller keeps the browser-only sign-in. */
export type AuthResult = { ok: true; user: SessionUser } | { ok: false; field: "name" | "email" | "password" | "consent"; error: string } | { ok: false; demo: true };

const DEMO = { ok: false, demo: true } as const;
const INTENTS: Intent[] = ["explore", "provide", "share"];
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const TOO_MANY = { ok: false, field: "email", error: "محاولات كثيرة خلال وقت قصير. انتظر ربع ساعة ثم حاول مجددًا." } as const;

const text = (v: unknown) => (typeof v === "string" ? v.trim() : "");
// strip control characters so a name always renders as one plain line
const cleanName = (v: unknown) => text(v).replace(/[\u0000-\u001f\u007f]/g, "").replace(/\s+/g, " ");

export async function signUpAction(input: { name?: unknown; email?: unknown; password?: unknown; intents?: unknown; consent?: unknown }): Promise<AuthResult> {
  if (!backendEnabled()) return DEMO;
  const name = cleanName(input.name);
  const email = text(input.email).toLowerCase();
  const password = typeof input.password === "string" ? input.password : "";
  const intents = Array.isArray(input.intents) ? INTENTS.filter((i) => (input.intents as unknown[]).includes(i)) : [];

  if (name.length < 2 || name.length > 60) return { ok: false, field: "name", error: "اكتب اسمك كما تحب أن يظهر، بين حرفين و60 حرفًا." };
  if (!EMAIL.test(email) || email.length > 254) return { ok: false, field: "email", error: "اكتب بريدًا إلكترونيًا صحيحًا، مثل name@example.com" };
  if (password.length < 8 || password.length > 128) return { ok: false, field: "password", error: "كلمة المرور بين 8 و128 حرفًا." };
  if (input.consent !== true) return { ok: false, field: "consent", error: "نحتاج موافقتك على الشروط وسياسة الخصوصية." };
  if (overLimit(`signup:${await clientIp()}`, 5, 60)) return TOO_MANY;

  const passwordHash = await hashPassword(password);
  try {
    const [user] = await db()<{ id: string; name: string; email: string; intents: string[]; created_at: Date }[]>`
      insert into users (email, name, password_hash, intents)
      values (${email}, ${name}, ${passwordHash}, ${intents})
      returning id, name, email, intents, created_at`;
    await startSession(user.id);
    return { ok: true, user: toSessionUser(user) };
  } catch (err) {
    if ((err as { code?: string }).code === "23505") return { ok: false, field: "email", error: "هذا البريد مسجّل من قبل. سجّل دخولك بدلًا من ذلك." };
    throw err;
  }
}

export async function signInAction(input: { email?: unknown; password?: unknown }): Promise<AuthResult> {
  if (!backendEnabled()) return DEMO;
  const email = text(input.email).toLowerCase();
  const password = typeof input.password === "string" ? input.password.slice(0, 128) : "";
  if (overLimit(`signin:ip:${await clientIp()}`, 20, 15) || overLimit(`signin:email:${email}`, 8, 15)) return TOO_MANY;

  const [user] = await db()<{ id: string; name: string; email: string; intents: string[]; created_at: Date; password_hash: string }[]>`
    select id, name, email, intents, created_at, password_hash from users where lower(email) = ${email}`;
  // one message for both cases, so the form does not reveal which emails have accounts
  if (!(await checkPassword(user?.password_hash, password)) || !user) return { ok: false, field: "password", error: "البريد أو كلمة المرور غير صحيحة." };
  await startSession(user.id);
  return { ok: true, user: toSessionUser(user) };
}

export async function signOutAction() {
  if (backendEnabled()) await endSession();
}

/** Deletes the member and everything tied to them (sessions go with the user row). */
export async function deleteAccountAction(): Promise<{ ok: boolean }> {
  if (!backendEnabled()) return { ok: true };
  const user = await currentUser();
  if (!user) return { ok: false };
  await db()`delete from users where id = ${user.id}`;
  await endSession();
  return { ok: true };
}
