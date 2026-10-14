// Prototype state. Everything a visitor does (signing in, joining a challenge, submitting a
// story…) is kept in this browser only, so the flows can be clicked through before the backend
// exists. The backend phase replaces this module with real API calls.
import { joinChallengeAction, leaveChallengeAction, setNoteAction, submitChallengeAction, toggleTaskAction } from "../server/challenge-actions";
import { addProviderAction, addReportAction, addRequestAction, addStoryAction, resolveReportAction, reviewProviderAction, reviewStoryAction, toggleHelpfulAction } from "../server/community-actions";
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

const noteTimers = new Map<number, ReturnType<typeof setTimeout>>();

/** With a database, a member's change is sent to the server after the local update; if the server
 *  turns it down, the store reloads the server's copy so the screen never shows unsaved work. */
function toServer(send: () => Promise<{ ok: boolean }>, { anyone = false } = {}) {
  if (!state.backend || (!state.user && !anyone)) return;
  send()
    .then((res) => (res.ok ? null : resync()))
    .catch(() => resync());
}
async function resync() {
  const { refreshSession } = await import("../session-client");
  await refreshSession();
}

/** Server records have UUIDs; the illustrative samples have readable ids and stay local. */
const isId = (id: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/.test(id);

// randomUUID exists only on HTTPS pages; the plain-HTTP preview builds a v4 UUID by hand
const uid = (): string =>
  typeof crypto.randomUUID === "function"
    ? crypto.randomUUID()
    : "10000000-1000-4000-8000-100000000000".replace(/[018]/g, (c) => (Number(c) ^ (crypto.getRandomValues(new Uint8Array(1))[0] & (15 >> (Number(c) / 4)))).toString(16));
const now = () => new Date().toISOString();

export const actions = {
  signIn(input: { name: string; email: string; admin?: boolean; intents?: Intent[] }) {
    update((s) => ({ ...s, user: { id: s.user?.email === input.email ? s.user.id : uid(), name: input.name, email: input.email, admin: !!input.admin, joinedAt: s.user?.joinedAt ?? now(), intents: input.intents ?? s.user?.intents ?? [] } }));
  },
  signOut() {
    // with real accounts, a member's challenges belong to the account, not to this device
    update((s) => ({ ...s, user: null, challenges: s.backend ? {} : s.challenges }));
  },
  /** The server's answer about who is signed in and their challenges (see lib/session-client.ts). */
  setSession(backend: boolean, user: DemoUser | null, challenges?: Record<number, ChallengeState>, community?: Pick<DemoState, "stories" | "providers" | "requests" | "reports" | "helpful">) {
    update((s) => (backend ? { ...s, ...community, backend, user, challenges: challenges ?? (user ? s.challenges : {}) } : { ...s, backend }));
  },
  setShowSamples(showSamples: boolean) {
    update((s) => ({ ...s, showSamples }));
  },
  reset() {
    update(() => initialState);
  },

  joinChallenge(method: number) {
    update((s) => (s.challenges[method] ? s : { ...s, challenges: { ...s.challenges, [method]: { joinedAt: now(), done: [], note: "", submittedAt: null, entry: "pending" } } }));
    toServer(() => joinChallengeAction(method));
  },
  leaveChallenge(method: number) {
    toServer(() => leaveChallengeAction(method));
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
    toServer(() => toggleTaskAction(method, task));
  },
  setNote(method: number, note: string) {
    update((s) => (s.challenges[method] ? { ...s, challenges: { ...s.challenges, [method]: { ...s.challenges[method], note } } } : s));
    // typing fires on every key: save once the member pauses
    clearTimeout(noteTimers.get(method));
    noteTimers.set(method, setTimeout(() => toServer(() => setNoteAction(method, note)), 800));
  },
  submitChallenge(method: number) {
    clearTimeout(noteTimers.get(method));
    const note = state.challenges[method]?.note ?? "";
    update((s) => (s.challenges[method] ? { ...s, challenges: { ...s.challenges, [method]: { ...s.challenges[method], submittedAt: now(), entry: "pending" } } } : s));
    toServer(() => submitChallengeAction(method, note));
  },

  addStory(input: Omit<Story, "id" | "createdAt" | "status" | "ownerId">) {
    const id = uid();
    update((s) => ({ ...s, stories: [{ ...input, id, createdAt: now(), status: "pending", ownerId: s.user?.id }, ...s.stories] }));
    toServer(() => addStoryAction(id, input));
    return id;
  },
  addProvider(input: Omit<Provider, "id" | "createdAt" | "status" | "ownerId">) {
    const id = uid();
    update((s) => ({ ...s, providers: [{ ...input, id, createdAt: now(), status: "pending", ownerId: s.user?.id }, ...s.providers] }));
    toServer(() => addProviderAction(id, input));
    return id;
  },
  addRequest(input: Omit<ContactRequest, "id" | "createdAt">) {
    update((s) => ({ ...s, requests: [{ ...input, id: uid(), createdAt: now() }, ...s.requests] }));
    // the illustrative profiles have no account behind them, so their requests stay on this device
    if (isId(input.providerId)) toServer(() => addRequestAction(input), { anyone: true });
  },

  toggleHelpful(storyId: string) {
    update((s) => ({ ...s, helpful: s.helpful.includes(storyId) ? s.helpful.filter((x) => x !== storyId) : [...s.helpful, storyId] }));
    if (isId(storyId)) toServer(() => toggleHelpfulAction(storyId));
  },
  addReport(input: Omit<Report, "id" | "createdAt" | "resolved">) {
    update((s) => ({ ...s, reports: [{ ...input, id: uid(), createdAt: now(), resolved: false }, ...s.reports] }));
    if (isId(input.targetId)) toServer(() => addReportAction(input), { anyone: true });
  },

  // ----- admin -----
  resolveReport(id: string) {
    update((s) => ({ ...s, reports: s.reports.map((r) => (r.id === id ? { ...r, resolved: true } : r)) }));
    toServer(() => resolveReportAction(id));
  },
  reviewStory(id: string, status: ReviewStatus) {
    update((s) => ({ ...s, stories: s.stories.map((x) => (x.id === id ? { ...x, status } : x)) }));
    toServer(() => reviewStoryAction(id, status));
  },
  reviewProvider(id: string, status: ReviewStatus) {
    update((s) => ({ ...s, providers: s.providers.map((x) => (x.id === id ? { ...x, status } : x)) }));
    toServer(() => reviewProviderAction(id, status));
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
