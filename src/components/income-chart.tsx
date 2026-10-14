"use client";

import Link from "next/link";
import type { CSSProperties } from "react";
import { methodHref } from "@/lib/methods";
import { CAPITAL, count } from "@/lib/taxonomy";
import type { CapitalBand, MethodSummary } from "@/lib/types";
import { cx } from "./ui";

const BANDS: CapitalBand[] = ["zero", "low", "high"];
const STEP = 2000;
const fmt = (n: number) => n.toLocaleString("en-US");
const METHODS: [string, string, string] = ["طريقة", "طريقتان", "طرق"];

/**
 * Monthly income by starting capital: one floating bar per method, from the low to the high end of
 * the book's range, grouped by how much money it takes to start. Only methods the book prices by
 * the month are drawn, so every bar is in the same unit. Bars grow from the right, like the text.
 * The cards and list views stay the table view of the same numbers.
 */
export function IncomeChart({ methods }: { methods: MethodSummary[] }) {
  const drawn = methods.filter((m) => m.monthly);
  const top = Math.max(STEP * 5, ...drawn.map((m) => Math.ceil((m.monthly!.max ?? m.monthly!.min) / STEP) * STEP));
  const ticks = Array.from({ length: top / STEP + 1 }, (_, i) => i * STEP);
  const pct = (v: number) => (v / top) * 100;
  const skipped = methods.length - drawn.length;

  return (
    <figure className="mt-6 rounded-card border border-line bg-white p-4 sm:p-6">
      <figcaption>
        <h2 className="font-display text-h3 text-ink">الدخل الشهري حسب رأس المال</h2>
        <p className="mt-1 text-sm text-ink-soft">
          {drawn.length ? `${count(drawn.length, METHODS)} يذكر الكتاب دخلها بالشهر، والشريط من أقل المتوقع إلى أعلاه.` : "لا توجد بين هذه الطرق طريقة يذكر الكتاب دخلها بالشهر."}
          {skipped ? ` ${drawn.length ? "والبقية" : "كلها"} تُسعَّر بالقطعة أو المشروع أو الموسم، فتجدها في عرض البطاقات.` : null}
        </p>
      </figcaption>

      {drawn.length ? (
        <div className="mt-6 space-y-6">
          {BANDS.map((band) => {
            const rows = drawn.filter((m) => m.capitalBand === band).sort((a, b) => (b.monthly!.max ?? top) - (a.monthly!.max ?? top) || b.monthly!.min - a.monthly!.min);
            if (!rows.length) return null;
            return (
              <section key={band}>
                <h3 className="mb-1 text-sm font-bold text-ink">
                  رأس المال: {CAPITAL[band]} <span className="font-normal text-ink-mute">· {rows.length}</span>
                </h3>
                <ol>
                  {rows.map((m) => {
                    const { min, max } = m.monthly!;
                    const end = max === null ? 100 : pct(max);
                    const after = end <= 72;
                    const range = max === null ? `+${fmt(min)}` : min === max ? fmt(min) : `${fmt(min)}–${fmt(max)}`;
                    return (
                      <li key={m.n}>
                        <Link
                          href={methodHref(m.n)}
                          aria-label={`الطريقة ${m.n}: ${m.title}. الدخل ${m.stats.income}، رأس المال ${m.stats.capital}`}
                          className="group grid grid-cols-[8.5rem_minmax(0,1fr)] items-stretch gap-3 rounded-md px-1 transition hover:bg-brand-wash focus-visible:bg-brand-wash sm:grid-cols-[15rem_minmax(0,1fr)]"
                        >
                          <span className="flex min-w-0 items-baseline gap-2 py-1.5 text-sm">
                            <span className="w-5 shrink-0 font-display text-brand">{m.n}</span>
                            <span className="truncate text-ink group-hover:font-semibold">{m.title}</span>
                          </span>
                          {/* the track carries the gridlines, so they run unbroken down the rows */}
                          <span
                            aria-hidden
                            className="relative bg-[linear-gradient(to_left,var(--color-line)_1px,transparent_1px)] [background-position:right] [background-size:var(--tick)_100%]"
                            style={{ "--tick": `${pct(STEP)}%` } as CSSProperties}
                          >
                            <span
                              className={cx("absolute top-1/2 h-2.5 min-w-1.5 -translate-y-1/2 rounded-full", max === null ? "bg-[linear-gradient(to_left,var(--chart-bar)_55%,transparent)]" : "bg-[var(--chart-bar)]")}
                              style={{ insetInlineStart: `${pct(min)}%`, width: `${end - pct(min)}%` }}
                            />
                            <span
                              className="pointer-events-none absolute top-1/2 -translate-y-1/2 whitespace-nowrap rounded bg-white px-1 text-xs font-bold tabular-nums text-ink opacity-0 shadow-soft transition group-hover:opacity-100 group-focus-visible:opacity-100"
                              style={after ? { insetInlineStart: `calc(${end}% + 6px)` } : { insetInlineEnd: `calc(${100 - pct(min)}% + 6px)` }}
                            >
                              {/* ranges read low → high, left to right, as everywhere on the site (text.tsx) */}
                              <bdi dir="ltr">{range}</bdi>
                            </span>
                          </span>
                        </Link>
                      </li>
                    );
                  })}
                </ol>
              </section>
            );
          })}

          {/* the axis: thousands of riyals a month */}
          <div aria-hidden className="grid grid-cols-[8.5rem_minmax(0,1fr)] gap-3 px-1 sm:grid-cols-[15rem_minmax(0,1fr)]">
            <span className="text-xs text-ink-mute">بالألف ريال شهريًا</span>
            <span className="relative h-5 border-t border-ink/30 text-xs tabular-nums text-ink-mute">
              {ticks.map((t) => (
                <span key={t} className="absolute top-1 translate-x-1/2" style={{ insetInlineStart: `${pct(t)}%` }}>
                  {t / 1000}
                </span>
              ))}
            </span>
          </div>
        </div>
      ) : null}
    </figure>
  );
}
