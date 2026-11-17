"use client";

import { Lock, LockOpen, Star } from "@/components/icons";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { CREDIT, isOpen } from "@/lib/access";
import { useDemo, useHydrated } from "@/lib/demo/hooks";
import { actions } from "@/lib/demo/store";
import { methodHref } from "@/lib/methods";
import { unlockMethodAction } from "@/lib/server/access-actions";
import { refreshSession } from "@/lib/session-client";
import { count } from "@/lib/taxonomy";
import { Button, Input, buttonClass, cx } from "./ui";

/** Whether this visitor may read the method, once the server has said so (null until then). */
export function useMethodOpen(method: number): boolean | null {
  const { access } = useDemo();
  const hydrated = useHydrated();
  return hydrated && access.loaded ? isOpen(access, method) : null;
}

/** A small lock on a card or row whose method is still closed to this visitor. */
export function LockMark({ method, className }: { method: number; className?: string }) {
  const open = useMethodOpen(method);
  if (open !== false) return null;
  return (
    <span title="مقفلة: الصفحة الأولى فقط" className={cx("grid size-7 place-items-center rounded-full bg-ink/85 text-white", className)}>
      <Lock aria-hidden className="size-3.5" />
      <span className="sr-only">مقفلة</span>
    </span>
  );
}

const WAYS: [string, number][] = [
  ["أرسل ملخص تحدٍّ لطريقة مفتوحة لك", CREDIT.challenge],
  ["قيّم طريقة جرّبتها", CREDIT.rating],
  ["انشر تجربتك مع إحدى الطرق", CREDIT.story],
  ["ادعُ صديقًا يسجّل ويجيب عن الاستبيان", CREDIT.invite],
];

/**
 * Stands where a locked method's second page would be: what is behind it, and the shortest way for
 * this visitor to open it. The server decides what is locked; this only explains and asks.
 */
export function UnlockPanel({ method, parts, className }: { method: number; parts: string[]; className?: string }) {
  const { user, access } = useDemo();
  const hydrated = useHydrated();
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const here = methodHref(method);
  const ready = hydrated && access.loaded;
  const open = ready && isOpen(access, method);

  // the page was sent locked but the method has opened since (another tab, a new credit): ask once more
  const asked = useRef(false);
  useEffect(() => {
    if (!open || asked.current) return;
    asked.current = true;
    router.refresh();
  }, [open, router]);

  const unlock = async () => {
    setBusy(true);
    setError("");
    const res = await unlockMethodAction(method).catch(() => ({ ok: false }));
    await refreshSession();
    if (res.ok) router.refresh();
    else setError("لم تُفتح الطريقة. حدّث الصفحة وتحقق من رصيدك.");
    setBusy(false);
  };

  return (
    <div id="unlock" className={cx("flex scroll-mt-24 flex-col rounded-card border border-dashed border-brand/40 bg-brand-wash/60 p-5 sm:p-6", className)}>
      <span className="grid size-12 place-items-center rounded-tile bg-brand text-white">
        <Lock aria-hidden className="size-6" />
      </span>
      <h2 className="mt-4 font-display text-h3 text-ink">الصفحة الثانية مقفلة</h2>
      <p className="mt-1 text-sm text-ink-soft">فيها ما يحوّل الفكرة إلى عمل:</p>
      <ul className="mt-3 flex flex-wrap gap-1.5">
        {parts.map((p) => (
          <li key={p} className="rounded-full bg-white px-2.5 py-1 text-xs font-semibold text-ink-soft">
            {p}
          </li>
        ))}
      </ul>

      <div className="mt-6 border-t border-brand/20 pt-5">
        {!ready ? (
          <div aria-busy="true" className="skeleton h-24" />
        ) : open ? (
          <p className="flex items-center gap-2 font-bold text-ink">
            <LockOpen aria-hidden className="size-5 text-ok" />
            فُتحت هذه الطريقة لك. لحظة…
          </p>
        ) : !user ? (
          <>
            <p className="leading-7 text-ink">أنشئ حسابًا مجانيًا وأجب عن خمسة أسئلة قصيرة، فنفتح لك خمس طرق تناسب وضعك. ثم تفتح البقية بما تنجزه.</p>
            <div className="mt-4 flex flex-wrap items-center gap-3">
              <Link href="/signup?next=/unlock" className={buttonClass("primary", "md")}>
                أنشئ حسابًا وافتح 5 طرق
              </Link>
              <Link href={`/login?next=${encodeURIComponent(here)}`} className="text-sm font-bold text-ink-soft underline underline-offset-4 hover:text-brand">
                عندي حساب
              </Link>
            </div>
          </>
        ) : access.credits > 0 ? (
          <>
            <p className="leading-7 text-ink">
              رصيدك يفتح <b>{count(access.credits, ["طريقة", "طريقتين", "طرق"])}</b>. افتح هذه بواحدة منه.
            </p>
            <div className="mt-4 flex flex-wrap items-center gap-3">
              <Button onClick={unlock} disabled={busy}>
                <LockOpen aria-hidden className="size-5" />
                {busy ? "لحظة…" : "افتحها الآن"}
              </Button>
              <Link href="/unlock" className="text-sm font-bold text-ink-soft underline underline-offset-4 hover:text-brand">
                رصيدي وما فتحته
              </Link>
            </div>
            {error ? <p className="mt-2 text-sm font-semibold text-bad">{error}</p> : null}
          </>
        ) : !access.survey ? (
          <>
            <p className="leading-7 text-ink">أجب عن خمسة أسئلة قصيرة، فنفتح لك خمس طرق تناسب مالك ووقتك وخبرتك.</p>
            <Link href="/unlock#survey" className={buttonClass("primary", "md", "mt-4")}>
              أجب وافتح 5 طرق
            </Link>
          </>
        ) : (
          <>
            <p className="font-bold text-ink">رصيدك صفر الآن. تكسبه بما تفعله:</p>
            <ul className="mt-3 grid gap-1.5 text-sm text-ink-soft">
              {WAYS.map(([label, n]) => (
                <li key={label} className="flex items-baseline justify-between gap-3 border-b border-brand/15 pb-1.5">
                  {label}
                  <bdi dir="ltr" className="shrink-0 font-display text-base text-brand-dark">+{n}</bdi>
                </li>
              ))}
            </ul>
            <Link href="/unlock" className={buttonClass("primary", "md", "mt-4")}>
              اكسب رصيدًا
            </Link>
          </>
        )}
        {ready && !open && access.bookCode && !access.bookOwner ? (
          <p className="mt-4 text-sm text-ink-soft">
            عندك الكتاب؟{" "}
            <Link href={user ? "/unlock#book" : "/signup?next=/unlock"} className="font-bold text-brand underline underline-offset-4">
              رمزه يفتح كل الطرق
            </Link>
            .
          </p>
        ) : null}
      </div>
    </div>
  );
}

/* ---------- readers' ratings ---------- */

const READERS: [string, string, string] = ["رأي قارئ", "رأيا قارئَين", "آراء قرّاء"];

/** The average of the readers' stars for a method, when anyone has rated it. */
export function RatingSummary({ method, className }: { method: number; className?: string }) {
  const rating = useDemo().ratings.methods[method];
  if (!rating?.count) return null;
  return (
    <span className={cx("inline-flex items-center gap-1 whitespace-nowrap font-semibold text-ink", className)}>
      <Star aria-hidden weight="fill" className="size-4 text-sun-deep" />
      {rating.average.toFixed(1)} من 5 · {count(rating.count, READERS)}
    </span>
  );
}

/**
 * Stars and one optional line from a member who has tried the method (one task of its challenge
 * done). The average is public; the line goes to the author only, so nothing here needs review.
 */
export function RatingBox({ method }: { method: number }) {
  const { user, challenges, ratings, backend } = useDemo();
  const hydrated = useHydrated();
  const mine = ratings.mine[method];
  const [stars, setStars] = useState(0);
  const [comment, setComment] = useState<string>();
  const [sent, setSent] = useState(false);
  const tried = (challenges[method]?.done.length ?? 0) > 0;
  const chosen = stars || mine?.stars || 0;

  return (
    <div className="rounded-card border border-line bg-white p-5">
      <h2 className="text-lg font-bold text-ink">رأيك في هذه الطريقة</h2>
      {!hydrated ? (
        <div aria-busy="true" className="skeleton mt-3 h-16" />
      ) : !user ? (
        <p className="mt-1 text-sm text-ink-soft">
          <Link href={`/login?next=${encodeURIComponent(methodHref(method))}`} className="font-bold text-brand underline underline-offset-4">
            سجّل دخولك
          </Link>{" "}
          وجرّب الطريقة لتقيّمها.
        </p>
      ) : !tried ? (
        <p className="mt-1 text-sm leading-6 text-ink-soft">
          أنجز مهمة واحدة من تحديها ثم قيّمها.{backend ? ` كل تقييم يفتح لك ${count(CREDIT.rating, ["طريقة", "طريقتين", "طرق"])}.` : ""}
        </p>
      ) : (
        <form
          className="mt-3"
          onSubmit={(e) => {
            e.preventDefault();
            if (!chosen) return;
            actions.rateMethod(method, chosen, (comment ?? mine?.comment ?? "").trim());
            setSent(true);
          }}
        >
          <div role="radiogroup" aria-label="تقييمك من خمس نجوم" className="flex gap-1">
            {[1, 2, 3, 4, 5].map((n) => (
              <button key={n} type="button" role="radio" aria-checked={chosen === n} aria-label={`${n} من 5`} onClick={() => (setStars(n), setSent(false))} className="tap grid size-10 place-items-center rounded-full transition hover:bg-paper">
                <Star aria-hidden weight={n <= chosen ? "fill" : "regular"} className={cx("size-6", n <= chosen ? "text-sun-deep" : "text-ink-mute")} />
              </button>
            ))}
          </div>
          <label htmlFor={`rate-${method}`} className="mt-3 block text-sm font-bold text-ink">
            سطر للمؤلف <span className="text-xs font-normal text-ink-mute">اختياري</span>
          </label>
          <Input id={`rate-${method}`} className="mt-1.5 h-11" maxLength={300} value={comment ?? mine?.comment ?? ""} onChange={(e) => (setComment(e.target.value), setSent(false))} placeholder="ما الذي أفادك أو نقصك؟" />
          <p className="mt-2 text-xs leading-5 text-ink-mute">النجوم تظهر للجميع كمتوسط. سطرك يصل للمؤلف فقط ولا يُنشر.</p>
          <div className="mt-3 flex items-center gap-3">
            <Button type="submit" size="sm" disabled={!chosen}>
              {mine ? "حدّث تقييمي" : "أرسل التقييم"}
            </Button>
            {sent ? <span className="text-sm font-semibold text-ok">وصل، شكرًا لك.</span> : null}
          </div>
        </form>
      )}
    </div>
  );
}
