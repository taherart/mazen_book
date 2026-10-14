"use server";

import { getMethod } from "../methods";
import { currentUser } from "./auth";
import { backendEnabled, db } from "./db";

/** Every action answers whether the server accepted it; the client store then trusts its own copy
 *  or reloads the server's (lib/demo/store.ts). */
type Result = { ok: boolean };

const MIN_NOTE = 30;
const MAX_NOTE = 5000;

async function member(method: unknown) {
  if (!backendEnabled() || typeof method !== "number" || !Number.isInteger(method) || !getMethod(method)) return null;
  return currentUser();
}

/** Tasks per method: the method's steps plus "document the result" (see lib/methods.ts). */
const taskCount = (method: number) => getMethod(method)!.steps.length + 1;

export async function joinChallengeAction(method: number): Promise<Result> {
  const user = await member(method);
  if (!user) return { ok: false };
  await db()`insert into challenges (user_id, method) values (${user.id}, ${method}) on conflict do nothing`;
  return { ok: true };
}

export async function leaveChallengeAction(method: number): Promise<Result> {
  const user = await member(method);
  if (!user) return { ok: false };
  // a sent write-up is a raffle entry; it stays once it has been reviewed
  await db()`delete from challenges where user_id = ${user.id} and method = ${method} and submitted_at is null`;
  return { ok: true };
}

export async function toggleTaskAction(method: number, task: number): Promise<Result> {
  const user = await member(method);
  if (!user || !Number.isInteger(task) || task < 0 || task >= taskCount(method)) return { ok: false };
  const rows = await db()`
    update challenges
    set done = case when ${task} = any(done)
      then array_remove(done, ${task}::smallint)
      else (select array_agg(t order by t) from unnest(array_append(done, ${task}::smallint)) t) end
    where user_id = ${user.id} and method = ${method} and submitted_at is null
    returning method`;
  return { ok: rows.length > 0 };
}

export async function setNoteAction(method: number, note: unknown): Promise<Result> {
  const user = await member(method);
  if (!user || typeof note !== "string" || note.length > MAX_NOTE) return { ok: false };
  const rows = await db()`update challenges set note = ${note} where user_id = ${user.id} and method = ${method} and submitted_at is null returning method`;
  return { ok: rows.length > 0 };
}

/** Sends the week's write-up. The server checks the same rules as the form. */
export async function submitChallengeAction(method: number, note: unknown): Promise<Result> {
  const user = await member(method);
  if (!user || typeof note !== "string" || note.trim().length < MIN_NOTE || note.length > MAX_NOTE) return { ok: false };
  const rows = await db()`
    update challenges set note = ${note}, submitted_at = now(), entry = 'pending'
    where user_id = ${user.id} and method = ${method} and submitted_at is null and cardinality(done) > 0
    returning method`;
  return { ok: rows.length > 0 };
}
