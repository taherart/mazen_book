"use client";

import { Eye, EyeOff, LoaderCircle, Mail } from "@/components/icons";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, type FormEvent } from "react";
import { useDemo } from "@/lib/demo/hooks";
import { actions } from "@/lib/demo/store";
import { requestPasswordResetAction, resetPasswordAction } from "@/lib/server/password-reset-actions";
import { refreshSession } from "@/lib/session-client";
import { Button, Field, Input, Notice } from "./ui";

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/** Step one: ask for the link. The answer is the same whether or not the address has an account. */
export function ForgotForm() {
  const { backend } = useDemo();
  const [error, setError] = useState<string>();
  const [busy, setBusy] = useState(false);
  const [sentTo, setSentTo] = useState<string>();

  const submit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const email = String(new FormData(e.currentTarget).get("email") ?? "").trim().toLowerCase();
    if (!EMAIL.test(email)) return setError("اكتب بريدًا إلكترونيًا صحيحًا، مثل name@example.com");
    setError(undefined);
    setBusy(true);
    try {
      const res = await requestPasswordResetAction({ email });
      if (res.ok) setSentTo(email);
      else if ("demo" in res) setError("لا يوجد بريد في النسخة التجريبية: ادخل بأي كلمة مرور.");
      else setError(res.error);
    } catch {
      setError("تعذّر الاتصال بالخادم. تحقّق من الإنترنت وحاول مجددًا.");
    }
    setBusy(false);
  };

  if (sentTo) {
    return (
      <div>
        <span className="grid size-14 place-items-center rounded-2xl bg-brand-wash text-brand">
          <Mail aria-hidden className="size-7" />
        </span>
        <h1 className="mt-5 font-display text-4xl text-ink">تفقّد بريدك</h1>
        <p className="mt-3 leading-8 text-ink-soft">
          إن كان لـ <bdi dir="ltr" className="font-semibold text-ink">{sentTo}</bdi> حساب عندنا، فقد وصلته رسالة فيها رابط إعادة التعيين. الرابط صالح لساعة واحدة. لم تصلك؟ انظر في البريد غير المرغوب، أو تأكد من العنوان وأعد الطلب.
        </p>
        <p className="mt-6 text-sm text-ink-soft">
          <Link href="/login" className="font-bold text-brand underline underline-offset-4">
            العودة لتسجيل الدخول
          </Link>
        </p>
      </div>
    );
  }

  return (
    <div>
      <h1 className="font-display text-4xl text-ink">نسيت كلمة المرور؟</h1>
      <p className="mt-2 text-ink-soft">اكتب بريدك، ونرسل لك رابطًا لتعيين كلمة مرور جديدة.</p>
      <form noValidate onSubmit={submit} className="mt-7 space-y-5">
        <Field label="البريد الإلكتروني" htmlFor="email" error={error}>
          <Input id="email" name="email" type="email" dir="ltr" className="text-end" autoComplete="email" inputMode="email" placeholder="name@example.com" aria-invalid={!!error} autoFocus />
        </Field>
        <Button type="submit" size="lg" className="w-full" disabled={busy}>
          {busy ? <LoaderCircle aria-hidden className="size-5 animate-spin" /> : null}
          {busy ? "لحظة…" : "أرسل الرابط"}
        </Button>
      </form>
      <p className="mt-6 text-center text-sm text-ink-soft">
        تذكّرتها؟{" "}
        <Link href="/login" className="font-bold text-brand underline underline-offset-4">
          سجّل دخولك
        </Link>
      </p>
      {backend ? null : (
        <Notice tone="sun" className="mt-6" title="نسخة أولية">
          استرجاع كلمة المرور يعمل على الخادم فقط. هنا، أي كلمة مرور بالصيغة الصحيحة تدخلك.
        </Notice>
      )}
    </div>
  );
}

/** Step two, from the link in the email: a new password, then straight to the dashboard. */
export function ResetForm() {
  const router = useRouter();
  const token = useSearchParams().get("token") ?? "";
  const [errors, setErrors] = useState<{ token?: string; password?: string }>({});
  const [busy, setBusy] = useState(false);
  const [show, setShow] = useState(false);

  const submit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const password = String(f.get("password") ?? "");
    if (password.length < 8) return setErrors({ password: "كلمة المرور 8 أحرف على الأقل." });
    if (password !== String(f.get("confirm") ?? "")) return setErrors({ password: "الكلمتان غير متطابقتين." });
    setErrors({});
    setBusy(true);
    try {
      const res = await resetPasswordAction({ token, password });
      if (res.ok) {
        actions.setSession(true, res.user, res.challenges);
        void refreshSession();
        router.push(res.user.admin ? "/admin" : "/dashboard");
        return;
      }
      setErrors("demo" in res ? { token: "لا يوجد استرجاع في النسخة التجريبية." } : { [res.field]: res.error });
    } catch {
      setErrors({ password: "تعذّر الاتصال بالخادم. تحقّق من الإنترنت وحاول مجددًا." });
    }
    setBusy(false);
  };

  if (!token || errors.token) {
    return (
      <div>
        <h1 className="font-display text-4xl text-ink">الرابط غير صالح</h1>
        <p className="mt-3 leading-8 text-ink-soft">{errors.token ?? "هذه الصفحة تُفتح من الرابط الذي يصلك بالبريد، وهو صالح لساعة واحدة ولمرة واحدة."}</p>
        <Link href="/forgot" className="mt-6 inline-block font-bold text-brand underline underline-offset-4">
          اطلب رابطًا جديدًا
        </Link>
      </div>
    );
  }

  return (
    <div>
      <h1 className="font-display text-4xl text-ink">كلمة مرور جديدة</h1>
      <p className="mt-2 text-ink-soft">اختر كلمة مرور جديدة. ستُسجَّل خروجك من كل الأجهزة الأخرى.</p>
      <form noValidate onSubmit={submit} className="mt-7 space-y-5">
        <Field label="كلمة المرور الجديدة" htmlFor="password" error={errors.password} hint="8 أحرف على الأقل.">
          <div className="relative">
            <Input id="password" name="password" type={show ? "text" : "password"} dir="ltr" className="pe-12 text-end" autoComplete="new-password" aria-invalid={!!errors.password} autoFocus />
            <button type="button" onClick={() => setShow((v) => !v)} aria-label={show ? "إخفاء كلمة المرور" : "إظهار كلمة المرور"} className="absolute end-2 top-1/2 grid size-9 -translate-y-1/2 place-items-center rounded-xl text-ink-soft hover:bg-paper">
              {show ? <EyeOff className="size-5" /> : <Eye className="size-5" />}
            </button>
          </div>
        </Field>
        <Field label="أعد كتابتها" htmlFor="confirm">
          <Input id="confirm" name="confirm" type={show ? "text" : "password"} dir="ltr" className="text-end" autoComplete="new-password" />
        </Field>
        <Button type="submit" size="lg" className="w-full" disabled={busy}>
          {busy ? <LoaderCircle aria-hidden className="size-5 animate-spin" /> : null}
          {busy ? "لحظة…" : "احفظ وادخل"}
        </Button>
      </form>
    </div>
  );
}
