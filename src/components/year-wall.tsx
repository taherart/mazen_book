"use client";

import { Check } from "@/components/icons";
import Link from "next/link";
import { useEffect, useRef } from "react";
import { useDemo } from "@/lib/demo/hooks";
import { methodHref } from "@/lib/methods";
import type { MethodSummary, WeekInfo } from "@/lib/types";
import { cx } from "./ui";
import { useWeekMethod } from "./weekly";

const WEEK_MS = 7 * 24 * 60 * 60 * 1000;
const MONTH = new Intl.DateTimeFormat("ar-SA-u-ca-gregory-nu-latn", { month: "long", year: "numeric", timeZone: "Asia/Riyadh" });
const DAY = new Intl.DateTimeFormat("ar-SA-u-ca-gregory-nu-latn", { day: "numeric", timeZone: "Asia/Riyadh" });

interface Row {
  week: number;
  method: MethodSummary;
  day: string;
}

/**
 * The year as a wall planner: twelve months, each listing its weeks with the date the week opens
 * and the method it belongs to. This week is shaded; the member's own progress is marked. Phones
 * swipe through the months; wider screens see the whole year.
 */
export function YearWall({ week, methods, className }: { week: WeekInfo; methods: MethodSummary[]; className?: string }) {
  const current = useWeekMethod(week);
  const { challenges } = useDemo();
  const rail = useRef<HTMLOListElement>(null);
  const yearStart = new Date(week.startsAt).getTime() - (week.week - 1) * WEEK_MS;

  const months: { name: string; rows: Row[] }[] = [];
  for (let k = 1; k <= 52; k++) {
    const starts = new Date(yearStart + (k - 1) * WEEK_MS);
    const name = MONTH.format(starts);
    const row = { week: k, method: methods[(k === week.week ? current : k) - 1], day: DAY.format(starts) };
    const last = months.at(-1);
    if (last?.name === name) last.rows.push(row);
    else months.push({ name, rows: [row] });
  }

  // on phones the months are a swipeable rail: once it comes into view, bring this month to the front
  useEffect(() => {
    const list = rail.current;
    const here = list?.querySelector<HTMLElement>("[data-now]");
    if (!list || !here || list.scrollWidth <= list.clientWidth) return;
    const io = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting) return;
      io.disconnect();
      here.scrollIntoView({ block: "nearest", inline: "start", behavior: "instant" });
    });
    io.observe(list);
    return () => io.disconnect();
  }, []);

  return (
    <ol ref={rail} className={cx("rail gap-3 lg:grid lg:grid-cols-3 lg:gap-4 lg:overflow-visible lg:[mask-image:none] xl:grid-cols-4", className)}>
      {months.map((month) => (
        <li key={month.name} data-now={month.rows.some((r) => r.week === week.week) ? "" : undefined} className="w-[78%] rounded-card border border-line bg-white p-3 sm:w-[45%] lg:w-auto">
          <h3 className="border-b border-ink pb-1.5 text-sm font-bold text-ink">{month.name}</h3>
          <ul>
            {month.rows.map(({ week: k, method: m, day }) => {
              const mine = challenges[m.n];
              const done = !!mine && mine.done.length >= m.tasks;
              const now = k === week.week;
              const past = k < week.week;
              return (
                <li key={k}>
                  <Link
                    href={methodHref(m.n)}
                    aria-label={`الأسبوع ${k}، يبدأ ${day} ${month.name}: ${m.title}${now ? " (تحدي هذا الأسبوع)" : ""}`}
                    className={cx("-mx-1.5 flex items-baseline gap-2 rounded-md border-b border-line px-1.5 py-1.5 text-sm transition last:border-b-0 hover:bg-brand-wash", now && "bg-sun hover:bg-sun-deep", past && !now && "text-ink-mute")}
                  >
                    <span className={cx("w-5 shrink-0 font-display text-base leading-none", now ? "text-ink" : past ? "text-ink-mute" : "text-brand")}>{k}</span>
                    <span className={cx("min-w-0 flex-1 truncate", now ? "font-bold text-ink" : !past && "text-ink")}>{m.title}</span>
                    {done ? <Check aria-label="أكملتها" className="size-4 shrink-0 text-ok" /> : mine ? <span aria-label="بدأتها" className="size-2 shrink-0 self-center rounded-full bg-brand" /> : null}
                    <span className="shrink-0 text-xs tabular-nums text-ink-mute">{day}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </li>
      ))}
    </ol>
  );
}
