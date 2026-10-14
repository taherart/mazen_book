"use client";

import { Search, SlidersHorizontal, X } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import { CAPITAL, DOMAINS, KINDS, LEVELS, PLACES, TIME } from "@/lib/taxonomy";
import type { MethodSummary } from "@/lib/types";
import { MethodCard } from "./method-card";
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

export function MethodsExplorer({ methods, limit, compact }: { methods: MethodSummary[]; limit?: number; compact?: boolean }) {
  const params = useSearchParams();
  const [filters, setFilters] = useState<Filters>(() => {
    const init = { ...EMPTY };
    if (!compact) for (const k of KEYS) init[k] = params.get(k) ?? "";
    return init;
  });
  const [panel, setPanel] = useState(false);

  const set = (key: keyof Filters, value: string) => {
    const next = { ...filters, [key]: value };
    setFilters(next);
    if (compact) return;
    // keep the address shareable without a navigation
    const qs = new URLSearchParams();
    for (const k of KEYS) if (next[k]) qs.set(k, next[k]);
    window.history.replaceState(null, "", qs.size ? `?${qs}` : window.location.pathname);
  };
  const clear = () => {
    setFilters(EMPTY);
    if (!compact) window.history.replaceState(null, "", window.location.pathname);
  };

  const result = useMemo(() => methods.filter((m) => matches(m, filters)), [methods, filters]);
  const active = KEYS.filter((k) => k !== "q" && filters[k]).length;
  const shown = limit ? result.slice(0, limit) : result;
  const groups = compact ? GROUPS.slice(0, 4) : GROUPS;

  return (
    <div>
      <div className="flex flex-wrap items-center gap-3">
        {!compact ? (
          <label className="relative block min-w-0 flex-1 basis-64">
            <span className="sr-only">ابحث في الطرق</span>
            <Search aria-hidden className="pointer-events-none absolute start-4 top-1/2 size-5 -translate-y-1/2 text-ink-mute" />
            <input type="search" value={filters.q} onChange={(e) => set("q", e.target.value)} placeholder="ابحث باسم الطريقة أو رقمها…" className="h-12 w-full rounded-full border-2 border-ink bg-white pe-4 ps-12 text-ink placeholder:text-ink-mute focus:border-brand focus:outline-none" />
          </label>
        ) : null}
        <Button variant="white" className="lg:hidden" onClick={() => setPanel((v) => !v)} aria-expanded={panel}>
          <SlidersHorizontal aria-hidden className="size-4" />
          تصفية
          {active ? <span className="grid size-5 place-items-center rounded-full bg-brand text-xs text-white">{active}</span> : null}
        </Button>
        <p aria-live="polite" className="ms-auto text-sm text-ink-soft">
          {/* keyed so the new count rolls in each time the filter changes it */}
          <b key={result.length} className="inline-block animate-digit font-display text-xl text-brand">
            {result.length}
          </b>{" "}
          من {methods.length} طريقة
        </p>
      </div>

      <div className={cx("mt-4 gap-x-6 gap-y-4 rounded-3xl border-2 border-ink bg-white p-4 lg:grid", compact ? "lg:grid-cols-4" : "lg:grid-cols-3", panel ? "grid" : "hidden")}>
        {groups.map((g) => (
          <fieldset key={g.key} className="min-w-0">
            <legend className="mb-2 text-xs font-bold text-ink-mute">{g.label}</legend>
            {/* chips stay compact; `tap` stretches each hit area to 44px and the row gap keeps them from overlapping */}
            <div className="flex flex-wrap gap-x-1.5 gap-y-2.5">
              {Object.entries(g.options).map(([value, label]) => {
                const on = filters[g.key] === value;
                return (
                  <button key={value} type="button" aria-pressed={on} onClick={() => set(g.key, on ? "" : value)} className={cx("tap rounded-full border-2 px-3 py-2 text-sm font-semibold leading-none transition-[scale,background-color,border-color,color] duration-(--dur-3) ease-spring active:scale-96", on ? "border-ink bg-brand text-white" : "border-line bg-white text-ink-soft hover:border-ink hover:text-ink")}>
                    {label}
                  </button>
                );
              })}
            </div>
          </fieldset>
        ))}
        {active || filters.q ? (
          <button type="button" onClick={clear} className="inline-flex items-center gap-1.5 self-end justify-self-start text-sm font-bold text-bad hover:underline">
            <X aria-hidden className="size-4" />
            مسح التصفية
          </button>
        ) : null}
      </div>

      {shown.length ? (
        <ul data-stagger className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {shown.map((m, i) => (
            <li key={m.n} data-reveal>
              <MethodCard method={m} className="h-full" priority={i < 4} />
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
