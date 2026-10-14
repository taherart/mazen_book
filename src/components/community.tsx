import { ArrowLeft, Clock3, Images, MapPin, Play, Wifi } from "@/components/icons";
import Link from "next/link";
import { OUTCOMES, riyal } from "@/lib/taxonomy";
import type { MethodSummary, Outcome, Provider, Story } from "@/lib/types";
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

/** What the member earned, set large like a figure in the book; the story's own words follow. */
function Result({ story, size }: { story: Story; size: "lg" | "md" }) {
  return (
    <div>
      <p className={cx("font-display leading-none", size === "lg" ? "text-h2" : "text-h3", story.income ? "text-brand-dark" : "text-ink-soft")}>{story.income ? riyal(story.income) : "لا دخل بعد"}</p>
      <p className="mt-1.5 text-sm text-ink-soft">
        خلال {story.duration} · التكلفة {story.cost === null ? "لم تُذكر" : story.cost === 0 ? "صفر" : riyal(story.cost)}
      </p>
    </div>
  );
}

function Media({ media }: { media: Story["media"] }) {
  if (media === "video") return <Play aria-label="فيها فيديو" weight="fill" className="size-4 text-ink-soft" />;
  if (media === "images") return <Images aria-label="فيها صور" className="size-4 text-ink-soft" />;
  return null;
}

export function StoryCard({ story, method, featured, className }: { story: Story; method?: MethodSummary; featured?: boolean; className?: string }) {
  return (
    <Link href={`/stories/${story.id}`} className={cx("group flex h-full flex-col rounded-card border border-line bg-white p-5 transition hover:border-ink", featured && "sm:p-7", className)}>
      <div className="flex flex-wrap items-center gap-2">
        <OutcomeChip outcome={story.outcome} />
        {story.sample ? <SampleTag /> : null}
        <span className="ms-auto text-xs font-semibold text-brand">الطريقة {story.method}</span>
      </div>
      <div className="mt-5">
        <Result story={story} size={featured ? "lg" : "md"} />
      </div>
      <h3 className={cx("mt-5 line-clamp-2 font-bold leading-snug text-ink", featured ? "text-xl" : "text-lg")}>{story.title}</h3>
      {method ? <p className="mt-0.5 truncate text-xs font-semibold text-ink-mute">{method.title}</p> : null}
      <p className={cx("mt-3 text-sm leading-7 text-ink-soft", featured ? "line-clamp-5" : "line-clamp-3")}>«{story.body}»</p>
      <div className="mt-auto flex items-center justify-between gap-3 border-t border-line pt-4 text-sm">
        <span className="flex min-w-0 items-center gap-2 text-ink-soft">
          <Avatar name={story.author} size="sm" />
          <span className="truncate">
            {story.author}
            {story.city ? ` · ${story.city}` : ""}
          </span>
          <Media media={story.media} />
        </span>
        <span className="inline-flex shrink-0 items-center gap-1 font-bold text-brand">
          اقرأ
          <ArrowLeft aria-hidden className="size-4 transition group-hover:-translate-x-1" />
        </span>
      </div>
    </Link>
  );
}

/** A story on one line, beside the featured one on the home page. */
export function StoryRow({ story, method, className }: { story: Story; method?: MethodSummary; className?: string }) {
  return (
    <Link href={`/stories/${story.id}`} className={cx("group flex h-full gap-4 rounded-card border border-line bg-white p-4 transition hover:border-ink", className)}>
      <p className="w-24 shrink-0 border-e border-line pe-3 font-display text-2xl leading-tight text-brand-dark sm:w-28">
        {story.income ? story.income.toLocaleString("en-US") : "—"}
        <span className="block font-sans text-xs font-semibold text-ink-mute">{story.income ? "ريال" : "لا دخل بعد"}</span>
      </p>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <OutcomeChip outcome={story.outcome} />
          {story.sample ? <SampleTag /> : null}
        </div>
        <h3 className="mt-2 line-clamp-2 font-bold leading-snug text-ink">{story.title}</h3>
        <p className="mt-0.5 truncate text-xs text-ink-mute">
          {method ? `${method.title} · ` : ""}
          {story.duration}
        </p>
      </div>
    </Link>
  );
}

export function ProviderCard({ provider, className }: { provider: Provider; className?: string }) {
  return (
    <Link href={`/providers/${provider.id}`} className={cx("group flex h-full flex-col overflow-hidden rounded-card border border-line bg-white transition hover:border-brand", className)}>
      <div className="flex items-start gap-3 bg-brand-wash p-4">
        <Avatar name={provider.name} />
        <div className="min-w-0 flex-1">
          <h3 className="truncate font-bold text-xl leading-tight text-ink">{provider.name}</h3>
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
      <p className="mt-3 line-clamp-2 px-4 text-sm text-ink-soft">{provider.headline}</p>
      <ul className="mt-3 flex flex-wrap gap-1.5 px-4">
        {provider.services.slice(0, 3).map((s) => (
          <li key={s}>
            <Chip tone="brand">{s}</Chip>
          </li>
        ))}
      </ul>
      <div className="mt-auto flex items-end justify-between gap-3 p-4">
        <p className="text-sm">
          {provider.priceFrom !== null ? (
            <>
              <span className="block text-[0.7rem] text-ink-mute">يبدأ من</span>
              <b className="font-display text-xl text-brand-dark">{riyal(provider.priceFrom)}</b>
              {provider.priceNote ? <span className="text-xs text-ink-soft"> {provider.priceNote}</span> : null}
            </>
          ) : (
            <span className="text-ink-soft">السعر عند الطلب</span>
          )}
        </p>
        <span className="inline-flex h-9 shrink-0 items-center rounded-full bg-brand px-4 text-sm font-bold text-white transition group-hover:bg-brand-dark">تواصل</span>
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
