"use client";

import { ArrowLeft, Check, Gift, Key, Link2, Lock, LockOpen } from "@/components/icons";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent, type ReactNode } from "react";
import { CREDIT, GOALS, INVITE_CAP, isOpen } from "@/lib/access";
import { useDemo, useHydrated } from "@/lib/demo/hooks";
import { methodHref } from "@/lib/method-links";
import { redeemBookCodeAction, submitSurveyAction, unlockMethodAction } from "@/lib/server/access-actions";
import { refreshSession } from "@/lib/session-client";
import { CAPITAL, LEVELS, PLACES, TIME, count } from "@/lib/taxonomy";
import type { MethodSummary } from "@/lib/types";
import { MethodNumber } from "./method-card";
import { useCopyLink } from "./share-buttons";
import { T } from "./text";
import { Button, Container, Eyebrow, Input, Notice, Progress, buttonClass, cx } from "./ui";

const METHODS: [string, string, string] = ["طريقة", "طريقتين", "طرق"];

const QUESTIONS: { name: string; label: string; options: [string, string][] }[] = [
  { name: "capital", label: "كم تستطيع أن تضع في البداية؟", options: Object.entries(CAPITAL) },
  { name: "time", label: "متى تحتاج أول دخل؟", options: Object.entries(TIME) },
  { name: "place", label: "أين تفضّل أن تعمل؟", options: Object.entries(PLACES) },
  { name: "level", label: "ما خبرتك في العمل الحر؟", options: Object.entries(LEVELS) },
  { name: "goal", label: "ما الذي تريده من هذه الطرق؟", options: Object.entries(GOALS) },
];

/**
 * The unlock page: how many methods are open, the survey that opens the first five to fit, what
 * each action earns, the invitation link, the book code, and every method with its lock.
 */
export function UnlockHub({ methods }: { methods: MethodSummary[] }) {
  const { user, access, backend } = useDemo();
  const hydrated = useHydrated();
  const ready = hydrated && access.loaded;
  const total = methods.length;
  const opened = access.all ? total : methods.filter((m) => access.open.includes(m.n)).length;
  const locked = methods.filter((m) => !isOpen(access, m.n));
  // the methods the survey has just opened: kept here so the list outlives the form that produced it
  const [fitted, setFitted] = useState<number[]>();

  return (
    <>
      <header className="border-b border-line">
        <Container className="py-10 sm:py-14">
          <Eyebrow>افتح الطرق</Eyebrow>
          <h1 className="mt-3 font-display text-4xl text-ink sm:text-6xl">52 طريقة، تفتحها بما تفعله</h1>
          <p className="mt-3 max-w-2xl text-lg text-ink-soft">الصفحة الأولى من كل طريقة مفتوحة للجميع: الرسمة والأرقام الثلاثة. الصفحة الثانية، بخطواتها وسرّ صنعتها وتحديها، تفتحها خطوة خطوة.</p>
          {ready ? (
            <div className="mt-7 max-w-xl">
              <p className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                <span className="text-ink-soft">
                  فتحت <b className="font-display text-3xl text-brand-dark">{opened}</b> من {total}
                </span>
                {access.all ? (
                  <span className="font-bold text-ok">كل الطرق مفتوحة لك</span>
                ) : user ? (
                  <span className="font-bold text-ink">
                    رصيدك: <span className="font-display text-xl text-brand-dark">{access.credits}</span>
                  </span>
                ) : null}
              </p>
              <Progress value={(opened / total) * 100} className="mt-2" />
            </div>
          ) : (
            <div aria-busy="true" className="skeleton mt-7 h-14 max-w-xl" />
          )}
        </Container>
      </header>

      <Container className="grid gap-10 py-12 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <div className="min-w-0 space-y-10">
          {!ready ? (
            <div aria-busy="true" className="skeleton h-96" />
          ) : !backend ? (
            <Notice title="كل الطرق مفتوحة في النسخة التجريبية">نظام الفتح يعمل على الخادم: هناك تُفتح خمس طرق للجميع، والبقية بالاستبيان والتحديات والتجارب ورمز الكتاب.</Notice>
          ) : access.all ? (
            <Notice tone="ok" title={access.bookOwner ? "شكرًا لاقتنائك الكتاب" : "حساب الفريق"}>
              كل الطرق الـ52 مفتوحة لك بصفحتيها. ابدأ من <Link href="/methods" className="font-bold text-brand underline underline-offset-4">دليل الطرق</Link> أو من <Link href="/challenge" className="font-bold text-brand underline underline-offset-4">تحدي هذا الأسبوع</Link>.
            </Notice>
          ) : (
            <>
              {/* step one: an account and the survey */}
              <Step n={1} done={access.survey} title="أجب عن خمسة أسئلة، وافتح خمس طرق تناسبك">
                {!user ? (
                  <>
                    <p className="text-ink-soft">نختار لك خمس طرق على مقاس مالك ووقتك وخبرتك. يلزمك حساب مجاني لنحفظها لك.</p>
                    <div className="mt-4 flex flex-wrap items-center gap-3">
                      <Link href="/signup?next=/unlock" className={buttonClass("primary", "md")}>
                        أنشئ حسابًا
                      </Link>
                      <Link href="/login?next=/unlock" className="text-sm font-bold text-ink-soft underline underline-offset-4 hover:text-brand">
                        عندي حساب
                      </Link>
                    </div>
                  </>
                ) : fitted ? (
                  <Fitted methods={methods} unlocked={fitted} />
                ) : access.survey ? (
                  <p className="text-ink-soft">أجبت عن الاستبيان، وفتحنا لك الطرق الأنسب لإجاباتك.</p>
                ) : (
                  <Survey onDone={setFitted} />
                )}
              </Step>

              {/* step two: earn credits */}
              <Step n={2} title="اكسب رصيدًا بما تفعله، وافتح به ما تشاء">
                <p className="text-ink-soft">كل نقطة رصيد تفتح طريقة تختارها أنت.</p>
                <ul className="mt-4 border-t border-line">
                  <Way worth={CREDIT.challenge} earned={access.earned.challenges} title="أرسل ملخص تحدٍّ" text="انضم لتحدي طريقة مفتوحة لك، أنجز مهامها، ثم أرسل ما حدث." href="/challenge" action="تحدي هذا الأسبوع" />
                  <Way worth={CREDIT.rating} earned={access.earned.ratings} title="قيّم طريقة جرّبتها" text="نجوم وسطر واحد للمؤلف في صفحة الطريقة. يُحسب لك حين ترسل ملخص تحديها." />
                  <Way worth={CREDIT.story} earned={access.earned.stories} title="انشر تجربتك" text="تجربة حقيقية بأرقامها، تُحسب بعد أن يراجعها الفريق وينشرها." href="/methods" action="اختر الطريقة التي جرّبتها" />
                  <Way worth={CREDIT.invite} earned={access.earned.invites + access.earned.welcome} title="ادعُ صديقًا" text={`لك وله، حين يسجّل برابطك ويجيب عن الاستبيان. حتى ${INVITE_CAP} أصدقاء.`} />
                </ul>
                {user && access.inviteCode ? <Invite code={access.inviteCode} invited={access.invited} /> : null}
              </Step>

              {/* the methods still closed, each with its own button */}
              <section aria-labelledby="locked-title">
                <h2 id="locked-title" className="font-display text-h3 text-ink">
                  الطرق المقفلة <span className="text-ink-mute">· {locked.length}</span>
                </h2>
                <p className="mt-1 text-sm text-ink-soft">{user ? (access.credits ? `رصيدك يفتح ${count(access.credits, METHODS)}. اختر.` : "اكسب رصيدًا لتفتح ما تختاره منها.") : "تفتحها بعد إنشاء الحساب."}</p>
                <LockedList methods={locked} canOpen={!!user && access.credits > 0} />
              </section>
            </>
          )}
        </div>

        <aside className="space-y-5 lg:sticky lg:top-24 lg:self-start">
          {ready && backend && user && access.bookCode && !access.all ? <BookCode /> : null}
          <div className="rounded-card border border-line bg-white p-5">
            <h2 className="text-lg font-bold text-ink">ما المفتوح للجميع؟</h2>
            <ul className="mt-3 grid gap-2.5 text-sm leading-6 text-ink-soft">
              {["الصفحة الأولى من كل الطرق الـ52.", "خمس طرق بصفحتيها، تجدها في الصفحة الرئيسية.", "طريقة تحدي الأسبوع ما دام أسبوعها مفتوحًا.", "كل طريقة تنضم لتحديها تبقى مفتوحة لك بعده."].map((line) => (
                <li key={line} className="flex gap-2">
                  <span aria-hidden className="mt-2 size-1.5 shrink-0 rounded-full bg-brand" />
                  {line}
                </li>
              ))}
            </ul>
          </div>
          {ready && backend && !access.all ? (
            <div className="rounded-card border border-line bg-white p-5">
              <h2 className="text-lg font-bold text-ink">
                المفتوحة لك <span className="font-normal text-ink-mute">· {opened}</span>
              </h2>
              <ul className="mt-3 flex flex-wrap gap-1.5">
                {methods
                  .filter((m) => access.open.includes(m.n))
                  .map((m) => (
                    <li key={m.n}>
                      <Link href={methodHref(m.n)} title={m.title} className="grid size-9 place-items-center rounded-lg bg-brand pt-[0.12em] font-display text-lg leading-none text-white transition hover:bg-brand-dark">
                        {m.n}
                      </Link>
                    </li>
                  ))}
              </ul>
            </div>
          ) : null}
        </aside>
      </Container>
    </>
  );
}

function Step({ n, title, done, children }: { n: number; title: string; done?: boolean; children: ReactNode }) {
  return (
    <section id={n === 1 ? "survey" : undefined} className="scroll-mt-24 rounded-panel border border-line bg-white p-5 sm:p-7">
      <h2 className="flex items-start gap-3 font-display text-h3 text-ink">
        <span className={cx("grid size-9 shrink-0 place-items-center rounded-full pt-[0.1em] text-xl leading-none", done ? "bg-ok text-white" : "bg-brand-wash text-brand-dark")}>{done ? <Check aria-hidden className="size-5" /> : n}</span>
        {title}
      </h2>
      <div className="mt-4">{children}</div>
    </section>
  );
}

function Way({ worth, earned, title, text, href, action }: { worth: number; earned: number; title: string; text: string; href?: string; action?: string }) {
  return (
    <li className="flex gap-4 border-b border-line py-4">
      <bdi dir="ltr" className="w-10 shrink-0 text-end font-display text-2xl leading-none text-brand-dark">+{worth}</bdi>
      <div className="min-w-0 flex-1">
        <p className="font-bold text-ink">
          {title}
          {earned ? <span className="ms-2 text-xs font-semibold text-ok">كسبت {earned}</span> : null}
        </p>
        <p className="mt-0.5 text-sm leading-6 text-ink-soft">{text}</p>
        {href && action ? (
          <Link href={href} className="mt-1.5 inline-flex items-center gap-1 text-sm font-bold text-brand hover:underline">
            {action}
            <ArrowLeft aria-hidden className="size-4" />
          </Link>
        ) : null}
      </div>
    </li>
  );
}

/** Five questions; the answers are kept only with the box ticked, and pick the first five methods. */
function Survey({ onDone }: { onDone: (unlocked: number[]) => void }) {
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [consent, setConsent] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (QUESTIONS.some((q) => !answers[q.name])) return setError("أجب عن الأسئلة الخمسة كلها.");
    if (!consent) return setError("نحتاج موافقتك على حفظ إجاباتك.");
    setError("");
    setBusy(true);
    try {
      const res = await submitSurveyAction({ ...answers, level: Number(answers.level), consent });
      if (res.ok) {
        onDone(res.unlocked);
        await refreshSession();
        return;
      }
      setError(res.error);
    } catch {
      setError("تعذّر الاتصال بالخادم. حاول مجددًا.");
    }
    setBusy(false);
  };

  return (
    <form noValidate onSubmit={submit} className="space-y-6">
      {QUESTIONS.map((q) => (
        <fieldset key={q.name}>
          <legend className="mb-2 font-bold text-ink">{q.label}</legend>
          <div className="flex flex-wrap gap-2">
            {q.options.map(([value, label]) => {
              const on = answers[q.name] === value;
              return (
                <label key={value} className={cx("tap cursor-pointer rounded-full border px-4 py-2 text-sm font-semibold transition", on ? "border-brand bg-brand text-white" : "border-ink/20 bg-white text-ink-soft hover:border-ink hover:text-ink")}>
                  <input type="radio" name={q.name} value={value} checked={on} onChange={() => setAnswers({ ...answers, [q.name]: value })} className="sr-only" />
                  {label}
                </label>
              );
            })}
          </div>
        </fieldset>
      ))}
      <label className="flex items-start gap-3 text-sm">
        <input id="survey-consent" type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} className="mt-1 size-5 accent-brand" />
        <span className="leading-6 text-ink-soft">
          أوافق على حفظ إجاباتي واستخدامها لاقتراح الطرق المناسبة لي ولتحسين المنصة والكتاب، وفق{" "}
          <Link href="/terms#privacy" className="font-bold text-brand underline underline-offset-4">
            سياسة الخصوصية
          </Link>
          . تُحذف مع حذف حسابي.
        </span>
      </label>
      {error ? <p className="text-sm font-semibold text-bad">{error}</p> : null}
      <Button type="submit" size="lg" disabled={busy}>
        {busy ? "لحظة…" : "أرسل وافتح 5 طرق"}
      </Button>
    </form>
  );
}

/** What the survey opened, each a link into the method. */
function Fitted({ methods, unlocked }: { methods: MethodSummary[]; unlocked: number[] }) {
  return (
    <div>
      <p className="font-bold text-ok">فتحنا لك {count(unlocked.length, METHODS)} تناسب إجاباتك:</p>
      <ul className="mt-3 grid gap-2">
        {unlocked.map((n) => (
          <li key={n}>
            <Link href={methodHref(n)} className="group flex items-center gap-3 rounded-tile border border-line p-2.5 transition hover:border-brand">
              <MethodNumber n={n} size="sm" />
              <span className="min-w-0 flex-1 truncate font-bold text-ink group-hover:text-brand">{methods[n - 1].title}</span>
              <LockOpen aria-hidden className="size-5 shrink-0 text-ok" />
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

function Invite({ code, invited }: { code: string; invited: number }) {
  const { copied, copy } = useCopyLink(`/signup?ref=${code}`);
  return (
    <div className="mt-5 flex flex-wrap items-center gap-3 rounded-card bg-brand-wash p-4">
      <Gift aria-hidden className="size-6 shrink-0 text-brand" />
      <p className="min-w-0 flex-1 text-sm text-ink">
        <b className="block">رابط دعوتك</b>
        انضم به {invited} من {INVITE_CAP} حتى الآن.
      </p>
      <Button size="sm" variant="white" onClick={copy}>
        {copied ? <Check aria-hidden className="size-4 text-ok" /> : <Link2 aria-hidden className="size-4" />}
        {copied ? "نُسخ" : "انسخ الرابط"}
      </Button>
    </div>
  );
}

/** The code printed in the book opens everything for its owner. */
function BookCode() {
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const submit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const code = String(new FormData(e.currentTarget).get("code") ?? "");
    if (!code.trim()) return;
    setBusy(true);
    setError("");
    try {
      const res = await redeemBookCodeAction(code);
      if (res.ok) await refreshSession();
      else setError(res.error);
    } catch {
      setError("تعذّر الاتصال بالخادم. حاول مجددًا.");
    }
    setBusy(false);
  };
  return (
    <form id="book" onSubmit={submit} className="scroll-mt-24 rounded-card border border-brand/30 bg-brand-wash p-5">
      <h2 className="flex items-center gap-2 text-lg font-bold text-ink">
        <Key aria-hidden className="size-5 text-brand" />
        عندك الكتاب؟
      </h2>
      <p className="mt-1 text-sm leading-6 text-ink-soft">اكتب الرمز المطبوع فيه، فتُفتح لك الطرق الـ52 كلها.</p>
      <label htmlFor="book-code" className="sr-only">
        رمز الكتاب
      </label>
      <Input id="book-code" name="code" dir="ltr" autoComplete="off" autoCapitalize="characters" maxLength={40} className="mt-3 h-11 text-center font-bold tracking-widest uppercase" aria-invalid={!!error} />
      {error ? <p className="mt-2 text-sm font-semibold text-bad">{error}</p> : null}
      <Button type="submit" size="sm" className="mt-3 w-full" disabled={busy}>
        {busy ? "لحظة…" : "افتح كل الطرق"}
      </Button>
    </form>
  );
}

function LockedList({ methods, canOpen }: { methods: MethodSummary[]; canOpen: boolean }) {
  const router = useRouter();
  const [busy, setBusy] = useState<number>();
  const open = async (n: number) => {
    setBusy(n);
    await unlockMethodAction(n).catch(() => null);
    await refreshSession();
    router.refresh();
    setBusy(undefined);
  };
  return (
    <ul className="mt-4 grid gap-2 sm:grid-cols-2">
      {methods.map((m) => (
        <li key={m.n} className="flex items-center gap-3 rounded-tile border border-line bg-white p-2.5">
          <MethodNumber n={m.n} size="sm" />
          <div className="min-w-0 flex-1">
            <Link href={methodHref(m.n)} className="block truncate font-bold text-ink hover:text-brand">
              {m.title}
            </Link>
            <p className="truncate text-xs text-ink-mute">
              <T>{m.stats.income}</T>
            </p>
          </div>
          {canOpen ? (
            <Button size="sm" variant="soft" disabled={busy !== undefined} onClick={() => open(m.n)}>
              {busy === m.n ? "…" : "افتح"}
            </Button>
          ) : (
            <Lock aria-label="مقفلة" className="size-4 shrink-0 text-ink-mute" />
          )}
        </li>
      ))}
    </ul>
  );
}
