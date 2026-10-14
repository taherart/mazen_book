"use client";

import { ArrowLeft, CalendarDays, Images, Lightbulb, MapPin, Mountain, Play, SearchX, ThumbsUp } from "@/components/icons";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { SAMPLE_STORIES } from "@/data/samples";
import { useDemo, useHydrated } from "@/lib/demo/hooks";
import { actions } from "@/lib/demo/store";
import { methodHref, methodImage } from "@/lib/methods";
import type { MethodSummary } from "@/lib/types";
import { formatDate } from "@/lib/week";
import { OutcomeChip, StoryFigures } from "./community";
import { MethodNumber } from "./method-card";
import { ReportButton } from "./report-button";
import { ShareButtons } from "./share-buttons";
import { PageSkeleton } from "./skeletons";
import { Avatar, Container, EmptyState, Notice, SampleTag, StatusPill, buttonClass, cx } from "./ui";
import { JoinButton } from "./weekly";

export function StoryDetail({ id, methods }: { id: string; methods: MethodSummary[] }) {
  const { stories, helpful, showSamples } = useDemo();
  const hydrated = useHydrated();
  const [played, setPlayed] = useState(false);
  const story = stories.find((s) => s.id === id) ?? (showSamples ? SAMPLE_STORIES.find((s) => s.id === id) : undefined);

  if (!story) {
    if (!hydrated) return <PageSkeleton />;
    return (
      <Container className="max-w-2xl py-16">
        <EmptyState
          icon={<SearchX className="size-6" />}
          title="هذه التجربة غير موجودة"
          action={
            <Link href="/stories" className={buttonClass("primary")}>
              تصفّح التجارب
            </Link>
          }
        >
          ربما حُذفت، أو لم تُنشر بعد، أو أن الرابط غير صحيح.
        </EmptyState>
      </Container>
    );
  }

  const method = methods[story.method - 1];
  const liked = helpful.includes(story.id);

  return (
    <article>
      <header className="border-b-2 border-ink paper-dots">
        <Container className="max-w-4xl py-8">
          {story.status !== "approved" ? (
            <Notice tone={story.status === "rejected" ? "bad" : "sun"} className="mb-5" title={story.status === "pending" ? "معاينة خاصة بك: بانتظار المراجعة" : "لم تُقبل هذه التجربة"}>
              {story.status === "pending" ? "لا يراها غيرك حتى توافق عليها الإدارة." : "راجع شروط النشر وعدّلها ثم أرسلها من جديد."}
            </Notice>
          ) : null}
          <Link href={methodHref(method.n)} className="inline-flex items-center gap-2.5 rounded-full border-2 border-ink bg-white py-1 pe-4 ps-1 text-sm font-bold hover:bg-brand-wash">
            <MethodNumber n={method.n} size="sm" className="rounded-full" />
            {method.title}
          </Link>
          <h1 className="mt-4 font-display text-3xl leading-[1.4] text-ink sm:text-5xl">{story.title}</h1>
          <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-ink-soft">
            <span className="flex items-center gap-2 font-bold text-ink">
              <Avatar name={story.author} size="sm" />
              {story.author}
            </span>
            {story.city ? (
              <span className="inline-flex items-center gap-1.5">
                <MapPin aria-hidden className="size-4" />
                {story.city}
              </span>
            ) : null}
            <span className="inline-flex items-center gap-1.5" suppressHydrationWarning>
              <CalendarDays aria-hidden className="size-4" />
              {formatDate(story.createdAt)}
            </span>
            <OutcomeChip outcome={story.outcome} />
            {story.status !== "approved" ? <StatusPill status={story.status} /> : null}
            {story.sample ? <SampleTag /> : null}
          </div>
        </Container>
      </header>

      <Container className="max-w-4xl space-y-8 py-10">
        {story.media !== "none" ? (
          <div className="relative grid aspect-video place-items-center overflow-hidden rounded-[2rem] border-2 border-ink bg-brand blue-dots shadow-print">
            <Image src={methodImage(story.method)} alt="" width={640} height={640} sizes="360px" className="absolute -bottom-10 end-4 w-72 opacity-90" />
            {story.media === "video" ? (
              <button type="button" onClick={() => setPlayed(true)} className="relative z-10 flex flex-col items-center gap-3 text-white">
                <span className="grid size-20 place-items-center rounded-full border-2 border-ink bg-sun text-ink shadow-print transition hover:scale-105">
                  <Play aria-hidden weight="fill" className="size-9 translate-x-[-2px]" />
                </span>
                <span className="rounded-full bg-ink/70 px-3 py-1 text-sm font-semibold">{played ? "الفيديو غير متاح في النسخة الأولية" : "شاهد التجربة"}</span>
              </button>
            ) : (
              <span className="relative z-10 flex flex-col items-center gap-3 text-white">
                <span className="grid size-20 place-items-center rounded-full border-2 border-ink bg-white text-ink shadow-print">
                  <Images aria-hidden className="size-9" />
                </span>
                <span className="rounded-full bg-ink/70 px-3 py-1 text-sm font-semibold">صور التجربة تظهر هنا</span>
              </span>
            )}
          </div>
        ) : null}

        <StoryFigures story={story} className="[&_dd]:text-lg [&_dt]:text-xs" />

        <section>
          <h2 className="font-display text-2xl text-ink">ماذا فعل؟</h2>
          <p className="mt-2 whitespace-pre-line text-lg leading-9 text-ink-soft">{story.body}</p>
        </section>

        <section className="rounded-3xl border-2 border-ink bg-white p-5">
          <h2 className="flex items-center gap-2 font-display text-2xl text-ink">
            <Mountain aria-hidden className="size-5 text-brand" />
            أبرز التحديات
          </h2>
          <p className="mt-2 leading-8 text-ink-soft">{story.challenges}</p>
        </section>

        <section className="rounded-3xl border-2 border-ink bg-sun-wash p-5">
          <h2 className="flex items-center gap-2 font-display text-2xl text-ink">
            <Lightbulb aria-hidden className="size-5 text-sun-deep" />
            نصائح لمن يبدأ
          </h2>
          <ul className="mt-3 grid gap-2">
            {story.tips.map((t, i) => (
              <li key={i} className="flex gap-3 leading-8 text-ink">
                <span className="font-display text-xl text-brand">{i + 1}</span>
                {t}
              </li>
            ))}
          </ul>
        </section>

        <div className="flex flex-wrap items-center justify-between gap-4 border-y-2 border-line py-5">
          <button type="button" aria-pressed={liked} onClick={() => actions.toggleHelpful(story.id)} className={cx("inline-flex h-11 items-center gap-2 rounded-full border-2 px-5 font-bold transition", liked ? "border-ink bg-brand text-white shadow-print-sm" : "border-ink bg-white text-ink hover:bg-brand-wash")}>
            <ThumbsUp aria-hidden weight={liked ? "fill" : "regular"} className="size-5" />
            {liked ? "أفادتني" : "هل أفادتك هذه التجربة؟"}
          </button>
          <ReportButton kind="story" targetId={story.id} targetTitle={story.title} />
        </div>

        <div>
          <p className="mb-2 text-sm font-bold text-ink-mute">شارك التجربة</p>
          <ShareButtons path={`/stories/${story.id}`} title={story.title} />
        </div>

        <div className="flex flex-wrap items-center justify-between gap-4 rounded-[2rem] border-2 border-ink bg-brand p-6 text-white shadow-print blue-dots">
          <div>
            <p className="font-display text-2xl">جرّب الطريقة نفسها</p>
            <p className="text-white/80">
              {method.n}. {method.title}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <JoinButton method={method.n} variant="sun" size="md" />
            <Link href={methodHref(method.n)} className="inline-flex items-center gap-1 font-bold underline underline-offset-4">
              صفحة الطريقة
              <ArrowLeft aria-hidden className="size-4" />
            </Link>
          </div>
        </div>
      </Container>
    </article>
  );
}
