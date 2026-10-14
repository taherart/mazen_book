// Prototype state. Everything a visitor does (signing in, joining a challenge, submitting a
// story…) is kept in this browser only, so the flows can be clicked through before the backend
// exists. The backend phase replaces this module with real API calls.
import type { Provider, ReviewStatus, Story } from "../types";

export interface DemoUser {
  id: string;
  name: string;
  email: string;
  admin: boolean;
  joinedAt: string;
  /** What brought them here; a member can hold several roles at once. */
  intents: Intent[];
}

export type Intent = "explore" | "provide" | "share";

export type EntryStatus = "pending" | "eligible" | "rejected";

export interface ChallengeState {
  joinedAt: string;
  done: number[];
  note: string;
  /** Set when the member sends their week's write-up; that is the raffle entry. */
  submittedAt: string | null;
  entry: EntryStatus;
}

export interface ContactRequest {
  id: string;
  providerId: string;
  providerName: string;
  name: string;
  contact: string;
  message: string;
  createdAt: string;
}

export interface Report {
  id: string;
  kind: "story" | "provider";
  targetId: string;
  targetTitle: string;
  reason: string;
  createdAt: string;
  resolved: boolean;
}

export interface Winner {
  name: string;
  method: number;
  drawnAt: string;
  announced: boolean;
}

export interface DemoState {
  /** True when the server has a database: the account then comes from the server session. */
  backend: boolean;
  user: DemoUser | null;
  challenges: Record<number, ChallengeState>;
  stories: Story[];
  providers: Provider[];
  requests: ContactRequest[];
  reports: Report[];
  /** Stories the member marked as helpful. */
  helpful: string[];
  /** Show the illustrative stories, providers and counters. Off = the real, empty launch state. */
  showSamples: boolean;
  admin: {
    /** Overrides the calendar: the method the team picked for this week. */
    weekMethod: number | null;
    prize: string;
    /** Review decisions on sample raffle entries, keyed by entry id. */
    entries: Record<string, EntryStatus>;
    winners: Record<number, Winner>;
  };
}

export const initialState: DemoState = {
  backend: false,
  user: null,
  challenges: {},
  stories: [],
  providers: [],
  requests: [],
  reports: [],
  helpful: [],
  showSamples: true,
  admin: { weekMethod: null, prize: "", entries: {}, winners: {} },
};

const KEY = "m52.demo.v1";
let state = initialState;
let loaded = false;
const listeners = new Set<() => void>();

function load() {
  if (loaded || typeof window === "undefined") return;
  loaded = true;
  try {
    const saved = window.localStorage.getItem(KEY);
    if (saved) {
      const parsed = JSON.parse(saved) as Partial<DemoState>;
      state = { ...initialState, ...parsed, admin: { ...initialState.admin, ...parsed.admin } };
    }
  } catch {
    // private mode or corrupt data: start clean
  }
}

export function getSnapshot() {
  load();
  return state;
}

export function getServerSnapshot() {
  return initialState;
}

export function subscribe(listener: () => void) {
  listeners.add(listener);
  const onStorage = (e: StorageEvent) => {
    if (e.key !== KEY) return;
    loaded = false;
    state = initialState;
    load();
    listener();
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", onStorage);
  };
}

function update(change: (s: DemoState) => DemoState) {
  load();
  state = change(state);
  try {
    window.localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    // storage unavailable: keep working in memory
  }
  listeners.forEach((l) => l());
}

const uid = () => (typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : String(Date.now()) + Math.random().toString(16).slice(2));
const now = () => new Date().toISOString();

export const actions = {
  signIn(input: { name: string; email: string; admin?: boolean; intents?: Intent[] }) {
    update((s) => ({ ...s, user: { id: s.user?.email === input.email ? s.user.id : uid(), name: input.name, email: input.email, admin: !!input.admin, joinedAt: s.user?.joinedAt ?? now(), intents: input.intents ?? s.user?.intents ?? [] } }));
  },
  signOut() {
    update((s) => ({ ...s, user: null }));
  },
  /** The server's answer about who is signed in (see lib/session-client.ts). */
  setSession(backend: boolean, user: DemoUser | null) {
    update((s) => (backend ? { ...s, backend, user } : { ...s, backend }));
  },
  setShowSamples(showSamples: boolean) {
    update((s) => ({ ...s, showSamples }));
  },
  reset() {
    update(() => initialState);
  },

  joinChallenge(method: number) {
    update((s) => (s.challenges[method] ? s : { ...s, challenges: { ...s.challenges, [method]: { joinedAt: now(), done: [], note: "", submittedAt: null, entry: "pending" } } }));
  },
  leaveChallenge(method: number) {
    update((s) => {
      const rest = { ...s.challenges };
      delete rest[method];
      return { ...s, challenges: rest };
    });
  },
  toggleTask(method: number, task: number) {
    update((s) => {
      const c = s.challenges[method];
      if (!c) return s;
      const done = c.done.includes(task) ? c.done.filter((t) => t !== task) : [...c.done, task].sort((a, b) => a - b);
      return { ...s, challenges: { ...s.challenges, [method]: { ...c, done } } };
    });
  },
  setNote(method: number, note: string) {
    update((s) => (s.challenges[method] ? { ...s, challenges: { ...s.challenges, [method]: { ...s.challenges[method], note } } } : s));
  },
  submitChallenge(method: number) {
    update((s) => (s.challenges[method] ? { ...s, challenges: { ...s.challenges, [method]: { ...s.challenges[method], submittedAt: now(), entry: "pending" } } } : s));
  },

  addStory(input: Omit<Story, "id" | "createdAt" | "status" | "ownerId">) {
    const id = uid();
    update((s) => ({ ...s, stories: [{ ...input, id, createdAt: now(), status: "pending", ownerId: s.user?.id }, ...s.stories] }));
    return id;
  },
  addProvider(input: Omit<Provider, "id" | "createdAt" | "status" | "ownerId">) {
    const id = uid();
    update((s) => ({ ...s, providers: [{ ...input, id, createdAt: now(), status: "pending", ownerId: s.user?.id }, ...s.providers] }));
    return id;
  },
  addRequest(input: Omit<ContactRequest, "id" | "createdAt">) {
    update((s) => ({ ...s, requests: [{ ...input, id: uid(), createdAt: now() }, ...s.requests] }));
  },

  toggleHelpful(storyId: string) {
    update((s) => ({ ...s, helpful: s.helpful.includes(storyId) ? s.helpful.filter((x) => x !== storyId) : [...s.helpful, storyId] }));
  },
  addReport(input: Omit<Report, "id" | "createdAt" | "resolved">) {
    update((s) => ({ ...s, reports: [{ ...input, id: uid(), createdAt: now(), resolved: false }, ...s.reports] }));
  },

  // ----- admin -----
  resolveReport(id: string) {
    update((s) => ({ ...s, reports: s.reports.map((r) => (r.id === id ? { ...r, resolved: true } : r)) }));
  },
  reviewStory(id: string, status: ReviewStatus) {
    update((s) => ({ ...s, stories: s.stories.map((x) => (x.id === id ? { ...x, status } : x)) }));
  },
  reviewProvider(id: string, status: ReviewStatus) {
    update((s) => ({ ...s, providers: s.providers.map((x) => (x.id === id ? { ...x, status } : x)) }));
  },
  setWeekMethod(weekMethod: number | null) {
    update((s) => ({ ...s, admin: { ...s.admin, weekMethod } }));
  },
  setPrize(prize: string) {
    update((s) => ({ ...s, admin: { ...s.admin, prize } }));
  },
  reviewEntry(id: string, status: EntryStatus) {
    update((s) => {
      if (id.startsWith("me:")) {
        const m = Number(id.slice(3));
        const c = s.challenges[m];
        return c ? { ...s, challenges: { ...s.challenges, [m]: { ...c, entry: status } } } : s;
      }
      return { ...s, admin: { ...s.admin, entries: { ...s.admin.entries, [id]: status } } };
    });
  },
  setWinner(week: number, winner: Winner | null) {
    update((s) => {
      const winners = { ...s.admin.winners };
      if (winner) winners[week] = winner;
      else delete winners[week];
      return { ...s, admin: { ...s.admin, winners } };
    });
  },
};
