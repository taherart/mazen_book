"use client";

import { useMemo, useSyncExternalStore } from "react";
import { SAMPLE_ENTRIES, SAMPLE_PROVIDERS, SAMPLE_STORIES } from "@/data/samples";
import type { Provider, Story } from "../types";
import { getServerSnapshot, getSnapshot, subscribe, type EntryStatus } from "./store";

export function useDemo() {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

const noop = () => () => {};
/** False on the server and during hydration; lets account-dependent UI show a skeleton first. */
export function useHydrated() {
  return useSyncExternalStore(
    noop,
    () => true,
    () => false,
  );
}

export function useUser() {
  return useDemo().user;
}

/** Published stories: the illustrative set (when switched on) plus anything approved locally. */
export function useStories(method?: number): Story[] {
  const { stories, showSamples } = useDemo();
  return useMemo(() => {
    const list = [...stories.filter((s) => s.status === "approved"), ...(showSamples ? SAMPLE_STORIES : [])];
    return method ? list.filter((s) => s.method === method) : list;
  }, [stories, showSamples, method]);
}

export function useProviders(method?: number): Provider[] {
  const { providers, showSamples } = useDemo();
  return useMemo(() => {
    const list = [...providers.filter((p) => p.status === "approved"), ...(showSamples ? SAMPLE_PROVIDERS : [])];
    return method ? list.filter((p) => p.methods.includes(method)) : list;
  }, [providers, showSamples, method]);
}

export interface RaffleEntry {
  id: string;
  name: string;
  method: number;
  done: number;
  total: number;
  note: string;
  status: EntryStatus;
  sample: boolean;
}

/** Entries for one method's weekly draw: the member's own write-up plus the illustrative ones. */
export function useEntries(method: number, totalTasks: number): RaffleEntry[] {
  const { user, challenges, showSamples, admin } = useDemo();
  return useMemo(() => {
    const list: RaffleEntry[] = [];
    const mine = challenges[method];
    if (user && mine?.submittedAt) {
      list.push({ id: `me:${method}`, name: user.name, method, done: mine.done.length, total: totalTasks, note: mine.note, status: mine.entry, sample: false });
    }
    if (showSamples) {
      for (const e of SAMPLE_ENTRIES) {
        list.push({ id: `${e.id}:${method}`, name: e.name, method, done: Math.min(e.done, totalTasks), total: totalTasks, note: e.note, status: admin.entries[`${e.id}:${method}`] ?? "pending", sample: true });
      }
    }
    return list;
  }, [user, challenges, showSamples, admin.entries, method, totalTasks]);
}
