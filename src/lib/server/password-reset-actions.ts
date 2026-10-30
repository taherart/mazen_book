"use server";

import { createHash, randomBytes } from "node:crypto";
import { SITE } from "../config";
import type { ChallengeState } from "../demo/store";
import { type SessionUser, clientIp, hashPassword, overLimit, startSession, toSessionUser } from "./auth";
import { loadChallenges } from "./challenges";
import { backendEnabled, db } from "./db";
import { mailEnabled, sendMail, template } from "./mail";

/**
 * Forgotten passwords. The link carries a random token; the table keeps only its hash, for one hour
 * and one use. Resetting signs the member out everywhere else and in here.
 */
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const TOKEN = /^[A-Za-z0-9_-]{43}$/;
const HOUR = 60 * 60 * 1000;
const digest = (token: string) => createHash("sha256").update(token).digest("hex");

export type RequestResult = { ok: true } | { ok: false; error: string } | { ok: false; demo: true };
export type ResetResult = { ok: true; user: SessionUser; challenges: Record<number, ChallengeState> } | { ok: false; field: "token" | "password"; error: string } | { ok: false; demo: true };

/** Always answers "sent" for a well-formed address, so the form never says which emails have accounts. */
export async function requestPasswordResetAction(input: { email?: unknown }): Promise<RequestResult> {
  if (!backendEnabled()) return { ok: false, demo: true };
  const email = typeof input.email === "string" ? input.email.trim().toLowerCase() : "";
  if (!EMAIL.test(email) || email.length > 254) return { ok: false, error: "اكتب بريدًا إلكترونيًا صحيحًا، مثل name@example.com" };
  if (overLimit(`reset:ip:${await clientIp()}`, 5, 60) || overLimit(`reset:email:${email}`, 3, 60)) return { ok: false, error: "طلبات كثيرة خلال وقت قصير. انتظر ساعة ثم حاول مجددًا." };

  const [user] = await db()<{ id: string; name: string }[]>`select id, name from users where lower(email) = ${email}`;
  if (!user) return { ok: true };

  const token = randomBytes(32).toString("base64url");
  await db().begin(async (tx) => {
    // one live link per member: a new request replaces any older unused one
    await tx`delete from password_resets where user_id = ${user.id} and used_at is null`;
    await tx`insert into password_resets (id, user_id, expires_at) values (${digest(token)}, ${user.id}, ${new Date(Date.now() + HOUR)})`;
  });
  const url = `${SITE.url}/reset?token=${token}`;

  if (!mailEnabled()) {
    // no mail provider on this server: the operator can pass the link on from the log
    console.log(`password reset link for ${email}: ${url}`);
    return { ok: true };
  }
  const { html, text } = template({
    title: `مرحبًا ${user.name}، هذا رابط إعادة تعيين كلمة مرورك`,
    intro: "طلب أحدهم إعادة تعيين كلمة المرور لحسابك في 52 طريقة. الرابط صالح لساعة واحدة ولمرة واحدة. إن لم تكن أنت، تجاهل هذه الرسالة وستبقى كلمة مرورك كما هي.",
    action: "أعِد تعيين كلمة المرور",
    url,
    footer: "إن لم يعمل الزر، انسخ الرابط التالي إلى المتصفح:",
  });
  const sent = await sendMail({ to: email, subject: "إعادة تعيين كلمة المرور · 52 طريقة", text, html });
  if (!sent.ok) return { ok: false, error: "تعذّر إرسال البريد الآن. حاول بعد قليل، وإن تكرر فراسل فريق المنصة." };
  return { ok: true };
}

export async function resetPasswordAction(input: { token?: unknown; password?: unknown }): Promise<ResetResult> {
  if (!backendEnabled()) return { ok: false, demo: true };
  const token = typeof input.token === "string" ? input.token : "";
  const password = typeof input.password === "string" ? input.password : "";
  if (overLimit(`reset:use:${await clientIp()}`, 10, 15)) return { ok: false, field: "token", error: "محاولات كثيرة خلال وقت قصير. انتظر ربع ساعة ثم حاول مجددًا." };
  const invalid = { ok: false, field: "token", error: "هذا الرابط غير صالح أو انتهت صلاحيته. اطلب رابطًا جديدًا." } as const;
  if (!TOKEN.test(token)) return invalid;
  if (password.length < 8 || password.length > 128) return { ok: false, field: "password", error: "كلمة المرور بين 8 و128 حرفًا." };

  const passwordHash = await hashPassword(password);
  const user = await db().begin(async (tx) => {
    const [reset] = await tx<{ user_id: string }[]>`
      update password_resets set used_at = now()
      where id = ${digest(token)} and used_at is null and expires_at > now()
      returning user_id`;
    if (!reset) return null;
    const [row] = await tx<{ id: string; name: string; email: string; intents: string[]; created_at: Date }[]>`
      update users set password_hash = ${passwordHash} where id = ${reset.user_id}
      returning id, name, email, intents, created_at`;
    // whoever held the old password is signed out everywhere
    await tx`delete from sessions where user_id = ${reset.user_id}`;
    return row;
  });
  if (!user) return invalid;
  await startSession(user.id);
  return { ok: true, user: toSessionUser(user), challenges: await loadChallenges(user.id) };
}
