import { ArrowLeft, Banknote, Clock3, Home, MapPin, Wallet } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { ViewTransition } from "react";
import { methodHref, methodImage } from "@/lib/methods";
import { DOMAINS, LEVELS, PLACES } from "@/lib/taxonomy";
import type { Level, MethodSummary } from "@/lib/types";
import { T } from "./text";
import { Chip, cx } from "./ui";

export function MethodNumber({ n, size = "md", inverted, className }: { n: number; size?: "sm" | "md" | "lg" | "xl"; inverted?: boolean; className?: string }) {
  const box = { sm: "size-9 text-xl rounded-lg", md: "size-12 text-3xl rounded-xl", lg: "size-16 text-4xl rounded-2xl", xl: "size-24 text-6xl rounded-3xl" }[size];
  return <span className={cx("grid shrink-0 place-items-center border-2 border-ink pt-[0.12em] font-display leading-none", inverted ? "bg-white text-brand" : "bg-brand text-white", box, className)}>{n}</span>;
}

export function LevelDots({ level }: { level: Level }) {
  return (
    <span className="inline-flex items-center gap-1.5" title={`مستوى الخبرة: ${LEVELS[level]}`}>
      <span aria-hidden className="flex gap-0.5">
        {[1, 2, 3].map((i) => (
          <span key={i} className={cx("size-1.5 rounded-full", i <= level ? "bg-brand" : "bg-line")} />
        ))}
      </span>
      {LEVELS[level]}
    </span>
  );
}

export function MethodArt({ n, title, className, priority, sizes = "(min-width: 1024px) 300px, (min-width: 640px) 45vw, 90vw" }: { n: number; title: string; className?: string; priority?: boolean; sizes?: string }) {
  return <Image src={methodImage(n)} alt={`رسمة توضيحية: ${title}`} width={640} height={640} sizes={sizes} priority={priority} className={cx("h-auto w-full select-none", className)} />;
}

/**
 * The illustration and number travel from a card into the method page hero on navigation.
 * Each name must be unique on a page, so only the card and the method hero use these.
 */
export function MethodArtMorph({ n, children }: { n: number; children: React.ReactNode }) {
  return (
    <ViewTransition name={`method-art-${n}`} share="morph" default="none">
      {children}
    </ViewTransition>
  );
}
export function MethodNumberMorph({ n, children }: { n: number; children: React.ReactNode }) {
  return (
    <ViewTransition name={`method-num-${n}`} share="morph" default="none">
      {children}
    </ViewTransition>
  );
}

export function MethodCard({ method, className, priority }: { method: MethodSummary; className?: string; priority?: boolean }) {
  return (
    // prefetch={true}: the App Shell alone stops at the page's Suspense boundary, and the art can
    // only travel into the method page if its hero is already on the client when the click lands
    <Link href={methodHref(method.n)} prefetch data-spotlight className={cx("spotlight lift group flex flex-col rounded-3xl border-2 border-ink bg-white", className)}>
      <div className="relative overflow-hidden rounded-t-[calc(1.5rem-2px)] bg-paper paper-dots">
        <MethodNumberMorph n={method.n}>
          <MethodNumber n={method.n} className="absolute start-3 top-3 z-10 shadow-print-sm" />
        </MethodNumberMorph>
        <MethodArtMorph n={method.n}>
          <MethodArt n={method.n} title={method.title} priority={priority} className="art-drift misprint mx-auto max-w-[15rem] p-3" />
        </MethodArtMorph>
      </div>
      <div className="flex flex-1 flex-col border-t-2 border-ink p-4">
        <Chip tone="brand" className="self-start">
          {DOMAINS[method.domain]}
        </Chip>
        <h3 className="mt-2.5 font-display text-[1.35rem] leading-snug text-ink">{method.title}</h3>
        {method.tagline ? <p className="mt-1 line-clamp-2 text-sm text-ink-soft">{method.tagline}</p> : null}
        <dl className="mt-auto grid gap-1.5 pt-4 text-sm">
          <div className="flex items-center gap-2">
            <Banknote aria-hidden className="size-4 shrink-0 text-brand" />
            <dt className="sr-only">الدخل المتوقع</dt>
            <dd className="font-bold text-ink"><T>{method.stats.income}</T></dd>
          </div>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-ink-soft">
            <span className="inline-flex items-center gap-1.5">
              <Wallet aria-hidden className="size-3.5" />
              <dt className="sr-only">رأس المال</dt>
              <dd><T>{method.stats.capital}</T></dd>
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Clock3 aria-hidden className="size-3.5" />
              <dt className="sr-only">أول ريال خلال</dt>
              <dd><T>{method.stats.firstRiyal}</T></dd>
            </span>
          </div>
        </dl>
        <div className="mt-4 flex items-center justify-between border-t border-line pt-3 text-xs font-semibold text-ink-soft">
          <span className="flex items-center gap-3">
            <LevelDots level={method.level} />
            <span className="inline-flex items-center gap-1">
              {method.place === "field" ? <MapPin aria-hidden className="size-3.5" /> : <Home aria-hidden className="size-3.5" />}
              {PLACES[method.place]}
            </span>
          </span>
          <span className="inline-flex items-center gap-1 text-brand">
            استكشف
            <ArrowLeft aria-hidden className="size-4 transition group-hover:-translate-x-1" />
          </span>
        </div>
      </div>
    </Link>
  );
}

/** One line of a method, for pickers and dense lists. */
export function MethodRow({ method, trailing, className }: { method: MethodSummary; trailing?: React.ReactNode; className?: string }) {
  return (
    <div className={cx("flex items-center gap-3", className)}>
      <MethodNumber n={method.n} size="sm" />
      <div className="min-w-0 flex-1">
        <Link href={methodHref(method.n)} className="block truncate font-bold text-ink hover:text-brand">
          {method.title}
        </Link>
        <p className="truncate text-xs text-ink-mute">{DOMAINS[method.domain]}</p>
      </div>
      {trailing}
    </div>
  );
}
