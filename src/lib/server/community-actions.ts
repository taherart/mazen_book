"use server";

import type { ReviewStatus } from "../types";
import { safeHttpUrl } from "../safe-url";
import { clientIp, currentUser, overLimit } from "./auth";
import { backendEnabled, db } from "./db";

/** The same rules the forms show, checked again here because a request can skip the form. */
type Result = { ok: boolean };
const NO = { ok: false } as const;
const YES = { ok: true } as const;

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const PHONE_OR_EMAIL = /^(\+?\d[\d\s-]{8,}|[^\s@]+@[^\s@]+\.[^\s@]{2,})$/;

const str = (v: unknown, min: number, max: number) => {
  if (typeof v !== "string") return null;
  const t = v.trim().replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/g, "");
  return t.length >= min && t.length <= max ? t : null;
};
const optStr = (v: unknown, max: number) => (v == null || v === "" ? null : str(v, 1, max));
const amount = (v: unknown) => (v == null ? null : Number.isInteger(v) && (v as number) >= 0 && (v as number) <= 1e9 ? (v as number) : undefined);
const method = (v: unknown) => (Number.isInteger(v) && (v as number) >= 1 && (v as number) <= 52 ? (v as number) : null);
const list = (v: unknown, minItems: number, maxItems: number, maxLen: number) => {
  if (!Array.isArray(v)) return null;
  const items = v.map((x) => str(x, 1, maxLen));
  return items.length >= minItems && items.length <= maxItems && items.every((x) => x !== null) ? (items as string[]) : null;
};

async function member(limitKey: string, max: number) {
  if (!backendEnabled()) return null;
  const user = await currentUser();
  if (!user || overLimit(`${limitKey}:${user.id}`, max, 60)) return null;
  return user;
}

export async function addStoryAction(id: unknown, input: Record<string, unknown>): Promise<Result> {
  const user = await member("story", 5);
  if (!user || typeof id !== "string" || !UUID.test(id)) return NO;
  const v = {
    method: method(input.method),
    title: str(input.title, 8, 120),
    author: optStr(input.author, 60) ?? user.name,
    city: optStr(input.city, 60),
    body: str(input.body, 60, 5000),
    duration: str(input.duration, 1, 60),
    cost: amount(input.cost),
    income: amount(input.income),
    outcome: ["worked", "partly", "didnt"].includes(input.outcome as string) ? (input.outcome as string) : null,
    challenges: str(input.challenges, 15, 2000),
    tips: list(input.tips, 1, 5, 300),
    media: ["video", "images", "none"].includes(input.media as string) ? (input.media as string) : null,
  };
  if (Object.entries(v).some(([k, x]) => x === undefined || (x === null && !["city", "cost", "income"].includes(k)))) return NO;
  await db()`
    insert into stories (id, user_id, method, title, author, city, body, duration, cost, income, outcome, challenges, tips, media)
    values (${id}, ${user.id}, ${v.method}, ${v.title}, ${v.author}, ${v.city}, ${v.body}, ${v.duration}, ${v.cost ?? null}, ${v.income ?? null}, ${v.outcome}, ${v.challenges}, ${v.tips}, ${v.media})`;
  return YES;
}

const CONTACT: Record<string, (v: string) => boolean> = {
  whatsapp: (v) => /^\+?\d{9,15}$/.test(v.replace(/[\s-]/g, "")),
  email: (v) => EMAIL.test(v),
  link: (v) => /^https?:\/\/\S+\.\S+/.test(v) && !!safeHttpUrl(v),
};

export async function addProviderAction(id: unknown, input: Record<string, unknown>): Promise<Result> {
  const user = await member("provider", 5);
  if (!user || typeof id !== "string" || !UUID.test(id)) return NO;
  const methods = Array.isArray(input.methods) && input.methods.length >= 1 && input.methods.length <= 3 && input.methods.every((m) => method(m)) ? (input.methods as number[]) : null;
  const portfolio = Array.isArray(input.portfolio) && input.portfolio.length <= 6 ? input.portfolio.map((l) => ({ label: str((l as { label?: unknown })?.label, 1, 80), url: str((l as { url?: unknown })?.url, 8, 300) })) : null;
  const contact = input.contact as { kind?: unknown; value?: unknown } | undefined;
  const contactValue = str(contact?.value, 3, 300);
  const v = {
    name: str(input.name, 2, 80),
    headline: str(input.headline, 15, 160),
    bio: str(input.bio, 40, 2000),
    services: list(input.services, 1, 10, 120),
    city: str(input.city, 1, 60),
    priceFrom: amount(input.priceFrom),
    priceNote: optStr(input.priceNote, 120),
  };
  if (!methods || !portfolio || portfolio.some((l) => !l.label || !l.url || !safeHttpUrl(l.url)) || Object.entries(v).some(([k, x]) => x === undefined || (x === null && !["priceFrom", "priceNote"].includes(k)))) return NO;
  if (typeof contact?.kind !== "string" || !CONTACT[contact.kind] || !contactValue || !CONTACT[contact.kind](contactValue)) return NO;
  await db()`
    insert into providers (id, user_id, methods, name, headline, bio, services, portfolio, price_from, price_note, city, remote, contact_kind, contact_value)
    values (${id}, ${user.id}, ${methods}, ${v.name}, ${v.headline}, ${v.bio}, ${v.services}, ${db().json(portfolio)}, ${v.priceFrom ?? null}, ${v.priceNote}, ${v.city}, ${input.remote === true}, ${contact.kind}, ${contactValue})`;
  return YES;
}

/** Anyone may contact a published provider; the request goes to that provider's account. */
export async function addRequestAction(input: { providerId?: unknown; name?: unknown; contact?: unknown; message?: unknown }): Promise<Result> {
  if (!backendEnabled() || typeof input.providerId !== "string" || !UUID.test(input.providerId)) return NO;
  if (overLimit(`request:${await clientIp()}`, 5, 60)) return NO;
  const name = str(input.name, 2, 80);
  const contact = str(input.contact, 5, 120);
  const message = str(input.message, 15, 2000);
  if (!name || !contact || !PHONE_OR_EMAIL.test(contact) || !message) return NO;
  const user = await currentUser();
  const rows = await db()`
    insert into contact_requests (provider_id, from_user_id, name, contact, message)
    select id, ${user?.id ?? null}, ${name}, ${contact}, ${message} from providers where id = ${input.providerId} and status = 'approved'
    returning id`;
  return { ok: rows.length > 0 };
}

export async function toggleHelpfulAction(storyId: unknown): Promise<Result> {
  if (!backendEnabled() || typeof storyId !== "string" || !UUID.test(storyId)) return NO;
  const user = await currentUser();
  if (!user) return NO;
  const removed = await db()`delete from helpful where user_id = ${user.id} and story_id = ${storyId} returning story_id`;
  if (!removed.length) await db()`insert into helpful (user_id, story_id) select ${user.id}, id from stories where id = ${storyId} and status = 'approved' on conflict do nothing`;
  return YES;
}

export async function addReportAction(input: { kind?: unknown; targetId?: unknown; targetTitle?: unknown; reason?: unknown }): Promise<Result> {
  if (!backendEnabled() || (input.kind !== "story" && input.kind !== "provider") || typeof input.targetId !== "string" || !UUID.test(input.targetId)) return NO;
  if (overLimit(`report:${await clientIp()}`, 10, 60)) return NO;
  const reason = str(input.reason, 3, 120);
  const title = str(input.targetTitle, 1, 160);
  if (!reason || !title) return NO;
  const user = await currentUser();
  await db()`insert into reports (kind, target_id, target_title, reason, reporter_id) values (${input.kind}, ${input.targetId}, ${title}, ${reason}, ${user?.id ?? null})`;
  return YES;
}

/* ---------- admin: every decision checks the admin list on the server ---------- */

async function admin() {
  if (!backendEnabled()) return null;
  const user = await currentUser();
  return user?.admin ? user : null;
}
const STATUSES: ReviewStatus[] = ["pending", "approved", "rejected"];

export async function reviewStoryAction(id: unknown, status: unknown): Promise<Result> {
  if (!(await admin()) || typeof id !== "string" || !UUID.test(id) || !STATUSES.includes(status as ReviewStatus)) return NO;
  const rows = await db()`update stories set status = ${status as string}, reviewed_at = now() where id = ${id} returning id`;
  return { ok: rows.length > 0 };
}

export async function reviewProviderAction(id: unknown, status: unknown): Promise<Result> {
  if (!(await admin()) || typeof id !== "string" || !UUID.test(id) || !STATUSES.includes(status as ReviewStatus)) return NO;
  const rows = await db()`update providers set status = ${status as string}, reviewed_at = now() where id = ${id} returning id`;
  return { ok: rows.length > 0 };
}

export async function resolveReportAction(id: unknown): Promise<Result> {
  if (!(await admin()) || typeof id !== "string" || !UUID.test(id)) return NO;
  const rows = await db()`update reports set resolved = true where id = ${id} returning id`;
  return { ok: rows.length > 0 };
}
