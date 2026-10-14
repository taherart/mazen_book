"use client";

import { Eye, EyeOff, LoaderCircle, ShieldCheck } from "@/components/icons";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, type FormEvent } from "react";
import { useDemo } from "@/lib/demo/hooks";
import { actions, type ChallengeState, type DemoUser, type Intent } from "@/lib/demo/store";
import { signInAction, signUpAction } from "@/lib/server/auth-actions";
import { Button, Field, Input, Notice, cx } from "./ui";
import { safeRedirectPath } from "@/lib/safe-url";

const INTENTS: { id: Intent; title: string; text: string }[] = [
  { id: "explore", title: "أجرّب طريقة", text: "أبحث عن دخل إضافي" },
  { id: "provide", title: "أعرض خدماتي", text: "عندي مهارة أقدّمها" },
  { id: "share", title: "أشارك تجربتي", text: "جرّبت إحدى الطرق" },
];

type Errors = Partial<Record<"name" | "email" | "password" | "consent", string>>;

/** Only same-site paths are followed after signing in. */

export function AuthForm({ mode }: { mode: "login" | "signup" }) {
  const router = useRouter();
  const next = safeRedirectPath(useSearchParams().get("next"), "/dashboard");
  const { user: existing, backend } = useDemo();
  const [errors, setErrors] = useState<Errors>({});
  const [busy, setBusy] = useState(false);
  const [show, setShow] = useState(false);
  const [intents, setIntents] = useState<Intent[]>(["explore"]);
  const signup = mode === "signup";
  const query = next === "/dashboard" ? "" : `?next=${encodeURIComponent(next)}`;

  const finish = (user: { name: string; email: string; admin?: boolean; intents?: Intent[] }, fromServer?: { user: DemoUser; challenges: Record<number, ChallengeState> }) => {
    if (fromServer) actions.setSession(true, fromServer.user, fromServer.challenges);
    else actions.signIn(user);
    // arriving from "I'll try this method": join on the way in
    const join = next.match(/^\/method\/(\d{2})\/challenge$/);
    if (join) actions.joinChallenge(Number(join[1]));
    router.push(user.admin ? "/admin" : next);
  };

  const submit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const get = (k: string) => String(f.get(k) ?? "").trim();
    const nextErrors: Errors = {};
    if (signup && get("name").length < 2) nextErrors.name = "اكتب اسمك كما تحب أن يظهر.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(get("email"))) nextErrors.email = "اكتب بريدًا إلكترونيًا صحيحًا، مثل name@example.com";
    if (get("password").length < 8) nextErrors.password = "كلمة المرور 8 أحرف على الأقل.";
    if (signup && !f.get("consent")) nextErrors.consent = "نحتاج موافقتك على الشروط وسياسة الخصوصية.";
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) {
      document.getElementById(Object.keys(nextErrors)[0])?.focus();
      return;
    }
    setBusy(true);
    const email = get("email").toLowerCase();
    const password = String(f.get("password") ?? "");
    try {
      const res = signup ? await signUpAction({ name: get("name"), email, password, intents, consent: !!f.get("consent") }) : await signInAction({ email, password });
      if (res.ok) return finish(res.user, res);
      if (!("demo" in res)) {
        setErrors({ [res.field]: res.error });
        document.getElementById(res.field)?.focus();
        setBusy(false);
        return;
      }
    } catch {
      setErrors({ email: "تعذّر الاتصال بالخادم. تحقّق من الإنترنت وحاول مجددًا." });
      setBusy(false);
      return;
    }
    // no database on this server: the browser-only demo sign-in
    const name = signup ? get("name") : existing?.email === email ? existing.name : email.split("@")[0];
    finish({ name, email, intents: signup ? intents : undefined });
  };

  return (
    <div>
      <h1 className="font-display text-4xl text-ink">{signup ? "أنشئ حسابك" : "أهلًا بعودتك"}</h1>
      <p className="mt-2 text-ink-soft">{signup ? "حساب واحد لتجرّب الطرق، تشارك تجاربك، وتعرض خدماتك." : "ادخل لتتابع تحدياتك وتجاربك وخدماتك."}</p>

      <form noValidate onSubmit={submit} className="mt-7 space-y-5">
        {signup ? (
          <Field label="الاسم" htmlFor="name" error={errors.name}>
            <Input id="name" name="name" autoComplete="name" aria-invalid={!!errors.name} />
          </Field>
        ) : null}
        <Field label="البريد الإلكتروني" htmlFor="email" error={errors.email}>
          <Input id="email" name="email" type="email" dir="ltr" className="text-end" autoComplete="email" inputMode="email" placeholder="name@example.com" aria-invalid={!!errors.email} />
        </Field>
        <Field label="كلمة المرور" htmlFor="password" error={errors.password} hint={signup ? "8 أحرف على الأقل." : undefined}>
          <div className="relative">
            <Input id="password" name="password" type={show ? "text" : "password"} dir="ltr" className="pe-12 text-end" autoComplete={signup ? "new-password" : "current-password"} aria-invalid={!!errors.password} />
            <button type="button" onClick={() => setShow((v) => !v)} aria-label={show ? "إخفاء كلمة المرور" : "إظهار كلمة المرور"} className="absolute end-2 top-1/2 grid size-9 -translate-y-1/2 place-items-center rounded-xl text-ink-soft hover:bg-paper">
              {show ? <EyeOff className="size-5" /> : <Eye className="size-5" />}
            </button>
          </div>
        </Field>

        {signup ? (
          <>
            <fieldset>
              <legend className="mb-2 text-sm font-bold text-ink">
                ما الذي جاء بك؟ <span className="text-xs font-normal text-ink-mute">اختر كل ما ينطبق، وتستطيع تغييره لاحقًا</span>
              </legend>
              <div className="grid gap-2 sm:grid-cols-3">
                {INTENTS.map((it) => {
                  const on = intents.includes(it.id);
                  return (
                    <button key={it.id} type="button" aria-pressed={on} onClick={() => setIntents(on ? intents.filter((x) => x !== it.id) : [...intents, it.id])} className={cx("rounded-2xl border-2 p-3 text-start transition", on ? "border-ink bg-brand text-white shadow-print-sm" : "border-line bg-white hover:border-ink")}>
                      <span className="block font-bold">{it.title}</span>
                      <span className={cx("text-xs", on ? "text-white/80" : "text-ink-mute")}>{it.text}</span>
                    </button>
                  );
                })}
              </div>
            </fieldset>
            <label className="flex items-start gap-3 text-sm">
              <input id="consent" type="checkbox" name="consent" className="mt-1 size-5 accent-brand" aria-invalid={!!errors.consent} />
              <span>
                أوافق على{" "}
                <Link href="/terms" className="font-bold text-brand underline underline-offset-4">
                  شروط الاستخدام وسياسة الخصوصية
                </Link>
                .{errors.consent ? <span className="mt-1 block font-semibold text-bad">{errors.consent}</span> : null}
              </span>
            </label>
          </>
        ) : null}

        <Button type="submit" size="lg" className="w-full" disabled={busy}>
          {busy ? <LoaderCircle aria-hidden className="size-5 animate-spin" /> : null}
          {busy ? "لحظة…" : signup ? "أنشئ الحساب" : "دخول"}
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-ink-soft">
        {signup ? "عندك حساب؟" : "جديد هنا؟"}{" "}
        <Link href={`${signup ? "/login" : "/signup"}${query}`} className="font-bold text-brand underline underline-offset-4">
          {signup ? "سجّل دخولك" : "أنشئ حسابًا"}
        </Link>
      </p>

      {backend ? null : (
      <Notice tone="sun" className="mt-6" title="نسخة أولية">
        الدخول هنا تجريبي: أي بريد وكلمة مرور بالصيغة الصحيحة يكفيان، ولا تُحفظ كلمة المرور.{" "}
        <button type="button" className="inline-flex items-center gap-1 font-bold text-brand underline underline-offset-4" onClick={() => finish({ name: "مشرف المنصة", email: "admin@example.com", admin: true })}>
          <ShieldCheck aria-hidden className="size-4" />
          ادخل كمشرف لتجربة لوحة الإدارة
        </button>
      </Notice>
      )}
    </div>
  );
}
