"use client";

import { Eraser, FlaskConical, ShieldCheck, SlidersHorizontal, X } from "@/components/icons";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useDemo, useHydrated } from "@/lib/demo/hooks";
import { actions } from "@/lib/demo/store";
import { PROTO_BAR_KEY } from "@/lib/pre-paint";
import { cx } from "./ui";

/** Remember the choice and apply it now. The attribute on <html> drives which form shows, and the
 *  root layout sets it again before first paint on the next visit, so nothing ever jumps. */
function setMinimised(min: boolean) {
  try {
    localStorage.setItem(PROTO_BAR_KEY, min ? "min" : "full");
  } catch {}
  if (min) document.documentElement.dataset.bar = "min";
  else delete document.documentElement.dataset.bar;
}

/**
 * Tells reviewers this is the clickable first build, and holds the controls for trying its states.
 * The first visit gets the full bar; after that it waits as a small pill above the tab bar, which
 * gives the phone screen its top 38px back.
 */
export function PrototypeBar() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    try {
      if (!localStorage.getItem(PROTO_BAR_KEY)) localStorage.setItem(PROTO_BAR_KEY, "min");
    } catch {}
  }, []);

  return (
    <>
      <div className="relative z-50 bg-ink text-white [html[data-bar=min]_&]:hidden">
        <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-1.5 text-xs sm:px-6">
          <FlaskConical aria-hidden className="size-3.5 shrink-0 text-sun" />
          <p className="min-w-0 flex-1 truncate">
            <span className="font-bold">نسخة أولية للمعاينة.</span> <span className="text-white/70">المحتوى المجتمعي أمثلة توضيحية، وما تفعله يُحفظ على جهازك فقط.</span>
          </p>
          <button type="button" onClick={() => setOpen((v) => !v)} aria-expanded={open} className="tap inline-flex shrink-0 items-center gap-1.5 rounded-full border border-white/25 px-2.5 py-1 font-semibold hover:bg-white/10">
            {open ? <X className="size-3.5" /> : <SlidersHorizontal className="size-3.5" />}
            خيارات العرض
          </button>
          <button
            type="button"
            aria-label="صغّر شريط المعاينة"
            title="صغّر شريط المعاينة"
            onClick={() => {
              setOpen(false);
              setMinimised(true);
            }}
            className="tap grid size-6 shrink-0 place-items-center rounded-full hover:bg-white/10"
          >
            <X aria-hidden className="size-3.5" />
          </button>
        </div>

        {open ? (
          <div className="absolute inset-x-0 top-full border-b-2 border-ink bg-white text-ink shadow-soft">
            <PrototypeOptions onDone={() => setOpen(false)} className="mx-auto max-w-6xl px-4 py-4 sm:grid-cols-3 sm:px-6" />
          </div>
        ) : null}
      </div>

      <div className="fixed bottom-[calc(5.5rem+env(safe-area-inset-bottom))] start-3 z-50 hidden lg:bottom-4 max-lg:[html[data-joinbar]_&]:bottom-[calc(10.25rem+env(safe-area-inset-bottom))] [html[data-bar=min]_&]:block">
        {open ? (
          <div className="absolute bottom-full start-0 mb-2 w-[min(22rem,calc(100vw-1.5rem))] rounded-card border-2 border-ink bg-white p-3 text-ink shadow-print">
            <PrototypeOptions onDone={() => setOpen(false)} />
            <button
              type="button"
              className="mt-3 text-sm font-semibold text-ink-soft underline underline-offset-4 hover:text-ink"
              onClick={() => {
                setOpen(false);
                setMinimised(false);
              }}
            >
              أظهر شريط المعاينة كاملًا
            </button>
          </div>
        ) : null}
        <button type="button" onClick={() => setOpen((v) => !v)} aria-expanded={open} className="tap inline-flex items-center gap-1.5 rounded-full border-2 border-ink bg-ink px-3 py-1.5 text-xs font-bold text-white shadow-print-sm">
          {open ? <X aria-hidden className="size-3.5" /> : <FlaskConical aria-hidden className="size-3.5 text-sun" />}
          نسخة أولية
        </button>
      </div>
    </>
  );
}

function PrototypeOptions({ onDone, className }: { onDone: () => void; className?: string }) {
  const { showSamples, user } = useDemo();
  const hydrated = useHydrated();
  return (
    <div className={cx("grid gap-3", className)}>
      <label className="flex items-start gap-3 rounded-2xl border border-line p-3">
        <input type="checkbox" className="mt-1 size-4 accent-brand" checked={hydrated ? showSamples : true} onChange={(e) => actions.setShowSamples(e.target.checked)} />
        <span className="text-sm">
          <span className="block font-bold">عرض الأمثلة التوضيحية</span>
          <span className="text-ink-soft">أوقفه لترى المنصة كما ستبدو يوم الإطلاق: بلا تجارب ولا أرقام.</span>
        </span>
      </label>
      <div className="flex items-start gap-3 rounded-2xl border border-line p-3 text-sm">
        <ShieldCheck aria-hidden className="mt-0.5 size-5 shrink-0 text-brand" />
        <div>
          <span className="block font-bold">لوحة الإدارة</span>
          {user?.admin ? (
            <Link href="/admin" onClick={onDone} className="font-semibold text-brand underline underline-offset-4">
              افتح لوحة الإدارة
            </Link>
          ) : (
            <button
              type="button"
              className="font-semibold text-brand underline underline-offset-4"
              onClick={() => {
                actions.signIn({ name: user?.name ?? "مشرف المنصة", email: user?.email ?? "admin@example.com", admin: true });
                onDone();
              }}
            >
              ادخل بحساب مشرف تجريبي
            </button>
          )}
        </div>
      </div>
      <div className="flex items-start gap-3 rounded-2xl border border-line p-3 text-sm">
        <Eraser aria-hidden className="mt-0.5 size-5 shrink-0 text-bad" />
        <div>
          <span className="block font-bold">ابدأ من جديد</span>
          <button
            type="button"
            className="font-semibold text-bad underline underline-offset-4"
            onClick={() => {
              if (window.confirm("سيُمسح حسابك التجريبي وكل ما أضفته على هذا الجهاز. متابعة؟")) {
                actions.reset();
                onDone();
              }
            }}
          >
            امسح بيانات التجربة من هذا الجهاز
          </button>
        </div>
      </div>
    </div>
  );
}
