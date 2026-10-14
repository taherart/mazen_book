"use client";

import { LayoutGrid, List, Search, SlidersHorizontal, X } from "@/components/icons";
import { useSearchParams } from "next/navigation";
import { useMemo, useRef, useState, useSyncExternalStore } from "react";
import { CAPITAL, DOMAINS, KINDS, LEVELS, PLACES, TIME } from "@/lib/taxonomy";
import type { MethodSummary } from "@/lib/types";
import { MethodCard, MethodListItem } from "./method-card";
import { Button, EmptyState, cx } from "./ui";

type Filters = { q: string; capital: string; time: string; level: string; place: string; kind: string; domain: string };
const EMPTY: Filters = { q: "", capital: "", time: "", level: "", place: "", kind: "", domain: "" };
const KEYS = Object.keys(EMPTY) as (keyof Filters)[];

const GROUPS: { key: keyof Filters; label: string; options: Record<string, string> }[] = [
  { key: "capital", label: "رأس المال المطلوب", options: CAPITAL },
  { key: "time", label: "أول دخل", options: TIME },
  { key: "level", label: "مستوى الخبرة", options: LEVELS as Record<string, string> },
  { key: "place", label: "مكان العمل", options: { home: PLACES.home, field: PLACES.field } },
  { key: "kind", label: "نوع الدخل", options: KINDS },
  { key: "domain", label: "المجال", options: DOMAINS },
];

const fold = (s: string) => s.replace(/[ً-ْـ]/g, "").replace(/[أإآ]/g, "ا").replace(/ى/g, "ي").replace(/ة/g, "ه").toLowerCase();

function matches(m: MethodSummary, f: Filters) {
  if (f.capital && m.capitalBand !== f.capital) return false;
  if (f.time && m.timeBand !== f.time) return false;
  if (f.level && String(m.level) !== f.level) return false;
  // a method that works both ways satisfies either choice
  if (f.place && m.place !== f.place && m.place !== "both") return false;
  if (f.kind && m.kind !== f.kind) return false;
  if (f.domain && m.domain !== f.domain) return false;
  if (f.q) {
    const hay = fold(`${m.n} ${m.title} ${m.tagline ?? ""} ${DOMAINS[m.domain]}`);
    if (!fold(f.q).split(/\s+/).every((w) => hay.includes(w))) return false;
  }
  return true;
}

const NARROW = "(max-width: 639.98px)";
const onResize = (change: () => void) => {
  const mq = window.matchMedia(NARROW);
  mq.addEventListener("change", change);
  return () => mq.removeEventListener("change", change);
};
/** Phones get the compact list by default. The explorer renders in the browser (it reads the query
 *  string), so the first render already knows the width and nothing switches after paint. */
function useNarrow() {
  return useSyncExternalStore(
    onResize,
    () => window.matchMedia(NARROW).matches,
    () => false,
  );
}

export function MethodsExplorer({ methods }: { methods: MethodSummary[] }) {
  const params = useSearchParams();
  const [filters, setFilters] = useState<Filters>(() => {
    const init = { ...EMPTY };
    for (const k of KEYS) init[k] = params.get(k) ?? "";
    return init;
  });
  const [panel, setPanel] = useState(false);
  const closeRef = useRef<HTMLButtonElement>(null);
  const narrow = useNarrow();
  const [choice, setChoice] = useState<"grid" | "list" | null>(null);
  const view = choice ?? (narrow ? "list" : "grid");

  const set = (key: keyof Filters, value: string) => {
    const next = { ...filters, [key]: value };
    setFilters(next);
    // keep the address shareable without a navigation
    const qs = new URLSearchParams();
    for (const k of KEYS) if (next[k]) qs.set(k, next[k]);
    window.history.replaceState(null, "", qs.size ? `?${qs}` : window.location.pathname);
  };
  const clear = () => {
    setFilters(EMPTY);
    window.history.replaceState(null, "", window.location.pathname);
  };

  const result = useMemo(() => methods.filter((m) => matches(m, filters)), [methods, filters]);
  const active = KEYS.filter((k) => k !== "q" && filters[k]).length;

  return (
    <div>
      <div className="flex flex-wrap items-center gap-3">
        <label className="relative block min-w-0 flex-1 basis-64">
          <span className="sr-only">ابحث في الطرق</span>
          <Search aria-hidden className="pointer-events-none absolute start-4 top-1/2 size-5 -translate-y-1/2 text-ink-mute" />
          <input type="search" value={filters.q} onChange={(e) => set("q", e.target.value)} placeholder="ابحث باسم الطريقة أو رقمها…" className="h-12 w-full rounded-full border border-ink/20 bg-white pe-4 ps-12 text-ink placeholder:text-ink-mute focus:border-brand focus:outline-none" />
        </label>
        <Button
          variant="white"
          className="lg:hidden"
          aria-expanded={panel}
          onClick={() => {
            setPanel(true);
            requestAnimationFrame(() => closeRef.current?.focus());
          }}
        >
          <SlidersHorizontal aria-hidden className="size-4" />
          تصفية
          {active ? <span className="grid size-5 place-items-center rounded-full bg-brand text-xs text-white">{active}</span> : null}
        </Button>
        <p aria-live="polite" className="ms-auto text-sm text-ink-soft">
          <b key={result.length} className="inline-block animate-digit font-display text-xl text-brand">
            {result.length}
          </b>{" "}
          من {methods.length} طريقة
        </p>
        <div role="group" aria-label="طريقة العرض" className="flex rounded-full border border-ink/20 bg-white p-0.5">
          {(
            [
              ["list", "قائمة", List],
              ["grid", "بطاقات", LayoutGrid],
            ] as const
          ).map(([v, label, Icon]) => (
            <button key={v} type="button" aria-pressed={view === v} title={label} onClick={() => setChoice(v)} className={cx("tap grid size-9 place-items-center rounded-full transition", view === v ? "bg-ink text-white" : "text-ink-soft hover:text-ink")}>
              <Icon aria-hidden className="size-4" />
              <span className="sr-only">{label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* phones: a bottom sheet over a dimmed page; desktop: an inline panel */}
      {panel ? <div aria-hidden onClick={() => setPanel(false)} className="fixed inset-0 z-[var(--z-overlay)] bg-ink/40 lg:hidden" /> : null}
      <div
        onKeyDown={(e) => e.key === "Escape" && setPanel(false)}
        className={cx(
          "gap-x-6 gap-y-4 border border-line bg-white p-4 lg:mt-4 lg:grid lg:grid-cols-3 lg:rounded-card",
          "max-lg:fixed max-lg:inset-x-0 max-lg:bottom-0 max-lg:z-[var(--z-overlay)] max-lg:max-h-[85dvh] max-lg:overflow-y-auto max-lg:rounded-t-panel max-lg:border-x-0 max-lg:border-b-0 max-lg:pb-[calc(1rem+env(safe-area-inset-bottom))]",
          panel ? "grid" : "hidden",
        )}
      >
        <div className="flex items-center justify-between lg:hidden">
          <p className="font-display text-h3 text-ink">تصفية الطرق</p>
          <button ref={closeRef} type="button" aria-label="أغلق التصفية" onClick={() => setPanel(false)} className="tap grid size-10 place-items-center rounded-full border border-ink/20">
            <X aria-hidden className="size-5" />
          </button>
        </div>
        {GROUPS.map((g) => (
          <fieldset key={g.key} className="min-w-0">
            <legend className="mb-2 text-xs font-bold text-ink-mute">{g.label}</legend>
            <div className="flex flex-wrap gap-1.5">
              {Object.entries(g.options).map(([value, label]) => {
                const on = filters[g.key] === value;
                return (
                  <button key={value} type="button" aria-pressed={on} onClick={() => set(g.key, on ? "" : value)} className={cx("tap rounded-full border-2 px-3 py-1.5 text-sm font-semibold leading-none transition duration-300 ease-spring active:scale-96", on ? "border-ink bg-brand text-white" : "border-line bg-white text-ink-soft hover:border-ink hover:text-ink")}>
                    {label}
                  </button>
                );
              })}
            </div>
          </fieldset>
        ))}
        {active || filters.q ? (
          <button type="button" onClick={clear} className="tap inline-flex items-center gap-1.5 self-end justify-self-start text-sm font-bold text-bad hover:underline">
            <X aria-hidden className="size-4" />
            مسح التصفية
          </button>
        ) : null}
        <Button size="lg" className="sticky bottom-0 w-full lg:hidden" onClick={() => setPanel(false)}>
          اعرض {result.length} طريقة
        </Button>
      </div>

      {result.length ? (
        <ul className={cx("mt-6 grid grid-cols-[minmax(0,1fr)]", view === "list" ? "gap-3 lg:grid-cols-2" : "gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4")}>
          {result.map((m, i) => (
            <li key={m.n} className="animate-rise" style={{ animationDelay: `${Math.min(i, 8) * 40}ms` }}>
              {view === "list" ? <MethodListItem method={m} className="h-full" /> : <MethodCard method={m} className="h-full" priority={i < 4} />}
            </li>
          ))}
        </ul>
      ) : (
        <EmptyState className="mt-6" icon={<Search className="size-6" />} title="لا توجد طريقة بهذه المواصفات" action={<Button onClick={clear}>اعرض كل الطرق</Button>}>
          جرّب إزالة أحد الشروط، فبعض التركيبات نادرة: مثلًا رأس مال صفر مع دخل خلال أسبوعين.
        </EmptyState>
      )}
    </div>
  );
}
