import { LAUNCH_DATE } from "./config";
import type { WeekInfo } from "./types";

const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

/** Which of the 52 weeks a moment falls in. Before launch it reports week 1. */
export function weekAt(now: Date): WeekInfo {
  const launch = new Date(LAUNCH_DATE).getTime();
  const elapsed = Math.max(0, Math.floor((now.getTime() - launch) / WEEK_MS));
  const startsAt = launch + elapsed * WEEK_MS;
  return {
    week: (elapsed % 52) + 1,
    startsAt: new Date(startsAt).toISOString(),
    endsAt: new Date(startsAt + WEEK_MS).toISOString(),
  };
}

/** The draws the team can still act on: this week's and, once there is one, last week's. */
export function openDraws(now: Date): WeekInfo[] {
  const current = weekAt(now);
  const previous = weekAt(new Date(new Date(current.startsAt).getTime() - WEEK_MS));
  return previous.startsAt === current.startsAt ? [current] : [current, previous];
}

export function formatDate(iso: string) {
  return new Intl.DateTimeFormat("ar-SA-u-ca-gregory-nu-latn", { day: "numeric", month: "long", year: "numeric", timeZone: "Asia/Riyadh" }).format(new Date(iso));
}

export function formatDay(iso: string) {
  return new Intl.DateTimeFormat("ar-SA-u-ca-gregory-nu-latn", { weekday: "long", day: "numeric", month: "long", timeZone: "Asia/Riyadh" }).format(new Date(iso));
}
