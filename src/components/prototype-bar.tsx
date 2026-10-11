"use client";

import { Eraser, FlaskConical, ShieldCheck, SlidersHorizontal, X } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { useDemo, useHydrated } from "@/lib/demo/hooks";
import { actions } from "@/lib/demo/store";

/** Tells reviewers this is the clickable first build, and holds the controls for trying its states. */
export function PrototypeBar() {
  const [open, setOpen] = useState(false);
  const { showSamples, user } = useDemo();
  const hydrated = useHydrated();

  return (
    <div className="relative z-50 bg-ink text-white">
      <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-1.5 text-xs sm:px-6">
        <FlaskConical aria-hidden className="size-3.5 shrink-0 text-sun" />
        <p className="min-w-0 flex-1 truncate">
          <span className="font-bold">نسخة أولية للمعاينة.</span> <span className="text-white/70">المحتوى المجتمعي أمثلة توضيحية، وما تفعله يُحفظ على جهازك فقط.</span>
        </p>
        <button type="button" onClick={() => setOpen((v) => !v)} aria-expanded={open} className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-white/25 px-2.5 py-1 font-semibold hover:bg-white/10">
          {open ? <X className="size-3.5" /> : <SlidersHorizontal className="size-3.5" />}
          خيارات العرض
        </button>
      </div>

      {open ? (
        <div className="absolute inset-x-0 top-full border-b-2 border-ink bg-white text-ink shadow-soft">
          <div className="mx-auto grid max-w-6xl gap-3 px-4 py-4 sm:grid-cols-3 sm:px-6">
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
                  <Link href="/admin" onClick={() => setOpen(false)} className="font-semibold text-brand underline underline-offset-4">
                    افتح لوحة الإدارة
                  </Link>
                ) : (
                  <button
                    type="button"
                    className="font-semibold text-brand underline underline-offset-4"
                    onClick={() => {
                      actions.signIn({ name: user?.name ?? "مشرف المنصة", email: user?.email ?? "admin@example.com", admin: true });
                      setOpen(false);
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
                      setOpen(false);
                    }
                  }}
                >
                  امسح بيانات التجربة من هذا الجهاز
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
