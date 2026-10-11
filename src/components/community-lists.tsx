"use client";

import { BadgeCheck, Flag, HandHeart, MessageSquareHeart, Rocket } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { SAMPLE_ENTRIES } from "@/data/samples";
import { useDemo, useProviders, useStories } from "@/lib/demo/hooks";
import { methodHref } from "@/lib/methods";
import { OUTCOMES } from "@/lib/taxonomy";
import type { MethodSummary, Outcome } from "@/lib/types";
import { ProviderCard, StoryCard } from "./community";
import { EmptyState, SampleTag, Select, buttonClass, cx } from "./ui";

function MethodFilter({ methods, value, onChange, used }: { methods: MethodSummary[]; value: number; onChange: (n: number) => void; used: Set<number> }) {
  return (
    <div className="w-full sm:w-72">
      <label htmlFor="method-filter" className="sr-only">
        تصفية حسب الطريقة
      </label>
      <Select id="method-filter" value={value} onChange={(e) => onChange(Number(e.target.value))} className="border-ink">
        <option value={0}>كل الطرق</option>
        {methods
          .filter((m) => used.has(m.n))
          .map((m) => (
            <option key={m.n} value={m.n}>
              {m.n}. {m.title}
            </option>
          ))}
      </Select>
    </div>
  );
}

export function StoriesGrid({ methods, method, limit, filter, className }: { methods: MethodSummary[]; method?: number; limit?: number; filter?: boolean; className?: string }) {
  const all = useStories(method);
  const [pick, setPick] = useState(0);
  const [outcome, setOutcome] = useState<Outcome | "">("");
  let list = pick ? all.filter((s) => s.method === pick) : all;
  if (outcome) list = list.filter((s) => s.outcome === outcome);
  if (limit) list = list.slice(0, limit);

  if (!all.length) {
    return (
      <EmptyState
        className={className}
        icon={<MessageSquareHeart className="size-6" />}
        title={method ? "لا توجد تجارب منشورة لهذه الطريقة بعد" : "لم تُنشر أي تجربة بعد"}
        action={
          <Link href={method ? `${methodHref(method)}/share` : "/methods"} className={buttonClass("primary")}>
            {method ? "كن أول من يشارك تجربته" : "اختر طريقة وابدأ"}
          </Link>
        }
      >
        التجارب تظهر هنا بعد مراجعتها، الناجحة منها وغير الناجحة، فالهدف أن نتعلّم من بعض.
      </EmptyState>
    );
  }
  return (
    <div className={className}>
      {filter ? (
        <div className="mb-5 flex flex-wrap items-center gap-3">
          <MethodFilter methods={methods} value={pick} onChange={setPick} used={new Set(all.map((s) => s.method))} />
          <div className="flex flex-wrap gap-1.5">
            {(Object.keys(OUTCOMES) as Outcome[]).map((o) => (
              <button key={o} type="button" aria-pressed={outcome === o} onClick={() => setOutcome(outcome === o ? "" : o)} className={cx("rounded-full border-2 px-3 py-2 text-sm font-semibold leading-none transition", outcome === o ? "border-ink bg-brand text-white" : "border-line bg-white text-ink-soft hover:border-ink")}>
                {OUTCOMES[o]}
              </button>
            ))}
          </div>
        </div>
      ) : null}
      {list.length ? (
        <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {list.map((s) => (
            <li key={s.id}>
              <StoryCard story={s} method={method ? undefined : methods[s.method - 1]} />
            </li>
          ))}
        </ul>
      ) : (
        <EmptyState title="لا توجد تجارب بهذه التصفية">جرّب طريقة أخرى أو أزل شرط النتيجة.</EmptyState>
      )}
    </div>
  );
}

export function ProvidersGrid({ methods, method, limit, filter, className }: { methods: MethodSummary[]; method?: number; limit?: number; filter?: boolean; className?: string }) {
  const all = useProviders(method);
  const [pick, setPick] = useState(0);
  let list = pick ? all.filter((p) => p.methods.includes(pick)) : all;
  if (limit) list = list.slice(0, limit);

  if (!all.length) {
    return (
      <EmptyState
        className={className}
        icon={<HandHeart className="size-6" />}
        title={method ? "لا يوجد مقدمو خدمات لهذه الطريقة بعد" : "دليل أصحاب المهارات فارغ حتى الآن"}
        action={
          <Link href={method ? `${methodHref(method)}/offer` : "/methods"} className={buttonClass("primary")}>
            {method ? "اعرض خدماتك هنا" : "اختر مهارتك من الطرق"}
          </Link>
        }
      >
        إن كنت تتقن هذه المهارة فاعرض خدماتك، وسيظهر ملفك هنا بعد موافقة الإدارة.
      </EmptyState>
    );
  }
  return (
    <div className={className}>
      {filter ? (
        <div className="mb-5">
          <MethodFilter methods={methods} value={pick} onChange={setPick} used={new Set(all.flatMap((p) => p.methods))} />
        </div>
      ) : null}
      {list.length ? (
        <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {list.map((p) => (
            <li key={p.id}>
              <ProviderCard provider={p} />
            </li>
          ))}
        </ul>
      ) : (
        <EmptyState title="لا يوجد مقدم خدمة لهذه الطريقة بعد" />
      )}
    </div>
  );
}

/** Live community counters. They are never padded: with the examples switched off they read zero. */
export function CommunityStats({ methods }: { methods: MethodSummary[] }) {
  const { challenges, showSamples } = useDemo();
  const stories = useStories().length;
  const providers = useProviders().length;
  const mine = Object.entries(challenges);
  const started = mine.length + (showSamples ? SAMPLE_ENTRIES.length : 0);
  const completed = mine.filter(([n, c]) => c.done.length >= methods[Number(n) - 1].tasks).length + (showSamples ? SAMPLE_ENTRIES.filter((e) => e.done >= 6).length : 0);
  const items = [
    { label: "تجربة بدأها الأعضاء", value: started, icon: Rocket },
    { label: "تجربة مكتملة", value: completed, icon: Flag },
    { label: "قصة منشورة", value: stories, icon: MessageSquareHeart },
    { label: "مقدم خدمة", value: providers, icon: BadgeCheck },
  ];
  const empty = items.every((i) => i.value === 0);
  return (
    <div>
      <dl className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {items.map(({ label, value, icon: Icon }) => (
          <div key={label} className="rounded-3xl border-2 border-white/25 bg-white/10 p-5 text-white">
            <Icon aria-hidden className="size-6 text-sun" />
            <dd className="mt-3 font-display text-5xl leading-none tabular-nums">{value}</dd>
            <dt className="mt-2 text-sm font-semibold text-white/80">{label}</dt>
          </div>
        ))}
      </dl>
      <p className="mt-4 flex flex-wrap items-center gap-2 text-sm text-white/70">
        {showSamples ? (
          <>
            <SampleTag className="border-white/50 text-white/80" />
            هذه الأرقام من الأمثلة التوضيحية في النسخة الأولية، وتُستبدل بالأرقام الفعلية عند الإطلاق.
          </>
        ) : empty ? (
          "العدّاد يبدأ من الصفر، وأول تجربة قد تكون تجربتك."
        ) : (
          "أرقام فعلية من نشاط الأعضاء."
        )}
      </p>
    </div>
  );
}
