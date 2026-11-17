"use client";

import { Key, Star } from "@/components/icons";
import { useCallback, useEffect, useState, type FormEvent } from "react";
import { GOALS } from "@/lib/access";
import { useDemo } from "@/lib/demo/hooks";
import { setBookCodeAction } from "@/lib/server/access-actions";
import { CAPITAL, LEVELS, PLACES, TIME } from "@/lib/taxonomy";
import { formatDate } from "@/lib/week";
import { Button, EmptyState, Field, Input, Notice } from "../ui";
import { AdminHead, Panel, type AdminProps } from "./shared";

interface Readers {
  funnel: { members: number; surveyed: number; joined: number; submitted: number; raters: number; storytellers: number; invited: number; bookOwners: number; creditUnlocks: number };
  survey: { question: string; answer: string; n: number }[];
  ratings: { method: number; average: number; count: number }[];
  comments: { method: number; stars: number; comment: string; name: string; at: string }[];
  unlocked: { method: number; n: number }[];
  bookCode: string;
}

const QUESTIONS: [string, string, Record<string, string>][] = [
  ["capital", "رأس المال المتاح", CAPITAL],
  ["time", "متى يحتاج أول دخل", TIME],
  ["place", "مكان العمل المفضّل", PLACES],
  ["level", "الخبرة", LEVELS as unknown as Record<string, string>],
  ["goal", "الهدف", GOALS],
];

/**
 * What the unlock steps tell the author: how far members get, who they are (the survey), and what
 * they think of each method (stars and the lines written for him). Also where the book code is set.
 */
export function AdminReaders({ methods }: AdminProps) {
  const { backend } = useDemo();
  const [data, setData] = useState<Readers | { error: string } | null>(null);
  const load = useCallback(() => {
    fetch("/api/admin/readers", { cache: "no-store" })
      .then(async (r) => (r.ok ? r.json() : { error: String(r.status) }))
      .then(setData)
      .catch(() => setData({ error: "offline" }));
  }, []);
  useEffect(() => {
    if (backend) load();
  }, [backend, load]);

  if (!backend) {
    return (
      <>
        <AdminHead title="القرّاء والفتح" lead="من يفتح ماذا، وما يقوله القرّاء عن الطرق." />
        <Notice title="يعمل على الخادم">في النسخة التجريبية كل الطرق مفتوحة ولا تُجمع إجابات. على الخادم يظهر هنا مسار الأعضاء، وإجابات الاستبيان، وتقييمات الطرق، ورمز الكتاب.</Notice>
      </>
    );
  }
  if (!data) return <div aria-busy="true" className="skeleton h-96" />;
  if ("error" in data) return <Notice tone="bad" title="تعذّر قراءة البيانات">حدّث الصفحة، فإن تكرر فراجع سجل الخادم.</Notice>;

  const f = data.funnel;
  const share = (n: number) => (f.members ? `${Math.round((n / f.members) * 100)}%` : "—");
  const steps: [string, number][] = [
    ["أنشؤوا حسابًا", f.members],
    ["أجابوا عن الاستبيان", f.surveyed],
    ["انضموا لتحدٍّ", f.joined],
    ["أرسلوا ملخص تحدٍّ", f.submitted],
    ["قيّموا طريقة", f.raters],
    ["نُشرت لهم تجربة", f.storytellers],
  ];

  return (
    <>
      <AdminHead title="القرّاء والفتح" lead="كم عضوًا يصل إلى كل خطوة، من هم بحسب الاستبيان، وما رأيهم في الطرق." />

      <Panel title="مسار الأعضاء">
        <ol className="grid gap-2">
          {steps.map(([label, n]) => (
            <li key={label} className="grid grid-cols-[minmax(0,11rem)_minmax(0,1fr)_4.5rem] items-center gap-3 text-sm">
              <span className="truncate font-bold text-ink">{label}</span>
              <span className="h-3 overflow-hidden rounded-full bg-paper-deep">
                <span className="block h-full rounded-full bg-brand" style={{ width: f.members ? `${(n / f.members) * 100}%` : 0 }} />
              </span>
              <span className="text-end tabular-nums text-ink-soft">
                <b className="text-ink">{n}</b> · {share(n)}
              </span>
            </li>
          ))}
        </ol>
        <p className="mt-4 text-sm text-ink-soft">
          جاؤوا بدعوة: <b className="text-ink">{f.invited}</b> · فعّلوا رمز الكتاب: <b className="text-ink">{f.bookOwners}</b> · طرق فُتحت بالرصيد: <b className="text-ink">{f.creditUnlocks}</b>
        </p>
      </Panel>

      <div className="mt-6 grid gap-6 xl:grid-cols-2">
        <Panel title={`إجابات الاستبيان · ${f.surveyed}`}>
          {f.surveyed ? (
            <div className="grid gap-5">
              {QUESTIONS.map(([key, label, names]) => {
                const rows = data.survey.filter((s) => s.question === key).sort((a, b) => b.n - a.n);
                return (
                  <div key={key}>
                    <h3 className="text-sm font-bold text-ink">{label}</h3>
                    <ul className="mt-1.5 grid gap-1">
                      {rows.map((r) => (
                        <li key={r.answer} className="grid grid-cols-[minmax(0,12rem)_minmax(0,1fr)_2.5rem] items-center gap-3 text-sm">
                          <span className="truncate text-ink-soft">{names[r.answer] ?? r.answer}</span>
                          <span className="h-2 overflow-hidden rounded-full bg-paper-deep">
                            <span className="block h-full rounded-full bg-brand" style={{ width: `${(r.n / f.surveyed) * 100}%` }} />
                          </span>
                          <span className="text-end font-bold tabular-nums text-ink">{r.n}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-sm text-ink-soft">لم يجب أحد عن الاستبيان بعد.</p>
          )}
        </Panel>

        <div className="grid content-start gap-6">
          <BookCodeForm current={data.bookCode} onSaved={load} />
          <Panel title="الأكثر فتحًا بالرصيد">
            {data.unlocked.length ? (
              <ol className="grid gap-1.5 text-sm">
                {data.unlocked.map((u) => (
                  <li key={u.method} className="flex items-baseline justify-between gap-3">
                    <span className="truncate text-ink">
                      <b className="font-display text-brand">{u.method}</b> {methods[u.method - 1].title}
                    </span>
                    <b className="tabular-nums text-ink">{u.n}</b>
                  </li>
                ))}
              </ol>
            ) : (
              <p className="text-sm text-ink-soft">ما يختاره الأعضاء حين يملكون رصيدًا يدل على ما يشدّهم. لا اختيارات بعد.</p>
            )}
          </Panel>
        </div>
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[0.8fr_1.2fr]">
        <Panel title="تقييم الطرق">
          {data.ratings.length ? (
            <ul className="grid gap-1.5 text-sm">
              {data.ratings.map((r) => (
                <li key={r.method} className="flex items-center justify-between gap-3">
                  <span className="truncate text-ink">
                    <b className="font-display text-brand">{r.method}</b> {methods[r.method - 1].title}
                  </span>
                  <span className="inline-flex shrink-0 items-center gap-1 tabular-nums text-ink-soft">
                    <Star aria-hidden weight="fill" className="size-4 text-sun-deep" />
                    <b className="text-ink">{r.average.toFixed(1)}</b> · {r.count}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-ink-soft">لا تقييمات بعد. يقيّم العضو الطريقة بعد إنجاز مهمة من تحديها.</p>
          )}
        </Panel>
        <Panel title="ما كتبه القرّاء للمؤلف">
          {data.comments.length ? (
            <ul className="grid gap-3">
              {data.comments.map((c, i) => (
                <li key={i} className="rounded-2xl border border-line p-3 text-sm">
                  <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-ink-soft">
                    <b className="text-ink">{c.name}</b>
                    <span>
                      الطريقة {c.method}: {methods[c.method - 1].title}
                    </span>
                    <span className="inline-flex items-center gap-0.5" aria-label={`${c.stars} من 5`}>
                      {[1, 2, 3, 4, 5].map((n) => (
                        <Star key={n} aria-hidden weight={n <= c.stars ? "fill" : "regular"} className={n <= c.stars ? "size-3.5 text-sun-deep" : "size-3.5 text-ink-mute"} />
                      ))}
                    </span>
                    <span className="ms-auto text-xs text-ink-mute">{formatDate(c.at)}</span>
                  </p>
                  <p className="mt-1.5 leading-7 text-ink">{c.comment}</p>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState title="لا تعليقات بعد">السطر الاختياري الذي يكتبه العضو مع تقييمه يصل إلى هنا فقط، ولا يُنشر.</EmptyState>
          )}
        </Panel>
      </div>
    </>
  );
}

function BookCodeForm({ current, onSaved }: { current: string; onSaved: () => void }) {
  const [state, setState] = useState<"idle" | "saved" | "bad">("idle");
  const submit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const code = String(new FormData(e.currentTarget).get("code") ?? "");
    const res = await setBookCodeAction(code).catch(() => ({ ok: false }));
    setState(res.ok ? "saved" : "bad");
    if (res.ok) onSaved();
  };
  return (
    <Panel title="رمز الكتاب" action={<Key aria-hidden className="size-5 text-brand" />}>
      <form onSubmit={submit}>
        <Field label="الرمز المطبوع في الكتاب" htmlFor="book-code-admin" hint="من يكتبه في صفحة «افتح الطرق» تُفتح له الطرق الـ52 كلها. 6 إلى 32 حرفًا لاتينيًا أو رقمًا أو شرطة. اتركه فارغًا لإخفاء الخانة عن الأعضاء." error={state === "bad" ? "لم يُحفظ: الرمز 6 إلى 32 حرفًا لاتينيًا أو رقمًا أو شرطة." : undefined}>
          <Input id="book-code-admin" name="code" dir="ltr" defaultValue={current} autoComplete="off" maxLength={32} className="text-center font-bold tracking-widest uppercase" />
        </Field>
        <div className="mt-3 flex items-center gap-3">
          <Button type="submit" size="sm">
            احفظ الرمز
          </Button>
          {state === "saved" ? <span className="text-sm font-semibold text-ok">حُفظ.</span> : null}
        </div>
      </form>
      <p className="mt-3 text-xs leading-5 text-ink-mute">الرمز واحد لكل النسخ، فإن انتشر غيّره من هنا: من فعّلوه قبل التغيير يبقون مفعّلين.</p>
    </Panel>
  );
}
