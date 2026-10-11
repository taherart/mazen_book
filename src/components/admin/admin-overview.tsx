"use client";

import { ArrowLeft, BarChart3, ClipboardCheck, Flag, PlugZap } from "lucide-react";
import { SAMPLE_ENTRIES } from "@/data/samples";
import { useDemo, useEntries, useProviders, useStories } from "@/lib/demo/hooks";
import { SampleTag } from "../ui";
import { useWeekMethod } from "../weekly";
import { AdminHead, Panel, type AdminProps, type AdminTab } from "./shared";

export function AdminOverview({ methods, week, go }: AdminProps & { go: (tab: AdminTab) => void }) {
  const { challenges, stories, providers, requests, reports, showSamples } = useDemo();
  const weekMethod = useWeekMethod(week);
  const published = useStories().length;
  const listed = useProviders().length;
  const entries = useEntries(weekMethod, methods[weekMethod - 1].tasks);

  const mine = Object.entries(challenges);
  const started = mine.length + (showSamples ? SAMPLE_ENTRIES.length : 0);
  const finished = mine.filter(([n, c]) => c.done.length >= methods[Number(n) - 1].tasks).length + (showSamples ? SAMPLE_ENTRIES.filter((e) => e.done >= 6).length : 0);

  const queue = [
    { label: "تجارب بانتظار المراجعة", value: stories.filter((s) => s.status === "pending").length, tab: "review" as const },
    { label: "ملفات خدمات بانتظار الموافقة", value: providers.filter((p) => p.status === "pending").length, tab: "review" as const },
    { label: "مشاركات سحب بانتظار التأهيل", value: entries.filter((e) => e.status === "pending").length, tab: "raffle" as const },
    { label: "بلاغات مفتوحة", value: reports.filter((r) => !r.resolved).length, tab: "people" as const },
  ];
  const counted = [
    { label: "المشاركون في تحدي الأسبوع", value: entries.length + (challenges[weekMethod] && !challenges[weekMethod].submittedAt ? 1 : 0) },
    { label: "نسبة إكمال التحديات", value: started ? `${Math.round((finished / started) * 100)}%` : "—" },
    { label: "التجارب المنشورة", value: published },
    { label: "مقدمو الخدمات", value: listed },
    { label: "طلبات التواصل مع مقدمي الخدمات", value: requests.length },
  ];
  const needsAnalytics = ["زيارات صفحات الطرق", "نسبة التحويل من زائر إلى مشارك", "مصادر الزيارات (QR، واتساب، سناب…)"];

  return (
    <>
      <AdminHead title="نظرة عامة" lead={`الأسبوع ${week.week} من 52 · طريقة الأسبوع: ${methods[weekMethod - 1].title}`} />

      <Panel title="بانتظارك">
        <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {queue.map((q) => (
            <li key={q.label}>
              <button type="button" onClick={() => go(q.tab)} className={`flex w-full items-center gap-3 rounded-2xl border-2 p-4 text-start transition hover:border-ink ${q.value ? "border-ink bg-sun-wash" : "border-line bg-paper/50"}`}>
                <span className="font-display text-4xl leading-none text-ink">{q.value}</span>
                <span className="flex-1 text-sm font-bold text-ink-soft">{q.label}</span>
                <ArrowLeft aria-hidden className="size-4 text-ink-mute" />
              </button>
            </li>
          ))}
        </ul>
      </Panel>

      <Panel title="مؤشرات الأداء" className="mt-6" action={showSamples ? <SampleTag /> : undefined}>
        <dl className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
          {counted.map((k) => (
            <div key={k.label} className="rounded-2xl bg-brand-wash p-4">
              <dd className="font-display text-4xl leading-none text-brand-dark">{k.value}</dd>
              <dt className="mt-2 text-sm font-semibold text-ink-soft">{k.label}</dt>
            </div>
          ))}
        </dl>
        <div className="mt-4 rounded-2xl border-2 border-dashed border-line p-4">
          <p className="flex items-center gap-2 font-bold text-ink">
            <PlugZap aria-hidden className="size-5 text-brand" />
            مؤشرات تظهر بعد ربط أداة التحليلات
          </p>
          <ul className="mt-2 flex flex-wrap gap-2">
            {needsAnalytics.map((k) => (
              <li key={k} className="rounded-full bg-paper px-3 py-1.5 text-sm text-ink-soft">
                {k}
              </li>
            ))}
          </ul>
          <p className="mt-2 text-sm text-ink-mute">لا نعرض هنا أرقامًا مقدّرة. كل رمز QR في الكتاب يفتح صفحة طريقته، فيُقاس مصدره تلقائيًا بعد الربط.</p>
        </div>
      </Panel>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Panel title="تقدّم المشاركين هذا الأسبوع" action={entries.some((e) => e.sample) ? <SampleTag /> : undefined}>
          {entries.length ? (
            <ul className="grid gap-2.5">
              {entries.map((e) => (
                <li key={e.id} className="flex items-center gap-3 text-sm">
                  <span className="w-24 shrink-0 truncate font-bold text-ink">{e.name}</span>
                  <span className="h-3 flex-1 overflow-hidden rounded-full bg-paper-deep">
                    <span className="block h-full rounded-full bg-brand" style={{ width: `${(e.done / e.total) * 100}%` }} />
                  </span>
                  <span className="w-10 shrink-0 text-end tabular-nums text-ink-soft">
                    {e.done}/{e.total}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="flex items-center gap-2 text-sm text-ink-soft">
              <BarChart3 aria-hidden className="size-5 text-ink-mute" />
              لا مشاركات في تحدي هذا الأسبوع بعد.
            </p>
          )}
        </Panel>
        <Panel title="اختصارات">
          <ul className="grid gap-2 text-sm font-bold">
            <li>
              <button type="button" onClick={() => go("review")} className="flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-start hover:bg-paper">
                <ClipboardCheck aria-hidden className="size-4 text-brand" />
                راجع التجارب وملفات الخدمات
              </button>
            </li>
            <li>
              <button type="button" onClick={() => go("week")} className="flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-start hover:bg-paper">
                <Flag aria-hidden className="size-4 text-brand" />
                غيّر طريقة الأسبوع أو الجائزة
              </button>
            </li>
            <li>
              <button type="button" onClick={() => go("raffle")} className="flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-start hover:bg-paper">
                <BarChart3 aria-hidden className="size-4 text-brand" />
                أهّل المشاركات واسحب الفائز
              </button>
            </li>
          </ul>
        </Panel>
      </div>
    </>
  );
}
