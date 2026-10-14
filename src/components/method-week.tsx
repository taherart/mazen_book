"use client";

import { CalendarClock, Gift, ScrollText, Trophy } from "lucide-react";
import Link from "next/link";
import { useDemo } from "@/lib/demo/hooks";
import { formatDay } from "@/lib/week";
import type { WeekInfo } from "@/lib/types";
import { Countdown, useWeekMethod } from "./weekly";
import { cx } from "./ui";

export const RAFFLE_RULES = ["انضم لتحدي الطريقة وأنجز مهامها خلال الأسبوع.", "أرسل ملخص تجربتك أو إثباتها قبل موعد الإغلاق.", "تراجع الإدارة المشاركات للتأكد من استيفاء الشروط.", "تدخل المشاركات المؤهلة فقط سحبًا عشوائيًا.", "يُعلن الفائز بعد التحقق منه والموافقة."];

/** Shown on a method page only while that method is the challenge of the week. */
export function WeekRibbon({ method, week }: { method: number; week: WeekInfo }) {
  const current = useWeekMethod(week);
  if (current !== method) return null;
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-3xl border-2 border-ink bg-sun px-4 py-3 shadow-print-sm">
      <p className="flex items-center gap-2 font-display text-xl leading-none text-ink">
        <Trophy aria-hidden className="size-5" />
        هذه طريقة تحدي الأسبوع {week.week}
      </p>
      <Countdown endsAt={week.endsAt} />
    </div>
  );
}

const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

/** Section G of the method page: this week's draw, or when this method's week comes up. */
export function RafflePanel({ method, week, className }: { method: number; week: WeekInfo; className?: string }) {
  const current = useWeekMethod(week);
  const { admin } = useDemo();
  const winner = admin.winners[week.week];

  if (current !== method) {
    const ahead = method - week.week;
    const starts = new Date(new Date(week.startsAt).getTime() + ahead * WEEK_MS).toISOString();
    return (
      <div className={cx("flex flex-wrap items-center gap-4 rounded-3xl border-2 border-dashed border-line bg-white/70 p-5", className)}>
        <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-brand-wash text-brand">
          <CalendarClock aria-hidden className="size-6" />
        </span>
        <div className="min-w-0 flex-1">
          <h3 className="font-display text-xl text-ink">{ahead > 0 ? `تحدي هذه الطريقة يبدأ في الأسبوع ${method}` : `كانت هذه الطريقة تحدي الأسبوع ${method}`}</h3>
          <p className="text-sm text-ink-soft" suppressHydrationWarning>
            {ahead > 0 ? `موعده ${formatDay(starts)}. تستطيع البدء من الآن؛ الجائزة والسحب خاصّان بأسبوعها.` : "انتهى سحبها، لكن التجربة مفتوحة دائمًا وتُحسب في إنجازاتك."}
          </p>
        </div>
        <Link href="/challenge" className="text-sm font-bold text-brand underline underline-offset-4">
          تحدي هذا الأسبوع
        </Link>
      </div>
    );
  }

  return (
    <div className={cx("overflow-hidden rounded-[2rem] border-2 border-ink bg-white shadow-print", className)}>
      <div className="grid divide-y-2 divide-ink md:grid-cols-3 md:divide-x-2 md:divide-y-0">
        <div className="p-5">
          <h3 className="flex items-center gap-2 font-display text-xl text-ink">
            <ScrollText aria-hidden className="size-5 text-brand" />
            شروط المشاركة
          </h3>
          <ol className="mt-3 grid gap-2 text-sm text-ink-soft">
            {RAFFLE_RULES.map((r, i) => (
              <li key={r} className="flex gap-2">
                <span className="font-display text-brand">{i + 1}</span>
                {r}
              </li>
            ))}
          </ol>
        </div>
        <div className="p-5">
          <h3 className="flex items-center gap-2 font-display text-xl text-ink">
            <CalendarClock aria-hidden className="size-5 text-brand" />
            موعد الإغلاق
          </h3>
          <p className="mt-3 font-bold text-ink" suppressHydrationWarning>
            {formatDay(week.endsAt)}
          </p>
          <p className="mb-3 text-sm text-ink-soft">منتصف الليل بتوقيت الرياض</p>
          <Countdown endsAt={week.endsAt} />
        </div>
        <div className="bg-sun-wash p-5">
          <h3 className="flex items-center gap-2 font-display text-xl text-ink">
            <Gift aria-hidden className="size-5 text-brand" />
            الجائزة والفائز
          </h3>
          <p className="mt-3 font-bold text-ink">{admin.prize || "تُعلن الجائزة مع بداية التحدي"}</p>
          {winner?.announced ? (
            <p className="mt-3 rounded-2xl border-2 border-ink bg-white px-3 py-2 text-sm">
              فائز الأسبوع {week.week}: <b className="font-display text-lg text-brand">{winner.name}</b>
            </p>
          ) : (
            <p className="mt-2 text-sm text-ink-soft">يُعلن الفائز هنا بعد إغلاق التحدي ومراجعة المشاركات.</p>
          )}
          <Link href="/terms#raffle" className="mt-3 inline-block text-sm font-bold text-brand underline underline-offset-4">
            الشروط الكاملة للسحب
          </Link>
        </div>
      </div>
    </div>
  );
}
