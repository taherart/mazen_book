"use client";

import { deleteAccountAction, signOutAction } from "./server/auth-actions";
import { actions, type ChallengeState, type DemoUser } from "./demo/store";

/** Asks the server who is signed in and puts the answer in the store. Without a database the
 *  server says so, and the browser-only demo sign-in stays in charge. */
export async function refreshSession() {
  try {
    const res = await fetch("/api/session", { cache: "no-store" });
    if (!res.ok) return;
    const data = (await res.json()) as { backend: boolean; user?: DemoUser | null; challenges?: Record<number, ChallengeState> };
    actions.setSession(data.backend, data.user ?? null, data.challenges);
  } catch {
    // offline: keep what the store already has
  }
}

export async function signOut() {
  await signOutAction();
  actions.signOut();
}

/** Removes the account on the server (when there is one) and everything kept in this browser. */
export async function deleteAccount() {
  const { ok } = await deleteAccountAction();
  if (ok) actions.reset();
  return ok;
}
