"use client";

import { ArrowLeft, Check, Users } from "@/components/icons";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { type CSSProperties, useEffect, useState, useSyncExternalStore } from "react";
import { SAMPLE_ENTRIES } from "@/data/samples";
import { useDemo, useHydrated } from "@/lib/demo/hooks";
import { actions } from "@/lib/demo/store";
import { methodHref } from "@/lib/methods";
import type { MethodSummary, WeekInfo } from "@/lib/types";
import { MethodArt, MethodNumber } from "./method-card";
import { STRIP } from "./week-strip-tones";
import { T } from "./text";
import { SampleTag, buttonClass, cx } from "./ui";

const everySecond = (tick: () => void) => {
  const id = window.setInterval(tick, 1000);
  return () => window.clearInterval(id);
};
/** Current time in whole seconds; null until the page is live in the browser. */
export function useNow(): number | null {
  return useSyncExternalStore(
    everySecond,
    () => Math.floor(Date.now() / 1000),
    () => null,
  );
}

/** The method on this week's challenge: the calendar's, unless the team picked another. */
export function useWeekMethod(week: WeekInfo) {
  return useDemo().admin.weekMethod ?? week.week;
}

export function Countdown({ endsAt, tone = "light", className }: { endsAt: string; tone?: "light" | "dark"; className?: string }) {
  const now = useNow();
  const left = now === null ? null : Math.max(0, Math.floor(new Date(endsAt).getTime() / 1000) - now);
  const parts = [
    { label: "يوم", value: left === null ? null : Math.floor(left / 86400) },
    { label: "ساعة", value: left === null ? null : Math.floor((left % 86400) / 3600) },
    { label: "دقيقة", value: left === null ? null : Math.floor((left % 3600) / 60) },
    { label: "ثانية", value: left === null ? null : left % 60 },
  ];
  if (left === 0) return <p className={cx("font-bold", tone === "dark" ? "text-sun" : "text-bad", className)}>انتهى وقت هذا التحدي.</p>;
  return (
    <div role="timer" aria-label="الوقت المتبقي لنهاية التحدي" className={cx("grid max-w-xs grid-cols-4 gap-2", className)}>
      {parts.map((p) => (
        <div key={p.label} className={cx("min-w-0 rounded-2xl border-2 px-1 py-1.5 text-center", tone === "dark" ? "border-white/25 bg-white/10 text-white" : "border-ink bg-white text-ink")}>
          {/* keyed so each new value rolls up from below; only the bottom edge clips */}
          <div className="font-display text-2xl leading-none tabular-nums [clip-path:inset(-1em_-1em_0_-1em)]">
            <span key={p.value ?? "-"} className={cx("block", p.value !== null && "animate-digit")}>
              {p.value === null ? "--" : String(p.value).padStart(2, "0")}
            </span>
          </div>
          <div className={cx("mt-1 text-[0.68rem] font-semibold", tone === "dark" ? "text-white/70" : "text-ink-mute")}>{p.label}</div>
        </div>
      ))}
    </div>
  );
}

/** One label for one intent, wherever it appears. */
export const JOIN_LABEL = "سأجرّب هذه الطريقة";

/** "I'll try this method": sends guests to sign in first, members straight to their checklist.
 *  `magnetic` marks the single primary action in view (desktop pointer only). */
export function JoinButton({ method, size = "lg", variant = "primary", className, magnetic }: { method: number; size?: "md" | "lg"; variant?: "primary" | "sun"; className?: string; magnetic?: boolean }) {
  const router = useRouter();
  const { user, challenges } = useDemo();
  const hydrated = useHydrated();
  const target = `${methodHref(method)}/challenge`;

  if (hydrated && user && challenges[method]) {
    return (
      <Link href={target} data-magnetic={magnetic ? "0.3" : undefined} className={buttonClass("white", size, className)}>
        <Check aria-hidden className="size-5 text-ok" />
        أنت في التحدي · تابع مهامك
      </Link>
    );
  }
  return (
    <button
      type="button"
      data-magnetic={magnetic ? "0.3" : undefined}
      className={buttonClass(variant, size, className)}
      onClick={() => {
        if (!user) {
          router.push(`/login?next=${encodeURIComponent(target)}`);
          return;
        }
        actions.joinChallenge(method);
        router.push(target);
      }}
    >
      {JOIN_LABEL}
      <ArrowLeft aria-hidden className="size-5" />
    </button>
  );
}

/**
 * Phones: once the hero's join button has scrolled away, a frosted bar keeps it in reach. It steps
 * aside while the try path's own button is on screen, and at the end of the page. The elements it
 * watches carry the ids join-hero, join-path and method-end, plus the site footer.
 */
export function StickyJoin({ method, title }: { method: number; title: string }) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const root = document.documentElement;
    const hero = document.getElementById("join-hero");
    const others = [document.getElementById("join-path"), document.getElementById("method-end"), document.querySelector("footer")].filter((el): el is HTMLElement => !!el);
    if (!hero) return;
    const visible = new Map<Element, boolean>();
    let heroPassed = false;
    const io = new IntersectionObserver((entries) => {
      for (const e of entries) {
        if (e.target === hero) heroPassed = !e.isIntersecting && e.boundingClientRect.top < 0;
        else visible.set(e.target, e.isIntersecting);
      }
      const on = heroPassed && ![...visible.values()].some(Boolean);
      setShow(on);
      // lets the prototype pill step out of the way
      if (on) root.dataset.joinbar = "";
      else delete root.dataset.joinbar;
    });
    io.observe(hero);
    others.forEach((el) => io.observe(el));
    return () => {
      io.disconnect();
      delete root.dataset.joinbar;
    };
  }, []);

  return (
    <div
      inert={!show}
      className={cx(
        "glass fixed inset-x-3 bottom-[calc(6.25rem+env(safe-area-inset-bottom))] z-[var(--z-sticky)] flex items-center gap-2.5 rounded-full border-2 border-ink py-1.5 pe-1.5 ps-2 shadow-print-sm transition duration-300 ease-out-expo lg:hidden",
        show ? "opacity-100" : "pointer-events-none translate-y-[calc(100%+1.5rem)] opacity-0",
      )}
    >
      <MethodNumber n={method} size="xs" />
      <p className="min-w-0 flex-1 truncate text-sm font-bold text-ink">{title}</p>
      <JoinButton method={method} size="md" className="shrink-0" />
    </div>
  );
}

export function Participants({ method, className }: { method: number; className?: string }) {
  const { challenges, showSamples } = useDemo();
  const count = (showSamples ? SAMPLE_ENTRIES.length : 0) + (challenges[method] ? 1 : 0);
  return (
    <p className={cx("flex flex-wrap items-center gap-2 text-sm text-ink-soft", className)}>
      <Users aria-hidden className="size-4 text-brand" />
      {count ? (
        <>
          المشاركون في التحدي: <b className="text-ink">{count}</b>
          {showSamples ? <SampleTag /> : null}
        </>
      ) : (
        "كن أول المشاركين في هذا التحدي"
      )}
    </p>
  );
}

export function WeeklyChallengeCard({ week, methods, className }: { week: WeekInfo; methods: MethodSummary[]; className?: string }) {
  const n = useWeekMethod(week);
  const m = methods[n - 1];
  return (
    <article className={cx("overflow-hidden rounded-[2rem] border-2 border-ink bg-white shadow-print", className)}>
      <header className="flex items-center justify-between gap-3 border-b-2 border-ink bg-sun px-5 py-2.5">
        <span className="font-display text-lg leading-none text-ink">تحدي الأسبوع</span>
        <span className="text-sm font-bold text-ink">
          الأسبوع <span className="font-display text-lg">{week.week}</span> من 52
        </span>
      </header>
      <div className="grid sm:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
        <Link href={methodHref(n)} className="plate relative block bg-paper paper-dots">
          <MethodNumber n={n} size="lg" className="absolute start-4 top-4 z-10 shadow-print-sm" />
          <MethodArt n={n} title={m.title} priority sizes="(min-width: 640px) 320px, 80vw" className="mx-auto max-w-[17rem] p-4 sm:max-w-none" />
        </Link>
        <div className="flex flex-col gap-4 border-t-2 border-ink p-5 sm:border-s-2 sm:border-t-0">
          <div>
            <h3 className="font-display text-2xl leading-snug text-ink sm:text-3xl">
              <Link href={methodHref(n)} className="hover:text-brand">
                {m.title}
              </Link>
            </h3>
            {m.tagline ? <p className="mt-1 text-ink-soft">{m.tagline}</p> : null}
          </div>
          <dl className="grid grid-cols-2 gap-2 text-sm">
            <div className="rounded-2xl bg-brand-wash px-3 py-2">
              <dt className="text-xs text-ink-soft">الدخل المتوقع</dt>
              <dd className="font-bold text-brand-dark"><T>{m.stats.income}</T></dd>
            </div>
            <div className="rounded-2xl bg-paper px-3 py-2">
              <dt className="text-xs text-ink-soft">رأس المال</dt>
              <dd className="font-bold text-ink"><T>{m.stats.capital}</T></dd>
            </div>
          </dl>
          <div>
            <p className="mb-2 text-xs font-bold text-ink-mute">ينتهي التحدي بعد</p>
            <Countdown endsAt={week.endsAt} />
          </div>
          <Participants method={n} />
          <JoinButton method={n} size="md" magnetic className="mt-auto w-full" />
        </div>
      </div>
    </article>
  );
}

/** The year at a glance: one cell per method, lit for this week and for what the member has tried. */
export function WeekStrip({ week, methods, tone = "paper", className }: { week: WeekInfo; methods: MethodSummary[]; tone?: keyof typeof STRIP; className?: string }) {
  const current = useWeekMethod(week);
  const { challenges } = useDemo();
  const look = STRIP[tone];
  return (
    // the cells stamp onto the page one after another as the strip scrolls in
    <ol className={cx("grid grid-cols-7 gap-1.5 [--stagger:14ms] sm:grid-cols-[repeat(13,minmax(0,1fr))] sm:gap-2", className)}>
      {methods.map((m, i) => {
        const mine = challenges[m.n];
        const done = !!mine && mine.done.length >= m.tasks;
        const state = m.n === current ? cx(look.current, "z-10 scale-110") : done ? look.done : mine ? look.mine : look.rest;
        return (
          <li key={m.n} data-reveal="scale" style={{ "--i": i } as CSSProperties}>
            <Link href={methodHref(m.n)} title={`${m.n}. ${m.title}`} aria-label={`الطريقة ${m.n}: ${m.title}${m.n === current ? " (تحدي هذا الأسبوع)" : ""}`} className={cx("relative grid aspect-square place-items-center rounded-xl border-2 pt-[0.12em] font-display text-lg leading-none transition sm:text-xl", state)}>
              {done ? <Check aria-hidden className="size-5" /> : m.n}
            </Link>
          </li>
        );
      })}
    </ol>
  );
}
