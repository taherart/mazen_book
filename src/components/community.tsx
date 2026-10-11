import { ArrowLeft, Clock3, Images, MapPin, Play, Wifi } from "@/components/icons";
import Image from "next/image";
import Link from "next/link";
import { methodImage } from "@/lib/methods";
import { OUTCOMES, riyal } from "@/lib/taxonomy";
import type { MethodSummary, Outcome, Provider, Story } from "@/lib/types";
import { MethodNumber } from "./method-card";
import { Avatar, Chip, SampleTag, cx } from "./ui";

export function OutcomeChip({ outcome }: { outcome: Outcome }) {
  // an attempt that did not pay off is still a lesson, so it never reads as an error
  const tone = outcome === "worked" ? "ok" : outcome === "partly" ? "sun" : "ink";
  return <Chip tone={tone}>{outcome === "didnt" ? "لم تنجح · درس مستفاد" : OUTCOMES[outcome]}</Chip>;
}

export function StoryFigures({ story, className }: { story: Story; className?: string }) {
  return (
    <dl className={cx("grid grid-cols-3 divide-x divide-line rounded-2xl border border-line bg-paper/60 text-center", className)}>
      <div className="px-2 py-2.5">
        <dt className="text-[0.7rem] text-ink-mute">المدة</dt>
        <dd className="mt-0.5 text-sm font-bold text-ink">{story.duration}</dd>
      </div>
      <div className="px-2 py-2.5">
        <dt className="text-[0.7rem] text-ink-mute">التكلفة الفعلية</dt>
        <dd className="mt-0.5 text-sm font-bold text-ink">{story.cost === null ? "لم تُذكر" : story.cost === 0 ? "صفر" : riyal(story.cost)}</dd>
      </div>
      <div className="px-2 py-2.5">
        <dt className="text-[0.7rem] text-ink-mute">الدخل المحقق</dt>
        <dd className={cx("mt-0.5 text-sm font-bold", story.income ? "text-ok" : "text-ink-soft")}>{story.income ? riyal(story.income) : "لا دخل بعد"}</dd>
      </div>
    </dl>
  );
}

export function StoryCard({ story, method, featured, className }: { story: Story; method?: MethodSummary; featured?: boolean; className?: string }) {
  return (
    <Link href={`/stories/${story.id}`} className={cx("group flex h-full flex-col overflow-hidden rounded-3xl border-2 border-ink bg-white transition hover:-translate-y-1 hover:shadow-print", className)}>
      <div className="relative flex aspect-[16/10] items-end overflow-hidden bg-brand blue-dots">
        <Image src={methodImage(story.method)} alt="" width={featured ? 480 : 320} height={featured ? 480 : 320} sizes={featured ? "320px" : "240px"} className={cx("absolute end-2 opacity-95 transition duration-300 group-hover:scale-105", featured ? "-bottom-10 w-[58%] max-w-80" : "-bottom-6 w-44")} />
        <div className="relative z-10 flex w-full items-center justify-between p-3">
          {story.media === "video" ? (
            <span className="grid size-11 place-items-center rounded-full border-2 border-ink bg-sun text-ink shadow-print-sm">
              <Play aria-hidden weight="fill" className="size-5 translate-x-[-1px]" />
            </span>
          ) : story.media === "images" ? (
            <span className="grid size-11 place-items-center rounded-full border-2 border-ink bg-white text-ink shadow-print-sm">
              <Images aria-hidden className="size-5" />
            </span>
          ) : (
            <span />
          )}
          <MethodNumber n={story.method} size="sm" inverted />
        </div>
      </div>
      <div className="flex flex-1 flex-col border-t-2 border-ink p-4">
        <div className="flex flex-wrap items-center gap-2">
          <OutcomeChip outcome={story.outcome} />
          {story.sample ? <SampleTag /> : null}
        </div>
        <h3 className="mt-2.5 line-clamp-2 font-display text-xl leading-snug text-ink">{story.title}</h3>
        {method ? <p className="mt-1 truncate text-xs font-semibold text-brand">{method.title}</p> : null}
        <StoryFigures story={story} className="mt-4" />
        <div className="mt-auto flex items-center justify-between pt-4 text-sm">
          <span className="flex min-w-0 items-center gap-2 text-ink-soft">
            <Avatar name={story.author} size="sm" />
            <span className="truncate">
              {story.author}
              {story.city ? ` · ${story.city}` : ""}
            </span>
          </span>
          <span className="inline-flex shrink-0 items-center gap-1 font-bold text-brand">
            اقرأ
            <ArrowLeft aria-hidden className="size-4 transition group-hover:-translate-x-1" />
          </span>
        </div>
      </div>
    </Link>
  );
}

/** A story on one line, beside the featured one on the home page. */
export function StoryRow({ story, method, className }: { story: Story; method?: MethodSummary; className?: string }) {
  return (
    <Link href={`/stories/${story.id}`} className={cx("lift group flex h-full gap-4 rounded-card border-2 border-ink bg-white p-3", className)}>
      <div className="relative w-24 shrink-0 overflow-hidden rounded-tile bg-brand blue-dots sm:w-28">
        <Image src={methodImage(story.method)} alt="" width={160} height={160} sizes="112px" className="absolute -bottom-3 inset-x-0 w-full" />
      </div>
      <div className="min-w-0 flex-1 py-1">
        <div className="flex flex-wrap items-center gap-2">
          <OutcomeChip outcome={story.outcome} />
          {story.sample ? <SampleTag /> : null}
        </div>
        <h3 className="mt-2 line-clamp-2 font-display text-lg leading-snug text-ink">{story.title}</h3>
        {method ? <p className="truncate text-xs font-semibold text-brand">{method.title}</p> : null}
        <p className="mt-1 text-sm text-ink-soft">
          {story.duration} · <b className={story.income ? "text-ok" : "font-semibold"}>{story.income ? riyal(story.income) : "لا دخل بعد"}</b>
        </p>
      </div>
    </Link>
  );
}

export function ProviderCard({ provider, className }: { provider: Provider; className?: string }) {
  return (
    <Link href={`/providers/${provider.id}`} className={cx("group flex h-full flex-col rounded-3xl border-2 border-ink bg-white p-4 transition hover:-translate-y-1 hover:shadow-print", className)}>
      <div className="flex items-start gap-3">
        <Avatar name={provider.name} />
        <div className="min-w-0 flex-1">
          <h3 className="truncate font-display text-xl leading-tight text-ink">{provider.name}</h3>
          <p className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-ink-soft">
            <span className="inline-flex items-center gap-1">
              <MapPin aria-hidden className="size-3.5" />
              {provider.city}
            </span>
            {provider.remote ? (
              <span className="inline-flex items-center gap-1">
                <Wifi aria-hidden className="size-3.5" />
                عن بُعد
              </span>
            ) : null}
          </p>
        </div>
        {provider.sample ? <SampleTag /> : null}
      </div>
      <p className="mt-3 line-clamp-2 text-sm text-ink-soft">{provider.headline}</p>
      <ul className="mt-3 flex flex-wrap gap-1.5">
        {provider.services.slice(0, 3).map((s) => (
          <li key={s}>
            <Chip>{s}</Chip>
          </li>
        ))}
      </ul>
      <div className="mt-auto flex items-end justify-between gap-3 pt-4">
        <p className="text-sm">
          {provider.priceFrom !== null ? (
            <>
              <span className="block text-[0.7rem] text-ink-mute">يبدأ من</span>
              <b className="font-display text-xl text-ink">{riyal(provider.priceFrom)}</b>
              {provider.priceNote ? <span className="text-xs text-ink-soft"> {provider.priceNote}</span> : null}
            </>
          ) : (
            <span className="text-ink-soft">السعر عند الطلب</span>
          )}
        </p>
        <span className="inline-flex h-9 shrink-0 items-center rounded-full bg-brand-wash px-4 text-sm font-bold text-brand-dark transition group-hover:bg-brand group-hover:text-white">تواصل</span>
      </div>
    </Link>
  );
}

export function Meta({ icon, children }: { icon?: React.ReactNode; children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-sm text-ink-soft">
      {icon ?? <Clock3 aria-hidden className="size-4" />}
      {children}
    </span>
  );
}
