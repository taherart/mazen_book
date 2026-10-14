"use client";

import { ArrowLeft, BadgeCheck, Flag, HandHeart, MessageSquareHeart, PenLine, Rocket } from "@/components/icons";
import Link from "next/link";
import { useState } from "react";
import { SAMPLE_ENTRIES } from "@/data/samples";
import { useDemo, useProviders, useStories } from "@/lib/demo/hooks";
import { methodHref } from "@/lib/methods";
import { OUTCOMES } from "@/lib/taxonomy";
import type { MethodSummary, Outcome } from "@/lib/types";
import { ProviderCard, StoryCard, StoryRow } from "./community";
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
              <button key={o} type="button" aria-pressed={outcome === o} onClick={() => setOutcome(outcome === o ? "" : o)} className={cx("tap rounded-full border-2 px-3 py-2 text-sm font-semibold leading-none transition duration-300 ease-spring active:scale-96", outcome === o ? "border-ink bg-brand text-white" : "border-line bg-white text-ink-soft hover:border-ink")}>
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

/** Home page community block: one featured story, two beside it, and providers on a rail. */
export function CommunityBento({ methods }: { methods: MethodSummary[] }) {
  const stories = useStories();
  const providers = useProviders();
  const [featured, ...rest] = stories;
  return (
    // minmax(0, 1fr): without it the providers rail would widen the column to fit every card
    <div className="grid grid-cols-[minmax(0,1fr)] gap-10">
      {featured ? (
        <div data-reveal className="grid grid-cols-[minmax(0,1fr)] gap-5 lg:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)]">
          <StoryCard story={featured} method={methods[featured.method - 1]} featured />
          <ul data-stagger className="grid grid-cols-[minmax(0,1fr)] gap-4 lg:grid-rows-[auto_auto_1fr]">
            {rest.slice(0, 2).map((s) => (
              <li key={s.id} data-reveal>
                <StoryRow story={s} method={methods[s.method - 1]} />
              </li>
            ))}
            {/* the invitation fills what the two rows leave beside the featured story */}
            <li data-reveal>
              <Link href="/methods" className="group flex h-full items-center gap-4 rounded-card border border-dashed border-brand/40 bg-brand-wash/70 p-4 transition hover:border-brand">
                <span className="grid size-12 shrink-0 place-items-center rounded-tile bg-brand text-white">
                  <PenLine aria-hidden className="size-6" />
                </span>
                <span className="min-w-0">
                  <b className="block text-lg font-bold text-ink">شارك تجربتك</b>
                  <span className="text-sm text-ink-soft">شارك ما حدث معك، نجحت أو لم تنجح: افتح الطريقة من الدليل ثم «شارك تجربتك».</span>
                </span>
              </Link>
            </li>
          </ul>
        </div>
      ) : (
        <EmptyState
          icon={<MessageSquareHeart className="size-6" />}
          title="لم تُنشر أي تجربة بعد"
          action={
            <Link href="/methods" className={buttonClass("primary")}>
              اختر طريقة وابدأ
            </Link>
          }
        >
          التجارب تظهر هنا بعد مراجعتها، الناجحة منها وغير الناجحة، فالهدف أن نتعلّم من بعض.
        </EmptyState>
      )}

      <div data-reveal>
        <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-2">
          <div>
            <h3 className="font-bold text-h3 text-ink">أصحاب مهارات ينفّذونها لك</h3>
            <p className="text-sm text-ink-soft">أشخاص يقدّمون خدمات مرتبطة بالطرق. تواصل معهم مباشرة، بلا وسيط ولا عمولة.</p>
          </div>
          <Link href="/providers" className="tap inline-flex items-center gap-1.5 text-sm font-bold text-brand hover:underline">
            دليل أصحاب المهارات
            <ArrowLeft aria-hidden className="size-4" />
          </Link>
        </div>
        {providers.length ? (
          <ul className="rail mt-4 gap-4 pb-1">
            {providers.map((p) => (
              <li key={p.id} className="w-72">
                <ProviderCard provider={p} />
              </li>
            ))}
          </ul>
        ) : (
          <EmptyState className="mt-4" icon={<HandHeart className="size-6" />} title="دليل أصحاب المهارات فارغ حتى الآن">
            إن كنت تتقن مهارة من الطرق فاعرض خدماتك من صفحتها، وسيظهر ملفك هنا بعد موافقة الإدارة.
          </EmptyState>
        )}
      </div>
    </div>
  );
}

/** Live community counters, as a flat row. They are never padded: with the examples switched off they read zero. */
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
      {/* the one blue band in this part of the page: the numbers are the news */}
      <dl data-stagger className="grid grid-cols-2 gap-y-6 rounded-panel bg-brand px-2 py-6 text-white sm:py-8 lg:grid-cols-4">
        {items.map(({ label, value, icon: Icon }) => (
          <div key={label} data-reveal className="flex flex-col-reverse border-s border-white/20 px-4 first:border-s-0 lg:px-6">
            <dt className="mt-2 flex items-center gap-1.5 text-sm font-semibold text-white/80">
              <Icon aria-hidden className="size-4 shrink-0 text-white/70" />
              {label}
            </dt>
            <dd data-countup={value} className="font-display text-h1 leading-none text-white tabular-nums">
              {value}
            </dd>
          </div>
        ))}
      </dl>
      <p className="mt-5 flex flex-wrap items-center gap-2 text-sm text-ink-soft">
        {showSamples ? (
          <>
            <SampleTag />
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
