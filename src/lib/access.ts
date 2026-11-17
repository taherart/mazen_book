// The unlock rules, shared by the server (which enforces them) and the pages (which explain them).
// Every method's first page is public. The second page and everything after it open with the
// method: five are open to everyone, the challenge of the week is open while it runs, and the rest
// are earned by doing things on the platform.

import type { CapitalBand, Level, MethodSummary, Place, TimeBand } from "./types";

/** What each action is worth, in methods the member may then open. */
export const CREDIT = {
  /** Answering the survey opens this many methods, picked to fit the answers. */
  survey: 5,
  /** Sending a challenge's write-up. */
  challenge: 5,
  /** Rating a method the member has tried. */
  rating: 2,
  /** A story the team approved. */
  story: 10,
  /** A friend who signed up with the member's link and answered the survey; also what the friend gets. */
  invite: 3,
} as const;
/** Invitations stop counting after this many, since sign-ups are not verified by email yet. */
export const INVITE_CAP = 5;

/** What the session tells the browser about a visitor's access. Without a database every method is open. */
export interface Access {
  /** False until the server has answered; lock marks wait for it. */
  loaded: boolean;
  /** Book owners and the team: everything is open. */
  all: boolean;
  /** Methods open to this visitor when `all` is false. */
  open: number[];
  /** Methods the member may still open by choice. */
  credits: number;
  survey: boolean;
  bookOwner: boolean;
  /** Whether the team has set a book code, so the form is worth showing. */
  bookCode: boolean;
  inviteCode: string | null;
  /** Friends who joined with the member's link and answered the survey. */
  invited: number;
  /** How the credits were earned, for the progress page. */
  earned: { challenges: number; ratings: number; stories: number; invites: number; welcome: number };
}

export const OPEN_ACCESS: Access = { loaded: true, all: true, open: [], credits: 0, survey: false, bookOwner: false, bookCode: false, inviteCode: null, invited: 0, earned: { challenges: 0, ratings: 0, stories: 0, invites: 0, welcome: 0 } };

export const isOpen = (access: Access, method: number) => access.all || access.open.includes(method);

/* ---------- the survey ---------- */

export const GOALS = { side: "دخل إضافي بجانب عملي أو دراستي", main: "مصدر دخل أساسي", skill: "أتعلّم مهارة أبيعها لاحقًا", explore: "أستكشف فقط" } as const;
export type Goal = keyof typeof GOALS;

export interface SurveyAnswers {
  capital: CapitalBand;
  time: TimeBand;
  place: Place;
  level: Level;
  goal: Goal;
}

const CAPITAL_RANK: Record<CapitalBand, number> = { zero: 0, low: 1, high: 2 };
const TIME_RANK: Record<TimeBand, number> = { week: 0, month: 1, more: 2 };

/** How well a method fits the answers: within the member's money, time and experience first,
 *  an exact match a little more. Higher is better. */
export function fit(m: MethodSummary, a: SurveyAnswers) {
  let score = 0;
  if (CAPITAL_RANK[m.capitalBand] <= CAPITAL_RANK[a.capital]) score += 3 + (m.capitalBand === a.capital ? 1 : 0);
  if (TIME_RANK[m.timeBand] <= TIME_RANK[a.time]) score += 2 + (m.timeBand === a.time ? 1 : 0);
  if (m.place === a.place || m.place === "both" || a.place === "both") score += 2;
  if (m.level <= a.level) score += 2 + (m.level === a.level ? 1 : 0);
  return score;
}

/** The best-fitting methods that are not open yet, best first; ties keep the book's order. */
export function bestFits(methods: MethodSummary[], answers: SurveyAnswers, alreadyOpen: number[], count: number) {
  return methods
    .filter((m) => !alreadyOpen.includes(m.n))
    .map((m) => ({ n: m.n, score: fit(m, answers) }))
    .sort((x, y) => y.score - x.score || x.n - y.n)
    .slice(0, count)
    .map((x) => x.n);
}
