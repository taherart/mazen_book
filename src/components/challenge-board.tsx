"use client";

import { Check, CircleCheckBig, FileUp, PartyPopper, Send, Trophy } from "lucide-react";
import Link from "next/link";
import { useId, useState } from "react";
import { useDemo } from "@/lib/demo/hooks";
import { actions } from "@/lib/demo/store";
import { methodHref } from "@/lib/methods";
import { TASKS, count } from "@/lib/taxonomy";
import type { MethodSummary, WeekInfo } from "@/lib/types";
import { AuthGate } from "./auth-gate";
import { MethodNumber } from "./method-card";
import { T } from "./text";
import { Button, Chip, Notice, Progress, Textarea, buttonClass, cx } from "./ui";
import { Countdown, useWeekMethod } from "./weekly";

const ENTRY_LABEL = { pending: "مشاركتك بانتظار المراجعة", eligible: "مشاركتك مؤهلة للسحب", rejected: "مشاركتك لم تستوفِ الشروط" } as const;
const MIN_NOTE = 30;

export function ChallengeBoard({ method, tasks, week }: { method: MethodSummary; tasks: { title: string; detail: string }[]; week: WeekInfo }) {
  return (
    <AuthGate title="سجّل دخولك لتبدأ التحدي" reason="نحفظ لك قائمة المهام وتقدّمك، ونُدخل مشاركتك في سحب الأسبوع.">
      {() => <Board method={method} tasks={tasks} week={week} />}
    </AuthGate>
  );
}

function Board({ method, tasks, week }: { method: MethodSummary; tasks: { title: string; detail: string }[]; week: WeekInfo }) {
  const state = useDemo().challenges[method.n];
  const isWeekly = useWeekMethod(week) === method.n;
  const noteId = useId();
  const [proof, setProof] = useState("");
  const [touched, setTouched] = useState(false);

  if (!state) {
    return (
      <div className="rounded-[2rem] border-2 border-ink bg-white p-6 text-center shadow-print sm:p-10">
        <MethodNumber n={method.n} size="lg" className="mx-auto" />
        <h2 className="mt-4 font-display text-2xl text-ink">لم تنضم لهذا التحدي بعد</h2>
        <p className="mx-auto mt-2 max-w-md text-ink-soft">
          {count(tasks.length, TASKS)} لتجربة «{method.title}». تحدّد إنجاز كل مهمة وتوثّق ما حدث معك.
        </p>
        <Button size="lg" className="mt-6" onClick={() => actions.joinChallenge(method.n)}>
          انضم للتحدي
        </Button>
      </div>
    );
  }

  const done = state.done.length;
  const pct = (done / tasks.length) * 100;
  const complete = done >= tasks.length;
  const noteShort = state.note.trim().length < MIN_NOTE;

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
      <div className="min-w-0 space-y-6">
        {/* progress */}
        <div className="rounded-[2rem] border-2 border-ink bg-white p-5 shadow-print sm:p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="font-display text-2xl text-ink">
              أنجزت <span className="text-brand">{done}</span> من {tasks.length}
            </p>
            {complete ? (
              <Chip tone="ok" className="animate-pop px-3 py-1.5 text-sm">
                <PartyPopper aria-hidden className="size-4" />
                أكملت كل المهام
              </Chip>
            ) : (
              <span className="text-sm font-semibold text-ink-soft">{Math.round(pct)}%</span>
            )}
          </div>
          <Progress value={pct} tone={complete ? "sun" : "brand"} className="mt-3" />
        </div>

        {/* checklist */}
        <ol className="grid gap-3">
          {tasks.map((t, i) => {
            const checked = state.done.includes(i);
            return (
              <li key={i}>
                <label className={cx("flex cursor-pointer gap-4 rounded-3xl border-2 p-4 transition sm:p-5", checked ? "border-ok bg-ok-wash" : "border-ink bg-white hover:bg-brand-wash")}>
                  <input type="checkbox" className="peer sr-only" checked={checked} onChange={() => actions.toggleTask(method.n, i)} />
                  <span aria-hidden className={cx("mt-0.5 grid size-8 shrink-0 place-items-center rounded-xl border-2 transition peer-focus-visible:outline-3 peer-focus-visible:outline-sun-deep", checked ? "border-ok bg-ok text-white" : "border-ink bg-white text-transparent")}>
                    <Check className="size-5" strokeWidth={3} />
                  </span>
                  <span className="min-w-0">
                    <span className="block text-xs font-bold text-ink-mute">المهمة {i + 1}</span>
                    <span className={cx("block font-display text-xl leading-snug", checked ? "text-ok line-through decoration-2" : "text-ink")}>
                      <T>{t.title}</T>
                    </span>
                    <span className="mt-1 block text-sm leading-7 text-ink-soft">
                      <T>{t.detail}</T>
                    </span>
                  </span>
                </label>
              </li>
            );
          })}
        </ol>

        {/* write-up */}
        <div className="rounded-[2rem] border-2 border-ink bg-white p-5 sm:p-6">
          <h2 className="font-display text-2xl text-ink">وثّق تقدّمك</h2>
          <p className="mt-1 text-sm text-ink-soft">ماذا فعلت هذا الأسبوع؟ ماذا نجح وماذا تعثّر؟ هذا الملخص هو مشاركتك في السحب.</p>
          <label htmlFor={noteId} className="sr-only">
            ملخص تجربتك
          </label>
          <Textarea id={noteId} className="mt-4" rows={5} value={state.note} placeholder="مثال: تعلّمت الأساسيات في ثلاثة أيام، جهّزت خمسة نماذج، وراسلت عشرة عملاء فردّ منهم اثنان…" onChange={(e) => actions.setNote(method.n, e.target.value)} onBlur={() => setTouched(true)} aria-invalid={touched && noteShort} disabled={!!state.submittedAt} />
          <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-xs">
            <span className={touched && noteShort ? "font-semibold text-bad" : "text-ink-mute"}>{noteShort ? `اكتب ${MIN_NOTE} حرفًا على الأقل (${state.note.trim().length}/${MIN_NOTE})` : "يُحفظ تلقائيًا على جهازك"}</span>
          </div>

          <label className="mt-4 flex cursor-pointer items-center gap-3 rounded-2xl border-2 border-dashed border-line px-4 py-3 text-sm hover:border-ink">
            <FileUp aria-hidden className="size-5 shrink-0 text-brand" />
            <span className="min-w-0 flex-1">
              <span className="block font-bold text-ink">{proof || "أرفق إثباتًا (اختياري)"}</span>
              <span className="text-ink-mute">صورة أو لقطة شاشة أو فيديو قصير. في النسخة الأولية لا يُرفع الملف فعليًا.</span>
            </span>
            <input type="file" accept="image/*,video/*" className="sr-only" disabled={!!state.submittedAt} onChange={(e) => setProof(e.target.files?.[0]?.name ?? "")} />
          </label>

          {state.submittedAt ? (
            <Notice tone={state.entry === "rejected" ? "bad" : "ok"} className="mt-5" icon={<CircleCheckBig className="size-5 text-ok" />} title={ENTRY_LABEL[state.entry]}>
              {state.entry === "pending" ? "وصلتنا مشاركتك. تراجعها الإدارة ثم تدخل السحب إن استوفت الشروط." : state.entry === "eligible" ? "بالتوفيق! يُعلن الفائز بعد إغلاق التحدي." : "راجع شروط المشاركة، وتستطيع المحاولة في تحدي الأسبوع القادم."}
            </Notice>
          ) : (
            <div className="mt-5 flex flex-wrap items-center gap-3">
              <Button
                size="lg"
                disabled={noteShort || done === 0}
                onClick={() => {
                  setTouched(true);
                  if (!noteShort) actions.submitChallenge(method.n);
                }}
              >
                <Send aria-hidden className="size-5" />
                أرسل مشاركتي
              </Button>
              <p className="text-sm text-ink-soft">{done === 0 ? "أنجز مهمة واحدة على الأقل أولًا." : isWeekly ? "تدخل مشاركتك سحب هذا الأسبوع بعد المراجعة." : "تُحسب في إنجازاتك؛ السحب خاص بطريقة الأسبوع."}</p>
            </div>
          )}
        </div>
      </div>

      {/* side */}
      <aside className="space-y-5 lg:sticky lg:top-24 lg:self-start">
        <div className={cx("rounded-3xl border-2 border-ink p-5", isWeekly ? "bg-sun" : "bg-white")}>
          <p className="flex items-center gap-2 font-display text-xl text-ink">
            <Trophy aria-hidden className="size-5" />
            {isWeekly ? `تحدي الأسبوع ${week.week}` : "تجربة مفتوحة"}
          </p>
          {isWeekly ? (
            <>
              <p className="mb-3 mt-1 text-sm text-ink">أرسل مشاركتك قبل نهاية الأسبوع لتدخل السحب.</p>
              <Countdown endsAt={week.endsAt} />
            </>
          ) : (
            <p className="mt-1 text-sm text-ink-soft">هذه ليست طريقة الأسبوع، فلا موعد نهائي لها. خذ وقتك وأكمل المهام.</p>
          )}
        </div>
        <div className="rounded-3xl border-2 border-ink bg-white p-5">
          <p className="font-display text-xl text-ink">بعد التجربة</p>
          <div className="mt-3 grid gap-2">
            <Link href={`${methodHref(method.n)}/share`} className={buttonClass("soft", "md", "w-full")}>
              شارك تجربتك كاملة
            </Link>
            <Link href={`${methodHref(method.n)}/offer`} className={buttonClass("soft", "md", "w-full")}>
              اعرض خدماتك في هذه المهارة
            </Link>
            <Link href={methodHref(method.n)} className={buttonClass("ghost", "md", "w-full")}>
              عُد لصفحة الطريقة
            </Link>
          </div>
        </div>
        {!state.submittedAt ? (
          <button
            type="button"
            className="text-sm font-semibold text-ink-mute underline underline-offset-4 hover:text-bad"
            onClick={() => {
              if (window.confirm("ستُحذف مهامك المنجزة وملخصك لهذه الطريقة. متابعة؟")) actions.leaveChallenge(method.n);
            }}
          >
            انسحب من هذا التحدي
          </button>
        ) : null}
      </aside>
    </div>
  );
}
