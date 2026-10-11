"use client";

import { CalendarDays, Medal, ScrollText, Trophy } from "@/components/icons";
import Link from "next/link";
import { useDemo, useEntries } from "@/lib/demo/hooks";
import { methodHref } from "@/lib/methods";
import { ENTRIES, count } from "@/lib/taxonomy";
import type { MethodSummary, WeekInfo } from "@/lib/types";
import { formatDay } from "@/lib/week";
import { MethodArt, MethodNumber, MethodRow } from "./method-card";
import { RAFFLE_RULES, RafflePanel } from "./method-week";
import { T } from "./text";
import { Chip, Container, EmptyState, Eyebrow, Notice, SampleTag, SectionHead } from "./ui";
import { Countdown, JoinButton, Participants, useWeekMethod } from "./weekly";

const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

export function ChallengePage({ week, methods, taskTitles }: { week: WeekInfo; methods: MethodSummary[]; taskTitles: string[][] }) {
  const n = useWeekMethod(week);
  const m = methods[n - 1];
  const tasks = taskTitles[n - 1];
  const { admin } = useDemo();
  const entries = useEntries(n, tasks.length);
  const winners = Object.entries(admin.winners)
    .filter(([, w]) => w.announced)
    .sort((a, b) => Number(b[0]) - Number(a[0]));
  const upcoming = [1, 2, 3, 4].map((k) => ({ week: ((week.week - 1 + k) % 52) + 1, starts: new Date(new Date(week.startsAt).getTime() + k * WEEK_MS).toISOString() }));

  return (
    <>
      {/* ---------- this week ---------- */}
      <section className="border-b-2 border-ink bg-sun">
        <Container className="grid items-center gap-8 py-10 lg:grid-cols-[1.1fr_0.9fr] lg:py-14">
          <div className="animate-enter">
            <Eyebrow>
              <Trophy aria-hidden className="size-3.5" />
              تحدي الأسبوع {week.week} من 52
            </Eyebrow>
            <div className="mt-4 flex items-start gap-4">
              <MethodNumber n={n} size="lg" className="shadow-print-sm" />
              <div>
                <h1 className="font-display text-h1 text-ink">{m.title}</h1>
                {m.tagline ? <p className="mt-1 font-display text-xl text-brand-dark sm:text-2xl">«{m.tagline}»</p> : null}
              </div>
            </div>
            <dl className="mt-5 flex flex-wrap gap-2 text-sm">
              <div className="rounded-2xl border-2 border-ink bg-white px-3 py-2">
                <dt className="text-xs text-ink-mute">الدخل المتوقع</dt>
                <dd className="font-bold text-ink">
                  <T>{m.stats.income}</T>
                </dd>
              </div>
              <div className="rounded-2xl border-2 border-ink bg-white px-3 py-2">
                <dt className="text-xs text-ink-mute">رأس المال</dt>
                <dd className="font-bold text-ink">
                  <T>{m.stats.capital}</T>
                </dd>
              </div>
              <div className="rounded-2xl border-2 border-ink bg-white px-3 py-2">
                <dt className="text-xs text-ink-mute">أول ريال خلال</dt>
                <dd className="font-bold text-ink">
                  <T>{m.stats.firstRiyal}</T>
                </dd>
              </div>
            </dl>
            <div className="mt-6">
              <p className="mb-2 text-sm font-bold text-ink">
                ينتهي <span suppressHydrationWarning>{formatDay(week.endsAt)}</span>
              </p>
              <Countdown endsAt={week.endsAt} />
            </div>
            <div className="mt-6 flex flex-wrap items-center gap-4">
              <JoinButton method={n} magnetic />
              <Link href={methodHref(n)} className="font-bold text-ink underline underline-offset-4">
                اقرأ عن الطريقة أولًا
              </Link>
            </div>
            <Participants method={n} className="mt-4 text-ink" />
          </div>
          <Link href={methodHref(n)} className="mx-auto block w-full max-w-sm animate-land rounded-[2.5rem] border-2 border-ink bg-white p-4 shadow-print [animation-delay:200ms]">
            <div className="plate rounded-tile">
              <MethodArt n={n} title={m.title} priority sizes="(min-width: 1024px) 380px, 80vw" />
            </div>
          </Link>
        </Container>
      </section>

      {/* ---------- tasks ---------- */}
      <section className="border-b-2 border-ink bg-white">
        <Container className="grid gap-8 py-12 lg:grid-cols-2">
          <div data-reveal>
            <h2 className="font-display text-h2 text-ink">مهام هذا الأسبوع</h2>
            <p className="mt-2 text-ink-soft">خطوات الطريقة كما في الكتاب، مرتبة لتنجزها خلال أسبوع وتوثّق نتيجتها.</p>
            <ol className="mt-5 grid gap-2">
              {tasks.map((t, i) => (
                <li key={i} className="flex items-center gap-3 rounded-2xl border-2 border-ink bg-paper px-4 py-3">
                  <span className="grid size-8 shrink-0 place-items-center rounded-full border-2 border-ink bg-white pt-[0.1em] font-display text-lg leading-none">{i + 1}</span>
                  <span className="font-bold text-ink">
                    <T>{t}</T>
                  </span>
                </li>
              ))}
            </ol>
          </div>
          <div data-reveal>
            <h2 className="flex items-center gap-2 font-display text-h2 text-ink">
              <ScrollText aria-hidden className="size-6 text-brand" />
              كيف يتم السحب؟
            </h2>
            <p className="mt-2 text-ink-soft">الجائزة لمن جرّب فعلًا، والاختيار عشوائي بين من استوفى الشروط.</p>
            <ol className="mt-5 grid gap-3">
              {["يحدد فريق الإدارة شروط التأهل ويعلنها مع بداية الأسبوع.", ...RAFFLE_RULES.slice(1)].map((r, i) => (
                <li key={r} className="flex gap-3">
                  <span className="font-display text-2xl leading-none text-brand">{i + 1}</span>
                  <span className="leading-7 text-ink-soft">{r}</span>
                </li>
              ))}
            </ol>
            <Notice tone="sun" className="mt-5">
              تخضع الجوائز والسحوبات للأنظمة المعمول بها في المملكة، وتُنشر{" "}
              <Link href="/terms#raffle" className="font-bold text-brand underline underline-offset-4">
                الشروط الكاملة
              </Link>{" "}
              قبل أول سحب.
            </Notice>
          </div>
        </Container>
      </section>

      {/* ---------- prize ---------- */}
      <section className="paper-dots">
        <Container className="py-12">
          <SectionHead reveal title="الجائزة والفائز" lead="موعد الإغلاق، الجائزة، واسم الفائز بعد إعلان النتيجة." />
          <div data-reveal className="mt-6">
            <RafflePanel method={n} week={week} />
          </div>
          <div data-reveal className="mt-6 rounded-3xl border-2 border-ink bg-white p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h3 className="font-display text-xl text-ink">مشاركات هذا الأسبوع</h3>
              <div className="flex flex-wrap items-center gap-2 text-sm">
                <Chip tone="paper">{count(entries.length, ENTRIES)}</Chip>
                <Chip tone="ok">{entries.filter((e) => e.status === "eligible").length} مؤهلة</Chip>
                <Chip tone="sun">{entries.filter((e) => e.status === "pending").length} بانتظار المراجعة</Chip>
                {entries.some((e) => e.sample) ? <SampleTag /> : null}
              </div>
            </div>
            {entries.length ? (
              <ul className="mt-4 flex flex-wrap gap-2">
                {entries.map((e) => (
                  <li key={e.id} className="rounded-full border border-line bg-paper px-3 py-1.5 text-sm font-semibold text-ink-soft">
                    {e.name} · {e.done}/{e.total}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-3 text-sm text-ink-soft">لا مشاركات بعد. أول من يرسل ملخص تجربته يظهر هنا.</p>
            )}
          </div>
        </Container>
      </section>

      {/* ---------- winners + upcoming ---------- */}
      <section className="border-t-2 border-ink bg-white">
        <Container className="grid gap-10 py-12 lg:grid-cols-2">
          <div data-reveal>
            <h2 className="flex items-center gap-2 font-display text-h2 text-ink">
              <Medal aria-hidden className="size-6 text-brand" />
              الفائزون السابقون
            </h2>
            {winners.length ? (
              <ul className="mt-5 grid gap-3">
                {winners.map(([w, win]) => (
                  <li key={w} className="flex items-center gap-3 rounded-2xl border-2 border-ink bg-sun-wash p-3">
                    <span className="grid size-11 shrink-0 place-items-center rounded-full border-2 border-ink bg-sun font-display text-xl">{w}</span>
                    <div className="min-w-0">
                      <p className="font-display text-xl leading-tight text-ink">{win.name}</p>
                      <p className="truncate text-sm text-ink-soft">
                        الأسبوع {w} · {methods[win.method - 1].title}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <EmptyState className="mt-5" icon={<Medal className="size-6" />} title="لم يُعلن أي فائز بعد">
                أسماء الفائزين تُنشر هنا بعد كل سحب، مع الطريقة التي جرّبوها.
              </EmptyState>
            )}
          </div>
          <div data-reveal>
            <h2 className="flex items-center gap-2 font-display text-h2 text-ink">
              <CalendarDays aria-hidden className="size-6 text-brand" />
              التحديات القادمة
            </h2>
            <ul className="mt-5 grid gap-3">
              {upcoming.map((u) => (
                <li key={u.week} className="rounded-2xl border border-line bg-paper/60 p-3">
                  <MethodRow
                    method={methods[u.week - 1]}
                    trailing={
                      <span className="shrink-0 text-xs font-semibold text-ink-mute" suppressHydrationWarning>
                        {formatDay(u.starts)}
                      </span>
                    }
                  />
                </li>
              ))}
            </ul>
            <p className="mt-3 text-sm text-ink-soft">لا تنتظر أسبوع طريقتك: كل الطرق مفتوحة للتجربة من الآن، والسحب خاص بطريقة الأسبوع.</p>
          </div>
        </Container>
      </section>
    </>
  );
}
